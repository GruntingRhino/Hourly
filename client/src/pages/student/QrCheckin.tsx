import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getErrorMessage } from "../../lib/api";

export default function QrCheckin() {
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId") || "";
  const [token, setToken] = useState(params.get("token") || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionId || !token) return setMessage("A session and attendance code are required.");
    setBusy(true); setMessage("");
    try {
      await api.post(`/sessions/${encodeURIComponent(sessionId)}/qr-checkin`, { token });
      setMessage("You are checked in.");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "This attendance code is invalid, expired, or already used."));
    } finally { setBusy(false); }
  };

  return <main className="max-w-md mx-auto p-6 space-y-4"><h1 className="text-xl font-semibold">Scan attendance QR</h1><p className="text-sm text-[var(--text-sec)]">Paste the code provided by the event organizer.</p><form onSubmit={submit} className="space-y-3"><input aria-label="Attendance code" value={token} onChange={(event) => setToken(event.target.value)} className="w-full border rounded px-3 py-2" required /><button disabled={busy} className="w-full py-2 bg-[var(--action)] text-white rounded disabled:opacity-50">{busy ? "Checking in..." : "Check in"}</button></form>{message && <p role="status">{message}</p>}</main>;
}
