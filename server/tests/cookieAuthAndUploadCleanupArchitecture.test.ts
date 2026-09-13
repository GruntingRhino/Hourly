import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const apiClient = fs.readFileSync(path.join(root, "../client/src/lib/api.ts"), "utf8");
const cleanup = fs.readFileSync(path.join(root, "src/lib/uploadCleanup.ts"), "utf8");
const authRoute = fs.readFileSync(path.join(root, "src/routes/auth.ts"), "utf8");

test("API requests use the HttpOnly same-origin session rather than a stored bearer token", () => {
  assert.doesNotMatch(apiClient, /localStorage\.getItem\(["']goodhours_token["']\)/);
  assert.match(apiClient, /credentials:\s*["']same-origin["']/);
});

test("upload cleanup uses the effective writable runtime directory", () => {
  assert.match(cleanup, /resolveWritableUploadDir\("beneficiary-attachments"\)/);
  assert.doesNotMatch(cleanup, /path\.join\(__dirname, ["']\.\.\/\.\.\/\.\.\/uploads/);
});

test("password rotation does not return the refreshed JWT to browser JavaScript", () => {
  const passwordRoute = authRoute;
  assert.match(passwordRoute, /setAuthCookie\(res, refreshedToken/);
  assert.doesNotMatch(passwordRoute, /json\(\{[^}]*token:\s*refreshedToken/);
});
