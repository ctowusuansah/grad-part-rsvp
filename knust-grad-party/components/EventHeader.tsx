import { EVENT_DATE_DISPLAY, EVENT_TIME_DISPLAY, EVENT_VENUE } from "@/lib/types";

export default function EventHeader() {
  return (
    <div className="case-card mx-auto max-w-md rounded-sm px-6 py-8 text-center">
      <div className="pin" />
      <p className="mb-2 font-display text-xs uppercase tracking-widest text-accent">
        Case File — 06.09.2026
      </p>
      <h1 className="font-display text-3xl font-bold uppercase leading-tight text-ink sm:text-4xl">
        Class of 2026
        <br />
        Grad Party
      </h1>
      <div className="mx-auto mt-4 h-px w-16 bg-ink/30" />
      <p className="mt-4 text-base font-semibold text-ink">{EVENT_DATE_DISPLAY}</p>
      <p className="text-base text-ink">{EVENT_VENUE}</p>
      <p className="text-base text-ink">{EVENT_TIME_DISPLAY}</p>
      <a
        href="#rsvp-form"
        className="mt-6 inline-block rounded-sm bg-accent px-8 py-3 font-display text-lg font-bold uppercase tracking-wide text-cream shadow-card transition hover:bg-accent/90"
      >
        RSVP Now
      </a>
    </div>
  );
}
