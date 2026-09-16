export type PaymentStatus = "pending" | "confirmed" | "rejected";
export type RsvpStatus = "active" | "cancelled";

export interface RsvpRecord {
  id: string;
  serial: number;
  created_at: string;

  full_name: string;
  phone_number: string;
  email: string;

  amount_due: number;
  amount_submitted: number | null;
  momo_transaction_ref: string | null;
  momo_payer_name: string | null;
  payment_screenshot_path: string | null;

  payment_status: PaymentStatus;
  rsvp_status: RsvpStatus;

  pending_email_sent: boolean;
  confirmed_email_sent: boolean;

  checked_in: boolean;
  checked_in_at: string | null;
}

// Human-readable RSVP ID, e.g. GRAD-2026-00001, built from the DB serial.
export function formatRsvpId(serial: number): string {
  return `GRAD-2026-${String(serial).padStart(5, "0")}`;
}

export const CONTRIBUTION_AMOUNT_GHS = 40;
export const EVENT_NAME = "Class of 2026 Grad Party";
export const EVENT_DATE_DISPLAY = "26 September 2026";
export const EVENT_DATE_ISO = "2026-09-26";
export const EVENT_TIME_DISPLAY = "6:30 PM";
export const EVENT_VENUE = "Number 5 Bar and Grill";
export const MOMO_NUMBER = "0248019864";
export const MOMO_ACCOUNT_NAME = "KSMD 2026 Events and Projects Committee";
export const MOMO_REFERENCE = "PARTY";
