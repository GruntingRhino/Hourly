import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "qr-token-cohort-scope-test-jwt-secret";
process.env.ATTENDANCE_QR_SECRET = "qr-token-cohort-scope-test-secret";

const prisma = require("../src/lib/prisma").default as typeof import("../src/lib/prisma").default;
const sessionRoutes = require("../src/routes/sessions").default as typeof import("../src/routes/sessions").default;
const prismaClient = prisma as any;

type TeacherFixture = {
  id: string;
  role: string;
  schoolId: string;
  assignedCohorts: string[];
};

type StudentFixture = {
  id: string;
  schoolId: string;
  cohortId: string | null;
};

function authUserFor(teacher: TeacherFixture) {
  return {
    id: teacher.id,
    email: `${teacher.id}@school.test`,
    role: teacher.role,
    status: "ACTIVE",
    tokenVersion: 0,
    emailVerified: true,
    eligibilityAttestation: { eligible13Plus: true },
    schoolId: teacher.schoolId,
    school: { verified: true, ownershipStatus: "APPROVED" },
  };
}

function studentRecord(student: StudentFixture) {
  return {
    id: student.id,
    role: "STUDENT",
    schoolId: student.schoolId,
    cohortId: student.cohortId,
    cohort: student.cohortId ? { schoolId: student.schoolId } : null,
    cohortMemberships: student.cohortId
      ? [{ cohortId: student.cohortId, cohort: { schoolId: student.schoolId } }]
      : [],
    classroom: null,
  };
}

async function postQrToken(app: express.Express, sessionId: string, actorId: string, actorRole: string) {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const token = jwt.sign(
      { userId: actorId, email: `${actorId}@school.test`, role: actorRole, tv: 0 },
      process.env.JWT_SECRET!,
    );
    const response = await fetch(`http://127.0.0.1:${(address as any).port}/${sessionId}/qr-token`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ ttlSeconds: 300 }),
    });
    return response;
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

function installMocks(opts: {
  teacher: TeacherFixture;
  student: StudentFixture;
  session: { id: string; schoolId: string | null; opportunityOrgId: string };
}) {
  const original = {
    userFindUnique: prismaClient.user.findUnique,
    sessionFindUnique: prismaClient.serviceSession.findUnique,
    qrCreate: prismaClient.attendanceQrToken?.create,
  };

  prismaClient.user.findUnique = async ({ where, select }: any) => {
    if (where.id === opts.teacher.id) {
      if (select?.assignedCohorts) {
        return {
          id: opts.teacher.id,
          role: opts.teacher.role,
          schoolId: opts.teacher.schoolId,
          assignedCohorts: opts.teacher.assignedCohorts.map((cohortId) => ({ cohortId })),
        };
      }
      if (select?.organizationId) {
        return {
          organizationId: null,
          schoolId: opts.teacher.schoolId,
          role: opts.teacher.role,
        };
      }
      return authUserFor(opts.teacher);
    }
    if (where.id === opts.student.id) return studentRecord(opts.student);
    return null;
  };

  prismaClient.serviceSession.findUnique = async () => ({
    id: opts.session.id,
    userId: opts.student.id,
    schoolId: opts.session.schoolId,
    opportunityId: "opp-1",
    opportunity: { organizationId: opts.session.opportunityOrgId },
  });

  prismaClient.attendanceQrToken = prismaClient.attendanceQrToken ?? {};
  prismaClient.attendanceQrToken.create = async ({ data }: any) => ({ ...data, createdAt: new Date() });

  return () => {
    prismaClient.user.findUnique = original.userFindUnique;
    prismaClient.serviceSession.findUnique = original.sessionFindUnique;
    if (original.qrCreate) prismaClient.attendanceQrToken.create = original.qrCreate;
  };
}

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(sessionRoutes);
  return app;
}

test("same-school teacher outside assigned cohort cannot mint a QR token (403)", async () => {
  const restore = installMocks({
    teacher: { id: "teacher-a", role: "TEACHER", schoolId: "school-a", assignedCohorts: ["cohort-a"] },
    student: { id: "student-b", schoolId: "school-a", cohortId: "cohort-b" },
    session: { id: "session-b", schoolId: "school-a", opportunityOrgId: "org-1" },
  });
  try {
    const response = await postQrToken(makeApp(), "session-b", "teacher-a", "TEACHER");
    assert.equal(response.status, 403);
  } finally {
    restore();
  }
});

test("assigned-cohort teacher can mint a QR token (201)", async () => {
  const restore = installMocks({
    teacher: { id: "teacher-a", role: "TEACHER", schoolId: "school-a", assignedCohorts: ["cohort-a"] },
    student: { id: "student-a", schoolId: "school-a", cohortId: "cohort-a" },
    session: { id: "session-a", schoolId: "school-a", opportunityOrgId: "org-1" },
  });
  try {
    const response = await postQrToken(makeApp(), "session-a", "teacher-a", "TEACHER");
    const body = (await response.json()) as { token?: string; expiresAt?: string };
    assert.equal(response.status, 201, JSON.stringify(body));
    assert.ok(typeof body.token === "string" && body.token.length > 0);
    assert.ok(body.expiresAt);
  } finally {
    restore();
  }
});

test("cross-school teacher cannot mint a QR token (403)", async () => {
  const restore = installMocks({
    teacher: { id: "teacher-a", role: "TEACHER", schoolId: "school-a", assignedCohorts: ["cohort-a"] },
    student: { id: "student-foreign", schoolId: "school-b", cohortId: "cohort-foreign" },
    session: { id: "session-foreign", schoolId: "school-b", opportunityOrgId: "org-1" },
  });
  try {
    const response = await postQrToken(makeApp(), "session-foreign", "teacher-a", "TEACHER");
    assert.equal(response.status, 403);
  } finally {
    restore();
  }
});

test("school admin in the same school can still mint a QR token (201, behavior preserved)", async () => {
  const restore = installMocks({
    teacher: { id: "admin-a", role: "SCHOOL_ADMIN", schoolId: "school-a", assignedCohorts: [] },
    student: { id: "student-b", schoolId: "school-a", cohortId: "cohort-b" },
    session: { id: "session-b", schoolId: "school-a", opportunityOrgId: "org-1" },
  });
  try {
    const response = await postQrToken(makeApp(), "session-b", "admin-a", "SCHOOL_ADMIN");
    const body = (await response.json()) as { token?: string; expiresAt?: string };
    assert.equal(response.status, 201, JSON.stringify(body));
    assert.ok(typeof body.token === "string" && body.token.length > 0);
  } finally {
    restore();
  }
});
