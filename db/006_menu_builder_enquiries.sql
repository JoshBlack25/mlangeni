-- ============================================================================
-- SUPERSEDED BY db/007_revert_menu_builder_enquiries.sql — DO NOT RUN THIS.
--
-- The decision this migration implements was reversed: the Interactive Menu
-- Builder writes to `orders` directly, not through the enquiry approval
-- process. 007 drops everything below EXCEPT get_booked_sessions() and the two
-- policy drops at the end, which fixed a pre-existing PII leak and are kept.
--
-- This file is retained only so 007 can be read against it, and so the numbered
-- sequence has no hole. If you are setting up a fresh database, skip it.
-- ============================================================================

-- 006 — Route the Interactive Menu Builder through the enquiry approval process.
--
-- WHY THIS EXISTS
-- The menu builder used to write straight into `orders` with status 'pending'
-- (db/003's create_menu_order). That skipped the approval process entirely: an
-- `orders` row immediately occupies the slot via the orders_no_overlap
-- exclusion constraint, shows up on the customer's Orders page as a real
-- booking, and is eligible for a consultation — all before a human has looked
-- at it. Meanwhile the admin Enquiries screen, which IS the approval process,
-- never saw it.
--
-- After this migration:
--
--     menu builder
--        └─> enquiries (pending) + enquiry_menu_items
--               │
--          admin confirms  ->  set_enquiry_status(id, 'confirmed')
--               │
--               └─> orders (confirmed) + customer_menu_items
--                      └─> consultations -> invoices
--                      └─> orders_no_overlap now applies
--
-- `orders` therefore means "approved booking" and nothing else. The slot is
-- only locked at approval time, which is also when the exclusion constraint
-- gets its say — so two customers CAN both request the same window, and the
-- second approval is the one that fails. That is deliberate: it is the admin,
-- not a race between two customers, who decides which request wins.
--
-- WHAT IT CHANGES
--   1. Widens `enquiries` so it can carry a full menu-builder request.
--   2. Adds `enquiry_menu_items` — the pre-approval equivalent of
--      `customer_menu_items`, which cannot be reused because its order_id is
--      NOT NULL and FKs to a row that does not exist yet.
--   3. `create_menu_enquiry(...)` — enquiry + line items in one transaction,
--      the same contract db/003 gave orders.
--   4. `set_enquiry_status(...)` — the approval process itself. Confirming a
--      menu enquiry materialises the order; cancelling one cancels it back.
--   5. `get_booked_sessions(date)` — closes the hole this migration would
--      otherwise widen. See "SECURITY" below.
--
-- SECURITY
-- schema.sql section 8(a) records that `enquiries` is world-readable: the
-- policy "Allow public read on enquiries" is granted to PUBLIC with
-- USING (true), and because permissive policies are OR'd it defeats both
-- narrow policies on the table. Today that leaks name, email, phone and
-- message. This migration adds venue address, price and customer_id to the
-- same table, so leaving that policy in place is not an option — it would be
-- this migration publishing them.
--
-- The blanket policy only survived because three components read `session` off
-- it to work out availability. `get_booked_sessions(date)` gives them exactly
-- that and nothing else, following the pattern db/002 set for `orders`, so the
-- policy (and the redundant "Allow public insert") can go.
--
-- REQUIRES: 001, 002. Supersedes 003 for the menu builder — create_menu_order
-- is left installed so an older client build keeps working, but nothing in the
-- app calls it any more.
--
-- Safe to re-run.


-- =============================================================================
-- 1. WIDEN `enquiries`
-- =============================================================================
-- All new columns are nullable: a contact-form enquiry has none of them, and
-- both kinds live in this one table so the admin screen stays a single list.

alter table public.enquiries
  add column if not exists customer_id     uuid,
  add column if not exists event_type_id   uuid,
  add column if not exists event_location  text,
  add column if not exists start_time      time without time zone,
  add column if not exists end_time        time without time zone,
  add column if not exists total_price     numeric(10,2),
  add column if not exists order_id        uuid,
  add column if not exists source          text not null default 'contact_form';

comment on column public.enquiries.customer_id is
  'Set for menu-builder enquiries. Null for anonymous contact-form submissions.';
comment on column public.enquiries.order_id is
  'The order created when this enquiry was approved. Null until then.';
comment on column public.enquiries.source is
  'contact_form | menu_builder — which entry point created the row.';

-- The menu builder treats a phone number as optional (validation.js only
-- checks it when one is given), but this column was NOT NULL because the
-- contact form always collects one. Relaxed rather than writing '' into it;
-- the contact form still requires it client-side.
alter table public.enquiries alter column phone drop not null;

alter table public.enquiries drop constraint if exists enquiries_source_check;
alter table public.enquiries add constraint enquiries_source_check
  CHECK (source in ('contact_form', 'menu_builder'));

-- A menu-builder enquiry must carry everything approve-time needs to build an
-- order, because `orders` declares all of these NOT NULL. Failing here beats
-- failing halfway through an approval.
alter table public.enquiries drop constraint if exists enquiries_menu_builder_complete;
alter table public.enquiries add constraint enquiries_menu_builder_complete
  CHECK (
    source <> 'menu_builder'
    or (
      customer_id    is not null
      and event_type_id  is not null
      and event_location is not null
      and start_time     is not null
      and end_time       is not null
      and total_price    is not null
    )
  );

alter table public.enquiries drop constraint if exists enquiries_time_check;
alter table public.enquiries add constraint enquiries_time_check
  CHECK (start_time is null or end_time is null or end_time > start_time);

-- ON DELETE SET NULL throughout, matching the existing user_id FK: deleting a
-- customer or an event type must not destroy the business's record of a lead.
alter table public.enquiries drop constraint if exists enquiries_customer_id_fkey;
alter table public.enquiries add constraint enquiries_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id)
  ON UPDATE CASCADE ON DELETE SET NULL;

