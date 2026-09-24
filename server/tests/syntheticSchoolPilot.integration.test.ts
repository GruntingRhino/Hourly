import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test, { after } from "node:test";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma";
import app from "../src/index";

// Test-only secrets; these are never read from or written to a deployed
// environment and are intentionally not printed.
process.env.ATTENDANCE_QR_SECRET = "synthetic-only-attendance-secret";
process.env.SUPERVISOR_VERIFICATION_SECRET = "synthetic-only-supervisor-secret";

/**
 * Named fake-pilot acceptance scenario. It intentionally leaves uniquely named
 * fixtures in the disposable loopback test database: this test never deletes or
 * resets records, so the evidence remains inspectable after the run.
 *
 * QR and supervisor verification are exercised through their registered HTTP
 * routes and checked again through the disposable database.
 */
const db = prisma as any;
const runId = `pilot-${Date.now()}`;
const passwordlessToken = (userId: string, email: string, role: string) =>
  `Bearer ${jwt.sign({ userId, email, role, tv: 0 }, process.env.JWT_SECRET!)}`;

async function httpServer(): Promise<{ base: string; server: Server }> {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { base: `http://127.0.0.1:${address.port}`, server };
}

async function request(base: string, path: string, actor: { id: string; email: string; role: string }, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("authorization", passwordlessToken(actor.id, actor.email, actor.role));
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return fetch(`${base}${path}`, { ...init, headers });
}

async function json(response: Response): Promise<any> {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text; }
}

