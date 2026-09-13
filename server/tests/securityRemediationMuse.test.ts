import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Source-pattern regression tests for the 2026-09-12 security remediation
// pass (audit §§A-C1, A-C2, B-F2, C-U1). These assert the fix is present in
// source; they need no database and run under the standard server test
// runner (`npm test -- securityRemediationMuse.test.ts` from server/).

const serverRoot = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(serverRoot, relativePath), "utf8");
}

// ─── A-C1: dev-signin explicit gate + allowlist + audit log ────────────────

test("A-C1: /dev-signin requires ENABLE_IMPERSONATION at request time, not just route registration", () => {
  const source = read("src/routes/googleAuth.ts");
  const start = source.indexOf('router.post("/dev-signin"');
  assert.ok(start > -1, "could not locate the /dev-signin route");
  const handler = source.slice(start, start + 3000);
  assert.match(
    handler,
    /if \(process\.env\.ENABLE_IMPERSONATION !== "true"\)/,
    "dev-signin must re-check ENABLE_IMPERSONATION per request and 404 when disabled",
  );
  assert.match(handler, /return res\.status\(404\)/, "disabled dev-signin must 404, not 403/500");
});

test("A-C1: /dev-signin enforces an explicit email allowlist that fails closed", () => {
  const source = read("src/routes/googleAuth.ts");
  assert.match(source, /function isDevSigninAllowlisted/, "allowlist helper must exist");
  assert.match(source, /DEV_SIGNIN_ALLOWLIST/, "allowlist must be env-driven");
  const start = source.indexOf('router.post("/dev-signin"');
  const handler = source.slice(start, start + 3000);
  assert.match(handler, /isDevSigninAllowlisted\(email\)/, "handler must consult the allowlist");
  assert.match(handler, /return res\.status\(403\)/, "non-allowlisted email must be rejected");
});

test("A-C1: /dev-signin writes an audit row for each minted session", () => {
  const source = read("src/routes/googleAuth.ts");
  const start = source.indexOf('router.post("/dev-signin"');
  const handler = source.slice(start, start + 3000);
  assert.match(handler, /prisma\.auditLog\.create/, "dev-signin must audit-log session mints");
  assert.match(handler, /DEV_SIGNIN/, "audit row must carry a DEV_SIGNIN action");
});

// ─── A-C2: accepted invitation replay rejected ─────────────────────────────

