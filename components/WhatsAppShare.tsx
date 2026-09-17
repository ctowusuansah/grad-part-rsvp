"use client";

import {
  CONTRIBUTION_AMOUNT_GHS,
  EVENT_DATE_DISPLAY,
  EVENT_TIME_DISPLAY,
  EVENT_VENUE,
} from "@/lib/types";

export default function WhatsAppShare() {
  function handleShare() {
    const siteUrl = "https://grad-party-rho.vercel.app/";

    const message = [
      "🎉 Class of 2026 Grad Party RSVP is now open!",
      "",
      `📅 ${EVENT_DATE_DISPLAY}`,
      `📍 ${EVENT_VENUE}`,
      `⏰ ${EVENT_TIME_DISPLAY}`,
      "",
      `💰 Contribution: GHS ${CONTRIBUTION_AMOUNT_GHS}`,
      "",
      "RSVP here:",
      siteUrl,
    ].join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  return (
    <button
      onClick={handleShare}
      className="w-full rounded-sm border-2 border-ink/20 bg-[#25D366] px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-white shadow-card transition hover:opacity-90"
    >
      Share RSVP on WhatsApp
    </button>
  );
}