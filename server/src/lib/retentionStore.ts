/**
 * Durable retention/legal-hold READS — LOCAL-SYNTHETIC scaffolding.
 *
 * Fail-closed, non-destructive by construction:
 * - This module performs snapshot READS ONLY (newest RetentionPolicy row +
 *   active LegalHold rows). It performs NO writes and NO row removals of any
 *   kind on any table. There is
 *   deliberately NO purge caller and NO execution workflow here: building one
 *   requires DEF-LEGAL-007 (approved retention/deletion schedule + named
 *   records administrator + school approval).
 * - Policy and holds are read inside ONE serializable `prisma.$transaction`
 *   so the advisory answer cannot skew between the two reads. A serialization
 *   abort throws (fail-closed) instead of answering from a torn snapshot.
 * - Every eligibility decision is delegated to the pure advisory gate in
 *   `./retentionPolicy` (`isPurgeEligible`). This module only maps durable
 *   rows to that gate's inputs. Retention durations are never chosen here:
 *   thresholds arrive as owner-provided `rules` JSON and the gate validates
 *   them only as finite positive numbers. No compliance is claimed.
 * - Fail-closed mapping rule: a LegalHold row whose `recordType` is not one
 *   of the gate's known audit record types is treated as covering EVERY
 *   record type (the unknown discriminator is dropped) rather than none, so
 *   a malformed scope blocks instead of silently narrowing the hold.
 * - No policy row (or no explicitly owner-approved row content) maps to the
 *   gate's blocked answers (`NO_POLICY` / `NOT_OWNER_APPROVED`). Nothing is
 *   seeded: a fresh database answers "blocked" to every check.
 */

import prisma from "./prisma";
import {
  isPurgeEligible,
  type LegalHold as PureLegalHold,
  type PurgeEligibility,
  type RetentionRecordType,
} from "./retentionPolicy";

const KNOWN_RECORD_TYPES: readonly string[] = [
  "AuditLog",
  "DataAccessLog",
  "BeneficiaryAuditLog",
];

export interface RetentionEvaluationParams {
  recordType: RetentionRecordType;
  createdAt: Date;
  now?: Date;
  schoolId?: string;
  targetId?: string;
}

interface StoredPolicyInput {
  version: unknown;
  ownerApproved: unknown;
  approvedBy: unknown;
  approvedAt: unknown;
  rules: unknown;
}

/**
 * Read the newest retention-policy row plus every active legal hold in a
 * single serializable transaction snapshot, then map them to the pure gate's
 * input shapes. Returns `policy: undefined` when no policy row exists, which
 * the pure gate answers with `NO_POLICY` (blocked).
 */
export async function readRetentionSnapshot(): Promise<{
  policy: StoredPolicyInput | undefined;
  holds: PureLegalHold[];
}> {
  const [policyRow, holdRows] = await prisma.$transaction(
    [
      prisma.retentionPolicy.findFirst({
        orderBy: [{ version: "desc" }, { createdAt: "desc" }],
      }),
      prisma.legalHold.findMany({ where: { active: true } }),
    ],
    { isolationLevel: "Serializable" },
  );
  return {
    policy: policyRow
      ? {
          version: policyRow.version,
          ownerApproved: policyRow.ownerApproved,
          approvedBy: policyRow.approvedBy,
          approvedAt: policyRow.approvedAt
            ? policyRow.approvedAt.toISOString()
            : policyRow.approvedAt,
          rules: policyRow.rules,
        }
      : undefined,
    holds: holdRows.map((row) => ({
      id: row.id,
      active: row.active,
      scope: {
        // Fail-closed: an unrecognized recordType discriminator must not
        // narrow the hold into matching nothing — drop it so the hold covers
        // every record type until a human corrects the row.
        ...(row.recordType && KNOWN_RECORD_TYPES.includes(row.recordType)
          ? { recordType: row.recordType as RetentionRecordType }
          : {}),
        ...(row.schoolId ? { schoolId: row.schoolId } : {}),
        ...(row.targetId ? { targetId: row.targetId } : {}),
      },
    })),
  };
}

/**
 * Advisory, fail-closed purge-eligibility evaluation against the durable
 * snapshot. Pure delegation after the atomic read: returns `eligible: false`
 * for every missing/unapproved/malformed/too-young/held case, and even an
 * `eligible: true` answer carries `requiresOwnerExecution: true` with no
 * deletion mechanism behind it.
 */
export async function evaluateRetentionEligibility(
  params: RetentionEvaluationParams,
): Promise<PurgeEligibility> {
  const snapshot = await readRetentionSnapshot();
  return isPurgeEligible({
    recordType: params.recordType,
    createdAt: params.createdAt,
    now: params.now,
    schoolId: params.schoolId,
    targetId: params.targetId,
    policy: snapshot.policy,
    holds: snapshot.holds,
  });
}
