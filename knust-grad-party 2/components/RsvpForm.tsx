"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONTRIBUTION_AMOUNT_GHS,
  MOMO_ACCOUNT_NAME,
  MOMO_NUMBER,
  MOMO_REFERENCE,
} from "@/lib/types";

type FieldErrors = Record<string, string>;

export default function RsvpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [momoRef, setMomoRef] = useState("");
  const [momoPayerName, setMomoPayerName] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyMomoNumber() {
    try {
      await navigator.clipboard.writeText(MOMO_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable — the number is shown on screen either way.
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});
    setSubmitting(true);

    const formData = new FormData();
    formData.set("full_name", fullName);
    formData.set("phone_number", phoneNumber);
    formData.set("email", email);
    formData.set("momo_transaction_ref", momoRef);
    formData.set("momo_payer_name", momoPayerName);
    formData.set("confirmed", confirmed ? "true" : "false");
    if (screenshot) formData.set("screenshot", screenshot);

    try {
      const res = await fetch("/api/rsvp", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setGeneralError(data.error || "Something went wrong. Please try again.");
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setSubmitting(false);
        return;
      }

      router.push(`/rsvp/confirmation/${data.id}`);
    } catch {
      setGeneralError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      id="rsvp-form"
      onSubmit={handleSubmit}
      className="case-card mx-auto max-w-md space-y-6 rounded-sm px-6 py-8"
    >
      <div className="tape" />

      <div>
        <h2 className="font-display text-xl font-bold uppercase text-ink">Your Details</h2>
        <p className="mt-1 text-sm text-ink/70">One RSVP per person.</p>
      </div>

      <Field label="Full Name" error={errors.full_name}>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="input"
          placeholder="e.g. Ama Serwaa Mensah"
        />
      </Field>

      <Field label="Phone Number" error={errors.phone_number}>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          className="input"
          placeholder="024XXXXXXX"
        />
      </Field>

      <Field label="Email Address" error={errors.email}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
          placeholder="you@example.com"
        />
      </Field>

      <div className="border-t border-ink/15 pt-6">
        <h2 className="font-display text-xl font-bold uppercase text-ink">Party Contribution</h2>
        <p className="mt-1 text-sm text-ink/80">
          Party contribution: <strong>GHS {CONTRIBUTION_AMOUNT_GHS}</strong>
        </p>
        <p className="mt-3 text-sm text-ink/80">
          Please make a GHS {CONTRIBUTION_AMOUNT_GHS} contribution via MoMo before submitting your RSVP.
        </p>

        <div className="mt-3 space-y-1 rounded-sm bg-ink/5 p-4 text-sm text-ink">
          <p>
            <span className="font-semibold">Amount:</span> GHS {CONTRIBUTION_AMOUNT_GHS}
          </p>
          <p>
            <span className="font-semibold">MoMo Number:</span> {MOMO_NUMBER}
          </p>
          <p>
            <span className="font-semibold">Account Name:</span> {MOMO_ACCOUNT_NAME}
          </p>
          <p>
            <span className="font-semibold">Reference:</span> {MOMO_REFERENCE}
          </p>
        </div>

        <button
          type="button"
          onClick={copyMomoNumber}
          className="mt-3 w-full rounded-sm bg-ink px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-cream shadow-card transition hover:opacity-90"
        >
          {copied ? "Number Copied ✓" : "Pay via MoMo"}
        </button>
        <p className="mt-1 text-xs text-ink/60">
          Opens your MoMo dialer manually — copies the number above so you can send the contribution.
        </p>
      </div>

      <div className="border-t border-ink/15 pt-6">
        <h2 className="font-display text-xl font-bold uppercase text-ink">After You've Paid</h2>

        <Field label="MoMo Transaction / Reference Number" error={errors.momo_transaction_ref}>
          <input
            type="text"
            value={momoRef}
            onChange={(e) => setMomoRef(e.target.value)}
            required
            className="input"
            placeholder="e.g. 8HD3KQ2P"
          />
        </Field>

        <Field label="Name Used for the Payment" error={errors.momo_payer_name}>
          <input
            type="text"
            value={momoPayerName}
            onChange={(e) => setMomoPayerName(e.target.value)}
            required
            className="input"
            placeholder="Name on the MoMo account you paid from"
          />
        </Field>

        <Field label="Upload Payment Screenshot (optional)" error={errors.screenshot}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            className="input file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-2 file:text-cream"
          />
        </Field>

        <label className="mt-4 flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            I have completed the GHS {CONTRIBUTION_AMOUNT_GHS} contribution and submitted my payment
            details.
          </span>
        </label>
        {errors.confirmed && <p className="mt-1 text-sm text-accent">{errors.confirmed}</p>}
      </div>

      {generalError && (
        <p className="rounded-sm bg-accent/10 p-3 text-sm text-accent">{generalError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-sm bg-accent px-6 py-4 font-display text-lg font-bold uppercase tracking-wide text-cream shadow-card transition hover:bg-accent/90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit RSVP"}
      </button>
      <p className="text-center text-xs text-ink/60">
        Your payment will be manually verified by the organizing committee.
      </p>

      <style jsx global>{`
        .input {
          margin-top: 4px;
          width: 100%;
          border-radius: 2px;
          border: 1px solid rgba(35, 26, 20, 0.25);
          background: white;
          padding: 10px 12px;
          font-size: 0.95rem;
          color: #231a14;
        }
        .input:focus {
          outline: 2px solid #b5352f;
          outline-offset: 1px;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-accent">{error}</span>}
    </label>
  );
}
