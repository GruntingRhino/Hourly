import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "src/services/canvasIntegration.ts"), "utf8");

test("Canvas OAuth keeps the exact hourly-dev callback and the scopes consumed by sync", () => {
  assert.match(source, /CANVAS_CALLBACK_URL/);
  assert.match(source, /login\/oauth2\/auth\?client_id=/);
  assert.match(source, /redirect_uri=\$\{encodeURIComponent\(CANVAS_CALLBACK_URL\)\}/);
  assert.match(source, /url:GET\|\/api\/v1\/courses/);
  assert.match(source, /url:GET\|\/api\/v1\/courses\/:course_id\/sections/);
  assert.match(source, /url:GET\|\/api\/v1\/courses\/:course_id\/enrollments/);
  assert.doesNotMatch(source, /url:GET\|\/api\/v1\/accounts/);
});
