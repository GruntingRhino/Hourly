import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { runSerializableTransaction } from "../lib/serializableTransaction";

export type SyncApplyDatabase = Prisma.TransactionClient;

export class LmsSyncInProgressError extends Error {
  readonly status = 409;
  readonly code = "LMS_SYNC_IN_PROGRESS";

  constructor() {
    super("An LMS sync apply is already in progress for this connection.");
    this.name = "LmsSyncInProgressError";
  }
}

/**
 * Serialize APPLY work per integration connection and atomically claim the
 * connection's current sync-job lease. The advisory lock is held through the
 * domain writes; a stale concurrent request loses the compare-and-set and is
 * rejected with 409 after the winning transaction commits.
 */
export async function runExclusiveApplyTransaction<T>(params: {
  connectionId: string;
  previousSyncJobId: string | null;
  syncJobId: string;
  run: (db: SyncApplyDatabase) => Promise<T>;
}): Promise<T> {
  return runSerializableTransaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${params.connectionId}, 0))`;
    const claimed = await tx.integrationConnection.updateMany({
      where: {
        id: params.connectionId,
        lastSyncJobId: params.previousSyncJobId,
      },
      data: {
        lastSyncJobId: params.syncJobId,
        lastSyncStatus: "RUNNING",
      },
    });
    if (claimed.count !== 1) throw new LmsSyncInProgressError();
    return params.run(tx);
  });
}

/**
 * Finalize a failed apply without clobbering a newer successful apply. This is
 * intentionally outside the rolled-back transaction and is idempotent.
 */
export async function finalizeFailedApply(params: {
  connectionId: string;
  previousSyncJobId: string | null;
  syncJobId: string;
  stage: string;
}): Promise<void> {
  const summary = JSON.stringify({
    stage: params.stage,
    error: "LMS apply failed before completion.",
  });
  await prisma.integrationSyncJob.updateMany({
    where: { id: params.syncJobId, status: "RUNNING" },
    data: {
      status: "FAILED",
      summary,
      finishedAt: new Date(),
    },
  });
  await prisma.integrationConnection.updateMany({
    where: {
      id: params.connectionId,
      lastSyncJobId: params.previousSyncJobId,
    },
    data: {
      status: "ERROR",
      lastSyncStatus: "FAILED",
    },
  });
}
