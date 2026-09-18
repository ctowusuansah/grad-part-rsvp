"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONTRIBUTION_AMOUNT_GHS,
  EVENT_DATE_DISPLAY,
  EVENT_NAME,
  EVENT_TIME_DISPLAY,
  EVENT_VENUE,
  formatRsvpId,
  RsvpRecord,
} from "@/lib/types";

interface Stats {
  total_rsvps: number;
  payment_confirmed: number;
  payment_pending: number;
  payment_rejected: number;
  total_expected: number;
  total_received: number;
  total_outstanding: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState<RsvpRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RsvpRecord | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();

    if (query) params.set("q", query);
    if (paymentFilter !== "all") {
      params.set("payment_status", paymentFilter);
    }
    if (rsvpFilter !== "all") {
      params.set("rsvp_status", rsvpFilter);
    }

    const res = await fetch(`/api/admin/rsvps?${params.toString()}`);

    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }

    const data = await res.json();

    setRecords(data.records || []);
    setStats(data.stats || null);
    setLoading(false);
  }, [query, paymentFilter, rsvpFilter, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function openRecord(r: RsvpRecord) {
    setSelected(r);
    setScreenshotUrl(null);

    const res = await fetch(`/api/admin/rsvps/${r.id}`);

    if (res.ok) {
      const data = await res.json();
      setSelected(data.record);
      setScreenshotUrl(data.screenshotUrl);
    }
  }

  async function updateStatus(
    id: string,
    patch: Record<string, string>
  ) {
    const res = await fetch(`/api/admin/rsvps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (res.ok) {
      const data = await res.json();
      setSelected(data.record);
      load();
    }
  }

  function sendWhatsAppConfirmation(record: RsvpRecord) {
    const phone = record.phone_number.replace(/\D/g, "");

    let whatsappNumber = phone;

    if (phone.startsWith("0")) {
      whatsappNumber = `233${phone.slice(1)}`;
    } else if (!phone.startsWith("233")) {
      whatsappNumber = `233${phone}`;
    }

    const message = [
      `🎉 Your payment has been confirmed!`,
      "",
      `${EVENT_NAME}`,
      "",
      `RSVP ID: ${formatRsvpId(record.serial)}`,
      `Contribution: GHS ${CONTRIBUTION_AMOUNT_GHS}`,
      `📅 ${EVENT_DATE_DISPLAY}`,
      `📍 ${EVENT_VENUE}`,
      `⏰ ${EVENT_TIME_DISPLAY}`,
      "",
      "Your RSVP is confirmed.",
      "Please keep your RSVP QR code and present it at the entrance for check-in.",
      "",
      "See you at the party! 🎓🎉",
    ].join("\n");

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold uppercase text-cream">
          Admin Dashboard
        </h1>

        <div className="flex gap-2">
          <a
            href="/admin/checkin"
            className="rounded-sm bg-cream px-4 py-2 text-sm font-semibold text-ink"
          >
            Check-in
          </a>

          <a
            href="/api/admin/export"
            className="rounded-sm bg-cream px-4 py-2 text-sm font-semibold text-ink"
          >
            Export CSV
          </a>

          <button
            onClick={logout}
            className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-cream"
          >
            Log Out
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total RSVPs"
            value={stats.total_rsvps}
          />

          <StatCard
            label="Payment Confirmed"
            value={stats.payment_confirmed}
          />

          <StatCard
            label="Payment Pending"
            value={stats.payment_pending}
          />

          <StatCard
            label="Payment Rejected"
            value={stats.payment_rejected}
          />

          <StatCard
            label="Total Expected"
            value={`GHS ${stats.total_expected}`}
          />

          <StatCard
            label="Total Received"
            value={`GHS ${stats.total_received}`}
          />

          <StatCard
            label="Total Outstanding"
            value={`GHS ${stats.total_outstanding}`}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, email, RSVP ID, or transaction ref…"
          className="min-w-[260px] flex-1 rounded-sm border border-cream/30 bg-cream px-3 py-2 text-sm"
        />

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-sm border border-cream/30 bg-cream px-3 py-2 text-sm"
        >
          <option value="all">All payment statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={rsvpFilter}
          onChange={(e) => setRsvpFilter(e.target.value)}
          className="rounded-sm border border-cream/30 bg-cream px-3 py-2 text-sm"
        >
          <option value="all">All RSVP statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-sm bg-cream">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/15 text-xs uppercase text-ink/60">
            <tr>
              <th className="px-3 py-2">RSVP ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Checked In</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-ink/60"
                >
                  Loading…
                </td>
              </tr>
            )}

            {!loading && records.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-ink/60"
                >
                  No RSVPs match.
                </td>
              </tr>
            )}

            {records.map((r) => (
              <tr
                key={r.id}
                className="border-b border-ink/10"
              >
                <td className="px-3 py-2 font-mono">
                  {formatRsvpId(r.serial)}
                </td>

                <td className="px-3 py-2">
                  {r.full_name}
                </td>

                <td className="px-3 py-2">
                  {r.phone_number}
                </td>

                <td className="px-3 py-2">
                  <StatusBadge status={r.payment_status} />
                </td>

                <td className="px-3 py-2">
                  {r.checked_in ? "Yes" : "No"}
                </td>

                <td className="px-3 py-2">
                  <button
                    onClick={() => openRecord(r)}
                    className="rounded-sm bg-ink px-3 py-1 text-xs font-semibold text-cream"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm bg-cream p-6">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-lg font-bold uppercase text-ink">
                {formatRsvpId(selected.serial)}
              </h2>

              <button
                onClick={() => setSelected(null)}
                className="text-ink/60"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-ink">
              <Detail
                label="Name"
                value={selected.full_name}
              />

              <Detail
                label="Phone"
                value={selected.phone_number}
              />

              <Detail
                label="Email"
                value={selected.email}
              />

              <Detail
                label="Submitted"
                value={new Date(
                  selected.created_at
                ).toLocaleString()}
              />

              <Detail
                label="Amount Due"
                value={`GHS ${selected.amount_due}`}
              />

              <Detail
                label="Amount Submitted"
                value={`GHS ${
                  selected.amount_submitted ?? "—"
                }`}
              />

              <Detail
                label="MoMo Transaction Ref"
                value={
                  selected.momo_transaction_ref || "—"
                }
              />

              <Detail
                label="MoMo Payer Name"
                value={
                  selected.momo_payer_name || "—"
                }
              />

              <Detail
                label="Payment Status"
                value={selected.payment_status}
              />

              <Detail
                label="RSVP Status"
                value={selected.rsvp_status}
              />

              <Detail
                label="Checked In"
                value={
                  selected.checked_in
                    ? `Yes (${new Date(
                        selected.checked_in_at || ""
                      ).toLocaleString()})`
                    : "No"
                }
              />
            </div>

            {screenshotUrl && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-semibold uppercase text-ink/60">
                  Payment Screenshot
                </p>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotUrl}
                  alt="Payment screenshot"
                  className="max-h-64 rounded-sm border"
                />
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  updateStatus(selected.id, {
                    payment_status: "confirmed",
                  })
                }
                className="rounded-sm bg-green-700 px-4 py-2 text-sm font-semibold text-cream"
              >
                Confirm Payment
              </button>

              {selected.payment_status === "confirmed" && (
                <button
                  onClick={() =>
                    sendWhatsAppConfirmation(selected)
                  }
                  className="rounded-sm bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
                >
                  Send WhatsApp Confirmation
                </button>
              )}

              <button
                onClick={() =>
                  updateStatus(selected.id, {
                    payment_status: "rejected",
                  })
                }
                className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-cream"
              >
                Reject Payment
              </button>

              <button
                onClick={() =>
                  updateStatus(selected.id, {
                    payment_status: "pending",
                  })
                }
                className="rounded-sm bg-ink/70 px-4 py-2 text-sm font-semibold text-cream"
              >
                Reset to Pending
              </button>

              {selected.rsvp_status === "active" ? (
                <button
                  onClick={() =>
                    updateStatus(selected.id, {
                      rsvp_status: "cancelled",
                    })
                  }
                  className="rounded-sm border border-ink/30 px-4 py-2 text-sm font-semibold text-ink"
                >
                  Cancel RSVP
                </button>
              ) : (
                <button
                  onClick={() =>
                    updateStatus(selected.id, {
                      rsvp_status: "active",
                    })
                  }
                  className="rounded-sm border border-ink/30 px-4 py-2 text-sm font-semibold text-ink"
                >
                  Reactivate RSVP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-sm bg-cream px-4 py-3">
      <p className="text-xs font-semibold uppercase text-ink/60">
        {label}
      </p>

      <p className="mt-1 font-display text-xl font-bold text-ink">
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b border-ink/10 py-1">
      <span className="text-ink/60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-200 text-yellow-900",
    confirmed: "bg-green-200 text-green-900",
    rejected: "bg-red-200 text-red-900",
  };

  return (
    <span
      className={`rounded-sm px-2 py-1 text-xs font-semibold ${
        colors[status] || ""
      }`}
    >
      {status}
    </span>
  );
}
