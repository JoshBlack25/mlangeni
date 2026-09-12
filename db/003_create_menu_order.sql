-- 003 — Atomic order + line-item creation for the menu builder.
--
-- WHY THIS EXISTS
-- The menu builder used to write the order and its line items as two separate
-- client-side inserts. If the second one failed the customer was left with an
-- order in the system containing no food. This wraps both in one transaction.
--
-- SECURITY INVOKER on purpose: RLS still applies, so a caller can only create
-- rows they were already allowed to create. This function buys atomicity, not
-- privilege.
--
-- The %TYPE anchors mean this file does not care whether the key columns are
-- uuid or bigint — it takes whatever the table already uses. Likewise the line
-- items arrive as jsonb and are typed by jsonb_populate_recordset against the
-- real table, so no id type is ever hardcoded.
--
-- REQUIRES: 001_orders_special_requests.sql
-- Safe to re-run.

create or replace function public.create_menu_order(
  p_customer_id      public.orders.customer_id%TYPE,
  p_event_type_id    public.orders.event_type_id%TYPE,
  p_event_date       date,
  p_start_time       time,
  p_end_time         time,
  p_location         text,
  p_guests           integer,
  p_total_price      numeric,
  p_special_requests text,
  -- [{ "item_id": <id> }, ...]  — quantity is applied uniformly below
  p_items            jsonb
)
returns public.orders.order_id%TYPE
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_order_id public.orders.order_id%TYPE;
begin
  if p_guests is null or p_guests < 1 then
    raise exception 'create_menu_order: p_guests must be at least 1'
      using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'create_menu_order: p_items must be a jsonb array'
      using errcode = '22023';
  end if;

  insert into public.orders (
    customer_id,
    event_type_id,
    status,
    total_price,
    event_date,
    event_location,
    start_time,
    end_time,
    number_of_guest,
    special_requests
  ) values (
    p_customer_id,
    p_event_type_id,
    'pending',
    p_total_price,
    p_event_date,
    p_location,
    p_start_time,
    p_end_time,
    p_guests,
    nullif(btrim(coalesce(p_special_requests, '')), '')
  )
  returning order_id into v_order_id;

  if jsonb_array_length(p_items) > 0 then
    insert into public.customer_menu_items (order_id, item_id, quantity)
    select v_order_id, r.item_id, p_guests
    from jsonb_populate_recordset(null::public.customer_menu_items, p_items) r
    where r.item_id is not null;
  end if;

  return v_order_id;
end;
$$;

-- GRANT will not accept %TYPE, so it needs the concrete signature. The types
-- below are the ones Postgres actually resolved the %TYPE anchors to, read
-- back from pg_proc after the function was created:
--
--   select oid::regprocedure from pg_proc where proname = 'create_menu_order';
--
-- This file previously resolved the signature at runtime in a DO block using
-- `execute format(...)`, which kept it agnostic to the key types. That was the
-- more portable form, but dynamic SQL in a migration is harder to review and is
-- refused by some tooling, so the resolved signature is spelled out instead. If
-- orders.customer_id / orders.event_type_id ever stop being uuid, update these
-- two grants to match — the function body still adapts on its own.

revoke all on function public.create_menu_order(
  uuid, uuid, date, time, time, text, integer, numeric, text, jsonb
) from public, anon;

grant execute on function public.create_menu_order(
  uuid, uuid, date, time, time, text, integer, numeric, text, jsonb
) to authenticated;

-- ── Rollback ──────────────────────────────────────────────────────────────
-- Use the signature reported by:
--   select oid::regprocedure from pg_proc where proname = 'create_menu_order';
-- then: drop function if exists public.create_menu_order(<that signature>);
