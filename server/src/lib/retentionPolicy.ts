/**
 * Retention / legal-hold policy gate — LOCAL-SYNTHETIC design contract.
 *
 * Non-destructive and fail-closed by construction:
 * - This module performs NO database access and deletes NOTHING. There is no
 *   purge, deleteMany, or Prisma import here. It only answers the advisory
 *   question "would an owner-approved policy permit purging this record?".
 * - The default answer is ALWAYS "no" (blocked) unless every gate passes:
 *   an explicitly owner-approved policy exists, a rule covers the record
 *   type, the record is older than the owner-specified threshold, and no
 *   active legal hold covers the record.
 * - Retention durations are NEVER chosen by code. Every threshold arrives as
 *   owner-provided input and this module only validates that it is a finite
 *   positive number. Choosing real durations, approving a policy, placing or
 *   releasing a legal hold, and executing any deletion are HUMAN/OWNER acts
 *   gated by DEF-LEGAL-007 (approved retention/deletion schedule + records
 *   administrator). See docs/qa/DEFERRED_REQUIREMENTS.md.
 * - Even an `eligible: true` answer is advisory only: it carries
 *   `requiresOwnerExecution: true` to record that a human owner execution
 *   step (signed disposition + verified backup) must still occur before any
 *   deletion mechanism — which does not exist yet and must not be built
 *   until the policy is approved.
 *
 * Audit-relevant tables covered: AuditLog, DataAccessLog, BeneficiaryAuditLog.
 * These are disclosure/accounting evidence; the self-delete and school-delete
 * paths tombstone (never wipe) them — see server/src/routes/auth.ts.
 */

export type RetentionRecordType = "AuditLog" | "DataAccessLog" | "BeneficiaryAuditLog";

const RECORD_TYPES: readonly RetentionRecordType[] = [
  "AuditLog",
  "DataAccessLog",
  "BeneficiaryAuditLog",
];

export interface RetentionRule {
  /** Which audit table the rule applies to. */
  recordType: RetentionRecordType;
  /** Owner-specified minimum age in days before a record MAY be considered. Must be a finite positive number. */
  olderThanDays: number;
}

export interface RetentionPolicy {
  version: number;
  /**
   * Owner-approval gate. Purge eligibility requires this to be literally
   * `true` together with `approvedBy` and `approvedAt`. Anything else —
   * missing, false, or any truthy non-`true` value — blocks.
   */
  ownerApproved: unknown;
  approvedBy?: unknown;
  approvedAt?: unknown;
  rules: RetentionRule[];
}

export interface LegalHoldScope {
  recordType?: RetentionRecordType;
  schoolId?: string;
  targetId?: string;
}

export interface LegalHold {
  id: string;
  active: boolean;
  scope: LegalHoldScope;
}

export type PurgeBlockedReason =
  | "NO_POLICY"
  | "POLICY_INVALID"
  | "NOT_OWNER_APPROVED"
  | "NO_RULE_FOR_TYPE"
  | "NOT_OLD_ENOUGH"
  | "LEGAL_HOLD_ACTIVE";

export type PurgeEligibility =
  | { eligible: false; reason: PurgeBlockedReason; detail: string }
  | { eligible: true; requiresOwnerExecution: true; detail: string };

function isRecordType(value: unknown): value is RetentionRecordType {
  return typeof value === "string" && (RECORD_TYPES as readonly string[]).includes(value);
}

/**
 * Validate an owner-supplied retention policy object. Returns the policy when
 * it is structurally valid; never throws for invalid input — invalid input
 * simply yields `{ ok: false }`, and every downstream check treats that as
 * blocked. Structural validity is NOT owner approval: approval is checked
 * separately by `isPurgeEligible` via the `ownerApproved` gate.
 */