test("fake school pilot: roles, waitlist, attendance, approval, ledger, transcript, export, isolation", async () => {
  const localDb = new URL(process.env.DATABASE_URL!).hostname;
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(localDb), "pilot must use loopback DB");
  assert.match(process.env.DATABASE_URL!, /disposable|test|local/i, "pilot must use a labeled disposable DB");

  const school = await db.school.create({ data: { name: `FAKE PILOT ${runId}`, ownershipStatus: "APPROVED", verified: true, domain: "fake-pilot.test" } });
  const otherSchool = await db.school.create({ data: { name: `FAKE OTHER ${runId}`, ownershipStatus: "APPROVED", verified: true } });
  const cohort = await db.cohort.create({ data: { name: `FAKE COHORT ${runId}`, schoolId: school.id, status: "PUBLISHED" } });
  const beneficiary = await db.beneficiary.create({ data: { name: `FAKE ORG ${runId}`, status: "ACTIVE", visibility: "PRIVATE", createdBySchoolId: school.id } });
  const schoolAdmin = await db.user.create({ data: { email: `${runId}-admin@fake-pilot.test`, name: "FAKE School Admin", role: "SCHOOL_ADMIN", schoolId: school.id, emailVerified: true } });
  const teacher = await db.user.create({ data: { email: `${runId}-teacher@fake-pilot.test`, name: "FAKE Teacher", role: "TEACHER", schoolId: school.id, emailVerified: true } });
  const otherAdmin = await db.user.create({ data: { email: `${runId}-other-admin@fake-pilot.test`, name: "FAKE Other Admin", role: "SCHOOL_ADMIN", schoolId: otherSchool.id, emailVerified: true } });
  const studentOne = await db.user.create({ data: { email: `${runId}-student1@fake-pilot.test`, name: "FAKE Student One", role: "STUDENT", schoolId: school.id, cohortId: cohort.id, emailVerified: true, isTestAccount: true, eligibilityAttestation: { create: { eligible13Plus: true, policyVersion: "fake-pilot", method: "synthetic" } } } });
  const studentTwo = await db.user.create({ data: { email: `${runId}-student2@fake-pilot.test`, name: "FAKE Student Two", role: "STUDENT", schoolId: school.id, cohortId: cohort.id, emailVerified: true, isTestAccount: true, eligibilityAttestation: { create: { eligible13Plus: true, policyVersion: "fake-pilot", method: "synthetic" } } } });
  await db.user.create({ data: { email: `${runId}-org@fake-pilot.test`, name: "FAKE Organization Admin", role: "BENEFICIARY_ADMIN", beneficiaryId: beneficiary.id, emailVerified: true } });
  await db.studentCohortMembership.createMany({ data: [{ studentId: studentOne.id, cohortId: cohort.id }, { studentId: studentTwo.id, cohortId: cohort.id }] });
  await db.cohortTeacherAssignment.create({ data: { cohortId: cohort.id, teacherId: teacher.id } });
  await db.schoolBeneficiaryApproval.create({ data: { schoolId: school.id, beneficiaryId: beneficiary.id, status: "APPROVED", approvedAt: new Date() } });

  const legacyOrganization = await db.organization.create({ data: { name: `FAKE LEGACY ORG ${runId}`, email: `${runId}@fake-pilot.test`, status: "APPROVED" } });
  const legacyOrgAdmin = await db.user.create({ data: { email: `${runId}-legacy-org@fake-pilot.test`, name: "FAKE Legacy Organization Admin", role: "ORG_ADMIN", organizationId: legacyOrganization.id, emailVerified: true } });
  // This scenario exercises a successful QR redemption; use today's Eastern calendar
  // date and an in-window event. The separate window tests cover tight boundaries.
  const easternParts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const easternToday = new Date(Date.UTC(Number(easternParts.year), Number(easternParts.month) - 1, Number(easternParts.day)));
  const legacyOpportunity = await db.opportunity.create({ data: { title: `FAKE Legacy Event ${runId}`, description: "Synthetic only", location: "Synthetic", date: easternToday, startTime: "12:00 AM", endTime: "11:59 PM", durationHours: 23, capacity: 10, organizationId: legacyOrganization.id, status: "ACTIVE" } });
  const legacySession = await db.serviceSession.create({ data: { userId: studentOne.id, schoolId: school.id, opportunityId: legacyOpportunity.id, status: "PENDING_CHECKIN" } });

  const opportunity = await db.beneficiaryOpportunity.create({ data: { title: `FAKE Event ${runId}`, description: "Synthetic only", beneficiaryId: beneficiary.id, startDate: new Date(Date.now() - 3 * 86400000), category: "general" } });
  const slot = await db.beneficiaryTimeSlot.create({ data: { opportunityId: opportunity.id, date: new Date(Date.now() - 2 * 86400000), startTime: "10:00", endTime: "12:00", durationHours: 2, capacity: 1 } });
  const { base, server } = await httpServer();
  try {
    const one = await request(base, `/api/beneficiaries/slots/${slot.id}/signup`, studentOne, { method: "POST", body: "{}" });
    const signupOne = await json(one);
    assert.equal(one.status, 201, JSON.stringify(signupOne));
    const two = await request(base, `/api/beneficiaries/slots/${slot.id}/signup`, studentTwo, { method: "POST", body: "{}" });
    const signupTwo = await json(two);
    assert.equal(two.status, 201, JSON.stringify(signupTwo));
    assert.equal(signupOne.status, "CONFIRMED");
    assert.equal(signupTwo.status, "WAITLISTED");

    const cancel = await request(base, `/api/beneficiaries/signups/${signupOne.id}/cancel`, studentOne, { method: "POST" });
    assert.equal(cancel.status, 200, await cancel.text());
    const promoted = await db.beneficiarySignup.findUnique({ where: { id: signupTwo.id } });
    assert.equal(promoted.status, "CONFIRMED");

    const beneficiaryAdmin = await db.user.findFirst({ where: { beneficiaryId: beneficiary.id } });
    assert.ok(beneficiaryAdmin);
    const attendance = await request(base, `/api/beneficiaries/${beneficiary.id}/opportunities/${opportunity.id}/attendance`, beneficiaryAdmin, { method: "POST", body: JSON.stringify({ records: [{ signupId: signupTwo.id, attendance: "ATTENDED" }] }) });
    assert.equal(attendance.status, 200, await attendance.text());
    const approval = await request(base, `/api/beneficiaries/signups/${signupTwo.id}/approve`, beneficiaryAdmin, { method: "POST", body: JSON.stringify({ approvedHours: 2 }) });
    assert.equal(approval.status, 200, await approval.text());
    const ledger = await db.serviceHourLedgerEntry.findMany({ where: { sourceId: signupTwo.id } });
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].approvedMinutes, 120);

    const report = await request(base, `/api/reports/student?studentId=${encodeURIComponent(studentTwo.id)}`, studentTwo);
    assert.equal(report.status, 200, await report.text());
    const transcript = await request(base, "/api/reports/student/transcript", studentTwo, { method: "POST", body: "{}" });
    const snapshot = await json(transcript);
    assert.equal(transcript.status, 201, JSON.stringify(snapshot));
    const certified = await request(base, `/api/reports/transcripts/${snapshot.id}/certify`, schoolAdmin, { method: "POST", body: "{}" });
    assert.equal(certified.status, 200, await certified.text());
    const exported = await request(base, "/api/reports/export/csv", studentTwo);
    const exportedBody = await exported.text();
    assert.equal(exported.status, 200, exportedBody);
    assert.match(exportedBody, /FAKE Event/);

    const denied = await request(base, `/api/reports/student?studentId=${encodeURIComponent(studentTwo.id)}`, otherAdmin);
    assert.equal(denied.status, 403, await denied.text());
    const teacherReport = await request(base, `/api/reports/student?studentId=${encodeURIComponent(studentTwo.id)}`, teacher);
    assert.equal(teacherReport.status, 200, await teacherReport.text());

    const supervisorEmail = `${runId}-supervisor@fake-pilot.test`;
    const issued = await request(base, `/api/beneficiaries/signups/${signupTwo.id}/supervisor-verification`, beneficiaryAdmin, { method: "POST", body: JSON.stringify({ supervisorEmail }) });
    const issuedBody = await json(issued);
    assert.equal(issued.status, 201, JSON.stringify(issuedBody));
    const supervisorToken = new URLSearchParams(new URL(issuedBody.verificationUrl).hash.replace(/^#/, "")).get("token");
    assert.ok(supervisorToken);
    const consume = await fetch(`${base}/api/beneficiaries/supervisor-verification/consume`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: supervisorToken, supervisorEmail }) });
    assert.equal(consume.status, 200, await consume.text());
    const consumedRecord = await db.supervisorVerification.findUnique({ where: { signupId: signupTwo.id } });
    const consumedSignup = await db.beneficiarySignup.findUnique({ where: { id: signupTwo.id } });
    assert.ok(consumedRecord?.usedAt);
    assert.equal(consumedSignup?.attendance, "ATTENDED");
    const replay = await fetch(`${base}/api/beneficiaries/supervisor-verification/consume`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: supervisorToken, supervisorEmail }) });
    assert.equal(replay.status, 400);
    const otherTenantIssue = await request(base, `/api/beneficiaries/signups/${signupTwo.id}/supervisor-verification`, otherAdmin, { method: "POST", body: JSON.stringify({ supervisorEmail }) });
    assert.equal(otherTenantIssue.status, 403);
    const supervisorSecond = await request(base, `/api/beneficiaries/signups/${signupTwo.id}/supervisor-verification`, beneficiaryAdmin, { method: "POST", body: JSON.stringify({ supervisorEmail }) });
    const supervisorSecondBody = await json(supervisorSecond);
    const supervisorSecondToken = new URLSearchParams(new URL(supervisorSecondBody.verificationUrl).hash.replace(/^#/, "")).get("token");
    const supervisorTampered = `${supervisorSecondToken!.slice(0, -1)}${supervisorSecondToken!.endsWith("a") ? "b" : "a"}`;
    const supervisorTamperResponse = await fetch(`${base}/api/beneficiaries/supervisor-verification/consume`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: supervisorTampered, supervisorEmail }) });
    assert.equal(supervisorTamperResponse.status, 400);
    const supervisorRecord = await db.supervisorVerification.findUnique({ where: { signupId: signupTwo.id } });
    await db.supervisorVerification.update({ where: { id: supervisorRecord.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const supervisorExpired = await fetch(`${base}/api/beneficiaries/supervisor-verification/consume`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: supervisorSecondToken, supervisorEmail }) });
    assert.equal(supervisorExpired.status, 400);

    const qrIssued = await request(base, `/api/sessions/${legacySession.id}/qr-token`, legacyOrgAdmin, { method: "POST", body: JSON.stringify({ ttlSeconds: 300 }) });
    const qrBody = await json(qrIssued);
    assert.equal(qrIssued.status, 201, JSON.stringify(qrBody));
    // A still-valid token must not bypass the event window on either endpoint.
    await db.opportunity.update({ where: { id: legacyOpportunity.id }, data: { date: new Date(easternToday.getTime() - 86400000) } });
    const closedResolve = await request(base, "/api/sessions/qr-resolve", studentOne, { method: "POST", body: JSON.stringify({ token: qrBody.token }) });
    assert.equal(closedResolve.status, 409, await closedResolve.text());
    const closedCheckin = await request(base, `/api/sessions/${legacySession.id}/qr-checkin`, studentOne, { method: "POST", body: JSON.stringify({ token: qrBody.token }) });
    assert.equal(closedCheckin.status, 409, await closedCheckin.text());
    assert.equal(await db.attendanceQrRedemption.count({ where: { sessionId: legacySession.id } }), 0);
    await db.opportunity.update({ where: { id: legacyOpportunity.id }, data: { date: easternToday } });
    const openResolve = await request(base, "/api/sessions/qr-resolve", studentOne, { method: "POST", body: JSON.stringify({ token: qrBody.token }) });
    assert.equal(openResolve.status, 200, await openResolve.text());
    const qrCheckin = await request(base, `/api/sessions/${legacySession.id}/qr-checkin`, studentOne, { method: "POST", body: JSON.stringify({ token: qrBody.token }) });
    assert.equal(qrCheckin.status, 200, await qrCheckin.text());
    const checkedIn = await db.serviceSession.findUnique({ where: { id: legacySession.id } });
    const redemption = await db.attendanceQrRedemption.findFirst({ where: { sessionId: legacySession.id } });
    assert.equal(checkedIn?.status, "CHECKED_IN");
    assert.ok(redemption);
    const qrReplay = await request(base, `/api/sessions/${legacySession.id}/qr-checkin`, studentOne, { method: "POST", body: JSON.stringify({ token: qrBody.token }) });
    assert.equal(qrReplay.status, 409);
    const qrCrossTenant = await request(base, `/api/sessions/${legacySession.id}/qr-checkin`, studentTwo, { method: "POST", body: JSON.stringify({ token: qrBody.token }) });
    assert.equal(qrCrossTenant.status, 403);
    const qrUnauthorizedIssuer = await request(base, `/api/sessions/${legacySession.id}/qr-token`, otherAdmin, { method: "POST", body: JSON.stringify({}) });
    assert.equal(qrUnauthorizedIssuer.status, 403);
    const tampered = `${qrBody.token.slice(0, -1)}${qrBody.token.endsWith("a") ? "b" : "a"}`;
    const qrTamper = await request(base, `/api/sessions/${legacySession.id}/qr-checkin`, studentOne, { method: "POST", body: JSON.stringify({ token: tampered }) });
    assert.equal(qrTamper.status, 400);
    const expiringSession = await db.serviceSession.create({ data: { userId: studentTwo.id, schoolId: school.id, opportunityId: legacyOpportunity.id, status: "PENDING_CHECKIN" } });
    const expiringIssued = await request(base, `/api/sessions/${expiringSession.id}/qr-token`, legacyOrgAdmin, { method: "POST", body: JSON.stringify({ ttlSeconds: 60 }) });
    const expiringBody = await json(expiringIssued);
    assert.equal(expiringIssued.status, 201, JSON.stringify(expiringBody));
    const expiringRecord = await db.attendanceQrToken.findFirst({ where: { opportunityId: legacyOpportunity.id }, orderBy: { createdAt: "desc" } });
    await db.attendanceQrToken.update({ where: { id: expiringRecord.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const qrExpired = await request(base, `/api/sessions/${expiringSession.id}/qr-checkin`, studentTwo, { method: "POST", body: JSON.stringify({ token: expiringBody.token }) });
    assert.equal(qrExpired.status, 400);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

after(async () => { await prisma.$disconnect(); });
