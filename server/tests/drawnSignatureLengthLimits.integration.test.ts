import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test, { after } from "node:test";
import prisma from "../src/lib/prisma";
import app from "../src/index";
import { signUserToken } from "../src/middleware/auth";

// Regression test: POST /api/sessions/:id/submit-verification accepted an
// unbounded DRAWN signatureData string stored verbatim in the database
// (REPORT.md §8, P1). It is now capped at 1M chars and must be an image
// data URL, matching the in-app signature pad's canvas PNG output.

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
    close: () => new Promise<void>((resolve, reject) => server.close(() => resolve())),
  };
}

async function createFixture(suffix: string) {
  const student = await db.user.create({
    data: {
      email: `sigcap-student-${suffix}@example.invalid`,
      name: "Sig Cap",
      role: "STUDENT",
      emailVerified: true,
      eligibilityAttestation: { create: { eligible13Plus: true, policyVersion: "2026-09-05", method: "test_fixture" } },
    },
  });
  const org = await db.organization.create({
    data: { name: `Sigcap Org ${suffix}`, email: `sigcap-org-${suffix}@example.invalid` },
  });
  const opportunity = await db.opportunity.create({
    data: {
      title: `Sigcap Opp ${suffix}`,
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
  return { student, org, opportunity, session };
}

async function cleanup(f: Awaited<ReturnType<typeof createFixture>>) {
  await db.auditLog.deleteMany({ where: { sessionId: f.session.id } });
  await db.serviceSession.deleteMany({ where: { id: f.session.id } });
  await db.opportunity.deleteMany({ where: { id: f.opportunity.id } });
  await db.organization.deleteMany({ where: { id: f.org.id } });
  await db.user.deleteMany({ where: { id: f.student.id } });
}

test("DRAWN signatures are bounded and must be image data URLs", async () => {
  const f = await createFixture(`sig-${Date.now()}`);
  const http = await startServer();
  const post = (payload: Record<string, unknown>) => fetch(`${http.baseUrl}/api/sessions/${f.session.id}/submit-verification`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${signUserToken({ ...f.student, tokenVersion: 0 })}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  try {
    const oversized = await post({ signatureType: "DRAWN", signatureData: `data:image/png;base64,${"A".repeat(1000001)}` });
    assert.equal(oversized.status, 400, await oversized.text());

    const notAnImage = await post({ signatureType: "DRAWN", signatureData: "hello-not-a-data-url" });
    assert.equal(notAnImage.status, 400, await notAnImage.text());

    // Small canvas PNG data URL (what SignaturePad.tsx emits) still works.
    const valid = await post({ signatureType: "DRAWN", signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" });
    assert.equal(valid.status, 200, await valid.text());
    const updated = await db.serviceSession.findUnique({ where: { id: f.session.id } });
    assert.equal(updated.status, "PENDING_VERIFICATION");
    assert.equal(updated.signatureType, "DRAWN");
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