export function parseRetentionPolicy(input: unknown): { ok: true; policy: RetentionPolicy } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "policy must be an object" };
  const candidate = input as Record<string, unknown>;
  if (typeof candidate.version !== "number" || !Number.isInteger(candidate.version) || candidate.version < 1) {
    return { ok: false, error: "policy.version must be a positive integer" };
  }
  if (!Array.isArray(candidate.rules) || candidate.rules.length === 0) {
    return { ok: false, error: "policy.rules must be a non-empty array" };
  }
  for (const rule of candidate.rules as unknown[]) {
    if (typeof rule !== "object" || rule === null) return { ok: false, error: "each rule must be an object" };
    const entry = rule as Record<string, unknown>;
    if (!isRecordType(entry.recordType)) return { ok: false, error: "each rule needs a known recordType" };
    if (typeof entry.olderThanDays !== "number" || !Number.isFinite(entry.olderThanDays) || entry.olderThanDays <= 0) {
      return { ok: false, error: "each rule needs a finite positive olderThanDays" };
    }
  }
  return {
    ok: true,
    policy: {
      version: candidate.version,
      ownerApproved: candidate.ownerApproved,
      approvedBy: candidate.approvedBy,
      approvedAt: candidate.approvedAt,
      rules: (candidate.rules as RetentionRule[]).map((rule) => ({
        recordType: rule.recordType,
        olderThanDays: rule.olderThanDays,
      })),
    },
  };
}

function holdCoversRecord(hold: LegalHold, record: { recordType: RetentionRecordType; schoolId?: string; targetId?: string }): boolean {
  if (!hold.active) return false;
  const scope = hold.scope ?? {};
  if (scope.recordType && scope.recordType !== record.recordType) return false;
  if (scope.schoolId && scope.schoolId !== record.schoolId) return false;
  if (scope.targetId && scope.targetId !== record.targetId) return false;
  return true;
}

/**
 * Advisory, fail-closed purge-eligibility check. Pure function: no I/O, no
 * deletion. Every failure mode returns `eligible: false`; only a fully
 * approved policy + matching rule + sufficient age + zero covering active
 * holds returns `eligible: true` (still marked `requiresOwnerExecution`).
 */
export function isPurgeEligible(params: {
  recordType: RetentionRecordType;
  createdAt: Date;
  now?: Date;
  policy: unknown;
  holds?: LegalHold[];
  schoolId?: string;
  targetId?: string;
}): PurgeEligibility {
  const now = params.now ?? new Date();
  if (!params.policy || typeof params.policy !== "object") {
    return { eligible: false, reason: "NO_POLICY", detail: "no retention policy supplied; purge blocked until an owner-approved policy exists (DEF-LEGAL-007)" };
  }
  const parsed = parseRetentionPolicy(params.policy);
  if (parsed.ok === false) {
    return { eligible: false, reason: "POLICY_INVALID", detail: `retention policy invalid (${parsed.error}); purge blocked` };
  }
  const policy = parsed.policy;
  if (policy.ownerApproved !== true || typeof policy.approvedBy !== "string" || policy.approvedBy.trim() === "" || typeof policy.approvedAt !== "string" || policy.approvedAt.trim() === "") {
    return { eligible: false, reason: "NOT_OWNER_APPROVED", detail: "policy lacks explicit owner approval (ownerApproved === true with approvedBy/approvedAt); purge blocked" };
  }
  const holds = Array.isArray(params.holds) ? params.holds : [];
  const covering = holds.find((hold) =>
    holdCoversRecord(hold, { recordType: params.recordType, schoolId: params.schoolId, targetId: params.targetId }),
  );
  if (covering) {
    return { eligible: false, reason: "LEGAL_HOLD_ACTIVE", detail: `active legal hold ${covering.id} covers this record; purge blocked` };
  }
  const rule = policy.rules.find((entry) => entry.recordType === params.recordType);
  if (!rule) {
    return { eligible: false, reason: "NO_RULE_FOR_TYPE", detail: `policy has no rule for ${params.recordType}; purge blocked` };
  }
  const ageMs = now.getTime() - params.createdAt.getTime();
  if (!Number.isFinite(ageMs) || ageMs < rule.olderThanDays * 86400000) {
    return { eligible: false, reason: "NOT_OLD_ENOUGH", detail: `record is younger than the owner-specified ${rule.olderThanDays}-day threshold; purge blocked` };
  }
  return {
    eligible: true,
    requiresOwnerExecution: true,
    detail: "owner-approved policy would permit purging; a signed human owner execution step (disposition + verified backup) is still required and no deletion mechanism exists yet",
  };
}

/**
 * Fail-closed guard for any future caller: throws unless the advisory check
 * passes. There are currently NO callers — no purge path exists — and this
 * must not be wired to one until DEF-LEGAL-007 is resolved.
 */
export function assertPurgeAuthorized(params: Parameters<typeof isPurgeEligible>[0]): void {
  const result = isPurgeEligible(params);
  if (result.eligible === false) {
    throw new Error(`Purge blocked (${result.reason}): ${result.detail}`);
  }
}
