import { Resend } from "resend";
import {
  CONTRIBUTION_AMOUNT_GHS,
  EVENT_DATE_DISPLAY,
  EVENT_NAME,
  EVENT_TIME_DISPLAY,
  EVENT_VENUE,
  formatRsvpId,
} from "./types";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

interface EmailArgs {
  toEmail: string;
  toName: string;
  serial: number;
  momoRef: string;
}

export async function sendPendingConfirmationEmail(args: EmailArgs) {
  const resend = getResend();

  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping pending confirmation email.");
    return { sent: false };
  }

  const rsvpId = formatRsvpId(args.serial);

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: args.toEmail,
    subject: `${EVENT_NAME} — RSVP Confirmation`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #231a14;">
        <h2>${EVENT_NAME}</h2>
        <p>Date: ${EVENT_DATE_DISPLAY}<br/>
        Venue: ${EVENT_VENUE}<br/>
        Time: ${EVENT_TIME_DISPLAY}</p>

        <p>Hi ${args.toName},</p>

        <p>We've received your RSVP. Here are your details:</p>

        <ul>
          <li><strong>RSVP ID:</strong> ${rsvpId}</li>
          <li><strong>Contribution:</strong> GHS ${CONTRIBUTION_AMOUNT_GHS}</li>
          <li><strong>Payment status:</strong> Pending Verification</li>
          <li><strong>MoMo reference you submitted:</strong> ${args.momoRef}</li>
        </ul>

        <p>
          Your payment will be manually verified by the organizing committee.
          You'll receive another email once it's confirmed.
          Please keep your RSVP ID — you'll need it (as a QR code) to check in at the event.
        </p>

        <p>See you there!</p>
      </div>
    `,
  });

  console.log("RESEND RESULT:", JSON.stringify(result));

  if (result.error) {
    console.error("RESEND EMAIL ERROR:", JSON.stringify(result.error));
    return { sent: false };
  }

  console.log("RESEND EMAIL ACCEPTED:", result.data?.id);
  return { sent: true };
}

export async function sendConfirmedEmail(args: {
  toEmail: string;
  toName: string;
  serial: number;
}) {
  const resend = getResend();

  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping payment-confirmed email.");
    return { sent: false };
  }

  const rsvpId = formatRsvpId(args.serial);

  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: args.toEmail,
    subject: `${EVENT_NAME} — Payment Confirmed`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #231a14;">
        <h2>${EVENT_NAME}</h2>

        <p>Hi ${args.toName},</p>

        <p>
          <strong>Your payment has been confirmed and your RSVP is officially confirmed.</strong>
        </p>

        <p>Your RSVP ID: <strong>${rsvpId}</strong></p>

        <p>
          Date: ${EVENT_DATE_DISPLAY}<br/>
          Venue: ${EVENT_VENUE}<br/>
          Time: ${EVENT_TIME_DISPLAY}
        </p>

        <p>
          Bring your RSVP confirmation (with its QR code) to check in at the entrance.
        </p>

        <p>See you there!</p>
      </div>
    `,
  });

  console.log("RESEND CONFIRMED RESULT:", JSON.stringify(result));

  if (result.error) {
    console.error("RESEND CONFIRMED EMAIL ERROR:", JSON.stringify(result.error));
    return { sent: false };
  }

  console.log("RESEND CONFIRMED EMAIL ACCEPTED:", result.data?.id);
  return { sent: true };
}