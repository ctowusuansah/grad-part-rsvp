# Class of 2026 Grad Party — RSVP & Payment System

A mobile-first RSVP + MoMo payment-tracking site for the KNUST Class of 2026 Grad Party, with a private admin dashboard, manual payment verification, QR check-in, and payment-status tracking.

This is a real Next.js application with a real database (Supabase/Postgres).

---

## 1. Create your Supabase project (the database)

1. Go to https://supabase.com → **New project**.
2. Once it's created, open **SQL Editor → New query**, paste in the contents of `supabase/schema.sql` from this folder, and click **Run**. This creates the `rsvps` table and a private storage bucket for payment screenshots.
3. Go to **Project Settings → API**. You'll need two values:

   * **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   * **service_role key** under **Project API keys** → `SUPABASE_SERVICE_ROLE_KEY`

The service role key is powerful — never share it, and never put it in a file that starts with `NEXT_PUBLIC_`.

---

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

* `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL.
* `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key.
* `ADMIN_PASSWORD` — the password you'll use at `/admin/login`.
* `ADMIN_SESSION_SECRET` — a long random string used to sign your login session.
* `NEXT_PUBLIC_SITE_URL` — your deployed Vercel URL.

No email service is required. The RSVP system does not send email or SMS notifications.

---

## 3. Run it locally (optional)

```bash
npm install
npm run dev
```

Visit:

* `http://localhost:3000` — public RSVP page
* `http://localhost:3000/admin/login` — admin dashboard

---

## 4. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com → **Add New Project** → import that repo.
3. In **Environment Variables**, add the required variables from your `.env.local`.
4. Click **Deploy**.
5. Vercel will give you a URL such as:

`https://your-app-name.vercel.app`

6. Set `NEXT_PUBLIC_SITE_URL` to that real URL in Vercel's environment variables and redeploy if necessary.

Your two main URLs are:

* **Public RSVP page:** `https://your-app-name.vercel.app/`
* **Private admin dashboard:** `https://your-app-name.vercel.app/admin/login`

---

## 5. Get your poster/WhatsApp QR code

Once deployed, visit:

```text
https://your-app-name.vercel.app/api/qr?text=https://your-app-name.vercel.app/
```

This generates a QR code encoding your live RSVP link. It can be used on posters or shared directly.

---

## 6. Day-to-day admin tasks

### Verify a payment

Log in at `/admin` → click **View** on the RSVP → check the transaction reference, payer name, and payment screenshot against your MoMo statement → click **Confirm Payment** or **Reject Payment**.

Payment verification is performed manually by the organizing committee.

### Check attendees in at the door

Go to `/admin/checkin`.

On a phone with a supported browser and camera:

1. Tap **Scan QR Code**.
2. Allow camera access.
3. Point the camera at the attendee's confirmation QR code.
4. The system checks the RSVP and payment status.

You can also search manually by name, phone number, or RSVP ID.

Only attendees with **Payment Confirmed** can be checked in. A second check-in requires an override confirmation.

### Export the full list

`/admin` → **Export CSV** downloads the RSVP information as a spreadsheet.

### Search and filter

The search box on `/admin` can be used to find attendees by name, phone number, RSVP ID, or MoMo transaction reference.

The dropdowns can filter by payment status or RSVP status.

---

## 7. Changing event details later

The date, venue, time, MoMo number, account name, reference, and **GHS 30 contribution amount** are defined in:

```text
lib/types.ts
```

Edit the constants in that file, commit the change, and push to GitHub. Vercel will automatically create a new deployment.

The programme image is:

```text
public/programme.jpeg
```

Replace that file if the programme changes.

---

## What's already built in

* Public RSVP form with name and phone number.
* GHS 30 party contribution.
* MoMo payment instructions with the event's payment number, account name, and reference.
* Contribution explanation covering the DJ, décor, and cake, with a possible complimentary drink depending on funds raised.
* Payment reference and payer name collection.
* Optional payment screenshot upload.
* Payment Pending Verification status that only an admin can change.
* The contribution amount is fixed on the server and cannot be changed by the visitor.
* Duplicate-RSVP prevention by phone number.
* Private password-protected admin dashboard.
* Search and filtering.
* Individual RSVP detail pages.
* Payment screenshot viewing.
* Manual payment confirmation/rejection.
* CSV export.
* Summary cards showing total RSVPs, confirmed/pending/rejected payments, and expected/received/outstanding amounts.
* Unique per-attendee QR codes shown on confirmation pages.
* Poster-ready QR code for the public RSVP link.
* Check-in screen with camera QR scanning where supported.
* Manual attendee search as a fallback for QR scanning.
* Check-in blocked for unconfirmed payments.
* Protection against accidental duplicate check-ins.

---

## Notes on security

* The database has no public access. Reads and writes go through server code using the Supabase service role key, which never reaches the browser.
* The admin dashboard is protected by a signed, httpOnly session cookie.
* The admin password is stored only in the environment variables.
* Payment screenshots are stored in a private Supabase bucket and served through short-lived signed URLs rather than public links.
* Payment confirmation is controlled by the admin and cannot be set by a visitor through the RSVP form.
