import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const serverRoot = path.resolve(__dirname, "..");
const clientRoot = path.resolve(serverRoot, "../client");
const publicQr = fs.readFileSync(path.join(clientRoot, "src/pages/PublicAttendanceQr.tsx"), "utf8");
const checkin = fs.readFileSync(path.join(clientRoot, "src/pages/student/QrCheckin.tsx"), "utf8");
const sessionsRoute = fs.readFileSync(path.join(serverRoot, "src/routes/sessions.ts"), "utf8");
const shareRoute = fs.readFileSync(path.join(serverRoot, "src/routes/attendanceQr.ts"), "utf8");
const shareLib = fs.readFileSync(path.join(serverRoot, "src/lib/attendanceQrShare.ts"), "utf8");
const appRoutes = fs.readFileSync(path.join(clientRoot, "src/App.tsx"), "utf8");
const indexHtml = fs.readFileSync(path.join(clientRoot, "index.html"), "utf8");

test("QR encodes a navigable check-in URL with token in fragment, never raw token or query", () => {
  assert.match(shareLib, /qr-checkin/i, "share lib must build a /qr-checkin handoff URL");
  assert.match(shareLib, /#token=/, "handoff URL must carry the token in the hash fragment (never in query/logs/referrer)");
  assert.doesNotMatch(shareLib, /qr-checkin\?token=/, "handoff URL must not place the token in the query string");
  assert.match(publicQr, /qr-checkin/i, "public display must encode the check-in URL, not the raw token");
  assert.doesNotMatch(publicQr, /toDataURL\(token\)/, "public display must not QR-encode the raw token");
});

test("expired QR display invalidates while open", () => {
  assert.match(publicQr, /setInterval/, "public display must tick while open");
  assert.match(publicQr, /expired/i, "public display must render an expired state");
  assert.match(publicQr, /setImage\(""\)|setImage\(null|setImage\(undefined/, "expired display must drop the QR image");
});

test("token-only check-in resolves the caller's own session server-side, token stays in body", () => {
  assert.match(sessionsRoute, /qr-resolve/, "server must expose a token-only resolve endpoint");
  assert.match(sessionsRoute, /requireRole\("STUDENT"\)/, "resolve must remain student-only");
  assert.match(checkin, /qr-resolve/, "check-in page must use the server-derived resolve endpoint");
  assert.match(checkin, /\{\s*token/, "token must travel in the request body, never as a URL path/query param");
  assert.doesNotMatch(checkin, /qr-checkin\/\$\{|supervisor-verification\/\$\{/, "token must not be embedded as a URL path parameter");
});

test("signed-out scan lands on a useful page and preserves the handoff", () => {
  assert.ok(
    appRoutes.indexOf('path="/qr-checkin"') > 0 &&
      appRoutes.indexOf('path="/qr-checkin"') < appRoutes.indexOf('{user ? ('),
    "/qr-checkin must be reachable without auth (public route before the authenticated block)",
  );
  assert.match(checkin, /Sign in/i, "check-in page must prompt signed-out scanners to sign in");
  assert.match(checkin, /sessionStorage/, "handoff token must survive the login redirect tab-locally");
});

test("capability-token responses never leak via cache, referrer, or robots", () => {
  const helperCalls = (shareRoute.match(/setCapabilityHeaders\(res\)/g) ?? []).length;
  const directHeaders = (shareRoute.match(/setHeader\("Referrer-Policy"/g) ?? []).length;
  assert.ok(
    helperCalls >= 3 || directHeaders >= 2,
    `share route must set Referrer-Policy on success AND invalid (helper calls ${helperCalls}, direct ${directHeaders})`,
  );
  assert.match(shareRoute, /no-store/, "invalid/success responses must be no-store");
  assert.match(shareRoute, /no-referrer/, "invalid/success responses must suppress referrer");
  assert.match(shareRoute, /noindex/, "invalid/success responses must suppress indexing");
  assert.match(indexHtml, /name="referrer".*no-referrer/, "app must suppress Referer so query/hash tokens never leak to fonts/CDN");
});

test("event-model limitation is disclosed accurately", () => {
  assert.match(checkin, /Opportunity/i, "check-in must name the supported Opportunity/ServiceSession model");
  assert.match(checkin, /beneficiary/i, "check-in must disclose the beneficiary-slot limitation");
  assert.match(publicQr, /beneficiary/i, "public display must disclose the beneficiary-slot limitation");
});
