# Class of 2026 Grad Party — RSVP & Payment System

A mobile-first RSVP + MoMo payment-tracking site for the KNUST Class of 2026
Grad Party, with a private admin dashboard, manual payment verification,
QR check-in, and email confirmations.

This is a real Next.js application with a real database (Supabase/Postgres).
It needs to be deployed to actually go live — nobody at Anthropic can host it
for you permanently, but the steps below take about 15–20 minutes and are
all free at this scale.

---

## 1. Create your Supabase project (the database)

1. Go to https://supabase.com → **New project** (free tier is plenty for this).
2. Once it's created, open **SQL Editor → New query**, paste in the contents
   of `supabase/schema.sql` from this folder, and click **Run**. This creates
   the `rsvps` table and a private storage bucket for payment screenshots.
3. Go to **Project Settings → API**. You'll need two values for step 3 below:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** (under "Project API keys", NOT the `anon` key)
     → `SUPABASE_SERVICE_ROLE_KEY`

The service role key is powerful — never share it, and never put it in any
file that starts with `NEXT_PUBLIC_`.

## 2. Create your Resend account (email)

1. Go to https://resend.com → sign up (free tier: 100 emails/day, 3,000/month).
2. Grab an **API key** from the dashboard → `RESEND_API_KEY`.
3. By default you can only send *from* `onboarding@resend.dev` and *to* your
   own verified email until you verify a domain. That's fine for testing.
   For sending to all your classmates, either:
   - Verify a domain you own (Resend → Domains → Add Domain), then set
     `EMAIL_FROM` to something like `RSVP <rsvp@yourdomain.com>`, or
   - Leave it on `onboarding@resend.dev` for now — emails will still send,
     just from that address.
4. If you'd rather skip email entirely for now, leave `RESEND_API_KEY` blank —
   the app will skip sending and log a warning instead of failing the RSVP.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from steps 1–2,
plus:

- `ADMIN_PASSWORD` — the password you'll type in at `/admin/login`. Pick
  something only you know.
- `ADMIN_SESSION_SECRET` — a random string used to sign your login session.
  Generate one with `openssl rand -base64 32` (or any password generator —
  it just needs to be long and random).
- `NEXT_PUBLIC_SITE_URL` — leave the placeholder for now; you'll come back
  and set this after your first deploy (step 5).

## 4. Run it locally (optional, to test before deploying)

```bash
npm install
npm run dev
```

Visit http://localhost:3000 for the public RSVP page, and
http://localhost:3000/admin/login for the admin dashboard.

## 5. Deploy to Vercel

1. Push this folder to a GitHub repo (private is fine).
2. Go to https://vercel.com → **Add New Project** → import that repo.
3. In the "Environment Variables" step, add every variable from your
   `.env.local` (same names, same values).
4. Click **Deploy**. Vercel gives you a URL like
   `https://your-app-name.vercel.app` — that's your public RSVP URL.
5. Go back into Vercel → Project → Settings → Environment Variables, and set
   `NEXT_PUBLIC_SITE_URL` to that real URL (needed so the WhatsApp share
   button and QR codes point to the right place). Redeploy after changing it
   (Vercel → Deployments → ⋯ → Redeploy).

Your two URLs:

- **Public RSVP page:** `https://your-app-name.vercel.app/`
- **Private admin dashboard:** `https://your-app-name.vercel.app/admin/login`

The admin dashboard is not linked from anywhere on the public site and isn't
guessable — only you (and anyone you give the password to) can reach it.

## 6. Get your poster/WhatsApp QR code

Once deployed, visit:

```
https://your-app-name.vercel.app/api/qr?text=https://your-app-name.vercel.app/
```

That's a downloadable PNG QR code encoding your live RSVP link — put it on
posters or share it directly.

## 7. Day-to-day admin tasks

- **Verify a payment:** Log in at `/admin` → click **View** on the RSVP →
  check the transaction ref / payer name / screenshot against your MoMo
  statement → click **Confirm Payment** (or **Reject Payment**). Confirming
  automatically emails the attendee that they're officially confirmed.
- **Check attendees in at the door:** go to `/admin/checkin`. On a phone with
  a camera, tap **Scan QR Code** and point it at each attendee's confirmation
  QR code. On any device, you can instead just search by name/phone/RSVP ID
  and tap **Check In**. Only attendees with **Payment Confirmed** can be
  checked in; a second check-in of the same person asks for confirmation
  first.
- **Export the full list:** `/admin` → **Export CSV** downloads everything
  (names, phones, emails, payment status, check-in status) as a spreadsheet.
- **Search/filter:** the search box on `/admin` matches name, phone, email,
  RSVP ID, or MoMo transaction reference; the dropdowns filter by payment or
  RSVP status.

## 8. Changing event details later

Date, venue, time, MoMo number/account/reference, and the GHS 40 amount are
all defined in one place: `lib/types.ts`. Edit the constants at the top of
that file, commit, and push — Vercel redeploys automatically. (The
programme image itself is `public/programme.jpeg` — replace that file if the
programme ever changes.)

## What's already built in

- Public RSVP form (name, phone, email only — no extra fields)
- MoMo payment instructions with your real number/account/reference, and a
  "Party contribution: GHS 40" framing (never "entry fee")
- Payment reference + payer name + optional screenshot upload, with a
  "Payment Pending Verification" status that only an admin can change —
  nothing the visitor submits can mark itself confirmed, and the amount due
  is fixed on the server, never trusted from the browser
- Duplicate-RSVP prevention (one phone number, one email, each used once)
- Automatic "pending verification" email on submission, and an automatic
  "payment confirmed" email the moment you confirm it in the dashboard
- A private admin dashboard (password-protected) with search, filters,
  per-record detail view, screenshot viewing, manual confirm/reject, CSV
  export, and summary cards (total RSVPs, confirmed/pending/rejected,
  amounts expected/received/outstanding)
- Unique per-attendee QR codes (shown on their confirmation page) plus a
  poster-ready QR code for the public RSVP link
- A check-in screen with camera QR scanning (where supported) and manual
  search, blocking check-in for unconfirmed payments and double check-ins
  unless you override

## Notes on security

- The database has no public access at all — every read/write goes through
  server code using Supabase's service role key, which never reaches the
  browser.
- The admin dashboard is protected by a signed, httpOnly session cookie; the
  password lives only in your environment variables.
- Payment screenshots are stored in a private Supabase bucket and served to
  you via short-lived signed URLs, never a public link.
