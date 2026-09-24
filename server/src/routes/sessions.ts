import { Router, Request, Response, NextFunction } from "express";
import { create as contentDisposition } from "content-disposition";
import multer from "multer";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { logDataAccess } from "../lib/dataAccessLog";
import { buildAnonymousVolunteerLabel } from "../lib/privacy";
import crypto from "node:crypto";
import { createAttendanceQrToken, hashAttendanceQrToken, parseAttendanceQrToken } from "../lib/attendanceQr";
import { buildAttendanceQrSharePath } from "../lib/attendanceQrShare";
import { isLegacyOpportunityQrWindowOpen } from "../lib/legacyQrWindow";
import { isPrismaKnownRequestError } from "../lib/prismaErrors";
import { detectSignatureMime } from "../lib/signatureStorage";
import {
  assertStudentAccessibleToStaff,
  buildCohortScopedStudentWhere,
  getStaffAccessScope,
} from "../lib/cohortAccess";

const router = Router();

// Token-only handoff resolution for the phone-camera QR flow. The QR carries
// only the signed opportunity-scoped token (in the /qr-checkin hash fragment);
// it never embeds a sessionId, so one student's session cannot be addressed to
// another student or school. The server derives the caller's OWN session via
// ServiceSession @@unique([userId, opportunityId]) and enforces the same
// tenant/state checks as redemption, without redeeming. The token travels in
// the POST body (never a URL path/query) and is never logged.
router.post("/qr-resolve", authenticate, requireRole("STUDENT"), async (req: Request, res: Response) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (!token || token.length > 4096 || /\s/.test(token)) return res.status(400).json({ error: "An attendance code is required" });
    const parsed = parseAttendanceQrToken(token, process.env.ATTENDANCE_QR_SECRET || "");
    if (!parsed) return res.status(400).json({ error: "This attendance code is invalid or expired" });
    const qr = await prisma.attendanceQrToken.findUnique({ where: { id: parsed.tokenId } });
    if (!qr || qr.tokenHash !== hashAttendanceQrToken(token) || qr.revokedAt || qr.expiresAt <= new Date()) {
      return res.status(400).json({ error: "This attendance code is invalid or expired" });
    }
    const session = await prisma.serviceSession.findUnique({
      where: { userId_opportunityId: { userId: req.user!.userId, opportunityId: parsed.opportunityId } },
      select: { id: true, schoolId: true, opportunityId: true, status: true,
        opportunity: { select: { date: true, startTime: true, endTime: true } } },
    });
    if (!session) return res.status(404).json({ error: "No session found for this event on your account" });
    if (qr.schoolId !== session.schoolId) return res.status(403).json({ error: "This code is not for your school" });
    if (!["PENDING_CHECKIN", "COMMITTED"].includes(session.status)) {
      return res.status(409).json({ error: "Your session is not awaiting check-in" });
    }
    if (!isLegacyOpportunityQrWindowOpen(session.opportunity)) {
      return res.status(409).json({ error: "Attendance check-in is available from 30 minutes before the event starts through its end (Eastern time)" });
    }
    return res.json({ sessionId: session.id, opportunityId: session.opportunityId, expiresAt: qr.expiresAt.toISOString() });
  } catch (err) { console.error("QR resolve error:", err); return res.status(500).json({ error: "Internal server error" }); }
});

