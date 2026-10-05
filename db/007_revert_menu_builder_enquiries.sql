-- 007 — Revert the menu-builder enquiry routing from 006, but KEEP its security fix.
--
-- WHY THIS EXISTS
-- 006 routed the Interactive Menu Builder through the enquiry approval process.
-- That decision was reversed: the menu builder writes to `orders` directly, as
-- it did before. So the scaffolding 006 added for it — the extra `enquiries`
-- columns, the `enquiry_menu_items` table, and the two RPCs — is now dead
-- weight and is dropped here.
--
-- WHAT IS DELIBERATELY *NOT* REVERTED
-- 006 also closed a pre-existing, high-severity hole that had nothing to do
-- with the menu builder. schema.sql section 8(a) records it: the policy
-- "Allow public read on enquiries" was granted to PUBLIC with USING (true),
-- and because permissive policies are OR'd it defeated both narrow policies on
-- the table — every lead's name, email, phone and message was readable by
-- anyone holding the publishable key that ships in the browser bundle.
--
-- That fix is kept. Specifically this file does NOT restore:
--
--   * the policy "Allow public read on enquiries"   (the leak)
--   * the policy "Allow public insert"              (only ever duplicated
--                                                    "anyone can submit an
--                                                    enquiry", which is intact)
--
-- and it does NOT drop:
--
--   * get_booked_sessions(date)  — the narrow replacement those policies were
--     keeping alive. It returns the booked session labels for one date and
--     nothing else, and it is what the three availability components call.
--
-- Reverting the security fix as well would mean re-publishing customer PII. If
-- that is genuinely wanted, the restore statements are in the rollback block at
-- the foot of this file — but read section 8(a) of schema.sql first.
--
-- REQUIRES: 006 to have been applied. Safe to re-run.


-- =============================================================================
-- 0. BEFORE YOU RUN THE REST — test data from the reverted flow
-- =============================================================================
-- If the menu builder was used while 006 was live, those submissions are sitting
-- in `enquiries` with source = 'menu_builder'. Dropping the columns below strips
-- their menu, venue and price and leaves a half-empty enquiry behind, and after
-- that they can no longer be told apart from contact-form rows.
--
-- INSPECT THEM FIRST — this is a SELECT, it changes nothing:
--
--   select id, name, email, event_date, session, guests, total_price, status,
--          order_id, created_at
--   from public.enquiries
--   where source = 'menu_builder'
--   order by created_at;
--
-- Then, ONLY IF they are test rows you want gone, uncomment and run this ONE
-- statement before continuing. enquiry_menu_items cascades with them.
-- It is left commented because it is irreversible and only you know whether any
-- of those rows represent a real customer you still owe a reply.
--
--   delete from public.enquiries where source = 'menu_builder';
--
-- Any you keep simply become ordinary enquiries.


-- =============================================================================
-- 1. DROP THE RPCs 006 ADDED FOR THE MENU BUILDER
-- =============================================================================
-- get_booked_sessions is NOT in this list, on purpose — see the header.

drop function if exists public.set_enquiry_status(uuid, public.enquiry_status);

drop function if exists public.create_menu_enquiry(
  uuid, uuid, text, text, text, date, time, time, text, integer, numeric, text, jsonb
);

-- derive_session only ever existed to stamp a session label onto a
-- menu-builder enquiry from its exact time window. Nothing else calls it.
drop function if exists public.derive_session(time, time);


-- =============================================================================
-- 2. DROP `enquiry_menu_items`
-- =============================================================================
-- Its policies, indexes and updated_at trigger go with it.

drop table if exists public.enquiry_menu_items;


-- =============================================================================
-- 3. DROP THE COLUMNS AND CONSTRAINTS 006 ADDED TO `enquiries`
-- =============================================================================
-- Constraints first: enquiries_menu_builder_complete references several of the
-- columns, and enquiries_source_check references `source`.

alter table public.enquiries drop constraint if exists enquiries_menu_builder_complete;
alter table public.enquiries drop constraint if exists enquiries_source_check;
alter table public.enquiries drop constraint if exists enquiries_time_check;
alter table public.enquiries drop constraint if exists enquiries_customer_id_fkey;
alter table public.enquiries drop constraint if exists enquiries_event_type_id_fkey;
alter table public.enquiries drop constraint if exists enquiries_order_id_fkey;

drop index if exists public.idx_enquiries_customer_id;
drop index if exists public.idx_enquiries_event_type_id;
drop index if exists public.idx_enquiries_order_id;

-- idx_enquiries_event_date is kept: every availability lookup filters on
-- event_date, so it earns its place whichever way the menu builder writes.

alter table public.enquiries
  drop column if exists customer_id,
  drop column if exists event_type_id,
  drop column if exists event_location,
  drop column if exists start_time,
  drop column if exists end_time,
  drop column if exists total_price,
  drop column if exists order_id,
  drop column if exists source;

-- `phone` is left NULLABLE, which is the one piece of 006 that stays.
-- Restoring NOT NULL would fail outright if any row picked up a null while 006
-- was live, and a migration that dies halfway is worse than a column that is
-- merely more permissive than it needs to be. Both forms that write this table
-- require a phone number client-side, so nothing produces nulls any more, and
-- the admin enquiry list guards against one rather than assuming a string.
--
-- To tighten it later, once you have confirmed there are none:
--   select count(*) from public.enquiries where phone is null;   -- expect 0
--   alter table public.enquiries alter column phone set not null;


-- =============================================================================
-- 4. VERIFY
-- =============================================================================
-- The menu-builder scaffolding is gone (expect 0 rows):
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'enquiries'
--     and column_name in ('customer_id','event_type_id','event_location',
--                         'start_time','end_time','total_price','order_id','source');
--
--   select to_regclass('public.enquiry_menu_items');            -- expect null
--   select proname from pg_proc where proname in
--     ('create_menu_enquiry','set_enquiry_status','derive_session');  -- expect 0 rows
--
-- The security fix is still in place (expect 1 row, get_booked_sessions):
--   select proname from pg_proc where proname = 'get_booked_sessions';
--
-- The leak is still closed (expect 0):
--   select count(*) from pg_policies
--   where tablename = 'enquiries' and policyname = 'Allow public read on enquiries';
--
-- Availability still answers for anonymous visitors (expect labels, or no rows):
--   set role anon; select * from public.get_booked_sessions(current_date); reset role;
--
-- And anon still cannot read the table itself (expect 0):
--   set role anon; select count(*) from public.enquiries; reset role;


-- =============================================================================
-- 5. ROLLBACK
-- =============================================================================
-- To put the menu-builder scaffolding back, re-run 006 — it is written to be
-- safe to re-run and recreates every object dropped above.
--
-- To ALSO reopen the PUBLIC read policy, which re-publishes every enquiry's
-- name, email, phone and message to anyone with the publishable key — read
-- schema.sql section 8(a) first, then:
--
--   create policy "Allow public read on enquiries" on public.enquiries
--     for select using (true);
--   create policy "Allow public insert" on public.enquiries
--     for insert with check (true);
