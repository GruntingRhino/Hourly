import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma";
import beneficiaryRoutes from "../src/routes/beneficiaries";

// F-04: slot cancellation must not wipe verification/audit evidence. The slot
// and signup rows are removed (required slotId FK), but every audit row for
// the cancelled signups survives — pre-existing rows detached, plus a
// SLOT_CANCELLED tombstone snapshotting the signup — instead of being wiped.
// All fixtures synthetic.

const db = prisma as any;
const ids = {
  student: "gh_slot_tombstone_student",
  beneficiary: "gh_slot_tombstone_beneficiary",
  admin: "gh_slot_tombstone_admin",
  opportunity: "gh_slot_tombstone_opportunity",
  slot: "gh_slot_tombstone_slot",
  signup: "gh_slot_tombstone_signup",
};

function auth(userId: string, role: string) {
  return { authorization: `Bearer ${jwt.sign({ userId, email: `${userId}@example.test`, role, tv: 0 }, process.env.JWT_SECRET!)}` };
}

async function setup() {
  await db.beneficiaryAuditLog.deleteMany({ where: { actorId: ids.admin } });
  await db.notification.deleteMany({ where: { userId: ids.student } });
  await db.beneficiarySignup.deleteMany({ where: { id: ids.signup } });
  await db.beneficiaryTimeSlot.deleteMany({ where: { id: ids.slot } });
  await db.beneficiaryOpportunity.deleteMany({ where: { id: ids.opportunity } });
  await db.user.deleteMany({ where: { id: { in: [ids.student, ids.admin] } } });
  await db.beneficiary.deleteMany({ where: { id: ids.beneficiary } });

  await db.beneficiary.create({ data: { id: ids.beneficiary, name: "Synthetic Tombstone Org" } });
  await db.user.create({ data: { id: ids.student, email: "gh-slot-student@example.test", name: "Synthetic Student", role: "STUDENT", emailVerified: true, eligibilityAttestation: { create: { eligible13Plus: true, policyVersion: "test", method: "synthetic" } } } });
  await db.user.create({ data: { id: ids.admin, email: "gh-slot-admin@example.test", name: "Synthetic Beneficiary Admin", role: "BENEFICIARY_ADMIN", beneficiaryId: ids.beneficiary, emailVerified: true } });
  await db.beneficiaryOpportunity.create({ data: { id: ids.opportunity, title: "Synthetic Tombstone Event", description: "test", beneficiaryId: ids.beneficiary, startDate: new Date("2025-01-01T00:00:00Z"), category: "general" } });
  // Slot deletion requires a date more than 24h in the future.
  const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await db.beneficiaryTimeSlot.create({ data: { id: ids.slot, opportunityId: ids.opportunity, date: future, startTime: "10:00", endTime: "14:00", durationHours: 4 } });
  await db.beneficiarySignup.create({ data: { id: ids.signup, slotId: ids.slot, studentId: ids.student, status: "CONFIRMED", verificationStatus: "APPROVED", totalHours: 4 } });
  await db.beneficiaryAuditLog.create({ data: { action: "APPROVE", actorId: ids.admin, signupId: ids.signup, details: JSON.stringify({ approvedHours: 4 }) } });
}

async function cleanup() {
  await db.beneficiaryAuditLog.deleteMany({ where: { actorId: ids.admin } });
  await db.notification.deleteMany({ where: { userId: ids.student } });
  await db.beneficiarySignup.deleteMany({ where: { id: ids.signup } });
  await db.beneficiaryTimeSlot.deleteMany({ where: { id: ids.slot } });
  await db.beneficiaryOpportunity.deleteMany({ where: { id: ids.opportunity } });
  await db.user.deleteMany({ where: { id: { in: [ids.student, ids.admin] } } });
  await db.beneficiary.deleteMany({ where: { id: ids.beneficiary } });
}

test("slot cancellation tombstones audit evidence instead of wiping it", async () => {
  await setup();
  const app = express();
  app.use(express.json());
  app.use("/api/beneficiaries", beneficiaryRoutes);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  try {
    const response = await fetch(`${base}/api/beneficiaries/${ids.beneficiary}/slots/${ids.slot}`, {
      method: "DELETE",
      headers: { ...auth(ids.admin, "BENEFICIARY_ADMIN"), "content-type": "application/json" },
      body: JSON.stringify({ forceCancel: true }),
    });
    assert.equal(response.status, 200);
    const body = await response.json() as { success: boolean; cancelledSignupCount: number };
    assert.equal(body.cancelledSignupCount, 1);

    // The slot + signup rows are gone (caller-visible deletion semantic kept).
    assert.equal(await db.beneficiaryTimeSlot.findUnique({ where: { id: ids.slot } }), null);
    assert.equal(await db.beneficiarySignup.findUnique({ where: { id: ids.signup } }), null);

    // Pre-existing verification evidence survives, detached rather than wiped.
    const approvals = await db.beneficiaryAuditLog.findMany({ where: { actorId: ids.admin, action: "APPROVE" } });
    assert.equal(approvals.length, 1, "APPROVE audit row must survive slot cancellation");
    assert.equal(approvals[0].signupId, null, "surviving row is detached (tombstoned), not linked to a deleted signup");
    assert.match(approvals[0].details as string, /approvedHours/);

    // A SLOT_CANCELLED tombstone snapshots the removed signup.
    const tombstones = await db.beneficiaryAuditLog.findMany({ where: { actorId: ids.admin, action: "SLOT_CANCELLED" } });
    assert.equal(tombstones.length, 1, "exactly one SLOT_CANCELLED tombstone per cancelled signup");
    const snapshot = JSON.parse(tombstones[0].details as string) as Record<string, unknown>;
    assert.equal(snapshot.tombstone, "slot-cancelled");
    assert.equal(snapshot.cancelledSignupId, ids.signup);
    assert.equal(snapshot.studentId, ids.student);
    assert.equal(snapshot.slotId, ids.slot);
    assert.equal(snapshot.opportunityId, ids.opportunity);
    assert.equal(snapshot.priorStatus, "CONFIRMED");
    assert.equal(snapshot.verificationStatus, "APPROVED");
    assert.equal(snapshot.totalHours, 4);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await cleanup();
  }
});
