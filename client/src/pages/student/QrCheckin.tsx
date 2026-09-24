import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, getErrorMessage } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

const SCANNED_TOKEN_KEY = "qr-checkin-token";
const QR_RETURN_KEY = "qr-checkin-return";

function readHashToken(): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash || "";
  if (!hash) return "";
  try {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    return params.get("token") || "";
  } catch {
    return "";
  }
}

function readStoredToken(): string {
  try {
    return window.sessionStorage.getItem(SCANNED_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function initialToken(queryToken: string): string {
  return queryToken || readHashToken() || (typeof window === "undefined" ? "" : readStoredToken());
}

export default function QrCheckin() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const querySessionId = params.get("sessionId") || "";
  const queryToken = params.get("token") || "";
  const [sessionId, setSessionId] = useState(querySessionId);
  // Phone-camera handoff: the QR opens /qr-checkin#token=... (fragment, never
  // a query). The fragment is not sent to the server and never appears in
  // logs or Referer headers; JS reads it and POSTs the token in the body.
  // Initialized lazily so no mount effect needs to copy URL state into React
  // state (react-hooks/set-state-in-effect).
  const [token, setToken] = useState(() => initialToken(queryToken));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const scanGeneration = useRef(0);

  useEffect(() => {
    const onScan = () => {
      scanGeneration.current += 1;
      const nextToken = readHashToken();
      setToken(nextToken);
      setSessionId("");
      setMessage("");
      try {
        if (nextToken) window.sessionStorage.setItem(SCANNED_TOKEN_KEY, nextToken);
        else window.sessionStorage.removeItem(SCANNED_TOKEN_KEY);
      } catch { /* Storage may be unavailable. */ }
    };
    window.addEventListener("hashchange", onScan);
    return () => window.removeEventListener("hashchange", onScan);
  }, []);

  // Persist tab-locally so a signed-out scan survives the login redirect.
  // This effect writes external storage only and never calls setState.
  useEffect(() => {
    if (!token.trim()) return;
    try {
      window.sessionStorage.setItem(SCANNED_TOKEN_KEY, token.trim());
    } catch {
      // sessionStorage unavailable (private mode): the URL hash still holds it.
    }
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    const trimmedToken = token.trim();
    if (!trimmedToken) return setMessage("An attendance code is required.");
    const generation = scanGeneration.current;
    setBusy(true);
    try {
      // Token-only scan: resolve the caller's OWN session server-side from
      // the token's opportunityId. The server enforces ownership, school
      // scope, expiry, and redeemable state; the client never trusts a
      // sessionId embedded in the QR (none is embedded).
      let targetSessionId = querySessionId.trim() || sessionId.trim();
      if (!targetSessionId) {
        const resolved = await api.post<{ sessionId: string }>("/sessions/qr-resolve", { token: trimmedToken });
        if (scanGeneration.current !== generation) return;
        targetSessionId = resolved.sessionId;
        setSessionId(targetSessionId);
      }
      if (scanGeneration.current !== generation) return;
      await api.post(`/sessions/${encodeURIComponent(targetSessionId)}/qr-checkin`, { token: trimmedToken });
      if (scanGeneration.current !== generation) return;
      try {
        window.sessionStorage.removeItem(SCANNED_TOKEN_KEY);
      } catch {
        // ignore
      }
      setMessage("You are checked in.");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "This attendance code is invalid, expired, or already used."));
    } finally { setBusy(false); }
  };

  if (loading) {
    return <main className="max-w-md mx-auto p-6"><p className="text-sm text-[var(--text-sec)]">Loading…</p></main>;
  }

  if (!user) {
    return (
      <main className="max-w-md mx-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold">Scan attendance QR</h1>
        <p className="text-sm text-[var(--text-sec)]">Sign in as a student to complete check-in. Your scanned code is kept in this tab and will be ready after you sign in.</p>
        <p><Link to="/login?returnTo=%2Fqr-checkin" onClick={() => { try { window.sessionStorage.setItem(QR_RETURN_KEY, "1"); } catch { /* ignore */ } }} className="underline">Sign in</Link></p>
        {message && <p role="status">{message}</p>}
        <p className="text-xs text-[var(--text-sec)]">QR check-in covers Opportunity sessions only; beneficiary time slots use a separate attendance path.</p>
      </main>
    );
  }

  if (user.role !== "STUDENT") {
    return (
      <main className="max-w-md mx-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold">Scan attendance QR</h1>
        <p role="alert" className="text-sm">Only student accounts can check in with an attendance code.</p>
        <p className="text-xs text-[var(--text-sec)]">QR check-in covers Opportunity sessions only; beneficiary time slots use a separate attendance path.</p>
      </main>
    );
  }

  return <main className="max-w-md mx-auto p-6 space-y-4"><h1 className="text-xl font-semibold">Scan attendance QR</h1><p className="text-sm text-[var(--text-sec)]">Paste the code provided by the event organizer, or open the QR link from your phone camera — your session is found automatically.</p><form onSubmit={submit} className="space-y-3"><input aria-label="Attendance code" value={token} onChange={(event) => setToken(event.target.value)} className="w-full border rounded px-3 py-2" required /><button disabled={busy} className="w-full py-2 bg-[var(--action)] text-white rounded disabled:opacity-50">{busy ? "Checking in..." : "Check in"}</button></form>{message && <p role="status">{message}</p>}<p className="text-xs text-[var(--text-sec)]">QR check-in covers Opportunity sessions only; beneficiary time slots use a separate attendance path. Codes expire automatically, cannot be reused once redeemed, and never work for another student or school.</p></main>;
}