alter table public.enquiries drop constraint if exists enquiries_event_type_id_fkey;
alter table public.enquiries add constraint enquiries_event_type_id_fkey
  FOREIGN KEY (event_type_id) REFERENCES public.event_type(event_id)
  ON UPDATE CASCADE ON DELETE SET NULL;

alter table public.enquiries drop constraint if exists enquiries_order_id_fkey;
alter table public.enquiries add constraint enquiries_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(order_id)
  ON UPDATE CASCADE ON DELETE SET NULL;

create index if not exists idx_enquiries_customer_id   on public.enquiries using btree (customer_id);
create index if not exists idx_enquiries_event_type_id on public.enquiries using btree (event_type_id);
create index if not exists idx_enquiries_order_id      on public.enquiries using btree (order_id);
create index if not exists idx_enquiries_event_date    on public.enquiries using btree (event_date);


-- =============================================================================
-- 2. `enquiry_menu_items`
-- =============================================================================
-- Mirrors customer_menu_items. Rows are copied across (not moved) on approval,
-- so a confirmed enquiry keeps showing the admin what was actually requested
-- even if the order's items are edited afterwards.

create table if not exists public.enquiry_menu_items (
  enquiry_item_id       uuid not null default gen_random_uuid(),
  enquiry_id            uuid not null,
  item_id               uuid not null,
  quantity              bigint not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint enquiry_menu_items_pkey PRIMARY KEY (enquiry_item_id),
  constraint enquiry_menu_items_quantity_check CHECK (quantity > 0)
);

alter table public.enquiry_menu_items drop constraint if exists enquiry_menu_items_enquiry_id_fkey;
alter table public.enquiry_menu_items add constraint enquiry_menu_items_enquiry_id_fkey
  FOREIGN KEY (enquiry_id) REFERENCES public.enquiries(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

alter table public.enquiry_menu_items drop constraint if exists enquiry_menu_items_item_id_fkey;
alter table public.enquiry_menu_items add constraint enquiry_menu_items_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES public.menu_item(item_id)
  ON UPDATE CASCADE ON DELETE CASCADE;

create index if not exists idx_enquiry_menu_items_enquiry_id on public.enquiry_menu_items using btree (enquiry_id);
create index if not exists idx_enquiry_menu_items_item_id    on public.enquiry_menu_items using btree (item_id);

drop trigger if exists set_enquiry_menu_items_updated_at on public.enquiry_menu_items;
create trigger set_enquiry_menu_items_updated_at
  before update on public.enquiry_menu_items
  for each row execute function public.set_updated_at();

-- The rls_auto_enable() event trigger already does this for newly created
-- tables, but it does not fire when the table is created by some other route
-- (a restore, say), and it never creates policies. Both stated explicitly.
alter table public.enquiry_menu_items enable row level security;

drop policy if exists "customer can view own enquiry menu items" on public.enquiry_menu_items;
create policy "customer can view own enquiry menu items"
  on public.enquiry_menu_items for select
  to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.enquiries e
      where e.id = enquiry_menu_items.enquiry_id
        and e.user_id = (select auth.uid())
    )
  );

