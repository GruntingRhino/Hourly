import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { hashAttendanceQrToken, parseAttendanceQrToken } from "../lib/attendanceQr";
import { normalizeAttendanceQrShareToken } from "../lib/attendanceQrShare";

const router = Router();

// Public capability read used only by the standalone QR display page. It
// returns no event, school, student, or account data. The signed token and its
// database row remain the authorization boundary.
router.get("/share", async (req: Request, res: Response) => {
  const token = normalizeAttendanceQrShareToken(req.query.token);
  const parsed = token ? parseAttendanceQrToken(token, process.env.ATTENDANCE_QR_SECRET || "") : null;
  if (!token || !parsed) return res.status(404).json({ error: "Attendance QR link is invalid or expired" });

  const record = await prisma.attendanceQrToken.findUnique({ where: { id: parsed.tokenId } });
  if (
    !record ||
    record.tokenHash !== hashAttendanceQrToken(token) ||
    record.revokedAt ||
    record.expiresAt <= new Date() ||
    record.expiresAt.getTime() !== parsed.expiresAt.getTime()
  ) {
    return res.status(404).json({ error: "Attendance QR link is invalid or expired" });
  }

  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res.json({ expiresAt: record.expiresAt.toISOString() });
});

export default router;