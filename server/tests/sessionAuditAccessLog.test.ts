import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma";
import reportsRoutes from "../src/routes/reports";

const db = prisma as any;
const student = { id: "qa-student", email: "student@example.test", role: "STUDENT" };

async function requestAudit(actor = student) {
  const app = express(); app.use("/api/reports", reportsRoutes);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const addr = server.address(); assert.ok(addr && typeof addr === "object");
    const token = jwt.sign({ userId: actor.id, email: actor.email, role: actor.role, tv: 0 }, process.env.JWT_SECRET!);
    return await fetch(`http://127.0.0.1:${addr.port}/api/reports/audit/qa-session`, { headers: { authorization: `Bearer ${token}` } });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

async function withMocks(logCreate: (input: any) => Promise<any>, check: () => Promise<void>, actor = student) {
  const old = { userFindUnique: db.user.findUnique, sessionFindUnique: db.serviceSession.findUnique, auditFindMany: db.auditLog.findMany, logCreate: db.dataAccessLog.create };
  db.user.findUnique = async ({ where }: any) => where.id === student.id
    ? ({ id: student.id, email: student.email, role: student.role, status: "ACTIVE", tokenVersion: 0, emailVerified: true, schoolId: "qa-school", cohortId: "qa-cohort", cohort: { schoolId: "qa-school" }, cohortMemberships: [], eligibilityAttestation: { eligible13Plus: true } })
    : ({ ...actor, status: "ACTIVE", tokenVersion: 0, emailVerified: true, schoolId: actor.role === "ORG_ADMIN" ? null : "other-school", organizationId: "other-org", assignedCohorts: [] });
  db.serviceSession.findUnique = async () => ({ id: "qa-session", userId: student.id, user: { id: student.id, schoolId: "qa-school", cohort: null, classroom: null }, opportunity: { organizationId: "qa-org" } });
  db.auditLog.findMany = async () => [{ id: "qa-audit", actor: { id: "qa-actor", name: "QA Actor", role: "ORG_ADMIN" } }];
  db.dataAccessLog.create = logCreate;
  try { await check(); } finally {
    db.user.findUnique = old.userFindUnique; db.serviceSession.findUnique = old.sessionFindUnique;
    db.auditLog.findMany = old.auditFindMany; db.dataAccessLog.create = old.logCreate;
  }
}

test("session audit access logs the student subject before response", async () => {
  const events: any[] = [];
  await withMocks(async (input) => { events.push(input.data); return input.data; }, async () => {
    const res = await requestAudit(); assert.equal(res.status, 200);
    assert.equal((await res.json()).length, 1);
    assert.equal(events.length, 1);
    assert.equal(events[0].actorId, student.id);
    assert.equal(events[0].targetId, student.id);
    assert.equal(events[0].schoolId, "qa-school");
    assert.ok(!JSON.stringify(events[0]).includes(student.email));
  });
});

test("session audit attributes a membership-only student to the authorized teacher's school", async () => {
  const teacher = { id: "qa-teacher", email: "teacher@example.test", role: "TEACHER" };
  const writes: any[] = [];
  await withMocks(async (input) => { writes.push(input.data); return input.data; }, async () => {
    db.user.findUnique = async ({ where }: any) => where.id === student.id
      ? ({ id: student.id, role: "STUDENT", schoolId: null, cohortId: null, cohort: null, classroom: null,
        cohortMemberships: [{ isActive: true, cohortId: "qa-cohort", cohort: { schoolId: "qa-school" } }],
        emailVerified: true, status: "ACTIVE", tokenVersion: 0, eligibilityAttestation: { eligible13Plus: true } })
      : ({ ...teacher, schoolId: "qa-school", school: { verified: true, ownershipStatus: "APPROVED" }, assignedCohorts: [{ cohortId: "qa-cohort" }],
        emailVerified: true, status: "ACTIVE", tokenVersion: 0 });
    db.serviceSession.findUnique = async () => ({ id: "qa-session", userId: student.id,
      user: { id: student.id, schoolId: null, cohort: null, classroom: null },
      opportunity: { organizationId: "qa-org" } });
    const res = await requestAudit(teacher);
    assert.equal(res.status, 200, await res.text());
    assert.equal(writes.length, 1);
    assert.equal(writes[0].schoolId, "qa-school");
  }, teacher);
});

test("session audit access fails closed on audit-write outage", async () => {
  await withMocks(async () => { throw new Error("simulated audit outage"); }, async () => {
    const res = await requestAudit(); assert.equal(res.status, 500);
    assert.doesNotMatch(await res.text(), /qa-audit/);
  });
});

for (const role of ["STUDENT", "TEACHER", "SCHOOL_ADMIN", "ORG_ADMIN"] as const) {
  test(`session audit denies an unrelated ${role} without reading or logging protected data`, async () => {
    const actor = { id: `other-${role}`, email: `other-${role}@example.test`, role };
    let writes = 0;
    let reads = 0;
    await withMocks(async () => { writes++; return {}; }, async () => {
      const originalRead = db.auditLog.findMany;
      db.auditLog.findMany = async () => { reads++; return [{ id: "qa-audit" }]; };
      try {
        const res = await requestAudit(actor);
        assert.equal(res.status, 403);
        assert.doesNotMatch(await res.text(), /qa-audit|qa-actor/);
        assert.equal(reads, 0);
        assert.equal(writes, 0);
      } finally { db.auditLog.findMany = originalRead; }
    }, actor);
  });
}
