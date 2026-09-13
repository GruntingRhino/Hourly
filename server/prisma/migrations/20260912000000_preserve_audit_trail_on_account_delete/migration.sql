-- Preserve the FERPA disclosure/accounting trail on account self-delete.
-- AuditLog.actorId and DataAccessLog.actorId become nullable with ON DELETE
-- SET NULL so the self-delete route can tombstone (detach + redact details)
-- those rows instead of wiping disclosure evidence. Session- and signup-
-- linked audit FKs were already ON DELETE SET NULL; no change needed there.

ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";
ALTER TABLE "AuditLog" ALTER COLUMN "actorId" DROP NOT NULL;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DataAccessLog" DROP CONSTRAINT "DataAccessLog_actorId_fkey";
ALTER TABLE "DataAccessLog" ALTER COLUMN "actorId" DROP NOT NULL;
ALTER TABLE "DataAccessLog" ADD CONSTRAINT "DataAccessLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
