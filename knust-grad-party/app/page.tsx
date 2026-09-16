import Image from "next/image";
import EventHeader from "@/components/EventHeader";
import RsvpForm from "@/components/RsvpForm";
import WhatsAppShare from "@/components/WhatsAppShare";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-md space-y-8 px-4 py-10">
      <EventHeader />

      <div className="case-card mx-auto max-w-md rounded-sm p-3">
        <div className="pin" />
        <p className="mb-2 text-center font-display text-xs uppercase tracking-widest text-ink/60">
          Event Programme
        </p>
        {/* Official programme image — displayed exactly as provided, no cropping or edits. */}
        <Image
          src="/programme.jpeg"
          alt="Class of 2026 Grad Party — official event programme"
          width={1558}
          height={2576}
          className="w-full rounded-sm"
          priority
        />
      </div>

      <RsvpForm />

      <WhatsAppShare />

      <footer className="pb-6 text-center text-xs text-cream/70">
        KSMD 2026 Events and Projects Committee
      </footer>
    </main>
  );
}
