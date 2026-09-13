ALTER TABLE "AttendanceQrToken" ADD COLUMN "schoolId" TEXT;

CREATE INDEX "AttendanceQrToken_schoolId_expiresAt_idx" ON "AttendanceQrToken"("schoolId", "expiresAt");

ALTER TABLE "AttendanceQrToken" ADD CONSTRAINT "AttendanceQrToken_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
