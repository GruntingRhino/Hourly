import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import prisma from "../src/lib/prisma";
import { evaluateRetentionEligibility } from "../src/lib/retentionStore";

const db = prisma as any;

// Durable retention/legal-hold records (LOCAL-SYNTHETIC, disposable loopback
// PostgreSQL only). Synthetic fixtures below use fixed `gh-retention-*` ids
// and are removed in setup/teardown by the TEST HARNESS — product code never
// deletes these rows (asserted at the bottom via source inspection).
// Synthetic age thresholds (e.g. 3650 days) are owner-provided INPUTS under
// test: this suite chooses no real durations, claims no compliance, approves
// no policy, and performs no purge. Owner approval remains gated by
// DEF-LEGAL-007 in docs/qa/DEFERRED_REQUIREMENTS.md.

const DAY_MS = 86400000;
const now = new Date("2026-09-12T00:00:00Z");
const oldRecord = new Date(now.getTime() - 4000 * DAY_MS);

const POLICY_IDS = ["gh-retention-policy-a", "gh-retention-policy-b"];
const HOLD_IDS = ["gh-retention-hold-a", "gh-retention-hold-b", "gh-retention-hold-c"];

async function cleanStore() {
  await db.legalHold.deleteMany({ where: { id: { in: HOLD_IDS } } });
  await db.retentionPolicy.deleteMany({ where: { id: { in: POLICY_IDS } } });
}

function approvedPolicyRow(id: string, version = 1, olderThanDays = 3650) {
  return {
    id,
    version,
    ownerApproved: true,
    approvedBy: "synthetic-owner",
    approvedAt: new Date("2026-09-12T00:00:00Z"),
    rules: [{ recordType: "AuditLog", olderThanDays }],
  };
}

test("empty store blocks every check with NO_POLICY", async () => {
  await cleanStore();
  try {
    assert.equal(await db.retentionPolicy.count(), 0);
    const result = await evaluateRetentionEligibility({ recordType: "AuditLog", createdAt: oldRecord, now });
    assert.equal(result.eligible, false);
    assert.equal((result as { reason: string }).reason, "NO_POLICY");
  } finally {
    await cleanStore();
  }
});

test("stored but unapproved policy blocks with NOT_OWNER_APPROVED", async () => {
  await cleanStore();
  try {
    await db.retentionPolicy.create({
      data: { ...approvedPolicyRow(POLICY_IDS[0]), ownerApproved: false, approvedBy: null, approvedAt: null },
    });
    const result = await evaluateRetentionEligibility({ recordType: "AuditLog", createdAt: oldRecord, now });
    assert.equal(result.eligible, false);
    assert.equal((result as { reason: string }).reason, "NOT_OWNER_APPROVED");
  } finally {
    await cleanStore();
  }
});

test("newest policy row governs: later unapproved version re-blocks", async () => {
  await cleanStore();
  try {
    await db.retentionPolicy.create({ data: approvedPolicyRow(POLICY_IDS[0], 1) });
    const eligible = await evaluateRetentionEligibility({ recordType: "AuditLog", createdAt: oldRecord, now });
    assert.equal(eligible.eligible, true);
    await db.retentionPolicy.create({
      data: { ...approvedPolicyRow(POLICY_IDS[1], 2), ownerApproved: false, approvedBy: null, approvedAt: null },
    });
    const blocked = await evaluateRetentionEligibility({ recordType: "AuditLog", createdAt: oldRecord, now });
    assert.equal(blocked.eligible, false);
    assert.equal((blocked as { reason: string }).reason, "NOT_OWNER_APPROVED");
  } finally {
    await cleanStore();
  }
});

test("malformed owner thresholds stay blocked: code chooses no durations", async () => {
  await cleanStore();
  try {
    await db.retentionPolicy.create({
      data: { ...approvedPolicyRow(POLICY_IDS[0]), rules: [{ recordType: "AuditLog", olderThanDays: -5 }] },
    });
    const result = await evaluateRetentionEligibility({ recordType: "AuditLog", createdAt: oldRecord, now });
    assert.equal(result.eligible, false);
    assert.equal((result as { reason: string }).reason, "POLICY_INVALID");
  } finally {
    await cleanStore();
  }
});

