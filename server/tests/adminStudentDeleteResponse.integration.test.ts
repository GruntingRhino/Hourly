import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma";
import schoolRoutes from "../src/routes/schools";

// F-02: the admin student-delete endpoint anonymizes the identity row but
// retains hour/verification/message/audit records, so the response must say
// exactly that and name the retained categories. All fixtures synthetic.

const db = prisma as any;
const ids = {
  school: "gh_admin_delete_school",
  admin: "gh_admin_delete_admin",
  student: "gh_admin_delete_student",
  beneficiary: "gh_admin_delete_beneficiary",
  opportunity: "gh_admin_delete_opportunity",
  slot: "gh_admin_delete_slot",
  signup: "gh_admin_delete_signup",
};

function auth(userId: string, role: string) {
  return { authorization: `Bearer ${jwt.sign({ userId, email: `${userId}@example.test`, role, tv: 0 }, process.env.JWT_SECRET!)}` };
}

async function setup() {
  await db.auditLog.deleteMany({ where: { actorId: { in: [ids.admin] } } });
  await db.dataAccessLog.deleteMany({ where: { OR: [{ actorId: ids.admin }, { targetId: ids.student }] } });
  await db.message.deleteMany({ where: { OR: [{ senderId: ids.admin }, { receiverId: ids.student }] } });
  await db.selfSubmittedRequest.deleteMany({ where: { studentId: ids.student } });
  await db.beneficiarySignup.deleteMany({ where: { id: ids.signup } });
  await db.beneficiaryTimeSlot.deleteMany({ where: { id: ids.slot } });
  await db.beneficiaryOpportunity.deleteMany({ where: { id: ids.opportunity } });
  await db.user.deleteMany({ where: { id: { in: [ids.student, ids.admin] } } });
  await db.beneficiary.deleteMany({ where: { id: ids.beneficiary } });
  await db.school.deleteMany({ where: { id: ids.school } });

  await db.school.create({ data: { id: ids.school, name: "Synthetic Delete School", verified: true, ownershipStatus: "APPROVED" } });
  await db.user.create({ data: { id: ids.admin, email: "gh-admin-delete-admin@example.test", name: "Synthetic Admin", role: "SCHOOL_ADMIN", schoolId: ids.school, emailVerified: true } });
  await db.user.create({ data: { id: ids.student, email: "gh-admin-delete-student@example.test", name: "Synthetic Student", role: "STUDENT", schoolId: ids.school, emailVerified: true, eligibilityAttestation: { create: { eligible13Plus: true, policyVersion: "test", method: "synthetic" } } } });
  await db.beneficiary.create({ data: { id: ids.beneficiary, name: "Synthetic Delete Org" } });
  await db.beneficiaryOpportunity.create({ data: { id: ids.opportunity, title: "Synthetic Delete Event", description: "test", beneficiaryId: ids.beneficiary, startDate: new Date("2025-01-01T00:00:00Z"), category: "general" } });
  await db.beneficiaryTimeSlot.create({ data: { id: ids.slot, opportunityId: ids.opportunity, date: new Date("2025-01-03T00:00:00Z"), startTime: "10:00", endTime: "14:00", durationHours: 4 } });
  await db.beneficiarySignup.create({ data: { id: ids.signup, slotId: ids.slot, studentId: ids.student, schoolId: ids.school, status: "CONFIRMED" } });
  await db.selfSubmittedRequest.create({ data: { studentId: ids.student, schoolId: ids.school, organizationName: "Synthetic Org", description: "synthetic hours", date: new Date("2025-01-02T00:00:00Z"), hours: 3 } });
  await db.message.create({ data: { senderId: ids.admin, receiverId: ids.student, body: "synthetic message" } });
  await db.auditLog.create({ data: { action: "SYNTHETIC_FIXTURE", actorId: ids.admin } });
}

async function cleanup() {
  await db.auditLog.deleteMany({ where: { actorId: { in: [ids.admin] } } });
  await db.dataAccessLog.deleteMany({ where: { OR: [{ actorId: ids.admin }, { targetId: ids.student }] } });
  await db.message.deleteMany({ where: { OR: [{ senderId: ids.admin }, { receiverId: ids.student }] } });
  await db.selfSubmittedRequest.deleteMany({ where: { studentId: ids.student } });
  await db.beneficiarySignup.deleteMany({ where: { id: ids.signup } });
  await db.beneficiaryTimeSlot.deleteMany({ where: { id: ids.slot } });
  await db.beneficiaryOpportunity.deleteMany({ where: { id: ids.opportunity } });
  await db.user.deleteMany({ where: { id: { in: [ids.student, ids.admin] } } });
  await db.beneficiary.deleteMany({ where: { id: ids.beneficiary } });
  await db.school.deleteMany({ where: { id: ids.school } });
}

test("admin student-delete anonymizes identity, retains records, and says so", async () => {
  await setup();
  const app = express();
  app.use(express.json());
  app.use("/api/schools", schoolRoutes);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  try {
    const response = await fetch(`${base}/api/schools/${ids.school}/students/${ids.student}`, {
      method: "DELETE",
      headers: auth(ids.admin, "SCHOOL_ADMIN"),
    });
    assert.equal(response.status, 200);
    const body = await response.json() as { message: string; retained: string[] };
    assert.equal(
      body.message,
      "Student identity anonymized; hour/audit records retained pending the school-approved retention schedule",
    );
    assert.deepEqual(body.retained, ["hours", "verification_evidence", "messages", "audit_trail", "preferences"]);
    assert.ok(!("data removed" in body) && !body.message.includes("removed"));

    const user = await db.user.findUnique({ where: { id: ids.student } });
    assert.equal(user.name, "[Deleted]");
    assert.equal(user.email, `deleted-${ids.student}@deleted.invalid`);
    assert.equal(user.status, "REVOKED");

    // Retained categories: nothing hour/message/audit related is deleted.
    assert.ok(await db.beneficiarySignup.findUnique({ where: { id: ids.signup } }), "signup retained");
    assert.equal(await db.selfSubmittedRequest.count({ where: { studentId: ids.student } }), 1, "self-submission retained");
    assert.equal(await db.message.count({ where: { receiverId: ids.student } }), 1, "message retained");
    assert.equal(await db.auditLog.count({ where: { actorId: ids.admin } }), 1, "audit row retained");
    const accessLog = await db.dataAccessLog.findFirst({ where: { action: "DELETE_STUDENT", targetId: ids.student } });
    assert.ok(accessLog, "DELETE_STUDENT disclosure entry logged");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await cleanup();
  }
});
