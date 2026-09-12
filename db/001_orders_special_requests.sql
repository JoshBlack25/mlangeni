-- 001 — Persist the menu builder's "Special culinary or dietary notes" field.
--
-- The Interactive Menu Builder has always collected this text but had nowhere
-- to put it, so it was silently discarded on submit. This adds the column.
--
-- Safe to re-run.

alter table public.orders
  add column if not exists special_requests text;

comment on column public.orders.special_requests is
  'Free-text dietary / logistics notes captured in the customer booking flows.';

-- ── Rollback ──────────────────────────────────────────────────────────────
-- alter table public.orders drop column if exists special_requests;
