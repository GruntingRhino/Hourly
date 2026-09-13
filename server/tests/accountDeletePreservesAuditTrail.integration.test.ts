import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import test, { after } from "node:test";
import prisma from "../src/lib/prisma";
import app from "../src/index";
import { signUserToken } from "../src/middleware/auth";

// Regression test: DELETE /api/auth/account must preserve the FERPA
// disclosure/accounting trail (auditLog + dataAccessLog rows) as tombstones
// instead of wiping them, and must not delete other actors' audit rows that
// merely reference the deleted user's sessions. See REPORT.md §13/G5.

const db = prisma as any;
const servers: Server[] = [];

async function startServer(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("server did not bind");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

async function createFixture(suffix: string) {
  const school = await db.school.create({
    data: { name: `Audit tombstone ${suffix}`, ownershipStatus: "APPROVED", verified: true, onboardingComplete: true },
  });
  const student = await db.user.create({
    data: {
      email: `tombstone-student-${suffix}@example.invalid`,
      name: "Tombstone Student",
      role: "STUDENT",
      emailVerified: true,
      eligibilityAttestation: { create: { eligible13Plus: true, policyVersion: "2026-09-05", method: "test_fixture" } },
      schoolId: school.id,
    },
  });
  const peer = await db.user.create({
    data: {
      email: `tombstone-peer-${suffix}@example.invalid`,
      name: "Tombstone Peer",
      role: "SCHOOL_ADMIN",
      emailVerified: true,
      schoolId: school.id,
    },
  });
  const org = await db.organization.create({
    data: { name: `Tombstone Org ${suffix}`, email: `tombstone-org-${suffix}@example.invalid` },
  });
  const opportunity = await db.opportunity.create({
    data: {
      title: `Tombstone Opp ${suffix}`,
      description: "fixture",
      location: "fixture",
      date: new Date(Date.now() - 86400000),
      startTime: "10:00 AM",
      endTime: "2:00 PM",
      durationHours: 4,
      capacity: 10,
      organizationId: org.id,
    },
  });
  const session = await db.serviceSession.create({
    data: { userId: student.id, opportunityId: opportunity.id, status: "COMMITTED", totalHours: 4 },
  });

  const ownAudit = await db.auditLog.create({
    data: {
      action: "CHECK_IN",
      actorId: student.id,
      sessionId: session.id,
      details: JSON.stringify({ time: new Date().toISOString(), email: student.email }),
    },
  });
  const ownAccess = await db.dataAccessLog.create({
    data: {
      actorId: student.id,
      action: "EXPORT_CSV",
      targetType: "student",
      targetId: student.id,
      schoolId: school.id,
      details: JSON.stringify({ email: student.email }),
    },
  });
  // Another actor's audit row that merely references the student's session —
  // the old code deleted these too, destroying someone else's trail.
  const peerSessionAudit = await db.auditLog.create({
    data: {
      action: "APPROVE",
      actorId: peer.id,
      sessionId: session.id,
      details: JSON.stringify({ note: `peer-approval-${suffix}` }),
    },
  });
  return { school, student, peer, org, opportunity, session, ownAudit, ownAccess, peerSessionAudit };
}

async function cleanup(f: Awaited<ReturnType<typeof createFixture>>) {
  await db.auditLog.deleteMany({ where: { id: { in: [f.ownAudit.id, f.peerSessionAudit.id] } } });
  await db.dataAccessLog.deleteMany({ where: { id: f.ownAccess.id } });
  await db.user.deleteMany({ where: { id: { in: [f.student.id, f.peer.id] } } });
  await db.opportunity.deleteMany({ where: { id: f.opportunity.id } });
  await db.organization.deleteMany({ where: { id: f.org.id } });
  await db.school.deleteMany({ where: { id: f.school.id } });
}

test("self-delete tombstones (never wipes) the audit and data-access trail", async () => {
  const suffix = `self-${Date.now()}`;
  const f = await createFixture(suffix);
  const http = await startServer();
  try {
    const response = await fetch(`${http.baseUrl}/api/auth/account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${signUserToken(f.student)}` },
    });
    assert.equal(response.status, 200, await response.text());

    // Personal row is still hard-deleted.
    assert.equal(await db.user.count({ where: { id: f.student.id } }), 0);

    // Own audit row survives, detached, with PII redacted to a tombstone.
    const audit = await db.auditLog.findUnique({ where: { id: f.ownAudit.id } });
    assert.ok(audit, "own auditLog row must survive self-delete");
    assert.equal(audit.actorId, null);
    const auditDetails = JSON.parse(audit.details) as { tombstoned?: string; actorHash?: string };
    assert.equal(auditDetails.tombstoned, "account-deleted");
    assert.equal(auditDetails.actorHash, createHash("sha256").update(f.student.id).digest("hex"));
    assert.ok(!audit.details.includes(f.student.email), "tombstone must not retain the email");
    assert.equal(audit.action, "CHECK_IN");

    // Own data-access (disclosure) row survives the same way.
    const access = await db.dataAccessLog.findUnique({ where: { id: f.ownAccess.id } });
    assert.ok(access, "own dataAccessLog row must survive self-delete");
    assert.equal(access.actorId, null);
    assert.equal((JSON.parse(access.details) as { tombstoned?: string }).tombstoned, "account-deleted");
    assert.ok(!access.details.includes(f.student.email), "tombstone must not retain the email");
    assert.equal(access.action, "EXPORT_CSV");
    assert.equal(access.targetId, f.student.id);

    // Another actor's audit row on the deleted session survives with its
    // actor and details intact; only the session link is detached.
    const peerAudit = await db.auditLog.findUnique({ where: { id: f.peerSessionAudit.id } });
    assert.ok(peerAudit, "another actor's session audit row must survive self-delete");
    assert.equal(peerAudit.actorId, f.peer.id);
    assert.equal(peerAudit.sessionId, null);
    assert.ok(peerAudit.details.includes(`peer-approval-${suffix}`), "peer audit details must be preserved");
  } finally {
    await http.close();
    await cleanup(f);
  }
});

after(async () => {
  for (const server of servers) {
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await prisma.$disconnect();
});
