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

  useEffect(() => {
    let active = true;
    if (!token) {
      return () => { active = false; };
    }
    void (async () => {
      try {
        const result = await api.get<{ expiresAt: string }>(`/attendance-qr/share?token=${encodeURIComponent(token)}`);
        const dataUrl = await QRCode.toDataURL(token, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 420,
          color: { dark: "#172033", light: "#ffffff" },
        });
        if (!active) return;
        setExpiresAt(result.expiresAt);
        setImage(dataUrl);
      } catch (err: unknown) {
        if (active) setError(getErrorMessage(err, "This attendance QR link is invalid or expired."));
      }
    })();
    return () => { active = false; };
  }, [token]);

  const displayError = token ? error : "This attendance QR link is missing.";
  if (displayError) {
    return <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-6"><section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm"><div className="text-3xl">⌛</div><h1 className="mt-4 text-xl font-semibold text-[#172033]">QR link unavailable</h1><p role="alert" className="mt-2 text-sm text-[#596579]">{displayError}</p></section></main>;
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
        <p className="mt-2 text-xs text-[#94a3b8]">This page does not provide access to the GoodHours application.</p>
      </section>
    </main>
  );
}