// Legacy session QR attendance. The schema intentionally binds these tokens to
// Opportunity/ServiceSession; beneficiary slots use their separate attendance path.
router.post("/:id/qr-token", authenticate, requireRole("ORG_ADMIN", "SCHOOL_ADMIN", "TEACHER"), async (req: Request, res: Response) => {
  try {
    const session = await prisma.serviceSession.findUnique({ where: { id: req.params.id }, include: { opportunity: true } });
    if (!session) return res.status(404).json({ error: "Session not found" });
    const actor = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { organizationId: true, schoolId: true, role: true } });
    let allowed = false;
    if (actor?.role === "ORG_ADMIN") {
      allowed = actor.organizationId === session.opportunity.organizationId;
    } else if (actor?.role === "SCHOOL_ADMIN" || actor?.role === "TEACHER") {
      // Mirror GET /school and GET /:id/signature-file: school staff must
      // present a valid staff scope, the session row must belong to the
      // staff member's school, and (for non-admins) the student must sit in
      // an assigned cohort via assertStudentAccessibleToStaff. Fail closed
      // on missing scope, missing session school, or out-of-cohort student.
      const scope = await getStaffAccessScope(req.user!.userId);
      allowed = Boolean(
        scope &&
        session.schoolId &&
        session.schoolId === scope.schoolId &&
        await assertStudentAccessibleToStaff(scope, session.userId)
      );
    }
    if (!allowed) return res.status(403).json({ error: "Not authorized for this session" });
    const ttl = typeof req.body?.ttlSeconds === "number" && Number.isInteger(req.body.ttlSeconds) ? Math.min(Math.max(req.body.ttlSeconds, 60), 900) : 300;
    const raw = createAttendanceQrToken({ tokenId: crypto.randomUUID(), opportunityId: session.opportunityId, expiresAt: new Date(Date.now() + ttl * 1000), secret: process.env.ATTENDANCE_QR_SECRET || "" });
    const parsed = parseAttendanceQrToken(raw, process.env.ATTENDANCE_QR_SECRET || "");
    if (!parsed) return res.status(500).json({ error: "Could not create attendance token" });
    await prisma.attendanceQrToken.create({ data: { id: parsed.tokenId, opportunityId: parsed.opportunityId, schoolId: session.schoolId, createdById: req.user!.userId, tokenHash: hashAttendanceQrToken(raw), expiresAt: parsed.expiresAt } });
    return res.status(201).json({
      token: raw,
      expiresAt: parsed.expiresAt,
      sharePath: buildAttendanceQrSharePath(raw),
    });
  } catch (err) { console.error("Issue attendance QR error:", err); return res.status(500).json({ error: "Internal server error" }); }
});

router.post("/:id/qr-checkin", authenticate, requireRole("STUDENT"), async (req: Request, res: Response) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const parsed = parseAttendanceQrToken(token, process.env.ATTENDANCE_QR_SECRET || "");
    if (!parsed) return res.status(400).json({ error: "Invalid or expired attendance QR token" });
    const session = await prisma.serviceSession.findUnique({ where: { id: req.params.id },
      include: { opportunity: { select: { date: true, startTime: true, endTime: true } } } });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user!.userId) return res.status(403).json({ error: "Not your session" });
    if (parsed.opportunityId !== session.opportunityId) return res.status(403).json({ error: "Token is not for this opportunity" });
    const qr = await prisma.attendanceQrToken.findUnique({ where: { id: parsed.tokenId } });
    if (!qr || qr.tokenHash !== hashAttendanceQrToken(token) || qr.revokedAt || qr.expiresAt <= new Date()) return res.status(400).json({ error: "Invalid or expired attendance QR token" });
    if (qr.schoolId !== session.schoolId) return res.status(403).json({ error: "Token is not for this school" });
    if (!["PENDING_CHECKIN", "COMMITTED"].includes(session.status)) return res.status(409).json({ error: "Session is not awaiting check-in" });
    if (!isLegacyOpportunityQrWindowOpen(session.opportunity)) return res.status(409).json({ error: "Attendance check-in is available from 30 minutes before the event starts through its end (Eastern time)" });
    const updated = await prisma.$transaction(async (tx) => {
      if (!isLegacyOpportunityQrWindowOpen(session.opportunity)) throw new Error("QR_WINDOW_CLOSED");
      const claimedSession = await tx.serviceSession.updateMany({ where: { id: session.id, status: { in: ["PENDING_CHECKIN", "COMMITTED"] } }, data: { status: "CHECKED_IN" } });
      if (claimedSession.count !== 1) throw new Error("SESSION_STATE_CHANGED");
      const redemption = await tx.attendanceQrRedemption.create({ data: { tokenId: qr.id, studentId: req.user!.userId, sessionId: session.id } });
      const result = await tx.serviceSession.update({ where: { id: session.id }, data: { checkInTime: redemption.checkedInAt } });
      await tx.auditLog.create({ data: { action: "CHECK_IN_QR", actorId: req.user!.userId, sessionId: session.id, details: JSON.stringify({ tokenId: qr.id, time: redemption.checkedInAt.toISOString() }) } });
      return result;
    });
    return res.json(updated);
  } catch (err) { if (isPrismaKnownRequestError(err) && err.code === "P2002") return res.status(409).json({ error: "Attendance QR token already redeemed" }); if (err instanceof Error && err.message === "SESSION_STATE_CHANGED") return res.status(409).json({ error: "Session is not awaiting check-in" }); if (err instanceof Error && err.message === "QR_WINDOW_CLOSED") return res.status(409).json({ error: "Attendance check-in window has closed" }); console.error("QR check-in error:", err); return res.status(500).json({ error: "Internal server error" }); }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function uploadSignatureFile(req: Request, res: Response, next: NextFunction) {
  upload.single("signatureFile")(req, res, (err: any) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File must be 5MB or smaller" });
    }

    const message = typeof err?.message === "string" && err.message.trim()
      ? err.message.trim()
      : "Invalid signature file upload";
    return res.status(400).json({ error: message });
  });
}

