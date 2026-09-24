import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as windowModule from "../src/lib/legacyQrWindow";

const opportunity = { date: new Date("2026-09-24T00:00:00.000Z"), startTime: "10:00 AM", endTime: "11:00 AM" };
const open = (now: string, event = opportunity) => windowModule.isLegacyOpportunityQrWindowOpen(event, new Date(now));

test("Eastern daylight-time QR check-in opens 30 minutes before and closes at event end", () => {
  assert.equal(open("2026-09-24T13:29:59.999Z"), false);
  assert.equal(open("2026-09-24T13:30:00.000Z"), true);
  assert.equal(open("2026-09-24T14:00:00.000Z"), true);
  assert.equal(open("2026-09-24T15:00:00.000Z"), true);
  assert.equal(open("2026-09-24T15:00:00.001Z"), false);
});

test("Eastern standard time after DST ends uses UTC-5 and the same boundaries", () => {
  const winter = { ...opportunity, date: new Date("2026-11-02T00:00:00.000Z") };
  assert.equal(open("2026-11-02T14:29:59.999Z", winter), false);
  assert.equal(open("2026-11-02T14:30:00.000Z", winter), true);
  assert.equal(open("2026-11-02T16:00:00.000Z", winter), true);
  assert.equal(open("2026-11-02T16:00:00.001Z", winter), false);
});

test("invalid, reversed, nonexistent DST local time and invalid date fail closed", () => {
  for (const event of [
    { ...opportunity, startTime: "bogus" },
    { ...opportunity, endTime: "09:00 AM" },
    { ...opportunity, date: new Date("invalid") },
    { ...opportunity, date: new Date("2026-03-08T00:00:00.000Z"), startTime: "02:30 AM", endTime: "04:00 AM" },
    { ...opportunity, date: new Date("2026-11-01T00:00:00.000Z"), startTime: "01:30 AM", endTime: "03:00 AM" },
  ]) assert.equal(open("2026-09-24T14:00:00.000Z", event), false);
});

test("ambiguous fall-back wall-clock times fail closed while unambiguous post-transition events remain valid", () => {
  const date = new Date("2026-11-01T00:00:00.000Z");
  const ambiguous = { ...opportunity, date, startTime: "01:30 AM", endTime: "03:00 AM" };
  const later = { ...opportunity, date, startTime: "03:00 AM", endTime: "04:00 AM" };
  assert.equal(open("2026-11-01T06:30:00.000Z", ambiguous), false);
  assert.equal(open("2026-11-01T08:00:00.000Z", later), true);
  assert.equal(open("2026-11-01T09:00:00.001Z", later), false);
});

test("both QR resolution and redemption enforce the same window before disclosure or mutation", () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/routes/sessions.ts"), "utf8");
  const resolve = source.slice(source.indexOf('router.post("/qr-resolve"'), source.indexOf('router.post("/:id/qr-token"'));
  const redeem = source.slice(source.indexOf('router.post("/:id/qr-checkin"'), source.indexOf("const upload = multer"));
  assert.match(resolve, /isLegacyOpportunityQrWindowOpen\(/);
  assert.match(redeem, /isLegacyOpportunityQrWindowOpen\(/);
  assert.ok(resolve.indexOf("isLegacyOpportunityQrWindowOpen(") < resolve.indexOf("return res.json({ sessionId"));
  assert.ok(redeem.indexOf("isLegacyOpportunityQrWindowOpen(") < redeem.indexOf("prisma.$transaction"));
});
