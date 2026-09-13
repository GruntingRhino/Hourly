import assert from "node:assert/strict";
import test from "node:test";
import { buildAttendanceQrSharePath, normalizeAttendanceQrShareToken } from "../src/lib/attendanceQrShare";

test("share path carries only the signed attendance token", () => {
  const token = "eyJ0b2tlbklkIjoidDEifQ.signature";
  assert.equal(buildAttendanceQrSharePath(token), `/attendance-share?token=${encodeURIComponent(token)}`);
  assert.equal(buildAttendanceQrSharePath(token).includes("sessionId"), false);
});

test("share token normalization rejects oversized or malformed input", () => {
  assert.equal(normalizeAttendanceQrShareToken(""), null);
  assert.equal(normalizeAttendanceQrShareToken("not a token"), null);
  assert.equal(normalizeAttendanceQrShareToken("a".repeat(4097)), null);
  assert.equal(normalizeAttendanceQrShareToken("signed.payload.signature"), "signed.payload.signature");
});
