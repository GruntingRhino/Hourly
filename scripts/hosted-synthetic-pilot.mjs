// Explicitly scoped hosted synthetic API rehearsal. No production writes, no secrets in output.
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
const require = createRequire('/home/opc/RTB/projects/goodhours/package.json');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dbUrl = process.env.DATABASE_URL;
const host = dbUrl && new URL(dbUrl).hostname.replace('-pooler.', '.');
if (host !== 'ep-summer-flower-avc14pih.c-11.us-east-1.aws.neon.tech' || process.env.QA_BASE !== 'https://hourly-dev.vercel.app') throw new Error('Isolated staging target required');
const db = new PrismaClient({ datasources: { db: { url: dbUrl } } });
const base = process.env.QA_BASE;
const run = `SYNTHETIC-PILOT-${Date.now()}`;
const pass = crypto.randomBytes(24).toString('hex') + 'Aa!1';
const output = { run, steps: [], fixtureIds: {} };
async function api(path, expected, token, body) {
  const r = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  let data; try { data = await r.json(); } catch { data = {}; }
  if (r.status !== expected) throw new Error(`${path.split('?')[0]} expected ${expected}, got ${r.status}; code=${data.code ?? 'none'}`);
  output.steps.push(`${path.split('?')[0]}: ${r.status}`);
  return data;
}
async function login(email) { const d = await api('/api/auth/login', 200, null, { email, password: pass }); if (!d.token) throw new Error('Login token absent'); return d.token; }
const record = (key, value) => { output.fixtureIds[key] = value.id; return value; };
try {
  await api('/api/health', 200);
  if (await db.user.count() !== 0 || await db.school.count() !== 0) throw new Error('Expected empty staging users and schools');
  const hash = await bcrypt.hash(pass, 12);
  const school = record('school', await db.school.create({ data: { name: `${run} SCHOOL`, domain: 'example.test', ownershipStatus: 'APPROVED', verified: true, onboardingComplete: true } }));
  const other = record('otherSchool', await db.school.create({ data: { name: `${run} OTHER`, ownershipStatus: 'APPROVED', verified: true, onboardingComplete: true } }));
  const cohort = record('cohort', await db.cohort.create({ data: { name: `${run} COHORT`, schoolId: school.id, status: 'PUBLISHED' } }));
  const beneficiary = record('beneficiary', await db.beneficiary.create({ data: { name: `${run} BENEFICIARY`, status: 'ACTIVE', visibility: 'PRIVATE', createdBySchoolId: school.id } }));
  const admin = record('admin', await db.user.create({ data: { email: `${run.toLowerCase()}-admin@example.test`, name: `${run} Admin`, role: 'SCHOOL_ADMIN', passwordHash: hash, schoolId: school.id, isTestAccount: true, emailVerified: true } }));
  const otherAdmin = record('otherAdmin', await db.user.create({ data: { email: `${run.toLowerCase()}-other@example.test`, name: `${run} Other Admin`, role: 'SCHOOL_ADMIN', passwordHash: hash, schoolId: other.id, isTestAccount: true, emailVerified: true } }));
  const org = record('org', await db.organization.create({ data: { name: `${run} ORG`, email: `${run.toLowerCase()}-org@example.test`, status: 'APPROVED' } }));
  const orgAdmin = record('orgAdmin', await db.user.create({ data: { email: `${run.toLowerCase()}-orgadmin@example.test`, name: `${run} Org Admin`, role: 'ORG_ADMIN', passwordHash: hash, organizationId: org.id, isTestAccount: true, emailVerified: true } }));
  const raw = crypto.randomBytes(32).toString('hex');
  const invite = record('invitation', await db.studentInvitation.create({ data: { cohortId: cohort.id, email: `${run.toLowerCase()}-student@example.test`, name: `${run} Student`, token: crypto.createHash('sha256').update(raw).digest('hex'), expiresAt: new Date(Date.now() + 3600000) } }));
  const publicInvite = await api(`/api/invitations/student?token=${raw}`, 200);
  if (publicInvite.schoolId !== school.id) throw new Error('Invitation not school-scoped');
  const accepted = await api('/api/invitations/student/accept', 201, null, { token: raw, name: `${run} Student`, password: pass, eligible13Plus: true });
  if (accepted.user?.schoolId !== school.id) throw new Error('Accepted student school mismatch');
  const student = record('student', await db.user.update({ where: { id: accepted.user.id }, data: { isTestAccount: true } }));
  const att = await db.eligibilityAttestation.findUnique({ where: { userId: student.id } });
  if (!att?.eligible13Plus || (await db.studentInvitation.findUnique({ where: { id: invite.id } })).status !== 'ACCEPTED') throw new Error('Invitation/attestation DB mismatch');
  const studentToken = await login(student.email);
  const orgToken = await login(orgAdmin.email);
  const otherToken = await login(otherAdmin.email);
  const adminToken = await login(admin.email);
  const eastern = Object.fromEntries(new Intl.DateTimeFormat('en-US',{ timeZone:'America/New_York', year:'numeric',month:'numeric',day:'numeric' }).formatToParts(new Date()).map(x=>[x.type,x.value]));
  const day = new Date(Date.UTC(+eastern.year, +eastern.month-1, +eastern.day));
  const opp = record('opportunity', await db.opportunity.create({ data: { title: `${run} EVENT`, description: 'Synthetic test event', location:'Synthetic', date:day, startTime:'12:00 AM', endTime:'11:59 PM', durationHours:23, capacity:5, organizationId:org.id, status:'ACTIVE' } }));
  const session = record('session', await db.serviceSession.create({ data: { userId:student.id, schoolId:school.id, opportunityId:opp.id, status:'PENDING_CHECKIN' } }));
  await api(`/api/sessions/${session.id}/qr-token`,403,otherToken,{});
  await api(`/api/reports/student?studentId=${student.id}`,403,otherToken);
  const issued = await api(`/api/sessions/${session.id}/qr-token`,201,orgToken,{ ttlSeconds:300 });
  const resolved = await api('/api/sessions/qr-resolve',200,studentToken,{token:issued.token});
  if (resolved.sessionId !== session.id) throw new Error('QR resolution not own session');
  await api(`/api/sessions/${session.id}/qr-checkin`,200,studentToken,{token:issued.token});
  await api(`/api/sessions/${session.id}/qr-checkin`,409,studentToken,{token:issued.token});
  const saved = await db.serviceSession.findUnique({where:{id:session.id}});
  if(saved.status !== 'CHECKED_IN' || await db.attendanceQrRedemption.count({where:{sessionId:session.id}}) !== 1) throw new Error('QR database outcome mismatch');
  await api(`/api/reports/student?studentId=${student.id}`,200,adminToken);
  if(await db.user.count({where:{email:{startsWith:run.toLowerCase()}}}) !== 4) throw new Error('Synthetic user count mismatch');
  output.outcome = 'API_DB_PASS';
} catch (e) { output.outcome = 'FAIL'; output.failure = e.message; process.exitCode = 1; }
finally { console.log(JSON.stringify(output)); await db.$disconnect(); }
