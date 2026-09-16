import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPendingConfirmationEmail } from "@/lib/email";
import { CONTRIBUTION_AMOUNT_GHS } from "@/lib/types";

// POST /api/rsvp
// Accepts multipart/form-data with: full_name, phone_number, email,
// momo_transaction_ref, momo_payer_name, confirmed (checkbox), and an
// optional screenshot file. The contribution amount is fixed here on the
// server (never trusted from the client) and every new RSVP always starts
// as "pending" — nothing the visitor sends can mark a payment confirmed.
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const fullName = String(formData.get("full_name") || "").trim();
  const phoneNumber = String(formData.get("phone_number") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const momoRef = String(formData.get("momo_transaction_ref") || "").trim();
  const momoPayerName = String(formData.get("momo_payer_name") || "").trim();
  const confirmed = formData.get("confirmed") === "true" || formData.get("confirmed") === "on";
  const screenshot = formData.get("screenshot");

  // --- Basic validation ---
  const errors: Record<string, string> = {};
  if (!fullName || fullName.length < 2) errors.full_name = "Enter your full name.";
  if (!/^[0-9+][0-9+\s-]{6,}$/.test(phoneNumber)) errors.phone_number = "Enter a valid phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!momoRef || momoRef.length < 3) errors.momo_transaction_ref = "Enter your MoMo transaction reference.";
  if (!momoPayerName || momoPayerName.length < 2) errors.momo_payer_name = "Enter the name used for the payment.";
  if (!confirmed) errors.confirmed = "Please confirm you have made the contribution.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors: errors }, { status: 400 });
  }

  // --- Optional screenshot upload ---
  let screenshotPath: string | null = null;
  if (screenshot instanceof File && screenshot.size > 0) {
    if (screenshot.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Screenshot is too large (max 8MB)." },
        { status: 400 }
      );
    }
    const ext = screenshot.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, await screenshot.arrayBuffer(), {
        contentType: screenshot.type || "image/jpeg",
      });
    if (uploadError) {
      return NextResponse.json({ error: "Could not upload screenshot. Try again." }, { status: 500 });
    }
    screenshotPath = path;
  }

  // --- Insert RSVP (amount_due is fixed server-side, status always starts pending) ---
  const { data, error } = await supabase
    .from("rsvps")
    .insert({
      full_name: fullName,
      phone_number: phoneNumber,
      email,
      amount_due: CONTRIBUTION_AMOUNT_GHS,
      amount_submitted: CONTRIBUTION_AMOUNT_GHS,
      momo_transaction_ref: momoRef,
      momo_payer_name: momoPayerName,
      payment_screenshot_path: screenshotPath,
      payment_status: "pending",
    })
    .select("id, serial")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation on phone or email.
      return NextResponse.json(
        { error: "This phone number or email has already been used to RSVP." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Could not save your RSVP. Please try again." }, { status: 500 });
  }

  // Best-effort email — don't fail the RSVP if the email provider hiccups.
  try {
    const result = await sendPendingConfirmationEmail({
      toEmail: email,
      toName: fullName,
      serial: data.serial,
      momoRef,
    });
    if (result.sent) {
      await supabase.from("rsvps").update({ pending_email_sent: true }).eq("id", data.id);
    }
  } catch (e) {
    console.error("Failed to send pending confirmation email:", e);
  }

  return NextResponse.json({ id: data.id, serial: data.serial }, { status: 201 });
}
