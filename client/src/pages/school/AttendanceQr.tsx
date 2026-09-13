import { useEffect, useMemo, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";
import EmptyState from "../../components/EmptyState";

// Staff QR issuance UI for the existing legacy session attendance route.
//
// Exact server contract (server/src/routes/sessions.ts — do not drift):
//   POST /api/sessions/:id/qr-token  { ttlSeconds?: 60–900 int, default 300 }
//   → 201 { token: string, expiresAt: string }
// Roles: ORG_ADMIN, SCHOOL_ADMIN, TEACHER. This page is mounted for the two
// school roles; the legacy ORG_ADMIN surface is intentionally untouched.
//
// Deliberate product properties, all covered by route-contract tests:
// - The token payload carries only tokenId + opportunityId + expiry (see
//   server/src/lib/attendanceQr.ts). The issued-code panel below renders only
//   the event title/date, expiry, and the code itself — never student PII.
// - There is NO revoke endpoint: AttendanceQrToken.revokedAt is read (not set)
//   by any route, so the panel discloses expiry-only invalidation instead of
//   rendering a revoke control that cannot work.
// - No QR-image dependency exists in client/package.json, so presentation is
//   copy / download (.txt) / print of the paste-based attendance code the
//   student /qr-checkin route already consumes. No third-party dep was added.

interface StaffSession {
  id: string;
  status: string;
  opportunity: { id: string; title: string; date: string };
  user: { id: string; name: string; email: string };
}

interface IssuedCode {
  sessionId: string;
  opportunityTitle: string;
  opportunityDate: string;
  token: string;
  expiresAt: string;
}

const TTL_OPTIONS = [
  { seconds: 60, label: "1 minute" },
  { seconds: 120, label: "2 minutes" },
  { seconds: 300, label: "5 minutes (recommended)" },
  { seconds: 600, label: "10 minutes" },
  { seconds: 900, label: "15 minutes (maximum)" },
];

// Sessions the server will actually redeem a QR against
// (POST /:id/qr-checkin accepts only these two states).
const REDEEMABLE_STATUSES = new Set(["PENDING_CHECKIN", "COMMITTED"]);

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function AttendanceQr() {
  const [sessions, setSessions] = useState<StaffSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState(300);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState("");
  const [issued, setIssued] = useState<IssuedCode | null>(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    // loadingSessions/sessionsError already initialize to loading/"", so no
    // synchronous setState is needed here (react-hooks/set-state-in-effect).
    const load = async () => {
      try {
        const result = await api.get<StaffSession[]>("/sessions/school");
        if (!active) return;
        setSessions(result);
        const firstEligible = result.find((s) => REDEEMABLE_STATUSES.has(s.status));
        if (firstEligible) setSelectedSessionId(firstEligible.id);
      } catch (err: unknown) {
        if (!active) return;
        setSessionsError(getErrorMessage(err, "Failed to load sessions. Please refresh."));
      } finally {
        if (active) setLoadingSessions(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const eligibleSessions = useMemo(
    () => sessions.filter((s) => REDEEMABLE_STATUSES.has(s.status)),
    [sessions],
  );
  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  // Live countdown for the issued code; expiry is enforced server-side, this
  // timer only drives the accessible expired/reissue state. `now` is stamped
  // in the issue handler below, so this effect only subscribes to the clock.
  useEffect(() => {
    if (!issued) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [issued]);

  const remainingMs = issued ? new Date(issued.expiresAt).getTime() - now : 0;
  const expired = issued ? remainingMs <= 0 : false;

  const issueCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSession || issuing) return;
    setIssuing(true);
    setIssueError("");
    setCopyFeedback("");
    try {
      const result = await api.post<{ token: string; expiresAt: string }>(
        `/sessions/${encodeURIComponent(selectedSession.id)}/qr-token`,
        { ttlSeconds },
      );
      setIssued({
        sessionId: selectedSession.id,
        opportunityTitle: selectedSession.opportunity.title,
        opportunityDate: selectedSession.opportunity.date,
        token: result.token,
        expiresAt: result.expiresAt,
      });
      setNow(Date.now());
    } catch (err: unknown) {
      setIssueError(getErrorMessage(err, "Could not issue an attendance code. Please try again."));
    } finally {
      setIssuing(false);
    }
  };

  const copyCode = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.token);
      setCopyFeedback("Code copied to clipboard.");
    } catch {
      // Clipboard API unavailable (permissions/insecure context): fall back to
      // selecting the readonly field so keyboard users can copy manually.
      document.getElementById("attendance-code-value")?.focus();
      (document.getElementById("attendance-code-value") as HTMLTextAreaElement | null)?.select();
      setCopyFeedback("Copy unavailable — the code is selected, press Ctrl+C to copy.");
    }
  };

  const downloadCode = () => {
    if (!issued) return;
    const body = [
      "GoodHours attendance code",
      `Event: ${issued.opportunityTitle}`,
      `Expires: ${formatExpiry(issued.expiresAt)}`,
      "",
      "Students enter this code on the QR check-in page against their own session.",
      "Codes expire automatically and cannot be revoked early — issue a new code if needed.",
      "",
      issued.token,
      "",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-code.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loadingSessions) {
    return (
      <main aria-busy="true">
        <h1 className="text-[20px] font-semibold text-[var(--text)]">Attendance QR codes</h1>
        <p className="mt-2 text-sm text-[var(--text-faint)]">Loading sessions…</p>
      </main>
    );
  }

  if (sessionsError) {
    return (
      <main>
        <h1 className="text-[20px] font-semibold text-[var(--text)]">Attendance QR codes</h1>
        <div role="alert" className="mt-4 p-4 bg-[var(--er-bg)] border border-[var(--er-b)] rounded-[3px] text-[var(--er-t)] text-sm">
          {sessionsError}
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="print:hidden">
        <div className="text-[12px] mb-1" style={{ color: "var(--text-faint)" }}>Check-in</div>
        <h1 className="text-[20px] font-semibold" style={{ color: "var(--text)" }}>Attendance QR codes</h1>
        <p className="mt-1 text-sm text-[var(--text-sec)] max-w-2xl">
          Issue a short-lived attendance code for an event. Students enter the code on the
          QR check-in page against their own session — the code itself carries no student information.
        </p>
      </div>

      {eligibleSessions.length === 0 ? (
        <div className="print:hidden mt-4 bg-[var(--surface)] border border-[var(--border)] rounded-[3px]">
          <EmptyState
            title="No sessions awaiting check-in"
            description="Attendance codes can only be redeemed by sessions in a pending or committed state. When students sign up for an upcoming event, eligible sessions will appear here."
            action={{ label: "View cohorts", to: "/cohorts" }}
          />
        </div>
      ) : (
        <form
          onSubmit={issueCode}
          className="print:hidden mt-4 bg-[var(--surface)] border border-[var(--border)] rounded-[3px] p-5 space-y-4 max-w-2xl"
        >
          <div>
            <label htmlFor="attendance-session" className="block text-sm font-medium text-[var(--text)] mb-1">
              Session awaiting check-in
            </label>
            <select
              id="attendance-session"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              disabled={issuing}
              className="w-full border border-[var(--border)] rounded-[3px] px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] disabled:opacity-50"
            >
              {eligibleSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.opportunity.title} — {s.user.name} ({s.status.toLowerCase().replace("_", " ")})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              Only sessions that can redeem a code are listed. Student names appear here for
              staff selection only and are never placed in the issued code.
            </p>
          </div>

          <div>
            <label htmlFor="attendance-ttl" className="block text-sm font-medium text-[var(--text)] mb-1">
              Code lifetime
            </label>
            <select
              id="attendance-ttl"
              value={ttlSeconds}
              onChange={(e) => setTtlSeconds(Number(e.target.value))}
              disabled={issuing}
              aria-describedby="attendance-ttl-help"
              className="w-full border border-[var(--border)] rounded-[3px] px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] disabled:opacity-50"
            >
              {TTL_OPTIONS.map((o) => (
                <option key={o.seconds} value={o.seconds}>{o.label}</option>
              ))}
            </select>
            <p id="attendance-ttl-help" className="mt-1 text-xs text-[var(--text-faint)]">
              The server clamps lifetimes to 1–15 minutes. Expired codes stop working automatically
              and cannot be revoked early — issue a new code if needed.
            </p>
          </div>

          {issueError && (
            <div role="alert" className="p-3 bg-[var(--er-bg)] border border-[var(--er-b)] rounded-[3px] text-[var(--er-t)] text-sm">
              {issueError}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedSession || issuing}
            className="px-4 py-2 bg-[var(--action)] text-white rounded-[2px] text-sm font-medium hover:opacity-85 disabled:opacity-50"
          >
            {issuing ? "Issuing code…" : issued && !expired ? "Issue new code" : "Issue attendance code"}
          </button>
        </form>
      )}

      {/* ISSUED-PANEL-START — the issued-code panel below must reference only the
          event (title/date), expiry, and the code token. No student PII
          (student name/email/id, session user) may be rendered here; enforced
          by server/tests/clientServerRouteContract.test.ts. */}
      {issued && (
        <section
          aria-label="Issued attendance code"
          aria-live="polite"
          className="mt-4 bg-[var(--surface)] border border-[var(--in-b)] rounded-[3px] p-5 max-w-2xl"
        >
          <h2 className="text-[15px] font-semibold text-[var(--text)]">Active attendance code</h2>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[.07em] text-[var(--text-faint)]">Event</dt>
              <dd className="mt-0.5 font-medium text-[var(--text)]">{issued.opportunityTitle}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[.07em] text-[var(--text-faint)]">Expires</dt>
              <dd className="mt-0.5 text-[var(--text-sec)]">
                {formatExpiry(issued.expiresAt)}{" "}
                <span role="status" className={`font-semibold ${expired ? "text-[var(--er-t)]" : "text-[var(--ok-t)]"}`}>
                  {expired ? "(expired)" : `(expires in ${formatCountdown(remainingMs)})`}
                </span>
              </dd>
            </div>
          </dl>

          {expired ? (
            <div role="alert" className="mt-4 p-3 bg-[var(--wn-bg)] border border-[var(--wn-b)] rounded-[3px] text-sm text-[var(--wn-t)]">
              This code has expired and can no longer be redeemed. Issue a new code for{" "}
              {issued.opportunityTitle}.
            </div>
          ) : (
            <>
              <label htmlFor="attendance-code-value" className="block mt-4 text-sm font-medium text-[var(--text)]">
                Attendance code — share with students at the event
              </label>
              <textarea
                id="attendance-code-value"
                readOnly
                rows={3}
                value={issued.token}
                onFocus={(e) => e.target.select()}
                className="mt-1 w-full border border-[var(--border)] rounded-[3px] px-3 py-2 text-xs font-mono bg-[var(--bg)] text-[var(--text)] break-all"
              />
            </>
          )}

          <div className="print:hidden mt-4 flex flex-wrap gap-2">
            {expired ? (
              <button
                type="button"
                onClick={issueCode}
                disabled={issuing || !selectedSession}
                className="px-4 py-2 bg-[var(--action)] text-white rounded-[2px] text-sm font-medium hover:opacity-85 disabled:opacity-50"
              >
                {issuing ? "Issuing code…" : "Reissue code"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-4 py-2 bg-[var(--action)] text-white rounded-[2px] text-sm font-medium hover:opacity-85"
                >
                  Copy code
                </button>
                <button
                  type="button"
                  onClick={downloadCode}
                  className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[2px] text-sm font-medium text-[var(--text-sec)] hover:bg-[var(--bg)]"
                >
                  Download (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[2px] text-sm font-medium text-[var(--text-sec)] hover:bg-[var(--bg)]"
                >
                  Print
                </button>
              </>
            )}
          </div>
          {copyFeedback && (
            <p role="status" className="print:hidden mt-2 text-sm text-[var(--ok-t)]">{copyFeedback}</p>
          )}
          <p className="mt-3 text-xs text-[var(--text-faint)]">
            Students enter this code on the QR check-in page against their own session. The code
            expires automatically and cannot be revoked early.
          </p>
        </section>
      )}
      {/* ISSUED-PANEL-END */}
    </main>
  );
}
