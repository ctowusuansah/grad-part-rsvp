import { getSupabaseAdmin } from "@/lib/supabase";
import {
  CONTRIBUTION_AMOUNT_GHS,
  EVENT_DATE_DISPLAY,
  EVENT_NAME,
  EVENT_TIME_DISPLAY,
  EVENT_VENUE,
  formatRsvpId,
} from "@/lib/types";
import { notFound } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending Verification",
  confirmed: "Payment Confirmed",
  rejected: "Payment Rejected",
};

export default async function ConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseAdmin();

  const { data: record } = await supabase
    .from("rsvps")
    .select("id, serial, full_name, payment_status")
    .eq("id", params.id)
    .single();

  if (!record) notFound();

  const rsvpId = formatRsvpId(record.serial);
  const qrPayload = record.id;

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-10">
      <div className="case-card mx-auto max-w-md rounded-sm px-6 py-8 text-center">
        <div className="pin" />

        <h1 className="font-display text-2xl font-bold uppercase text-ink">
          RSVP Received
        </h1>

        <p className="mt-2 text-sm text-ink/70">{EVENT_NAME}</p>

        <div className="mx-auto mt-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?text=${encodeURIComponent(qrPayload)}`}
            alt="Your check-in QR code"
            width={220}
            height={220}
            className="rounded-sm border border-ink/10 bg-cream p-2"
          />
        </div>

        <div className="mt-6 space-y-2 text-left text-sm text-ink">
          <Row label="Name" value={record.full_name} />
          <Row label="RSVP ID" value={rsvpId} />
          <Row label="Date" value={EVENT_DATE_DISPLAY} />
          <Row label="Venue" value={EVENT_VENUE} />
          <Row label="Time" value={EVENT_TIME_DISPLAY} />
          <Row
            label="Contribution"
            value={`GHS ${CONTRIBUTION_AMOUNT_GHS}`}
          />
          <Row
            label="Payment Status"
            value={STATUS_LABEL[record.payment_status] || record.payment_status}
            highlight
          />
        </div>

        <p className="mt-6 text-xs text-ink/60">
          Save this page or screenshot your QR code — you'll present it at the
          entrance to check in. Your payment will be manually verified by the
          organizing committee.
        </p>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-ink/10 pb-1">
      <span className="text-ink/60">{label}</span>
      <span
        className={highlight ? "font-semibold text-accent" : "font-semibold"}
      >
        {value}
      </span>
    </div>
  );
}
