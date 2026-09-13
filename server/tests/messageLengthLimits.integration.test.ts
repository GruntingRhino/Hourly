import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test, { after } from "node:test";
import prisma from "../src/lib/prisma";
import app from "../src/index";
import { signUserToken } from "../src/middleware/auth";

// Regression test: POST /api/messages had no length cap while Message.body
// is unbounded plaintext (REPORT.md §8, P1). Caps mirror the existing
// POST /bulk schema (body ≤ 5000, subject ≤ 255).

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
    data: { name: `Msg cap ${suffix}`, ownershipStatus: "APPROVED", verified: true, onboardingComplete: true },
  });
  const sender = await db.user.create({
    data: {
      email: `msgcap-sender-${suffix}@example.invalid`,
      name: "Cap Sender",
      role: "TEACHER",
      emailVerified: true,
      schoolId: school.id,
    },
  });
  const receiver = await db.user.create({
    data: {
      email: `msgcap-receiver-${suffix}@example.invalid`,
      name: "Cap Receiver",
      role: "TEACHER",
      emailVerified: true,
      schoolId: school.id,
    },
  });
  return { school, sender, receiver };
}

async function cleanup(f: Awaited<ReturnType<typeof createFixture>>) {
  await db.message.deleteMany({ where: { OR: [{ senderId: f.sender.id }, { receiverId: f.receiver.id }] } });
  await db.notification.deleteMany({ where: { userId: { in: [f.sender.id, f.receiver.id] } } });
  await db.user.deleteMany({ where: { id: { in: [f.sender.id, f.receiver.id] } } });
  await db.school.deleteMany({ where: { id: f.school.id } });
}

test("POST /api/messages rejects over-long bodies and subjects, accepts the boundary", async () => {
  const f = await createFixture(`cap-${Date.now()}`);
  const http = await startServer();
  const post = (payload: Record<string, unknown>) => fetch(`${http.baseUrl}/api/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${signUserToken({ ...f.sender, tokenVersion: 0 })}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  try {
    const tooLong = await post({ receiverId: f.receiver.id, body: "x".repeat(5001) });
    assert.equal(tooLong.status, 400, await tooLong.text());

    const longSubject = await post({ receiverId: f.receiver.id, subject: "s".repeat(256), body: "hello" });
    assert.equal(longSubject.status, 400, await longSubject.text());

    const boundary = await post({ receiverId: f.receiver.id, subject: "s".repeat(255), body: "y".repeat(5000) });
    assert.equal(boundary.status, 201, await boundary.text());

    assert.equal(await db.message.count({ where: { senderId: f.sender.id } }), 1);
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
