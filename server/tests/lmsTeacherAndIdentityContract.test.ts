import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const servicePath = path.resolve(process.cwd(), "src/services");
const canvas = fs.readFileSync(path.join(servicePath, "canvasIntegration.ts"), "utf8");
const classroom = fs.readFileSync(path.join(servicePath, "googleClassroomIntegration.ts"), "utf8");

function ensureTeacherBlock(source: string): string {
  const start = source.indexOf("async function ensureTeacherUser");
  const end = source.indexOf("async function reconcileRemovedStudentEnrollment", start);
  assert.ok(start >= 0 && end > start);
  return source.slice(start, end);
}

test("provider-created teachers are visible real staff, not hidden test accounts", () => {
  for (const service of [canvas, classroom]) {
    const block = ensureTeacherBlock(service);
    assert.match(block, /role: "TEACHER"/);
    assert.match(block, /emailVerified: true/);
    assert.doesNotMatch(block, /isTestAccount:\s*true/);
  }
});

test("student and invitation identity writes use canonical lowercase email", () => {
  for (const service of [canvas, classroom]) {
    assert.match(service, /email:\s*normalizedEmail/);
    assert.doesNotMatch(service, /where:\s*\{\s*email:\s*student\.email/);
    assert.doesNotMatch(service, /cohortId_email:\s*\{\s*cohortId:\s*targetCohortId,\s*email:\s*student\.email/);
  }
});
