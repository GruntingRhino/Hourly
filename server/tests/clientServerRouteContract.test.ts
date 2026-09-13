import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const supervisorVerify = fs.readFileSync(
  path.join(root, "../client/src/pages/SupervisorVerify.tsx"),
  "utf8",
);
const opportunityDetail = fs.readFileSync(
  path.join(root, "../client/src/pages/student/OpportunityDetail.tsx"),
  "utf8",
);
const beneficiariesRoute = fs.readFileSync(
  path.join(root, "src/routes/beneficiaries.ts"),
  "utf8",
);
const sessionsRoute = fs.readFileSync(
  path.join(root, "src/routes/sessions.ts"),
  "utf8",
);
const authRoute = fs.readFileSync(path.join(root, "src/routes/auth.ts"), "utf8");

test("supervisor verification client posts the token in the body to the registered consume path", () => {
  assert.match(
    beneficiariesRoute,
    /router\.post\("\/supervisor-verification\/consume"/,
  );
  assert.match(
    supervisorVerify,
    /\/beneficiaries\/supervisor-verification\/consume/,
    "client must call the registered /beneficiaries/supervisor-verification/consume path",
  );
  assert.doesNotMatch(
    supervisorVerify,
    /supervisor-verification\/\$\{/,
    "token must not be embedded as a URL path parameter (it is not registered)",
  );
  assert.match(
    supervisorVerify,
    /\{\s*token/,
    "token must be submitted in the request body alongside supervisorEmail",
  );
});

test("inline student QR check-in posts to the session-scoped registered path", () => {
  assert.match(sessionsRoute, /router\.post\("\/:id\/qr-checkin"/);
  assert.doesNotMatch(
    opportunityDetail,
    /api\.post\("\/sessions\/qr-checkin"/,
    "bare /sessions/qr-checkin is not registered; the session id is required",
  );
  assert.match(
    opportunityDetail,
    /\/sessions\/\$\{[^}]+\}\/qr-checkin/,
    "client must call /sessions/:id/qr-checkin for the student's own session",
  );
});

test("school-deletion helper tombstones (never wipes) disclosure rows and stays unwired pending an owner product decision", () => {
  // The school-deletion helper in server/src/routes/auth.ts is currently
  // dead/unwired: defined once, invoked nowhere, with no product route that
  // calls it. No school-deletion product route is invented here — wiring one
  // up (what "delete a school" should mean, who may trigger it, what happens
  // to the school's users/cohorts/data) is an OWNER/PRODUCT decision. This
  // test locks two properties so a future wiring cannot silently regress:
  // (1) the helper body preserves disclosure rows via tombstone/detach, and
  // (2) the helper remains definition-only until that decision is recorded.
  //
  // (2) is enforced across the ENTIRE server source tree (not just auth.ts):
  // any new reference — an import, a route handler call, a re-export — fails
  // this test loudly, so school deletion cannot be wired up by accident.
  const srcDir = path.join(root, "src");
  const tsFiles: string[] = [];
  const collect = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (entry.isFile() && entry.name.endsWith(".ts")) tsFiles.push(full);
    }
  };
  collect(srcDir);
  let totalOccurrences = 0;
  for (const file of tsFiles) {
    const matches = fs.readFileSync(file, "utf8").match(/deleteSchoolData/g) ?? [];
    totalOccurrences += matches.length;
  }
  assert.equal(
    totalOccurrences,
    1,
    "deleteSchoolData must remain definition-only (exactly 1 occurrence across all of server/src); wiring a school-deletion route requires an explicit owner/product decision",
  );
  const occurrences = authRoute.match(/deleteSchoolData/g) ?? [];
  assert.equal(
    occurrences.length,
    1,
    "the single deleteSchoolData occurrence must live in server/src/routes/auth.ts",
  );
  assert.match(authRoute, /const deleteSchoolData = async \(schoolId: string\)/);
  const helperStart = authRoute.indexOf("const deleteSchoolData = async (schoolId: string)");
  const helperEnd = authRoute.indexOf("await tx.school.delete({ where: { id: schoolId } });", helperStart);
  assert.ok(helperEnd > helperStart, "helper body must be locatable");
  const helperBody = authRoute.slice(helperStart, helperEnd);
  assert.doesNotMatch(
    helperBody,
    /dataAccessLog\.deleteMany/,
    "school-deletion helper must never hard-delete DataAccessLog rows",
  );
  assert.doesNotMatch(
    helperBody,
    /auditLog\.deleteMany/,
    "school-deletion helper must never hard-delete AuditLog rows",
  );
  assert.match(
    helperBody,
    /dataAccessLog\.updateMany\(\{\s*where:\s*\{\s*schoolId\s*\}/,
    "school-wide data-access rows must be detached via updateMany on schoolId",
  );
  assert.match(helperBody, /schoolId:\s*null/, "detached rows must null the schoolId scalar");
  assert.match(helperBody, /school-deleted/, "detached rows must carry the school-deleted tombstone marker");
});

test("no route wipes the disclosure/accounting trail by scope", () => {
  assert.doesNotMatch(
    authRoute,
    /dataAccessLog\.deleteMany\(\{\s*where:\s*\{\s*schoolId\s*\}\s*\}\)/,
    "school-wide DataAccessLog rows must be tombstoned/detached, never wiped",
  );
  const routesDir = path.join(root, "src/routes");
  for (const file of fs.readdirSync(routesDir)) {
    if (!file.endsWith(".ts")) continue;
    const source = fs.readFileSync(path.join(routesDir, file), "utf8");
    assert.doesNotMatch(
      source,
      /auditLog\.deleteMany/,
      `${file} must never hard-delete AuditLog rows`,
    );
    assert.doesNotMatch(
      source,
      /dataAccessLog\.deleteMany/,
      `${file} must never hard-delete DataAccessLog rows`,
    );
    assert.doesNotMatch(
      source,
      /beneficiaryAuditLog\.deleteMany/,
      `${file} must never hard-delete BeneficiaryAuditLog rows (slot cancellation tombstones instead)`,
    );
  }
});

test("privacy page describes the shipped HttpOnly cookie transport (F-01)", () => {
  const privacy = fs.readFileSync(
    path.join(root, "../client/src/pages/Privacy.tsx"),
    "utf8",
  );
  assert.match(privacy, /HttpOnly/, "Privacy §11 must describe the HttpOnly session cookie");
  assert.match(privacy, /gh_session/, "Privacy §11 must name the gh_session cookie");
  assert.match(privacy, /stored for up to 7 days/, "Privacy §11 must state the persistent cookie storage lifetime (7-day Max-Age per authCookies.ts)");
  assert.match(privacy, /remains valid for up to 24 hours/, "Privacy §11 must state the student token validity separately from cookie storage (24h JWT per middleware/auth.ts)");
  assert.match(privacy, /up to 7 days for other roles/, "Privacy §11 must state the non-student token validity");
  assert.match(privacy, /even if the cookie is still stored/, "Privacy §11 must explain an expired token requires re-login despite cookie storage");
  assert.doesNotMatch(
    privacy,
    /persistent.*lasts up to 24 hours/,
    "Privacy §11 must not conflate cookie storage lifetime with student JWT validity",
  );
  assert.match(privacy, /Logging out clears the session cookie/, "Privacy §11 must state logout clears the cookie");
  assert.doesNotMatch(
    privacy,
    /uses <strong>localStorage<\/strong> \(not cookies\)/,
    "Privacy §11 must not claim the token lives in localStorage",
  );
});

test("privacy page no longer promises parent self-service links (F-18)", () => {
  const privacy = fs.readFileSync(
    path.join(root, "../client/src/pages/Privacy.tsx"),
    "utf8",
  );
  assert.match(
    privacy,
    /Self-service parent progress links are currently disabled/,
    "Privacy §5.2 must state parent links are disabled",
  );
  assert.doesNotMatch(
    privacy,
    /may generate a time-limited, read-only parent progress link/,
    "Privacy §5.2 must not promise school-generated parent links",
  );
});

test("orphan studentPreferences router is mounted for the student settings client (F-11)", () => {
  const indexSource = fs.readFileSync(path.join(root, "src/index.ts"), "utf8");
  assert.match(
    indexSource,
    /app\.use\("\/api\/student-preferences", studentPreferencesRoutes\)/,
    "studentPreferences router must be mounted at /api/student-preferences",
  );
  const prefsRoute = fs.readFileSync(
    path.join(root, "src/routes/studentPreferences.ts"),
    "utf8",
  );
  assert.match(
    prefsRoute,
    /requireRole\("STUDENT"\)/,
    "studentPreferences must remain student-only",
  );
  const studentSettings = fs.readFileSync(
    path.join(root, "../client/src/pages/student/Settings.tsx"),
    "utf8",
  );
  assert.match(
    studentSettings,
    /\/student-preferences/,
    "student settings client path must match the mounted route",
  );
});

// ─── Staff QR issuance UI (client/src/pages/school/AttendanceQr.tsx) ────────
// The school/staff issuance surface for the exact registered contract
// POST /api/sessions/:id/qr-token → 201 { token, expiresAt } (ttlSeconds
// clamped server-side to 60–900, default 300). These tests lock the UI to
// that contract without touching QR cryptography, TTL, scope, redemption,
// or security semantics.
const attendanceQrUi = fs.readFileSync(
  path.join(root, "../client/src/pages/school/AttendanceQr.tsx"),
  "utf8",
);
const appRoutesSource = fs.readFileSync(
  path.join(root, "../client/src/App.tsx"),
  "utf8",
);
const layoutNavSource = fs.readFileSync(
  path.join(root, "../client/src/components/Layout.tsx"),
  "utf8",
);
const qrCheckinPage = fs.readFileSync(
  path.join(root, "../client/src/pages/student/QrCheckin.tsx"),
  "utf8",
);

test("staff QR issuance UI posts ttlSeconds to the session-scoped registered path", () => {
  assert.match(sessionsRoute, /router\.post\("\/:id\/qr-token"/);
  assert.match(
    attendanceQrUi,
    /\/sessions\/\$\{[^}]+\}\/qr-token/,
    "issuance client must call /sessions/:id/qr-token for the selected session",
  );
  assert.match(
    attendanceQrUi,
    /\{\s*ttlSeconds/,
    "issuance client must send ttlSeconds in the request body (server clamps 60–900)",
  );
  assert.doesNotMatch(
    attendanceQrUi,
    /api\.post\("\/sessions\/qr-token"/,
    "bare /sessions/qr-token is not registered; the session id is required",
  );
  assert.match(
    attendanceQrUi,
    /expiresAt/,
    "issuance client must consume the expiresAt field of the 201 response",
  );
});

test("staff QR issuance UI exposes no revoke control (no revoke route exists)", () => {
  // revokedAt is a read-only guard in the redemption path — no route ever
  // sets it, so a revoke button could not work. The UI must disclose
  // expiry-only invalidation instead of inventing revocation semantics.
  assert.doesNotMatch(
    sessionsRoute,
    /revokedAt\s*:/,
    "no sessions route may write revokedAt; there is no revoke endpoint",
  );
  // Strip comments first: the file documents the *absence* of revocation, and
  // the visible copy discloses "cannot be revoked early" — so only an actual
  // control (handler, button, endpoint call) counts as revocation UI.
  const attendanceQrCode = attendanceQrUi
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
  assert.doesNotMatch(
    attendanceQrCode,
    /onRevoke|revokeCode|revokeToken|>\s*revoke\s*</i,
    "issuance UI must not render a revoke control for a nonexistent endpoint",
  );
  assert.match(
    attendanceQrUi,
    /cannot be revoked early/,
    "issuance UI must disclose expiry-only invalidation to staff",
  );
});

test("issued-code panel renders event + expiry + code only, never student PII", () => {
  // The token payload carries tokenId + opportunityId + expiry only; the
  // display must not add student identity around it. Slice the panel between
  // its source anchors so prose elsewhere in the file cannot mask a leak.
  const begin = attendanceQrUi.indexOf("ISSUED-PANEL-START");
  const end = attendanceQrUi.indexOf("ISSUED-PANEL-END");
  assert.ok(begin > 0 && end > begin, "issued-code panel anchors must exist");
  const panel = attendanceQrUi.slice(begin, end);
  assert.match(panel, /issued\.opportunityTitle/, "panel shows the associated event");
  assert.match(panel, /issued\.expiresAt/, "panel shows expiry");
  assert.match(panel, /issued\.token/, "panel shows the code (the paste-based product contract)");
  assert.doesNotMatch(panel, /\.user\b/, "panel must not read session user PII");
  assert.doesNotMatch(panel, /\.email\b/, "panel must not read student email");
  assert.doesNotMatch(panel, /student\.(name|email|id)/i, "panel must not read student identity");
  assert.doesNotMatch(panel, /user\.(name|email|id)/, "panel must not read user identity");
});

test("issuance route is mounted for school roles and public QR display is isolated", () => {
  assert.ok(
    appRoutesSource.indexOf("SCHOOL_ROLES.includes") <
      appRoutesSource.indexOf('path="/attendance-qr"'),
    "/attendance-qr must be mounted inside the authenticated school-roles block",
  );
  const navHits = layoutNavSource.match(/path:\s*"\/attendance-qr"/g) ?? [];
  assert.equal(
    navHits.length,
    2,
    "Attendance QR nav entry must exist for both SCHOOL_ADMIN and TEACHER",
  );
  const clientPackage = JSON.parse(
    fs.readFileSync(path.join(root, "../client/package.json"), "utf8"),
  );
  const allDeps = [
    ...Object.keys(clientPackage.dependencies ?? {}),
    ...Object.keys(clientPackage.devDependencies ?? {}),
  ];
  assert.ok(
    allDeps.includes("qrcode"),
    `the standalone display must use the pinned qrcode package (found: ${allDeps.join(", ")})`,
  );
  assert.match(appRoutesSource, /location\.pathname === "\/attendance-share"/);
  assert.match(appRoutesSource, /PublicAttendanceQr/);
});

test("student QR check-in route is unchanged by the staff issuance UI", () => {
  assert.match(
    qrCheckinPage,
    /\/sessions\/\$\{[^}]+\}\/qr-checkin/,
    "student check-in must keep posting to the session-scoped registered path",
  );
  assert.match(qrCheckinPage, /\{\s*token/, "student check-in keeps the token in the body");
  assert.doesNotMatch(
    qrCheckinPage,
    /qr-token/,
    "student check-in must not reference the staff issuance path",
  );
});
