import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const envSource = fs.readFileSync(path.join(root, "src/lib/env.ts"), "utf8");

test("Google Classroom mock mode is project-scoped rather than blocked in every production-like environment", () => {
  assert.match(envSource, /GOOGLE_CLASSROOM_ENABLE_MOCK === "true"/);
  assert.match(envSource, /VERCEL_PROJECT_ID === "prj_ZP9k4HEjRT8sMEKzsvcSsHXVMVai"/);
  assert.doesNotMatch(envSource, /GOOGLE_CLASSROOM_ENABLE_MOCK=true is not allowed in production\./);
});
