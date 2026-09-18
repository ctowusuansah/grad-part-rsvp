"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRsvpId, RsvpRecord } from "@/lib/types";

export default function CheckinPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RsvpRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [scanSupported, setScanSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanningRef = useRef(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Progressive enhancement: only offer camera scanning where the browser
    // supports it. Search-by-name/ID always works as the reliable fallback.
    setScanSupported(
      typeof (window as any).BarcodeDetector !== "undefined"
    );

    return () => {
      scanningRef.current = false;
    };
  }, []);

  async function search(q: string) {
    setQuery(q);

    if (!q.trim()) {
      setResults([]);
      return;
    }

    const res = await fetch(
      `/api/admin/rsvps?q=${encodeURIComponent(q)}`
    );

    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }

    const data = await res.json();
    setResults(data.records || []);
  }

  async function checkIn(id: string, override = false) {
    setMessage(null);

    const res = await fetch(`/api/admin/rsvps/${id}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ override }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(`✓ ${data.record.full_name} checked in.`);
      search(query);
    } else if (res.status === 409) {
      const confirmOverride = window.confirm(
        `${
          data.record?.full_name || "This attendee"
        } is already checked in. Check in again anyway?`
      );

      if (confirmOverride) {
        checkIn(id, true);
      }
    } else {
      setMessage(`✕ ${data.error}`);
    }
  }

  async function startScan() {
    scanningRef.current = true;
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: ["qr_code"] });

      const tick = async () => {
        if (!scanningRef.current) {
          stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
          return;
        }

        if (
          !videoRef.current ||
          videoRef.current.readyState < 2
        ) {
          if (scanningRef.current) {
            requestAnimationFrame(tick);
          }
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);

          if (codes.length > 0) {
            const rsvpId = codes[0].rawValue;

            scanningRef.current = false;
            stream
              .getTracks()
              .forEach((t: MediaStreamTrack) => t.stop());

            setScanning(false);
            checkIn(rsvpId);
            return;
          }
        } catch {
          // Keep trying.
        }

        if (scanningRef.current) {
          requestAnimationFrame(tick);
        }
      };

      tick();
    } catch {
      scanningRef.current = false;
      setMessage(
        "Could not access the camera. Use search instead."
      );
      setScanning(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-8">
      <h1 className="font-display text-xl font-bold uppercase text-cream">
        Check-in
      </h1>

      {scanSupported && (
        <div className="case-card rounded-sm p-3">
          {scanning ? (
            <video
              ref={videoRef}
              className="w-full rounded-sm"
              muted
              playsInline
            />
          ) : (
            <button
              onClick={startScan}
              className="w-full rounded-sm bg-ink px-4 py-3 font-display text-sm font-bold uppercase text-cream"
            >
              Scan QR Code
            </button>
          )}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search by name, phone, or RSVP ID…"
        className="w-full rounded-sm border border-cream/30 bg-cream px-3 py-2 text-sm"
      />

      {message && (
        <p className="rounded-sm bg-cream px-3 py-2 text-sm font-semibold text-ink">
          {message}
        </p>
      )}

      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={r.id}
            className="case-card flex items-center justify-between rounded-sm px-4 py-3"
          >
            <div>
              <p className="font-semibold text-ink">
                {r.full_name}
              </p>

              <p className="text-xs text-ink/60">
                {formatRsvpId(r.serial)} · {r.payment_status} ·{" "}
                {r.checked_in ? "Checked in" : "Not checked in"}
              </p>
            </div>

            <button
              onClick={() => checkIn(r.id)}
              disabled={r.payment_status !== "confirmed"}
              className="rounded-sm bg-accent px-3 py-2 text-xs font-bold uppercase text-cream disabled:opacity-40"
            >
              Check In
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