test("A-C2: accepted beneficiary invitation can no longer mint a fresh JWT", () => {
  const source = read("src/routes/invitations.ts");
  const start = source.indexOf('router.post("/beneficiary/accept"');
  assert.ok(start > -1, "could not locate the beneficiary accept route");
  // Bound the window to this handler (ends at the next router.* registration).
  const rest = source.slice(start);
  const nextRoute = rest.search(/\nrouter\.(get|post|put|patch|delete)\("/);
  const handler = nextRoute > -1 ? rest.slice(0, nextRoute) : rest;
  assert.match(
    handler,
    /if \(inv\.status === "ACCEPTED"\) \{\s*return res\.status\(400\)/,
    "ACCEPTED invitations must be rejected with 400 and no session",
  );
  assert.doesNotMatch(
    handler,
    /existingAcceptedUser/,
    "the re-issue branch (lookup + signUserToken on ACCEPTED) must be gone",
  );
});

// ─── B-F2: beneficiary PII gate ────────────────────────────────────────────

test("B-F2: bulk signup list calls the FERPA gate and withholds studentId when denied", () => {
  const source = read("src/routes/beneficiaries.ts");
  const start = source.indexOf('router.get("/:id/signups"');
  assert.ok(start > -1, "could not locate the bulk signup list route");
  const rest = source.slice(start);
  const nextRoute = rest.search(/\nrouter\.(get|post|put|patch|delete)\("/);
  const handler = nextRoute > -1 ? rest.slice(0, nextRoute) : rest;
  assert.match(handler, /isBeneficiaryPiiEnabled\(req\.params\.id\)/, "list must consult the FERPA gate");
  assert.match(handler, /pseudonymousStudentLabel\(/, "list must pseudonymize when the gate denies");
  assert.match(
    handler,
    /studentId: _withheldJoinKey/,
    "denied path must omit the joinable studentId (omit, not null)",
  );
});

test("B-F2: attendance checklist calls the FERPA gate and audit-logs the read", () => {
  const source = read("src/routes/beneficiaries.ts");
  const start = source.indexOf('attendance-checklist');
  assert.ok(start > -1, "could not locate the attendance checklist route");
  const rest = source.slice(start);
  const nextRoute = rest.search(/\nrouter\.(get|post|put|patch|delete)\("/);
  const handler = nextRoute > -1 ? rest.slice(0, nextRoute) : rest;
  assert.match(handler, /isBeneficiaryPiiEnabled\(req\.params\.id\)/, "checklist must consult the FERPA gate");
  assert.match(handler, /pseudonymousStudentLabel\(studentId\)/, "checklist must pseudonymize when denied");
  assert.match(handler, /VIEW_ATTENDANCE_CHECKLIST/, "checklist read must be audit-logged");
  assert.match(handler, /await logDataAccess\(/, "checklist audit write must be awaited (fail-closed)");
});

// ─── C-U1: CSV import caps + limiter ───────────────────────────────────────

test("C-U1: every CSV import schema caps csvData pre-parse", () => {
  for (const file of [
    "src/routes/selfSubmissions.ts",
    "src/routes/beneficiaries.ts",
    "src/routes/cohorts.ts",
  ]) {
    const source = read(file);
    const schemas = source.match(/csvData: z\.string\(\)[^,\n]*/g) ?? [];
    assert.ok(schemas.length > 0, `${file} has no csvData schema`);
    for (const schema of schemas) {
      assert.match(
        schema,
        /\.max\(/,
        `${file}: csvData schema must cap length pre-parse (got: ${schema})`,
      );
    }
  }
});

test("C-U1: every synchronous CSV parse passes a per-record size bound", () => {
  for (const file of [
    "src/routes/selfSubmissions.ts",
    "src/routes/beneficiaries.ts",
    "src/routes/cohorts.ts",
  ]) {
    const source = read(file);
    assert.ok(source.includes("(csvData"), `${file} has no csvData parse call`);
    const calls = source.split("(csvData").slice(1);
    for (const call of calls) {
      const options = call.slice(0, call.indexOf("}") + 1);
      assert.ok(
        options.includes("max_record_size"),
        `${file}: csv-parse call must set max_record_size`,
      );
    }
  }
});

test("C-U1: every CSV import route sits behind a per-user import limiter", () => {
  const expectations: Array<[string, string]> = [
    ["src/routes/selfSubmissions.ts", 'router.post("/import"'],
    ["src/routes/beneficiaries.ts", 'router.post("/import-csv"'],
    ["src/routes/cohorts.ts", 'router.post("/teachers/import"'],
    ["src/routes/cohorts.ts", 'router.post("/:id/import"'],
    ["src/routes/cohorts.ts", 'router.post("/:id/teachers/import"'],
  ];
  for (const [file, registration] of expectations) {
    const source = read(file);
    const start = source.indexOf(registration);
    assert.ok(start > -1, `${file}: could not locate ${registration}`);
    const line = source.slice(Math.max(0, start - 200), start + 300).split("\n").find((l) => l.includes(registration));
    assert.ok(
      line && /Limiter/.test(line),
      `${file}: ${registration} must include an import limiter middleware`,
    );
  }
  for (const file of ["src/routes/selfSubmissions.ts", "src/routes/beneficiaries.ts", "src/routes/cohorts.ts"]) {
    assert.match(
      read(file),
      /namespace: "csv-import"/,
      `${file} must define a csv-import rate-limit namespace`,
    );
  }
});
