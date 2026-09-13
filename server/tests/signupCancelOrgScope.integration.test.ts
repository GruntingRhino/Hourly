import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test, { after } from "node:test";
import prisma from "../src/lib/prisma";
import app from "../src/index";
import { signUserToken } from "../src/middleware/auth";

// Regression test: POST /api/signups/:id/cancel must enforce
// organization ownership for ORG_ADMIN callers — any ORG_ADMIN could
// previously cancel any signup in the system (REPORT.md §7(a), P1).
// Mirrors the ownership rule on the verification approve/reject routes.

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

async function cancelAs(baseUrl: string, user: { id: string; email: string; role: string; tokenVersion: number }, signupId: string) {
  return fetch(`${baseUrl}/api/signups/${signupId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${signUserToken(user)}` },
  });
}

async function createFixture(suffix: string) {
  const orgA = await db.organization.create({
    data: { name: `Cancel Org A ${suffix}`, email: `cancel-orga-${suffix}@example.invalid` },
  });
  const orgB = await db.organization.create({
    data: { name: `Cancel Org B ${suffix}`, email: `cancel-orgb-${suffix}@example.invalid` },
  });
  const makeUser = (role: string, label: string, extra: Record<string, unknown> = {}) => db.user.create({
    data: {
      email: `${label}-${suffix}@example.invalid`,
      name: label,
      role,
      emailVerified: true,
      eligibilityAttestation: { create: { eligible13Plus: true, policyVersion: "2026-09-05", method: "test_fixture" } },
      ...extra,
    },
  });
  const adminA = await makeUser("ORG_ADMIN", "cancel-admin-a", { organizationId: orgA.id });
  const adminB = await makeUser("ORG_ADMIN", "cancel-admin-b", { organizationId: orgB.id });
  const student1 = await makeUser("STUDENT", "cancel-student-1");
  const student2 = await makeUser("STUDENT", "cancel-student-2");
  const opportunity = await db.opportunity.create({
    data: {
      title: `Cancel Opp ${suffix}`,
      description: "fixture",
      location: "fixture",
      date: new Date(Date.now() + 86400000),
      startTime: "10:00 AM",
      endTime: "2:00 PM",
      durationHours: 4,
      capacity: 10,
      organizationId: orgA.id,
    },
  });
  const signup1 = await db.signup.create({
    data: { userId: student1.id, opportunityId: opportunity.id, status: "CONFIRMED" },
  });
  const signup2 = await db.signup.create({
    data: { userId: student2.id, opportunityId: opportunity.id, status: "CONFIRMED" },
  });
  return { orgA, orgB, adminA, adminB, student1, student2, opportunity, signup1, signup2 };
}

async function cleanup(f: Awaited<ReturnType<typeof createFixture>>) {
  const ids = [f.adminA.id, f.adminB.id, f.student1.id, f.student2.id];
  await db.notification.deleteMany({ where: { userId: { in: ids } } });
  await db.signup.deleteMany({ where: { id: { in: [f.signup1.id, f.signup2.id] } } });
  await db.opportunity.deleteMany({ where: { id: f.opportunity.id } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.organization.deleteMany({ where: { id: { in: [f.orgA.id, f.orgB.id] } } });
}

test("ORG_ADMIN from another organization cannot cancel a signup", async () => {
  const f = await createFixture(`other-${Date.now()}`);
  const http = await startServer();
  try {
    const response = await cancelAs(http.baseUrl, f.adminB, f.signup1.id);
    assert.equal(response.status, 403, await response.text());
    const signup = await db.signup.findUnique({ where: { id: f.signup1.id } });
    assert.equal(signup.status, "CONFIRMED");
  } finally {
    await http.close();
    await cleanup(f);
  }
});

test("ORG_ADMIN from the owning organization can cancel, and students can cancel their own", async () => {
  const f = await createFixture(`own-${Date.now()}`);
  const http = await startServer();
  try {
    const ownOrg = await cancelAs(http.baseUrl, f.adminA, f.signup2.id);
    assert.equal(ownOrg.status, 200, await ownOrg.text());
    assert.equal((await db.signup.findUnique({ where: { id: f.signup2.id } })).status, "CANCELLED");

    const self = await cancelAs(http.baseUrl, f.student1, f.signup1.id);
    assert.equal(self.status, 200, await self.text());
    assert.equal((await db.signup.findUnique({ where: { id: f.signup1.id } })).status, "CANCELLED");
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
