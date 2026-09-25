import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "src/services/canvasIntegration.ts"), "utf8");

test("Canvas mock mode is an explicit opt-in in every environment", () => {
  assert.match(source, /const CANVAS_ENABLE_MOCK = process\.env\.CANVAS_ENABLE_MOCK === "true";/);
  assert.doesNotMatch(source, /CANVAS_ENABLE_MOCK[^\n]*\|\|\s*!isProdLike\(\)/);
  assert.doesNotMatch(source, /CANVAS_ENABLE_MOCK[^\n]*\|\|\s*!isPubliclyDeployed\(\)/);
});

test("Canvas mock access still fails closed when the flag is absent", () => {
  assert.match(source, /function assertMockAllowed\(\): void/);
  assert.match(source, /if \(!CANVAS_ENABLE_MOCK\)/);
  assert.match(source, /Canvas mock mode is disabled/);
});
