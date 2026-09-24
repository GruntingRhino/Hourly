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

// Phone-camera handoff: the QR must encode a navigable check-in URL, not the
// raw token. The token travels in the hash fragment so it is never sent to the
// server on page load, never appears in access logs or query strings, and is
// never included in Referer headers to third parties (fonts/CDN). Client JS
// extracts the fragment and POSTs the token in the request body. No sessionId
// is embedded: the server derives the caller's own session from the token's
// opportunityId (ServiceSession @@unique([userId, opportunityId])), so one
// student's session can never be addressed to another tenant.
export function buildAttendanceQrCheckinUrl(origin: string, token: string): string {
  const normalized = normalizeAttendanceQrShareToken(token);
  if (!normalized) throw new Error("Attendance QR share token is invalid");
  const base = (origin || "").trim().replace(/\/+$/, "");
  if (!base) throw new Error("Attendance QR check-in origin is required");
  return `${base}/qr-checkin#token=${encodeURIComponent(normalized)}`;
}

// Extract a handoff token from a scanned check-in URL. Prefers the hash
// fragment (the safe carrier); accepts the legacy ?token= query for
// robustness. Returns null when no well-formed token is present.
export function extractAttendanceQrTokenFromCheckinUrl(value: string): string | null {
  if (typeof value !== "string" || !value) return null;
  const hashIndex = value.indexOf("#");
  if (hashIndex >= 0) {
    const fragment = value.slice(hashIndex + 1);
    const params = new URLSearchParams(fragment);
    const fromHash = normalizeAttendanceQrShareToken(params.get("token"));
    if (fromHash) return fromHash;
  }
  const queryIndex = value.indexOf("?");
  if (queryIndex >= 0) {
    const queryEnd = hashIndex >= 0 && hashIndex > queryIndex ? hashIndex : value.length;
    const params = new URLSearchParams(value.slice(queryIndex + 1, queryEnd));
    const fromQuery = normalizeAttendanceQrShareToken(params.get("token"));
    if (fromQuery) return fromQuery;
  }
  return null;
}