async function authorizeVerificationSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await prisma.serviceSession.findUnique({
      where: { id: req.params.id },
      include: { opportunity: true },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user!.userId) return res.status(403).json({ error: "Not your session" });
    if (!["COMMITTED", "CHECKED_OUT", "PENDING_VERIFICATION", "REJECTED"].includes(session.status)) {
      return res.status(400).json({ error: "Session is not ready for verification" });
    }
    if (new Date() < new Date(session.opportunity.date)) {
      return res.status(400).json({ error: "Cannot submit verification before the opportunity date" });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

// POST /api/sessions/:id/checkin — student checks in
router.post("/:id/checkin", authenticate, requireRole("STUDENT"), async (req: Request, res: Response) => {
  try {
    const session = await prisma.serviceSession.findUnique({
      where: { id: req.params.id },
      include: { opportunity: true },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Not your session" });
    }
    if (session.status !== "PENDING_CHECKIN" && session.status !== "COMMITTED") {
      return res.status(400).json({ error: "Already checked in or completed" });
    }

    // Time-window enforcement: allow check-in within 30 min of start
    const now = new Date();

    const updated = await prisma.serviceSession.update({
      where: { id: req.params.id },
      data: {
        checkInTime: now,
        status: "CHECKED_IN",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CHECK_IN",
        actorId: req.user!.userId,
        sessionId: session.id,
        details: JSON.stringify({ time: now.toISOString() }),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:id/checkout — student checks out
router.post("/:id/checkout", authenticate, requireRole("STUDENT"), async (req: Request, res: Response) => {
  try {
    const session = await prisma.serviceSession.findUnique({
      where: { id: req.params.id },
      include: { opportunity: true },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Not your session" });
    }
    if (session.status !== "CHECKED_IN") {
      return res.status(400).json({ error: "Not checked in" });
    }

    const now = new Date();
    const checkIn = session.checkInTime!;
    const totalHours = Math.round(((now.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;

    const updated = await prisma.serviceSession.update({
      where: { id: req.params.id },
      data: {
        checkOutTime: now,
        totalHours,
        status: "CHECKED_OUT",
        verificationStatus: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CHECK_OUT",
        actorId: req.user!.userId,
        sessionId: session.id,
        details: JSON.stringify({ time: now.toISOString(), totalHours }),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Check-out error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/my — student's service sessions
router.get("/my", authenticate, requireRole("STUDENT"), async (req: Request, res: Response) => {
  try {
    const { status, verificationStatus, opportunityId } = req.query;
    const where: any = { userId: req.user!.userId };
    if (status) where.status = status;
    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (opportunityId) where.opportunityId = opportunityId;

    const sessions = await prisma.serviceSession.findMany({
      where,
      include: {
        opportunity: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(sessions);
  } catch (err) {
    console.error("My sessions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/organization — org sees their volunteers' sessions
router.get("/organization", authenticate, requireRole("ORG_ADMIN"), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.organizationId) {
      return res.status(400).json({ error: "Not associated with organization" });
    }

    const { verificationStatus } = req.query;
    const where: any = { opportunity: { organizationId: user.organizationId } };
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const sessions = await prisma.serviceSession.findMany({
      where,
      include: {
        user: { select: { id: true } },
        opportunity: { select: { id: true, title: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      sessions.map((session) => ({
        ...session,
        user: {
          label: buildAnonymousVolunteerLabel(session.user.id),
        },
      }))
    );
  } catch (err) {
    console.error("Org sessions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:id/submit-verification — student submits verification with signature
router.post("/:id/submit-verification", authenticate, requireRole("STUDENT"), authorizeVerificationSubmission, uploadSignatureFile, async (req: Request, res: Response) => {
  try {
    const session = await prisma.serviceSession.findUnique({
      where: { id: req.params.id },
      include: { opportunity: true, user: { include: { classroom: { include: { school: true } } } } },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user!.userId) {
      return res.status(403).json({ error: "Not your session" });
    }
    if (!["COMMITTED", "CHECKED_OUT", "PENDING_VERIFICATION", "REJECTED"].includes(session.status)) {
      return res.status(400).json({ error: "Session is not ready for verification" });
    }

    // Check opportunity end date has passed
    const oppDate = new Date(session.opportunity.date);
    const now = new Date();
    if (now < oppDate) {
      return res.status(400).json({ error: "Cannot submit verification before the opportunity date" });
    }

    // Determine signature type
    const { signatureType, signatureData } = req.body;
    const file = req.file;

    // DRAWN signatures are stored verbatim in ServiceSession.signatureData
    // (unbounded text). Bound them: the in-app signature pad emits a small
    // canvas PNG data URL (tens of KB), so 1M chars (~750KB decoded) is
    // generous while file uploads are separately capped at 5MB by multer.
    const MAX_DRAWN_SIGNATURE_CHARS = 1000000;
    if (signatureType === "DRAWN") {
      if (typeof signatureData !== "string" || signatureData.length === 0) {
        return res.status(400).json({ error: "Signature data is required for drawn signatures" });
      }
      if (!signatureData.startsWith("data:image/")) {
        return res.status(400).json({ error: "Drawn signature must be an image data URL" });
      }
      if (signatureData.length > MAX_DRAWN_SIGNATURE_CHARS) {
        return res.status(400).json({ error: "Drawn signature must be 1MB or smaller" });
      }
    } else if (file) {
      const signatureMimeType = detectSignatureMime(file.buffer);
      if (!signatureMimeType) {
        return res.status(400).json({ error: "Signature file must contain a PDF, PNG, or JPEG document" });
      }
    } else {
      return res.status(400).json({ error: "Either a drawn signature or file upload is required" });
    }

    const updated = await prisma.serviceSession.update({
      where: { id: req.params.id },
      data: {
        status: "PENDING_VERIFICATION",
        verificationStatus: "PENDING",
        signatureType: file ? "FILE" : "DRAWN",
        signatureData: signatureType === "DRAWN" ? signatureData : null,
        signatureFileName: file ? file.originalname : null,
        signatureFileBytes: file ? Uint8Array.from(file.buffer) : null,
        signatureFileMimeType: file ? detectSignatureMime(file.buffer) : null,
        submittedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "SUBMIT_VERIFICATION",
        actorId: req.user!.userId,
        sessionId: session.id,
        details: JSON.stringify({
          signatureType: file ? "FILE" : "DRAWN",
          totalHours: session.totalHours,
        }),
      },
    });

    // Notify school staff
    const schoolId = session.user.classroom?.school?.id;
    if (schoolId) {
      const schoolStaff = await prisma.user.findMany({
        where: {
          schoolId,
          role: { in: ["SCHOOL_ADMIN", "TEACHER"] },
        },
      });
      await prisma.notification.createMany({
        data: schoolStaff.map((staff) => ({
          userId: staff.id,
          type: "VERIFICATION_SUBMITTED",
          title: "Verification Submitted",
          body: `${session.user.name} submitted ${session.totalHours}h for "${session.opportunity.title}" for review.`,
          data: JSON.stringify({ sessionId: session.id }),
        })),
      });
    }

    // Notify org admins of verification submission
    const orgAdmins = await prisma.user.findMany({
      where: { organizationId: session.opportunity.organizationId, role: "ORG_ADMIN" },
      select: { id: true },
    });
    if (orgAdmins.length > 0) {
      await prisma.notification.createMany({
        data: orgAdmins.map((admin) => ({
          userId: admin.id,
          type: "VERIFICATION_SUBMITTED",
          title: "Verification Request",
          body: `${buildAnonymousVolunteerLabel(session.user.id)} submitted verification for "${session.opportunity.title}" — ${session.totalHours}h`,
        })),
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("Submit verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/:id/signature-file — scoped access to durable file evidence
router.get("/:id/signature-file", authenticate, requireRole("STUDENT", "SCHOOL_ADMIN", "TEACHER", "ORG_ADMIN"), async (req: Request, res: Response) => {
  try {
    const session = await prisma.serviceSession.findUnique({
      where: { id: req.params.id },
      select: {
        userId: true,
        schoolId: true,
        signatureFileName: true,
        signatureFileBytes: true,
        signatureFileMimeType: true,
        opportunity: { select: { organizationId: true } },
      },
    });
    if (!session?.signatureFileBytes || !session.signatureFileMimeType) {
      return res.status(404).json({ error: "Signature file not found" });
    }

    const actor = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { role: true, organizationId: true },
    });
    let allowed = false;
    if (actor?.role === "STUDENT") {
      allowed = session.userId === req.user!.userId;
    } else if (actor?.role === "ORG_ADMIN") {
      allowed = actor.organizationId === session.opportunity.organizationId;
    } else if (actor?.role === "SCHOOL_ADMIN" || actor?.role === "TEACHER") {
      const scope = await getStaffAccessScope(req.user!.userId);
      allowed = Boolean(
        scope &&
        session.schoolId === scope.schoolId &&
        await assertStudentAccessibleToStaff(scope, session.userId)
      );
    }
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    res.setHeader("Content-Type", session.signatureFileMimeType);
    res.setHeader("Content-Disposition", contentDisposition(session.signatureFileName ?? "signature"));
    res.send(Buffer.from(session.signatureFileBytes));
  } catch (err) {
    console.error("Signature download error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/school — school sees all student sessions
router.get("/school", authenticate, requireRole("SCHOOL_ADMIN", "TEACHER"), async (req: Request, res: Response) => {
  try {
    const scope = await getStaffAccessScope(req.user!.userId);
    if (!scope) return res.status(403).json({ error: "No school access" });

    const { studentId, verificationStatus } = req.query;

    if (studentId) {
      const allowed = await assertStudentAccessibleToStaff(scope, studentId as string);
      if (!allowed) {
        return res.status(404).json({ error: "Student not found" });
      }
    }

    const where: any = {
      schoolId: scope.schoolId,
      user: buildCohortScopedStudentWhere(scope),
    };
    if (studentId) where.userId = studentId;
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const sessions = await prisma.serviceSession.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        opportunity: {
          include: { organization: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    await logDataAccess({
      actorId: req.user!.userId,
      action: "VIEW_SESSIONS",
      targetType: studentId ? "student" : "school",
      targetId: (studentId as string | undefined) ?? scope.schoolId,
      schoolId: scope.schoolId,
      details: { sessionCount: sessions.length },
    });

    res.json(sessions);
  } catch (err) {
    console.error("School sessions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
