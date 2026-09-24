import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useSearchParams } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";

export default function PublicAttendanceQr() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [image, setImage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    if (!token) {
      return () => { active = false; };
    }
    void (async () => {
      try {
        const result = await api.get<{ expiresAt: string }>(`/attendance-qr/share?token=${encodeURIComponent(token)}`);
        // Phone-camera handoff: the QR encodes a navigable check-in URL with
        // the token in the hash fragment (#token=), never the raw token and
        // never a ?token= query. The fragment is not sent to the server on
        // page load, never appears in access logs, and is excluded from
        // Referer headers. No sessionId is embedded: the check-in page
        // resolves the scanner's own session server-side.
        const checkinUrl = `${window.location.origin}/qr-checkin#token=${encodeURIComponent(token)}`;
        const dataUrl = await QRCode.toDataURL(checkinUrl, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 420,
          color: { dark: "#172033", light: "#ffffff" },
        });
        if (!active) return;
        setExpiresAt(result.expiresAt);
        setNow(Date.now());
        setImage(dataUrl);
      } catch (err: unknown) {
        if (active) setError(getErrorMessage(err, "This attendance QR link is invalid or expired."));
      }
    })();
    return () => { active = false; };
  }, [token]);

  // While the display stays open, invalidate the QR the moment it expires.
  // Redemption is still enforced server-side; this timer only drops the
  // image so an expired code cannot be scanned from a stale screen. State
  // updates happen inside the interval callback (a subscription), never as
  // synchronous setState in the effect body.
  useEffect(() => {
    if (!expiresAt) return;
    const expiryMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiryMs)) return;
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= expiryMs) setImage("");
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const expired = Boolean(expiresAt) && new Date(expiresAt).getTime() <= now;

  const displayError = token ? error : "This attendance QR link is missing.";
  if (displayError || expired) {
    return <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-6"><section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm"><div className="text-3xl">⌛</div><h1 className="mt-4 text-xl font-semibold text-[#172033]">{expired ? "QR code expired" : "QR link unavailable"}</h1><p role="alert" className="mt-2 text-sm text-[#596579]">{expired ? "This QR code has expired and can no longer be scanned. Ask the event organizer to issue a new code." : displayError}</p><p className="mt-4 text-xs text-[#94a3b8]">QR check-in covers Opportunity sessions only; beneficiary time slots use a separate attendance path.</p></section></main>;
  }

  if (!image) {
    return <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-6"><p className="text-sm text-[#596579]">Loading attendance QR…</p></main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-6">
      <section className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-10 text-center shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">GoodHours attendance</div>
        <h1 className="mt-3 text-2xl font-semibold text-[#172033]">Scan to check in</h1>
        <p className="mt-2 text-sm text-[#596579]">Use your phone camera to scan this code.</p>
        <div className="mt-7 rounded-xl border border-[#e3e8f0] bg-white p-4 sm:p-6">
          <img src={image} alt="Attendance check-in QR code" className="mx-auto h-auto w-full max-w-[420px]" />
        </div>
        <p className="mt-5 text-xs text-[#64748b]">This display link expires {new Date(expiresAt).toLocaleString()}.</p>
        <p className="mt-2 text-xs text-[#94a3b8]">This page does not provide access to the GoodHours application. QR check-in covers Opportunity sessions only; beneficiary time slots use a separate attendance path.</p>
      </section>
    </main>
  );
}
