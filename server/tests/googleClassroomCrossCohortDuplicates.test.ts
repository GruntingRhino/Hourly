import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "src/services/googleClassroomIntegration.ts"), "utf8");

test("same email in two Classroom cohorts is not treated as a duplicate", () => {
  assert.match(source, /seenStudentEmails = new Map<string, \{ id: string; cohortId: string \}>\(\)/);
  assert.match(source, /existingEmailOwner\.cohortId === targetCohortId/);
});

test("same email twice in one cohort still fails closed", () => {
  const block = source.slice(source.indexOf("const existingEmailOwner = seenStudentEmails.get"), source.indexOf("seenStudentEmails.set", source.indexOf("const existingEmailOwner = seenStudentEmails.get")));
  assert.match(block, /code: "DUPLICATE_STUDENT_EMAIL"/);
  assert.match(block, /summary\.counts\.errors\+\+/);
  assert.match(block, /summary\.counts\.skipped\+\+/);
  assert.match(block, /continue;/);
});
