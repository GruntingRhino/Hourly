import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  assertPurgeAuthorized,
  isPurgeEligible,
  parseRetentionPolicy,
} from "../src/lib/retentionPolicy";

// Fail-closed retention/legal-hold contract (LOCAL-SYNTHETIC, pure unit).
// No database, no fixtures, no deletion. Synthetic thresholds below are
// owner-provided INPUTS under test — this suite chooses no real durations,
// claims no compliance, and approves no policy. Owner approval remains gated
// by DEF-LEGAL-007 in docs/qa/DEFERRED_REQUIREMENTS.md.

const DAY_MS = 86400000;
const now = new Date("2026-09-12T00:00:00Z");
const oldRecord = new Date(now.getTime() - 4000 * DAY_MS);
const freshRecord = new Date(now.getTime() - 10 * DAY_MS);

function approvedPolicy(olderThanDays = 3650) {
  return {
    version: 1,
    ownerApproved: true,
    approvedBy: "synthetic-owner",
    approvedAt: "2026-09-12",
    rules: [{ recordType: "AuditLog", olderThanDays }],
  };
}

test("missing policy blocks purge", () => {
  const result = isPurgeEligible({ recordType: "AuditLog", createdAt: oldRecord, now, policy: undefined });
  assert.equal(result.eligible, false);
  assert.equal((result as { reason: string }).reason, "NO_POLICY");
});

test("unapproved policy blocks purge even for old records", () => {
  for (const policy of [
    { ...approvedPolicy(), ownerApproved: false },
    { ...approvedPolicy(), ownerApproved: "yes" },
    { ...approvedPolicy(), approvedBy: "" },
    { ...approvedPolicy(), approvedAt: "" },
  ]) {
    const result = isPurgeEligible({ recordType: "AuditLog", createdAt: oldRecord, now, policy });
    assert.equal(result.eligible, false, JSON.stringify(policy));
    assert.equal((result as { reason: string }).reason, "NOT_OWNER_APPROVED");
  }
});

test("malformed policy blocks purge", () => {
  assert.equal(parseRetentionPolicy(null).ok, false);
  assert.equal(parseRetentionPolicy({ version: 1, rules: [] }).ok, false);
  assert.equal(
    parseRetentionPolicy({ version: 1, rules: [{ recordType: "AuditLog", olderThanDays: -5 }] }).ok,
    false,
  );
  const result = isPurgeEligible({
    recordType: "AuditLog",
    createdAt: oldRecord,
    now,
    policy: { version: 1, rules: [] },
  });
  assert.equal((result as { reason: string }).reason, "POLICY_INVALID");
});

test("active legal hold blocks an otherwise-eligible record", () => {
  const result = isPurgeEligible({
    recordType: "AuditLog",
    createdAt: oldRecord,
    now,
    policy: approvedPolicy(),
    holds: [{ id: "hold-1", active: true, scope: {} }],
  });
  assert.equal(result.eligible, false);
  assert.equal((result as { reason: string }).reason, "LEGAL_HOLD_ACTIVE");
});

test("inactive holds and non-matching scopes do not block", () => {
  const result = isPurgeEligible({
    recordType: "AuditLog",
    createdAt: oldRecord,
    now,
    policy: approvedPolicy(),
    holds: [
      { id: "released", active: false, scope: {} },
      { id: "other-type", active: true, scope: { recordType: "DataAccessLog" } },
      { id: "other-school", active: true, scope: { schoolId: "school-b" } },
    ],
    schoolId: "school-a",
  });
  assert.equal(result.eligible, true);
});

test("scoped hold blocks only records in scope", () => {
  const hold = { id: "school-a-hold", active: true, scope: { schoolId: "school-a" } };
  const blocked = isPurgeEligible({
    recordType: "AuditLog",
    createdAt: oldRecord,
    now,
    policy: approvedPolicy(),
    holds: [hold],
    schoolId: "school-a",
  });
  assert.equal(blocked.eligible, false);
  const allowed = isPurgeEligible({
    recordType: "AuditLog",
    createdAt: oldRecord,
    now,
    policy: approvedPolicy(),
    holds: [hold],
    schoolId: "school-b",
  });
  assert.equal(allowed.eligible, true);
});

test("record without a covering rule or sufficient age stays blocked", () => {
  const noRule = isPurgeEligible({ recordType: "DataAccessLog", createdAt: oldRecord, now, policy: approvedPolicy() });
  assert.equal((noRule as { reason: string }).reason, "NO_RULE_FOR_TYPE");
  const tooYoung = isPurgeEligible({ recordType: "AuditLog", createdAt: freshRecord, now, policy: approvedPolicy() });
  assert.equal((tooYoung as { reason: string }).reason, "NOT_OLD_ENOUGH");
});

test("eligible answer is advisory and still requires human owner execution", () => {
  const result = isPurgeEligible({ recordType: "AuditLog", createdAt: oldRecord, now, policy: approvedPolicy() });
  assert.equal(result.eligible, true);
  assert.equal((result as { requiresOwnerExecution?: boolean }).requiresOwnerExecution, true);
});

test("assertPurgeAuthorized throws fail-closed and passes only when eligible", () => {
  assert.throws(
    () => assertPurgeAuthorized({ recordType: "AuditLog", createdAt: oldRecord, now, policy: undefined }),
    /Purge blocked \(NO_POLICY\)/,
  );
  assert.throws(
    () =>
      assertPurgeAuthorized({
        recordType: "AuditLog",
        createdAt: oldRecord,
        now,
        policy: approvedPolicy(),
        holds: [{ id: "hold-1", active: true, scope: {} }],
      }),
    /Purge blocked \(LEGAL_HOLD_ACTIVE\)/,
  );
  assert.doesNotThrow(() =>
    assertPurgeAuthorized({ recordType: "AuditLog", createdAt: oldRecord, now, policy: approvedPolicy() }),
  );
});

test("retention module is non-destructive: no DB access or delete calls", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/lib/retentionPolicy.ts"), "utf8");
  assert.doesNotMatch(source, /from\s+["']\.\/prisma["']/, "policy gate must not import the database client");
  assert.doesNotMatch(source, /prisma\./, "policy gate must not call the database client");
  assert.doesNotMatch(source, /\.deleteMany\(|\.delete\(/, "policy gate must not implement deletion");
});
