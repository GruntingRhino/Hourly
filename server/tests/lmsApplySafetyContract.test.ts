import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const servicePath = path.resolve(process.cwd(), "src/services");
const canvas = fs.readFileSync(path.join(servicePath, "canvasIntegration.ts"), "utf8");
const classroom = fs.readFileSync(path.join(servicePath, "googleClassroomIntegration.ts"), "utf8");
const applyLock = fs.readFileSync(path.join(servicePath, "lmsSyncApply.ts"), "utf8");

for (const [name, source] of Object.entries({ canvas, classroom })) {
  test(`${name} scopes provider cleanup to the explicit selected-course run`, () => {
    assert.match(source, /selectedSectionIdsForCleanup/);
    assert.match(source, /isMappingInSelectedSyncScope/);
    assert.match(
      source,
      /const mappedSectionsToArchive = sectionMappings\.filter\([\s\S]*?isMappingInSelectedSyncScope/,
    );
    assert.match(
      source,
      /const enrollmentMappingsToDeactivate = enrollmentMappings\.filter\([\s\S]*?isMappingInSelectedSyncScope/,
    );
  });

  test(`${name} APPLY writes use the exclusive serializable transaction helper`, () => {
    assert.match(source, /runExclusiveApplyTransaction/);
    assert.match(source, /finalizeFailedApply/);
    assert.match(source, /ensureStudentCohortMembership\(\{[\s\S]*?db: prisma/);
    assert.match(source, /reconcileRemovedStudentEnrollment\(\{[\s\S]*?db: prisma/);
    assert.match(source, /if \(params\.mode !== "APPLY"\)[^\n]*\n\s*summary\.operations\.push\(\{ type: "teacher-assignment"/);
    assert.match(source, /if \(params\.mode === "APPLY"\)[\s\S]*?createLmsApplyAuditRecord\(\{/);
    const transactionCatch = source.indexOf('stage: "APPLY_TRANSACTION"');
    const previewAudit = source.indexOf('if (params.mode !== "APPLY")', transactionCatch);
    assert.ok(transactionCatch >= 0 && previewAudit > transactionCatch);
    assert.match(source.slice(previewAudit), /await logDataAccess\(\{/);
    assert.doesNotMatch(source.slice(transactionCatch), /sync audit log failed/);
  });
}

test("apply lease is a conditional compare-and-set with rollback and terminal failure handling", () => {
  assert.match(applyLock, /runSerializableTransaction/);
  assert.match(applyLock, /lastSyncJobId:\s*params\.previousSyncJobId/);
  assert.match(applyLock, /claimed\.count !== 1/);
  assert.match(applyLock, /status:\s*"FAILED"/);
  assert.match(applyLock, /finishedAt:\s*new Date\(\)/);
});