drop policy if exists "customer can add own enquiry menu items" on public.enquiry_menu_items;
create policy "customer can add own enquiry menu items"
  on public.enquiry_menu_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.enquiries e
      where e.id = enquiry_menu_items.enquiry_id
        and e.user_id = (select auth.uid())
    )
  );

drop policy if exists "customer or admin can remove enquiry menu items" on public.enquiry_menu_items;
create policy "customer or admin can remove enquiry menu items"
  on public.enquiry_menu_items for delete
  to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.enquiries e
      where e.id = enquiry_menu_items.enquiry_id
        and e.user_id = (select auth.uid())
    )
  );


-- =============================================================================
-- 3. `derive_session` — time window -> the session label availability uses
-- =============================================================================
-- The enquiry side of the app blocks availability by date + coarse session
-- (see app/components/constants/sessions.js), while the menu builder captures
-- an exact window. Rather than teach the public contact form about time
-- ranges, a menu-builder enquiry stores both: the exact window for the order,
-- and a derived label so it participates in the session-based blocking that
-- already exists.

create or replace function public.derive_session(
  p_start time without time zone,
  p_end   time without time zone
)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_start is null then 'full_day'
    -- Eight hours or more spans more than one session in practice, so it
    -- blocks the whole day rather than pretending to be just a "morning".
    when p_end is not null and (p_end - p_start) >= interval '8 hours' then 'full_day'
    when p_start <  time '12:00' then 'morning'
    when p_start <  time '17:00' then 'afternoon'
    else 'evening'
  end;
$$;

revoke all on function public.derive_session(time, time) from public, anon;
grant execute on function public.derive_session(time, time) to authenticated;


-- =============================================================================
-- 4. `create_menu_enquiry` — the menu builder's write
-- =============================================================================
-- SECURITY INVOKER, exactly as db/003: RLS still applies, so this buys
-- atomicity (an enquiry never exists without its food), not privilege.
--
-- The %TYPE anchors mean this file does not care whether the key columns are
-- uuid or bigint. Line items arrive as jsonb and are typed by
-- jsonb_populate_recordset against the real table.

create or replace function public.create_menu_enquiry(
  p_customer_id      public.enquiries.customer_id%TYPE,
  p_event_type_id    public.enquiries.event_type_id%TYPE,
  p_name             text,
  p_email            text,
  p_phone            text,
  p_event_date       date,
  p_start_time       time,
  p_end_time         time,
  p_location         text,
  p_guests           integer,
  p_total_price      numeric,
  p_message          text,
  -- [{ "item_id": <id> }, ...]  — quantity is applied uniformly below
  p_items            jsonb
)
returns public.enquiries.id%TYPE
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_enquiry_id public.enquiries.id%TYPE;
begin
  if p_guests is null or p_guests < 1 then
    raise exception 'create_menu_enquiry: p_guests must be at least 1'
      using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'create_menu_enquiry: p_items must be a jsonb array'
      using errcode = '22023';
  end if;

  insert into public.enquiries (
    source,
    user_id,
    customer_id,
    event_type_id,
    name,
    email,
    phone,
    event_date,
    start_time,
    end_time,
    session,
    event_location,
    guests,
    total_price,
    message,
    status
  ) values (
    'menu_builder',
    auth.uid(),
    p_customer_id,
    p_event_type_id,
    p_name,
    p_email,
    nullif(btrim(coalesce(p_phone, '')), ''),
    p_event_date,
    p_start_time,
    p_end_time,
    public.derive_session(p_start_time, p_end_time),
    p_location,
    p_guests,
    p_total_price,
    nullif(btrim(coalesce(p_message, '')), ''),
    'pending'
  )
  returning id into v_enquiry_id;

  if jsonb_array_length(p_items) > 0 then
    insert into public.enquiry_menu_items (enquiry_id, item_id, quantity)
    select v_enquiry_id, r.item_id, p_guests
    from jsonb_populate_recordset(null::public.enquiry_menu_items, p_items) r
    where r.item_id is not null;
  end if;

  return v_enquiry_id;
