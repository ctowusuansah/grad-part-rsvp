import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";

// POST /api/admin/rsvps/[id]/checkin
// Body: { override?: boolean } — pass override:true to allow a second
// check-in (e.g. the attendee stepped out and came back in by mistake).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));

  const { data: record, error: fetchError } = await supabase
    .from("rsvps")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !record) {
    return NextResponse.json({ error: "RSVP not found." }, { status: 404 });
  }

  if (record.rsvp_status !== "active") {
    return NextResponse.json({ error: "This RSVP has been cancelled." }, { status: 400 });
  }

  if (record.payment_status !== "confirmed") {
    return NextResponse.json(
      { error: "Payment is not confirmed for this RSVP — cannot check in.", record },
      { status: 400 }
    );
  }

  if (record.checked_in && !body.override) {
    return NextResponse.json(
      { error: "Already checked in. Use an override to check in again.", record },
      { status: 409 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("rsvps")
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Could not check in." }, { status: 500 });
  }

  return NextResponse.json({ record: updated });
}
