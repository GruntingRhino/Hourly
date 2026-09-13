const MAX_ATTENDANCE_QR_SHARE_TOKEN_LENGTH = 4096;

export function normalizeAttendanceQrShareToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  if (!token || token.length > MAX_ATTENDANCE_QR_SHARE_TOKEN_LENGTH || /\s/.test(token)) return null;
  return token;
}

export function buildAttendanceQrSharePath(token: string): string {
  const normalized = normalizeAttendanceQrShareToken(token);
  if (!normalized) throw new Error("Attendance QR share token is invalid");
  return `/attendance-share?token=${encodeURIComponent(normalized)}`;
}