end;
$$;

-- GRANT will not accept %TYPE, so the concrete signature is spelled out. These
-- are the types Postgres resolved the anchors to; if enquiries.customer_id or
-- .event_type_id ever stop being uuid, update these two lines — the body
-- still adapts on its own. Read the real signature back with:
--   select oid::regprocedure from pg_proc where proname = 'create_menu_enquiry';

revoke all on function public.create_menu_enquiry(
  uuid, uuid, text, text, text, date, time, time, text, integer, numeric, text, jsonb
) from public, anon;

grant execute on function public.create_menu_enquiry(
  uuid, uuid, text, text, text, date, time, time, text, integer, numeric, text, jsonb
) to authenticated;


-- =============================================================================
-- 5. `set_enquiry_status` — the approval process
-- =============================================================================
-- SECURITY DEFINER is required, not convenient: approving means inserting an
-- `orders` row on behalf of a customer, and the "customer can create own
-- orders" policy is `customer_id = current_customer_id()`, which an admin can
-- never satisfy. The guard is therefore in the body — is_admin() first, before
-- anything else — and the grants below take EXECUTE away from PUBLIC, which
-- Postgres would otherwise hand out by default. Same shape as db/004.
--
-- Idempotent: confirming an already-confirmed enquiry returns the existing
-- order rather than creating a second one.

create or replace function public.set_enquiry_status(
  p_enquiry_id public.enquiries.id%TYPE,
  p_status     public.enquiry_status
)
returns public.orders.order_id%TYPE
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_enquiry  public.enquiries%ROWTYPE;
  v_order_id public.orders.order_id%TYPE;
begin
  if not public.is_admin() then
    raise exception 'set_enquiry_status: admin privileges required'
      using errcode = '42501';
  end if;

  -- FOR UPDATE so two admins clicking Confirm at the same moment cannot both
  -- get past the "already has an order" check below.
  select * into v_enquiry
  from public.enquiries
  where id = p_enquiry_id
  for update;

  if not found then
    raise exception 'set_enquiry_status: enquiry % not found', p_enquiry_id
      using errcode = 'P0002';
  end if;

  v_order_id := v_enquiry.order_id;

  if p_status = 'confirmed' then
    -- A contact-form enquiry has no menu, no venue and no price. There is
    -- nothing to build an order out of, so confirming it just means "we have
    -- accepted this booking" and the admin raises the order by hand.
    if v_enquiry.source = 'menu_builder' and v_order_id is null then
      -- enquiries_menu_builder_complete guarantees these at INSERT time, but
      -- customer_id and event_type_id are ON DELETE SET NULL — a customer who
      -- closed their account, or a deleted event type, nulls them afterwards.
      -- `orders` declares both NOT NULL, so without this the admin would get a
      -- bare 23502 with nothing to act on.
      if v_enquiry.customer_id is null then
        raise exception
          'This request cannot be approved: the customer account it belongs to no longer exists.'
          using errcode = '23502';
      end if;

      if v_enquiry.event_type_id is null then
        raise exception
          'This request cannot be approved: the event type it was booked under has been deleted. Recreate it, or raise the order by hand.'
          using errcode = '23502';
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
        v_enquiry.customer_id,
        v_enquiry.event_type_id,
        'confirmed',
        v_enquiry.total_price,
        v_enquiry.event_date,
        v_enquiry.event_location,
        v_enquiry.start_time,
        v_enquiry.end_time,
        v_enquiry.guests,
        v_enquiry.message
      )
      returning order_id into v_order_id;

      insert into public.customer_menu_items (order_id, item_id, quantity)
      select v_order_id, emi.item_id, emi.quantity
      from public.enquiry_menu_items emi
      where emi.enquiry_id = p_enquiry_id;

    elsif v_order_id is not null then
      -- Re-confirming after a cancellation. This can raise 23P01 if the slot
      -- was given away in the meantime, which is the correct answer.
      update public.orders set status = 'confirmed' where order_id = v_order_id;
    end if;

  elsif p_status = 'cancelled' then
    if v_order_id is not null then
      update public.orders set status = 'cancelled' where order_id = v_order_id;
    end if;

  elsif p_status = 'pending' then
    -- Back to pending keeps the order but parks it. It still holds the slot,
    -- because orders_no_overlap excludes everything that is not 'cancelled' —
    -- which is what you want while an admin is reconsidering.
    if v_order_id is not null then
      update public.orders set status = 'pending' where order_id = v_order_id;
    end if;
  end if;

  update public.enquiries
  set status   = p_status,
      order_id = v_order_id
  where id = p_enquiry_id;

  return v_order_id;
