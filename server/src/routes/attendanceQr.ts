import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { hashAttendanceQrToken, parseAttendanceQrToken } from "../lib/attendanceQr";
import { normalizeAttendanceQrShareToken } from "../lib/attendanceQrShare";

const router = Router();

// Public capability read used only by the standalone QR display page. It
// returns no event, school, student, or account data. The signed token and its
// database row remain the authorization boundary. Security headers apply to
// BOTH success and invalid responses so a capability token in the query is
// never cached, indexed, or sent as a referrer.
function setCapabilityHeaders(res: Response): void {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
}

router.get("/share", async (req: Request, res: Response) => {
  const token = normalizeAttendanceQrShareToken(req.query.token);
  const parsed = token ? parseAttendanceQrToken(token, process.env.ATTENDANCE_QR_SECRET || "") : null;
  if (!token || !parsed) {
    setCapabilityHeaders(res);
    return res.status(404).json({ error: "Attendance QR link is invalid or expired" });
  }

  const record = await prisma.attendanceQrToken.findUnique({ where: { id: parsed.tokenId } });
  if (
    !record ||
    record.tokenHash !== hashAttendanceQrToken(token) ||
    record.revokedAt ||
    record.expiresAt <= new Date() ||
    record.expiresAt.getTime() !== parsed.expiresAt.getTime()
  ) {
    setCapabilityHeaders(res);
    return res.status(404).json({ error: "Attendance QR link is invalid or expired" });
  }

  setCapabilityHeaders(res);
  return res.json({ expiresAt: record.expiresAt.toISOString() });
});

export default router;