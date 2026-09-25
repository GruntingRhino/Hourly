import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const envModuleUrl = pathToFileURL(path.join(root, "src/lib/env.ts")).href;

function validateProductionLikeClassroomMock(projectId: string) {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    APP_ENV: "production",
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    VERCEL_PROJECT_ID: projectId,
    DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/goodhours_test",
    JWT_SECRET: "test-jwt-secret",
    FIELD_ENCRYPTION_KEY: "a".repeat(64),
    CRON_SECRET: "test-cron-secret",
    ATTENDANCE_QR_SECRET: "test-attendance-secret",
    SUPERVISOR_VERIFICATION_SECRET: "test-supervisor-secret",
    GOOGLE_CLASSROOM_ENABLE_MOCK: "true",
  };
  for (const key of [
    "DEV_DATABASE_URL",
    "CANVAS_ENABLE_MOCK",
    "CANVAS_CLIENT_ID",
    "CANVAS_CLIENT_SECRET",
    "CANVAS_CALLBACK_URL",
    "CANVAS_ALLOWED_ORIGINS",
    "GOOGLE_CLASSROOM_CLIENT_ID",
    "GOOGLE_CLASSROOM_CLIENT_SECRET",
    "GOOGLE_CLASSROOM_CALLBACK_URL",
    "LMS_ALLOW_TEST_ORIGINS",
    "LMS_TEST_ALLOWED_ORIGINS",
  ]) delete env[key];

  return spawnSync(
    process.execPath,
    ["--import", "tsx", "--eval", `import(${JSON.stringify(envModuleUrl)}).then(() => console.log("ENV_OK"))`],
    { cwd: root, env, encoding: "utf8", timeout: 30_000 },
  );
}

test("Google Classroom mock mode is allowed only on the explicitly approved isolated staging project", () => {
  const staging = validateProductionLikeClassroomMock("prj_4EDHs3MHJR4dcOzQJAFNAXk9rYsu");
  assert.equal(staging.status, 0, staging.stderr);
  assert.match(staging.stdout, /ENV_OK/);

  const unknown = validateProductionLikeClassroomMock("prj_unknown_production_like");
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /approved isolated Google Classroom staging project/);

  const production = validateProductionLikeClassroomMock("prj_ZP9k4HEjRT8sMEKzsvcSsHXVMVai");
  assert.notEqual(production.status, 0);
  assert.match(production.stderr, /approved isolated Google Classroom staging project/);
});
