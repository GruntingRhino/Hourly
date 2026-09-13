-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "ownerApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalHold" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "recordType" TEXT,
    "schoolId" TEXT,
    "targetId" TEXT,
    "reason" TEXT,
    "createdBy" TEXT,
    "releasedAt" TIMESTAMP(3),
    "releasedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RetentionPolicy_version_createdAt_idx" ON "RetentionPolicy"("version", "createdAt");

-- CreateIndex
CREATE INDEX "LegalHold_active_createdAt_idx" ON "LegalHold"("active", "createdAt");

-- CreateIndex
CREATE INDEX "LegalHold_schoolId_active_idx" ON "LegalHold"("schoolId", "active");
