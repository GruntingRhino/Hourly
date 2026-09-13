import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

// Behavioral tests for server/scripts/ensure-safe-test-target.sh, the pretest
// gate that runs before node --test boots any child test process. All inputs are
// synthetic; the gate performs pure string checks and never opens connections,
// so the `.invalid` targets below also prove refusal precedes any network use.

const serverDir = path.resolve(__dirname, "..");
const script = path.join(serverDir, "scripts/ensure-safe-test-target.sh");

function runGate(extraEnv: Record<string, string>) {
  return spawnSync(script, {
    cwd: serverDir,
    env: { PATH: process.env.PATH ?? "", ...extraEnv },
    encoding: "utf8",
  });
}

const LOOPBACK = "postgresql://u:p@127.0.0.1:5433/goodhours_test";
const NON_LOOPBACK = "postgresql://u:p@db.non-loopback.invalid:5432/prod";

test("safe test gate passes a loopback labeled target", () => {
  const result = runGate({ DATABASE_URL: LOOPBACK, APP_ENV: "test", NODE_ENV: "test" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /targets OK/);
});

test("safe test gate passes when no target variables are inherited", () => {
  const result = runGate({ APP_ENV: "test" });
  assert.equal(result.status, 0, result.stderr);
});

test("safe test gate refuses a non-loopback DATABASE_URL without contacting it", () => {
  const result = runGate({ DATABASE_URL: NON_LOOPBACK });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /REFUSING test run/);
  assert.match(result.stderr, /non-loopback/);
  const combined = `${result.stdout}\n${result.stderr}`;
  assert.doesNotMatch(combined, /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|getaddrinfo/);
});

test("safe test gate refuses a remote DEV_DATABASE_URL even with loopback DATABASE_URL", () => {
  const result = runGate({ DATABASE_URL: LOOPBACK, DEV_DATABASE_URL: NON_LOOPBACK });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DEV_DATABASE_URL/);
});

test("safe test gate refuses a remote RATE_LIMIT_TEST_DATABASE_URL", () => {
  const result = runGate({
    DATABASE_URL: LOOPBACK,
    RATE_LIMIT_TEST_DATABASE_URL: NON_LOOPBACK,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /RATE_LIMIT_TEST_DATABASE_URL/);
});

test("safe test gate refuses production mode flags", () => {
  for (const flag of ["APP_ENV", "NODE_ENV", "VERCEL_ENV"] as const) {
    const result = runGate({ DATABASE_URL: LOOPBACK, [flag]: "production" });
    assert.notEqual(result.status, 0, flag);
    assert.match(result.stderr, new RegExp(`${flag}=production`), flag);
  }
});

test("safe test gate never prints URL values on refusal", () => {
  const secretShaped = "postgresql://user:s3cret-value@db.non-loopback.invalid:5432/prod";
  const result = runGate({ DATABASE_URL: secretShaped });
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /s3cret-value/);
});