test("active durable hold blocks; released hold keeps its audit trail and unblocks", async () => {
  await cleanStore();
  try {
    await db.retentionPolicy.create({ data: approvedPolicyRow(POLICY_IDS[0]) });
    await db.legalHold.create({
      data: { id: HOLD_IDS[0], active: true, reason: "synthetic hold", createdBy: "synthetic-owner" },
    });
    const blocked = await evaluateRetentionEligibility({ recordType: "AuditLog", createdAt: oldRecord, now });
    assert.equal(blocked.eligible, false);
    assert.equal((blocked as { reason: string }).reason, "LEGAL_HOLD_ACTIVE");

    await db.legalHold.update({
      where: { id: HOLD_IDS[0] },
      data: { active: false, releasedAt: new Date("2026-09-12T00:00:00Z"), releasedBy: "synthetic-owner" },
    });
    const released = await db.legalHold.findUnique({ where: { id: HOLD_IDS[0] } });
    assert.ok(released);
    assert.equal(released.active, false);
    assert.ok(released.releasedAt instanceof Date);
    assert.equal(released.releasedBy, "synthetic-owner");
    assert.equal(released.createdBy, "synthetic-owner");

    const eligible = await evaluateRetentionEligibility({ recordType: "AuditLog", createdAt: oldRecord, now });
    assert.equal(eligible.eligible, true);
    assert.equal((eligible as { requiresOwnerExecution?: boolean }).requiresOwnerExecution, true);
  } finally {
    await cleanStore();
  }
});

test("school-scoped durable hold blocks only its school", async () => {
  await cleanStore();
  try {
    await db.retentionPolicy.create({ data: approvedPolicyRow(POLICY_IDS[0]) });
    await db.legalHold.create({
      data: { id: HOLD_IDS[1], active: true, schoolId: "synthetic-school-a", createdBy: "synthetic-owner" },
    });
    const blocked = await evaluateRetentionEligibility({
      recordType: "AuditLog", createdAt: oldRecord, now, schoolId: "synthetic-school-a",
    });
    assert.equal(blocked.eligible, false);
    const allowed = await evaluateRetentionEligibility({
      recordType: "AuditLog", createdAt: oldRecord, now, schoolId: "synthetic-school-b",
    });
    assert.equal(allowed.eligible, true);
  } finally {
    await cleanStore();
  }
});

test("hold with unknown recordType fails closed across every type", async () => {
  await cleanStore();
  try {
    await db.retentionPolicy.create({
      data: {
        ...approvedPolicyRow(POLICY_IDS[0]),
        rules: [
          { recordType: "AuditLog", olderThanDays: 3650 },
          { recordType: "DataAccessLog", olderThanDays: 3650 },
        ],
      },
    });
    await db.legalHold.create({
      data: { id: HOLD_IDS[2], active: true, recordType: "NotARecordType", createdBy: "synthetic-owner" },
    });
    for (const recordType of ["AuditLog", "DataAccessLog"] as const) {
      const result = await evaluateRetentionEligibility({ recordType, createdAt: oldRecord, now });
      assert.equal(result.eligible, false, recordType);
      assert.equal((result as { reason: string }).reason, "LEGAL_HOLD_ACTIVE", recordType);
    }
  } finally {
    await cleanStore();
  }
});

test("retention store is read-only and snapshot-atomic: no writes, no deletes, no purge caller", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/lib/retentionStore.ts"), "utf8");
  assert.doesNotMatch(source, /\.deleteMany\(|\.delete\(/, "store must never delete rows");
  assert.doesNotMatch(source, /\.create\(|\.update\(|\.upsert\(/, "store must never write rows");
  assert.doesNotMatch(source, /auditLog|dataAccessLog/, "store must not touch disclosure tables at all");
  assert.match(
    source,
    /prisma\.\$transaction\(\s*\[/,
    "policy and holds must be read in one transaction snapshot",
  );
  assert.match(source, /isolationLevel:\s*"Serializable"/, "snapshot must be serializable");
  assert.match(source, /isPurgeEligible\(/, "eligibility must delegate to the pure fail-closed gate");
});
