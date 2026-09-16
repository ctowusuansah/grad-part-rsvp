import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import { formatRsvpId } from "@/lib/types";

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data: records, error } = await supabase
    .from("rsvps")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "RSVP ID",
    "Submitted At",
    "Full Name",
    "Phone Number",
    "Email",
    "Amount Due (GHS)",
    "Amount Submitted (GHS)",
    "MoMo Transaction Ref",
    "MoMo Payer Name",
    "Payment Status",
    "RSVP Status",
    "Confirmation Email Sent",
    "Checked In",
    "Check-in Time",
  ];

  const rows = (records || []).map((r) => [
    formatRsvpId(r.serial),
    r.created_at,
    r.full_name,
    r.phone_number,
    r.email,
    r.amount_due,
    r.amount_submitted,
    r.momo_transaction_ref,
    r.momo_payer_name,
    r.payment_status,
    r.rsvp_status,
    r.confirmed_email_sent ? "Yes" : "No",
    r.checked_in ? "Yes" : "No",
    r.checked_in_at || "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="grad-party-rsvps-${Date.now()}.csv"`,
    },
  });
}
