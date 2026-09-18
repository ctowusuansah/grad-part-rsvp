import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: record, error } = await supabase
    .from("rsvps")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !record) {
    return NextResponse.json(
      { error: "RSVP not found." },
      { status: 404 }
    );
  }

  let screenshotUrl: string | null = null;

  if (record.payment_screenshot_path) {
    const { data: signed } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(
        record.payment_screenshot_path,
        60 * 10
      );

    screenshotUrl = signed?.signedUrl || null;
  }

  return NextResponse.json({
    record,
    screenshotUrl,
  });
}

// PATCH: admin manually sets payment_status ("confirmed" | "rejected" | "pending")
// and/or rsvp_status ("active" | "cancelled"). This is the ONLY place payment
// status ever changes — nothing the public form submits can set it.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));

  const update: Record<string, unknown> = {};

  if (
    body.payment_status &&
    ["pending", "confirmed", "rejected"].includes(
      body.payment_status
    )
  ) {
    update.payment_status = body.payment_status;
  }

  if (
    body.rsvp_status &&
    ["active", "cancelled"].includes(body.rsvp_status)
  ) {
    update.rsvp_status = body.rsvp_status;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 }
    );
  }

  const { data: record, error } = await supabase
    .from("rsvps")
    .update(update)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error || !record) {
    return NextResponse.json(
      { error: "Could not update RSVP." },
      { status: 500 }
    );
  }

  return NextResponse.json({ record });
}
