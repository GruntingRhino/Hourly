import assert from "node:assert/strict";
import test from "node:test";
import prisma from "../src/lib/prisma";
import {
  createLmsApplyAuditRecord,
  finalizeFailedApply,
  LmsSyncInProgressError,
  runExclusiveApplyTransaction,
} from "../src/services/lmsSyncApply";

const db = prisma as any;

async function createFixture(label: string) {
  const suffix = `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const school = await db.school.create({
    data: {
      name: `Synthetic LMS apply safety ${suffix}`,
      ownershipStatus: "APPROVED",
      verified: true,
      onboardingComplete: true,
    },
  });
  const admin = await db.user.create({
    data: {
      email: `lms-apply-${suffix}@example.invalid`,
      name: "Synthetic LMS Apply Admin",
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
      emailVerified: true,
    },
  });
  const connection = await db.integrationConnection.create({
    data: {
      provider: "CANVAS",
      schoolId: school.id,
      status: "CONNECTED",
      createdById: admin.id,
      config: JSON.stringify({ mode: "MOCK", mockScenario: "default", selectedExternalCourseIds: ["course-a"] }),
    },
  });
  const previousJob = await db.integrationSyncJob.create({
    data: {
      connectionId: connection.id,
      provider: "CANVAS",
      schoolId: school.id,
      mode: "APPLY",
      startedById: admin.id,
      status: "COMPLETED",
      finishedAt: new Date(),
    },
  });
  await db.integrationConnection.update({
    where: { id: connection.id },
    data: { lastSyncJobId: previousJob.id, lastSyncStatus: "COMPLETED" },
  });
  return { suffix, school, admin, connection, previousJob };
}

async function createJob(fixture: Awaited<ReturnType<typeof createFixture>>, label: string) {
  return db.integrationSyncJob.create({
    data: {
      connectionId: fixture.connection.id,
      provider: "CANVAS",
      schoolId: fixture.school.id,
      mode: "APPLY",
      startedById: fixture.admin.id,
      status: "RUNNING",
      summary: label,
    },
  });
}

async function cleanup(fixture: Awaited<ReturnType<typeof createFixture>>) {
  await db.cohort.deleteMany({ where: { schoolId: fixture.school.id } });
  await db.integrationSyncJob.deleteMany({ where: { connectionId: fixture.connection.id } });
  await db.integrationConnection.deleteMany({ where: { id: fixture.connection.id } });
  await db.user.deleteMany({ where: { id: fixture.admin.id } });
  await db.school.deleteMany({ where: { id: fixture.school.id } });
}

test("failed LMS apply rolls back domain writes and finalizes its job", async () => {
  const fixture = await createFixture("rollback");
  const job = await createJob(fixture, "synthetic rollback");
  try {
    await assert.rejects(
      runExclusiveApplyTransaction({
        connectionId: fixture.connection.id,
        previousSyncJobId: fixture.previousJob.id,
        syncJobId: job.id,
        run: async (tx) => {
          await tx.cohort.create({
            data: {
              name: `Must Roll Back ${fixture.suffix}`,
              schoolId: fixture.school.id,
              status: "DRAFT",
            },
          });
          throw new Error("synthetic apply failure");
        },
      }),
      /synthetic apply failure/,
    );

    assert.equal(
      await db.cohort.count({ where: { schoolId: fixture.school.id } }),
      0,
      "domain write must roll back",
    );
    const rolledBackConnection = await db.integrationConnection.findUnique({ where: { id: fixture.connection.id } });
    assert.equal(rolledBackConnection.lastSyncJobId, fixture.previousJob.id);

    await finalizeFailedApply({
      connectionId: fixture.connection.id,
      previousSyncJobId: fixture.previousJob.id,
      syncJobId: job.id,
      stage: "APPLY_TRANSACTION",
    });

    const [failedJob, failedConnection] = await Promise.all([
      db.integrationSyncJob.findUnique({ where: { id: job.id } }),
      db.integrationConnection.findUnique({ where: { id: fixture.connection.id } }),
    ]);
    assert.equal(failedJob.status, "FAILED");
    assert.ok(failedJob.finishedAt);
    assert.match(failedJob.summary, /APPLY_TRANSACTION/);
    assert.equal(failedConnection.status, "ERROR");
    assert.equal(failedConnection.lastSyncStatus, "FAILED");
  } finally {
    await cleanup(fixture);
  }
});

test("APPLY audit failure rolls back domain writes and preserves terminal state", async () => {
  const fixture = await createFixture("audit-failure");
  const job = await createJob(fixture, "synthetic audit failure");
  try {
    await assert.rejects(
      runExclusiveApplyTransaction({
        connectionId: fixture.connection.id,
        previousSyncJobId: fixture.previousJob.id,
        syncJobId: job.id,
        run: async (tx) => {
          await tx.cohort.create({
            data: {
              name: `Must Roll Back On Audit Failure ${fixture.suffix}`,
              schoolId: fixture.school.id,
              status: "DRAFT",
            },
          });
          await createLmsApplyAuditRecord({
            db: tx,
            actorId: "missing-audit-actor",
            schoolId: fixture.school.id,
            provider: "CANVAS",
            scenario: "synthetic",
            summary: { errors: 0 },
          });
        },
      }),
      /Foreign key constraint violated|P2003/,
    );

    assert.equal(await db.cohort.count({ where: { schoolId: fixture.school.id } }), 0);
    assert.equal(
      await db.dataAccessLog.count({ where: { schoolId: fixture.school.id, action: "CANVAS_SYNC_APPLY" } }),
      0,
    );
    const connection = await db.integrationConnection.findUnique({ where: { id: fixture.connection.id } });
    assert.equal(connection.lastSyncJobId, fixture.previousJob.id);
    assert.notEqual(connection.lastSyncStatus, "RUNNING");
  } finally {
    await cleanup(fixture);
  }
});

test("simultaneous LMS applies cannot both claim the same connection", async () => {
  const fixture = await createFixture("concurrency");
  const firstJob = await createJob(fixture, "synthetic first apply");
  const secondJob = await createJob(fixture, "synthetic second apply");
  let releaseFirst!: () => void;
  let firstEntered!: () => void;
  const releasePromise = new Promise<void>((resolve) => { releaseFirst = resolve; });
  const enteredPromise = new Promise<void>((resolve) => { firstEntered = resolve; });

  try {
    const firstApply = runExclusiveApplyTransaction({
      connectionId: fixture.connection.id,
      previousSyncJobId: fixture.previousJob.id,
      syncJobId: firstJob.id,
      run: async (tx) => {
        await tx.cohort.create({
          data: {
            name: `First Apply Wins ${fixture.suffix}`,
            schoolId: fixture.school.id,
            status: "DRAFT",
          },
        });
        firstEntered();
        await releasePromise;
      },
    });
    await enteredPromise;

    const secondApply = runExclusiveApplyTransaction({
      connectionId: fixture.connection.id,
      previousSyncJobId: fixture.previousJob.id,
      syncJobId: secondJob.id,
      run: async (tx) => {
        await tx.cohort.create({
          data: {
            name: `Second Apply Must Lose ${fixture.suffix}`,
            schoolId: fixture.school.id,
            status: "DRAFT",
          },
        });
      },
    });

    releaseFirst();
    await firstApply;
    await assert.rejects(secondApply, LmsSyncInProgressError);

    const cohorts = await db.cohort.findMany({
      where: { schoolId: fixture.school.id },
      select: { name: true },
    });
    assert.deepEqual(cohorts.map((cohort: { name: string }) => cohort.name), [
      `First Apply Wins ${fixture.suffix}`,
    ]);
    const claimedConnection = await db.integrationConnection.findUnique({ where: { id: fixture.connection.id } });
    assert.equal(claimedConnection.lastSyncJobId, firstJob.id);
  } finally {
    releaseFirst?.();
    await cleanup(fixture);
  }
});
