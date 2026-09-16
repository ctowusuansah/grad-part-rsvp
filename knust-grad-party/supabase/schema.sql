-- Run this once in your Supabase project's SQL Editor (Supabase dashboard > SQL Editor > New query).

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  serial bigint generated always as identity, -- used to build the human-readable RSVP ID
  created_at timestamptz not null default now(),

  full_name text not null,
  phone_number text not null,
  email text not null,

  amount_due numeric not null default 40,
  amount_submitted numeric,
  momo_transaction_ref text,
  momo_payer_name text,
  payment_screenshot_path text, -- storage path in the 'payment-proofs' bucket

  payment_status text not null default 'pending' check (payment_status in ('pending', 'confirmed', 'rejected')),
  rsvp_status text not null default 'active' check (rsvp_status in ('active', 'cancelled')),

  pending_email_sent boolean not null default false,
  confirmed_email_sent boolean not null default false,

  checked_in boolean not null default false,
  checked_in_at timestamptz
);

-- Prevent the same phone number or email from RSVPing twice.
create unique index if not exists rsvps_phone_unique on rsvps (phone_number);
create unique index if not exists rsvps_email_unique on rsvps (lower(email));

-- Fast admin search/filter.
create index if not exists rsvps_payment_status_idx on rsvps (payment_status);
create index if not exists rsvps_rsvp_status_idx on rsvps (rsvp_status);
create index if not exists rsvps_full_name_idx on rsvps using gin (full_name gin_trgm_ops);

create extension if not exists pg_trgm;

-- Storage bucket for uploaded payment screenshots (private — not publicly readable).
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Row Level Security: lock the table down completely. The app talks to
-- Supabase using the SERVICE ROLE key from the server only, which bypasses
-- RLS — so nothing here is reachable directly from a visitor's browser.
alter table rsvps enable row level security;
-- (No policies are created, so anon/public access is fully denied by default.)
