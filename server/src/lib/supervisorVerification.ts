import crypto from "node:crypto";
export interface SupervisorVerificationPayload { verificationId: string; serviceRecordId: string; supervisorEmail: string; expiresAt: number; }
function sign(encoded: string, secret: string) { return crypto.createHmac("sha256", secret).update(encoded).digest("base64url"); }
export function createSupervisorVerificationToken(params: { verificationId: string; serviceRecordId: string; supervisorEmail: string; expiresAt: Date; secret: string }): string {
  if (!params.secret || !params.supervisorEmail.includes("@")) throw new Error("Invalid supervisor verification parameters");
  const encoded = Buffer.from(JSON.stringify({ verificationId: params.verificationId, serviceRecordId: params.serviceRecordId, supervisorEmail: params.supervisorEmail.toLowerCase(), expiresAt: params.expiresAt.getTime() })).toString("base64url");
  return `${encoded}.${sign(encoded, params.secret)}`;
}
export function hashSupervisorVerificationToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}
export function parseSupervisorVerificationToken(token: string, secret: string, now = new Date()): SupervisorVerificationPayload {
  const separator = token.lastIndexOf("."); if (separator <= 0) throw new Error("Invalid verification token");
  const encoded = token.slice(0, separator); const supplied = Buffer.from(token.slice(separator + 1), "base64url"); const expected = Buffer.from(sign(encoded, secret), "base64url");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) throw new Error("Invalid verification token");
  let payload: SupervisorVerificationPayload;
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SupervisorVerificationPayload; } catch { throw new Error("Invalid verification token"); }
  if (!payload.verificationId || !payload.serviceRecordId || !payload.supervisorEmail || !Number.isSafeInteger(payload.expiresAt)) throw new Error("Invalid verification token");
  if (payload.expiresAt <= now.getTime()) throw new Error("Expired verification token");
  return payload;
}
export function consumeSupervisorVerificationToken(token: string, params: { secret: string; now?: Date; authorizedDomains: string[]; consumedIds: Set<string> }): SupervisorVerificationPayload {
  const payload = parseSupervisorVerificationToken(token, params.secret, params.now);
  const domain = payload.supervisorEmail.split("@")[1]?.toLowerCase();
  if (!domain || !params.authorizedDomains.map((item) => item.toLowerCase()).includes(domain)) throw new Error("Supervisor email domain is not authorized");
  if (params.consumedIds.has(payload.verificationId)) throw new Error("Expired or replayed verification token");
  params.consumedIds.add(payload.verificationId); return payload;
}
