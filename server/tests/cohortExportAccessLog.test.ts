import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma";
import cohortRoutes from "../src/routes/cohorts";

const db = prisma as any;
const actor = { id: "qa-school-admin", email: "admin@example.test", role: "SCHOOL_ADMIN" };

async function fetchExport() {
  const app = express();
  app.use("/api/cohorts", cohortRoutes);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const addr = server.address();
    assert.ok(addr && typeof addr === "object");
    const token = jwt.sign({ userId: actor.id, email: actor.email, role: actor.role, tv: 0 }, process.env.JWT_SECRET!);
    return await fetch(`http://127.0.0.1:${addr.port}/api/cohorts/export`, { headers: { authorization: `Bearer ${token}` } });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("cohort CSV export logs authorized access before releasing the file", async () => {
  const old = { userFindUnique: db.user.findUnique, schoolFindUnique: db.school.findUnique, cohortFindMany: db.cohort.findMany, userFindMany: db.user.findMany, logCreate: db.dataAccessLog.create };
  const events: any[] = [];
  db.user.findUnique = async () => ({ id: actor.id, email: actor.email, role: actor.role, status: "ACTIVE", tokenVersion: 0, emailVerified: true, schoolId: "qa-school", assignedCohorts: [] });
  db.school.findUnique = async () => ({ requiredHours: 40 });
  db.cohort.findMany = async () => [];
  db.user.findMany = async () => [];
  db.dataAccessLog.create = async (input: any) => { events.push(input.data); return input.data; };
  try {
    const res = await fetchExport();
    assert.equal(res.status, 200);
    assert.match(await res.text(), /Cohort Name/);
    assert.equal(events.length, 1);
    assert.equal(events[0].actorId, actor.id);
    assert.equal(events[0].schoolId, "qa-school");
    assert.match(events[0].action, /EXPORT.*COHORT|COHORT.*EXPORT/);
    assert.ok(!JSON.stringify(events[0]).includes(actor.email));
  } finally {
    db.user.findUnique = old.userFindUnique; db.school.findUnique = old.schoolFindUnique;
    db.cohort.findMany = old.cohortFindMany; db.user.findMany = old.userFindMany; db.dataAccessLog.create = old.logCreate;
  }
});

test("cohort CSV export fails closed when access logging fails", async () => {
  const old = { userFindUnique: db.user.findUnique, schoolFindUnique: db.school.findUnique, cohortFindMany: db.cohort.findMany, userFindMany: db.user.findMany, logCreate: db.dataAccessLog.create };
  db.user.findUnique = async () => ({ id: actor.id, email: actor.email, role: actor.role, status: "ACTIVE", tokenVersion: 0, emailVerified: true, schoolId: "qa-school", assignedCohorts: [] });
  db.school.findUnique = async () => ({ requiredHours: 40 });
  db.cohort.findMany = async () => [];
  db.user.findMany = async () => [];
  db.dataAccessLog.create = async () => { throw new Error("simulated audit outage"); };
  try {
    const res = await fetchExport();
    assert.equal(res.status, 500);
    assert.doesNotMatch(await res.text(), /Cohort Name/);
  } finally {
    db.user.findUnique = old.userFindUnique; db.school.findUnique = old.schoolFindUnique;
    db.cohort.findMany = old.cohortFindMany; db.user.findMany = old.userFindMany; db.dataAccessLog.create = old.logCreate;
  }
});