end;
$$;

revoke all on function public.set_enquiry_status(uuid, public.enquiry_status)
  from public, anon;
grant execute on function public.set_enquiry_status(uuid, public.enquiry_status)
  to authenticated;


-- =============================================================================
-- 6. `get_booked_sessions` — availability without the blanket read policy
-- =============================================================================
-- Returns which sessions are taken on a date, and nothing else. No name, no
-- email, no phone, no price, no venue, no id. This is the fix schema.sql
-- section 8(a) prescribed, and it is what lets the PUBLIC read policy go.
--
-- Granted to anon because the public contact form on the marketing site needs
-- it before anyone signs in.

create or replace function public.get_booked_sessions(p_date date)
returns table (session text)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_date is null then
    raise exception 'get_booked_sessions: p_date is required'
      using errcode = '22004';
  end if;

  return query
    select distinct e.session
    from public.enquiries e
    where e.event_date = p_date
      and e.status = 'confirmed'::public.enquiry_status
      and e.session is not null;
end;
$$;

revoke all on function public.get_booked_sessions(date) from public;
grant execute on function public.get_booked_sessions(date) to anon, authenticated;

-- Now the leak can be closed. Both of these are PUBLIC-role policies, which is
-- broader than anon+authenticated — see the note at the end of schema.sql §7.
--
-- "anyone can submit an enquiry" (anon+, INSERT, true) stays, so the public
-- contact form keeps working; "Allow public insert" only ever duplicated it.
drop policy if exists "Allow public read on enquiries" on public.enquiries;
drop policy if exists "Allow public insert" on public.enquiries;


-- =============================================================================
-- 7. VERIFY
-- =============================================================================
-- Sessions taken on a date, as anon (should work, and return only labels):
--   select * from public.get_booked_sessions(current_date);
--
-- The leak is closed (should return 0 rows as the anon role):
--   set role anon; select count(*) from public.enquiries; reset role;
--
-- Session derivation:
--   select public.derive_session('09:00', '13:00');  -- morning
--   select public.derive_session('13:00', '16:00');  -- afternoon
--   select public.derive_session('18:00', '23:00');  -- evening
--   select public.derive_session('09:00', '17:00');  -- full_day
--
-- Resolved signatures, if a grant ever needs updating:
--   select oid::regprocedure from pg_proc
--   where proname in ('create_menu_enquiry', 'set_enquiry_status',
--                     'get_booked_sessions', 'derive_session');


-- =============================================================================
-- 8. ROLLBACK
-- =============================================================================
-- Restoring the dropped policies re-opens the leak in schema.sql §8(a); it is
-- listed only because a rollback has to be complete to be useful.
--
--   drop function if exists public.get_booked_sessions(date);
--   drop function if exists public.set_enquiry_status(uuid, public.enquiry_status);
--   drop function if exists public.create_menu_enquiry(
--     uuid, uuid, text, text, text, date, time, time, text, integer, numeric, text, jsonb);
--   drop function if exists public.derive_session(time, time);
--   drop table if exists public.enquiry_menu_items;
--   alter table public.enquiries
--     drop column if exists customer_id,
--     drop column if exists event_type_id,
--     drop column if exists event_location,
--     drop column if exists start_time,
--     drop column if exists end_time,
--     drop column if exists total_price,
--     drop column if exists order_id,
--     drop column if exists source;
--   create policy "Allow public read on enquiries" on public.enquiries
--     for select using (true);
--   create policy "Allow public insert" on public.enquiries
--     for insert with check (true);
