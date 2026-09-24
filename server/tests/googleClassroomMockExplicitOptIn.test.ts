import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "src/services/googleClassroomIntegration.ts"), "utf8");

test("Google Classroom mock mode is an explicit opt-in in every environment", () => {
  assert.match(source, /const GOOGLE_CLASSROOM_ENABLE_MOCK = process\.env\.GOOGLE_CLASSROOM_ENABLE_MOCK === "true";/);
  assert.doesNotMatch(source, /GOOGLE_CLASSROOM_ENABLE_MOCK[^\n]*\|\|\s*!isProdLike\(\)/);
  assert.doesNotMatch(source, /GOOGLE_CLASSROOM_ENABLE_MOCK[^\n]*\|\|\s*!isPubliclyDeployed\(\)/);
});

test("Google Classroom mock access still fails closed when the flag is absent", () => {
  assert.match(source, /function assertMockAllowed\(\): void/);
  assert.match(source, /if \(!GOOGLE_CLASSROOM_ENABLE_MOCK\)/);
  assert.match(source, /Use OAuth mode with a real Google Classroom tenant/);
});
