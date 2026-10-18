-- 008 — PayFast: make `payments` provider-neutral and keep the raw ITN.
--
-- WHY THIS EXISTS
-- `payments` was drawn up for Stripe (`stripe_payment_id`), which was never
-- wired up. Payments now arrive from PayFast's ITN (Instant Transaction
-- Notification) webhook, so the column is renamed to something that does not
-- lie, and a `provider` column records which gateway a row came from.
--
-- `provider_payment_id` stays UNIQUE NOT NULL. For PayFast it holds
-- `pf_payment_id`, which is what makes the webhook idempotent: PayFast retries
-- ITNs, and the handler upserts on this column so a retry cannot double-count.
--
-- `provider_payload` keeps the verified ITN body for audit/refund disputes.
--
-- RLS: nothing to add. The webhook writes with the service-role key, which
-- bypasses RLS; the existing policies still let a customer read their own
-- payments and an admin read/manage all of them.
--
-- The table has 0 rows, so the rename is safe.
-- Safe to re-run.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'payments'
      and column_name  = 'stripe_payment_id'
  ) then
    alter table public.payments
      rename column stripe_payment_id to provider_payment_id;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'payments_stripe_payment_id_key'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      rename constraint payments_stripe_payment_id_key
      to payments_provider_payment_id_key;
  end if;
end
$$;

alter table public.payments
  add column if not exists provider text not null default 'payfast';

alter table public.payments
  add column if not exists provider_payload jsonb;
