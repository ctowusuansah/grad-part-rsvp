import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";

// GET /api/admin/rsvps?q=...&payment_status=...&rsvp_status=...
// Returns matching RSVP records plus dashboard summary stats computed
// from the FULL table (independent of the current search/filter).
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const paymentStatus = req.nextUrl.searchParams.get("payment_status");
  const rsvpStatus = req.nextUrl.searchParams.get("rsvp_status");

  let query = supabase.from("rsvps").select("*").order("created_at", { ascending: false });

  if (q) {
    // Search by name, phone, RSVP serial (as string), or MoMo transaction ref.
    const serialGuess = q.replace(/[^0-9]/g, "");
    const orParts = [
      `full_name.ilike.%${q}%`,
      `phone_number.ilike.%${q}%`,
      `momo_transaction_ref.ilike.%${q}%`,
      `email.ilike.%${q}%`,
    ];
    if (serialGuess) orParts.push(`serial.eq.${parseInt(serialGuess, 10)}`);
    query = query.or(orParts.join(","));
  }
  if (paymentStatus && paymentStatus !== "all") {
    query = query.eq("payment_status", paymentStatus);
  }
  if (rsvpStatus && rsvpStatus !== "all") {
    query = query.eq("rsvp_status", rsvpStatus);
  }

  const { data: records, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stats always reflect the whole table, not the filtered view.
  const { data: allRecords, error: statsError } = await supabase
    .from("rsvps")
    .select("payment_status, amount_due, amount_submitted, rsvp_status");

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  const active = (allRecords || []).filter((r) => r.rsvp_status === "active");
  const confirmed = active.filter((r) => r.payment_status === "confirmed");
  const pending = active.filter((r) => r.payment_status === "pending");
  const rejected = active.filter((r) => r.payment_status === "rejected");

  const stats = {
    total_rsvps: active.length,
    payment_confirmed: confirmed.length,
    payment_pending: pending.length,
    payment_rejected: rejected.length,
    total_expected: active.reduce((sum, r) => sum + Number(r.amount_due || 0), 0),
    total_received: confirmed.reduce((sum, r) => sum + Number(r.amount_submitted || r.amount_due || 0), 0),
    total_outstanding: pending.reduce((sum, r) => sum + Number(r.amount_due || 0), 0),
  };

  return NextResponse.json({ records, stats });
}
