-- 005 — Make the testimonials table usable by the app: prove the reviewer is a
--       real customer, let the admin curate what the public sees, and publish a
--       narrow anonymous read that does not hand out the customer table.
--
-- WHY THIS EXISTS
-- The table, the testimonial_status enum and five policies have been in place
-- since the beginning, but nothing ever wrote to it and three things stood in
-- the way of wiring it up.
--
-- 1. ANYONE COULD REVIEW. The INSERT policy only checked that the row belonged
--    to the caller, so an account that had never booked anything could post a
--    five-star review. A review should be attached to an event the business
--    actually delivered, so the table now carries the order_id and the policies
--    refuse rows that do not name a qualifying order belonging to the reviewer.
--
--    NOTE ON WHICH ORDERS QUALIFY. The obvious rule — orders.status =
--    'completed' — is useless here. create_menu_order (003) hard codes every
--    new order to 'pending' and NOTHING in the application ever updates
--    orders.status; there is no completion step in the booking pipeline at all.
--    Gating on it would lock out every customer permanently. So the rule is
--    "a non-cancelled order whose event_date is in the past": objective,
--    self-maintaining, and already true of rows in the table today. If an
--    order-completion workflow is ever built, tighten customer_may_review().
--
-- 2. MODERATION IS NOT CURATION. `status` answers "may this be seen at all".
--    It does not answer "does this go on the homepage, and in what order".
--    Those are different decisions made at different times, so they get
--    different columns: `featured` and `display_order`.
--
-- 3. THE PUBLIC PAGE NEEDS A NAME AND CANNOT HAVE ONE. public.customer has no
--    anon SELECT policy — deliberately, it is a table of names, emails, phone
--    numbers and addresses — so the obvious PostgREST embed
--        .select("rating, message, customer(first_name, last_name)")
--    returns customer: null for every anonymous visitor, i.e. a wall of
--    reviews with nobody's name on them. The fix is emphatically NOT to open
--    up `customer`. It is the pattern 002 established for `orders` and that
--    schema.sql section 8(a) prescribes for `enquiries`: one narrow SECURITY
--    DEFINER function that reads across the fence and returns a projection
--    chosen to be safe to publish. The signed-in dashboard carousel has the
--    same problem for the same reason (the customer policy is own-row-only)
--    and calls the same function.
--
-- A NOTE ON is_admin()'s anon GRANT
-- 004 kept EXECUTE on public.is_admin() for anon specifically because the old
-- {anon,authenticated} testimonials policy called it. This file removes that
-- policy, so the stated reason expires. The grant is deliberately LEFT ALONE:
-- revoking it turns a benign `false` into a hard 42501 for any caller that
-- reaches the server before its session is attached, and confirming nothing
-- else depends on it is separate work that deserves its own migration and its
-- own rollback.
--
-- Safe to re-run.


-- ── Pre-flight (read-only — these change nothing) ─────────────────────────
-- Two things this file assumes but cannot read off the repo. Run them first.
--
--   -- (a) The policy names dropped below must match EXACTLY. DROP POLICY IF
--   --     EXISTS with a wrong name is a SILENT no-op, and because permissive
--   --     policies are OR'd, a surviving broad policy would sit alongside the
--   --     new narrow one and defeat it — the exact shape of the known issue in
--   --     schema.sql section 8(a).
--   select policyname, roles, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public' and tablename = 'testimonials'
--   order by cmd, policyname;
--
--   -- (b) Does this table already have an updated_at trigger, under what name?
--   --     schema.sql documents set_updated_at() but has no per-table trigger
--   --     section, so this is the only way to find out.
--   select tgname, pg_get_triggerdef(oid)
--   from pg_trigger
--   where tgrelid = 'public.testimonials'::regclass and not tgisinternal;


-- ── Columns ───────────────────────────────────────────────────────────────

alter table public.testimonials
  add column if not exists order_id      uuid,
  add column if not exists featured      boolean not null default false,
  add column if not exists display_order integer not null default 0;

comment on column public.testimonials.order_id is
  'The past event this review is about. Eligibility is enforced by customer_may_review() from the INSERT and customer-edit policies, not by a CHECK constraint — a CHECK cannot contain a subquery.';
comment on column public.testimonials.featured is
  'Admin curation: show this review on the public marketing homepage. Only meaningful alongside status = approved; get_public_testimonials() requires both.';
comment on column public.testimonials.display_order is
  'Hand-picked sort key for featured reviews, ascending. Deliberately NOT unique — a UNIQUE would turn every reorder into a deferred-constraint swap dance. Ties fall back to newest first.';


-- ── Constraints ───────────────────────────────────────────────────────────
-- Postgres has no ADD CONSTRAINT IF NOT EXISTS, so these are guarded on
-- pg_constraint. Static DDL inside a DO block, not dynamic `execute format`.

do $$
begin
  -- ON DELETE SET NULL rather than CASCADE, which is what every other child of
  -- orders uses. A testimonial is not a detail of an order the way a line item
  -- is — it is something the customer wrote. If an admin deletes an old
  -- booking, losing the review along with it would be a surprising and
  -- unrecoverable side effect, so the review survives and simply stops naming
  -- an event. get_public_testimonials LEFT JOINs orders for exactly this case.
  if not exists (
    select 1 from pg_constraint
    where conname = 'testimonials_order_id_fkey'
      and conrelid = 'public.testimonials'::regclass
  ) then
    alter table public.testimonials
      add constraint testimonials_order_id_fkey
      foreign key (order_id) references public.orders(order_id)
      on update cascade on delete set null;
  end if;

  -- `message` is NOT NULL, but '' satisfies NOT NULL. This text ends up on the
  -- marketing homepage, so it gets a floor and a ceiling.
  if not exists (
    select 1 from pg_constraint
    where conname = 'testimonials_message_check'
      and conrelid = 'public.testimonials'::regclass
  ) then
    alter table public.testimonials
      add constraint testimonials_message_check
      check (char_length(btrim(message)) between 10 and 2000);
  end if;
end
$$;


-- ── Indexes ───────────────────────────────────────────────────────────────

-- schema.sql section 5: "Every foreign key in this schema is indexed, which is
-- the right default and worth preserving." The partial unique index below
-- cannot serve the FK's own lookups, so the plain one is not redundant.
create index if not exists idx_testimonials_order_id
  on public.testimonials (order_id);

-- ONE LIVE REVIEW PER EVENT — partial, and excluding 'rejected' on purpose.
--
-- A plain unique index on order_id would dead-end anyone whose review is
-- rejected: they cannot edit it, because "customer can edit own pending
-- testimonial" only covers status = 'pending', and a fresh insert would hit the
-- unique violation. Their one chance to review that event would be gone, with
-- no route back except deleting the row and knowing to do so. Excluding
-- rejected rows keeps moderation debris from locking someone out. This is
-- strictly more permissive than a plain UNIQUE, so it can be tightened later
-- without a data migration.
create unique index if not exists idx_testimonials_one_review_per_order
  on public.testimonials (order_id)
  where order_id is not null
    and status <> 'rejected'::public.testimonial_status;

-- Serves the homepage read exactly: get_public_testimonials' WHERE plus its
-- ORDER BY.
create index if not exists idx_testimonials_featured
  on public.testimonials (display_order, created_at desc)
  where featured and status = 'approved'::public.testimonial_status;


-- ── updated_at ────────────────────────────────────────────────────────────
-- Written to be correct whatever pre-flight (b) reports. If a trigger already
-- exists under THIS name it is replaced; if one exists under a different name
-- both fire and both assign now() to the same column in the same statement,
-- which is harmless — drop the duplicate at your leisure.
--
-- set_updated_at() lost its EXECUTE grants and had search_path pinned in 004.
-- Neither matters here: the trigger machinery does not consult EXECUTE at fire
-- time, and the body touches only NEW and now().

drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();


-- ── Who is allowed to review ──────────────────────────────────────────────
-- One definition, called from two policies, so the INSERT rule and the edit
-- rule cannot drift apart.
--
-- WHY A FUNCTION RATHER THAN THE SUBQUERY INLINE IN THE POLICY. Inline would
-- work: policy expressions are evaluated with the CALLER's privileges, so RLS
-- on public.orders applies inside the subquery, and "customer can view own
-- orders" USING (own OR is_admin()) makes exactly the row we care about
-- visible. But that quietly makes testimonial writes depend on a policy on a
-- DIFFERENT table staying permissive — narrow orders' SELECT later for any
-- reason and review submission starts failing with nothing pointing at orders.
-- SECURITY DEFINER cuts that coupling.
--
-- IT IS A WEAK ORACLE, and that is accepted. A caller who already knows two
-- unguessable v4 UUIDs — a customer_id and an order_id — can learn whether
-- that order belongs to that customer and is in the past. It returns no data,
-- only that bit, and it is authenticated-only. Closing it would mean giving up
-- the decoupling above for no practical gain.

create or replace function public.customer_may_review(
  p_customer_id uuid,
  p_order_id    uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    where o.order_id    = p_order_id
      and o.customer_id = p_customer_id
      -- See the header: 'completed' is unreachable in this application, so
      -- "the event has happened and was not called off" is the honest test.
      and o.status     <> 'cancelled'::public.order_status
      and o.event_date  < current_date
  );
$$;

comment on function public.customer_may_review(uuid, uuid) is
  'Is this order one the customer may review — theirs, not cancelled, and already in the past? Called from the testimonials INSERT and customer-edit policies. SECURITY DEFINER so those policies do not depend on the SELECT policy on public.orders.';

revoke all on function public.customer_may_review(uuid, uuid) from public, anon;
grant execute on function public.customer_may_review(uuid, uuid) to authenticated;


-- ── Policies ──────────────────────────────────────────────────────────────
-- Postgres has no CREATE POLICY IF NOT EXISTS, so each is dropped and
-- recreated. Nothing here is `as restrictive` — a restrictive policy ANDs with
-- every other one and is the single change that could silently zero the admin
-- dashboard's pending-testimonial count.
--
-- Every helper call is wrapped in (select ...) so Postgres evaluates it once
-- per query as an InitPlan rather than once per scanned row. schema.sql
-- section 8(c) counts 44 existing policies that get this wrong; these are the
-- first that do not.

-- SELECT — the broad anon policy goes away entirely.
--
-- "anyone can view approved testimonials" was USING (status = 'approved' OR
-- is_admin()) to {anon, authenticated}. It is not literally the section 8(a)
-- bug — it is not USING (true) and had no narrower sibling to defeat — but it
-- is now both unnecessary and leaky:
--
--   * Unnecessary. The public read is served by get_public_testimonials, which
--     is the only thing that can produce a reviewer's name anyway.
--   * Leaky. It let any anonymous caller run
--         select customer_id from testimonials where status = 'approved'
--     and collect the primary keys of real customers. Those uuids are inert on
--     their own, but they are stable identifiers that appear in other tables'
--     RLS expressions, and there is no reason to publish them.
--
-- Replacing it also fixes a latent bug nobody had hit yet: under the old
-- expression a customer could not read their OWN pending or rejected review,
-- so a "my reviews" page would have shown them nothing while they waited.
--
-- Consequence to be aware of: after this, anon gets NOTHING from
-- from("testimonials") and a signed-in customer sees only their own rows.
-- Every "other people's reviews" surface — the homepage carousel and the
-- dashboard card — MUST go through the RPC. That is fail-closed by design.

drop policy if exists "anyone can view approved testimonials" on public.testimonials;
drop policy if exists "customer can view own testimonials"    on public.testimonials;

create policy "customer can view own testimonials"
on public.testimonials
for select to authenticated
using (
  customer_id = (select public.current_customer_id())
  or (select public.is_admin())
);

-- INSERT — ownership and eligibility.
drop policy if exists "customer can submit own testimonial" on public.testimonials;

create policy "customer can submit own testimonial"
on public.testimonials
for insert to authenticated
with check (
  customer_id = (select public.current_customer_id())
  and public.customer_may_review(customer_id, order_id)
);

-- UPDATE (customer) — the same eligibility test, so a customer cannot edit a
-- still-pending review to point at an event that has not happened yet.
--
-- The old policy had no explicit WITH CHECK, so Postgres reused USING for it.
-- That is load-bearing and is preserved below: requiring 'pending' on BOTH
-- sides is what stops a customer approving their own review. Do not loosen the
-- WITH CHECK relative to the USING clause here.
drop policy if exists "customer can edit own pending testimonial" on public.testimonials;

create policy "customer can edit own pending testimonial"
on public.testimonials
for update to authenticated
using (
  customer_id = (select public.current_customer_id())
  and status = 'pending'::public.testimonial_status
)
with check (
  customer_id = (select public.current_customer_id())
  and status = 'pending'::public.testimonial_status
  and public.customer_may_review(customer_id, order_id)
);

-- UPDATE (admin) and DELETE are left exactly as they are:
--   "admin manages testimonials"                        UPDATE  is_admin()
--   "customer or admin can delete own/any testimonial"  DELETE  own OR is_admin()
-- The admin policy has no explicit WITH CHECK, so USING is reused, and
-- is_admin() is true on both sides — approve, reject, feature and reorder all
-- work against the new columns without a change here. Confirm with pre-flight
-- (a) rather than taking this on trust.


-- ── The public projection ─────────────────────────────────────────────────
--
-- WHY IT RETURNS "Thandi M." AND NOT "Thandi Mokoena"
-- These are real customers of a real business, and this string goes onto a
-- public page that search engines will index and archive. There is no consent
-- column anywhere in this schema, so the only consent on record is "I wrote a
-- review in my account" — which is not the same as "publish my full name
-- against my event, permanently, to anyone". First name plus last initial is
-- the convention every large review platform settled on for exactly this
-- reason: it reads as a real person, and it identifies the reviewer to
-- themselves, without publishing a searchable identity.
--
-- `initials` is composed here rather than returning the name parts for the
-- client to assemble, so the privacy rule lives in ONE place and a client
-- cannot render more than it was handed. It exposes nothing display_name does
-- not already.
--
-- first_name and last_name are both NULLABLE on public.customer, so a profile
-- that was never completed falls back to 'A guest' rather than rendering a
-- blank card or, worse, an email local-part.
--
-- search_path is pinned EMPTY, the direction 004 moved set_updated_at, rather
-- than the `public, pg_temp` used by 002 and 003. The cost is that every
-- public object below must be schema-qualified, INCLUDING the enum casts — a
-- bare 'approved'::testimonial_status will not resolve and creation will fail.
--
-- FOR FUTURE EDITS: if you change the `returns table (...)` list you must DROP
-- the function first. CREATE OR REPLACE cannot change a function's OUT columns
-- and fails with "cannot change return type of existing function".

create or replace function public.get_public_testimonials(
  p_featured_only boolean default true,
  p_limit         integer default 12
)
returns table (
  testimonial_id uuid,
  rating         smallint,
  message        text,
  display_name   text,
  initials       text,
  event_name     text,
  created_at     timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.testimonial_id,
         t.rating,
         btrim(t.message),
         -- "Thandi M."  /  "Thandi"  (no surname on file)  /  "A guest"
         coalesce(n.fn, 'A guest')
           || case when n.ln is not null
                   then ' ' || upper(left(n.ln, 1)) || '.'
                   else '' end,
         -- "TM" / "T" / "A"
         upper(left(coalesce(n.fn, 'A guest'), 1) || coalesce(left(n.ln, 1), '')),
         e.event_name,
         t.created_at
  from public.testimonials t
  join public.customer c
    on c.customer_id = t.customer_id
  -- LEFT, because order_id is nulled rather than cascaded when an order is
  -- deleted; such a review keeps its text and simply names no event.
  left join public.orders o
    on o.order_id = t.order_id
  left join public.event_type e
    on e.event_id = o.event_type_id
  cross join lateral (
    select nullif(btrim(coalesce(c.first_name, '')), '') as fn,
           nullif(btrim(coalesce(c.last_name,  '')), '') as ln
  ) n
  where t.status = 'approved'::public.testimonial_status
    and (not coalesce(p_featured_only, true) or t.featured)
  -- One ordering serves both callers: the homepage passes p_featured_only =>
  -- true and gets the admin's exact sequence; the dashboard card passes false
  -- and gets the curated picks first, then everything else newest-first.
  order by t.featured desc, t.display_order asc, t.created_at desc
  -- Hard cap, same reasoning as 002's 400-day window: a SECURITY DEFINER
  -- function should never be usable to walk the whole table. There is no
  -- offset parameter either, so it cannot be paged through.
  limit least(greatest(coalesce(p_limit, 12), 1), 50);
$$;

comment on function public.get_public_testimonials(boolean, integer) is
  'Public-safe projection of approved testimonials for the marketing homepage and the dashboard carousel. SECURITY DEFINER because public.customer has no anon SELECT policy by design. Returns a shortened display name and initials only — never customer_id, surname, contact details, or anything about the booking beyond its event type.';

-- Revoke from PUBLIC first. Revoking from anon alone would leave the inherited
-- PUBLIC grant in place and change nothing — see 004. Granting explicitly also
-- makes the grant visible in proacl rather than silently inherited.
revoke all on function public.get_public_testimonials(boolean, integer) from public;
grant execute on function public.get_public_testimonials(boolean, integer) to anon, authenticated;


-- ── Verify ────────────────────────────────────────────────────────────────
-- 1. Columns, constraints and indexes:
--
--   select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'testimonials'
--   order by ordinal_position;
--
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint where conrelid = 'public.testimonials'::regclass;
--
--   select indexname, indexdef from pg_indexes
--   where schemaname = 'public' and tablename = 'testimonials';
--
-- 2. Exactly five policies, NONE of them granted to anon:
--
--   select policyname, permissive, roles, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public' and tablename = 'testimonials'
--   order by cmd, policyname;
--
--   Expect: "customer can view own testimonials" (SELECT, {authenticated}),
--   "customer can submit own testimonial" (INSERT), "admin manages
--   testimonials" (UPDATE), "customer can edit own pending testimonial"
--   (UPDATE), "customer or admin can delete own/any testimonial" (DELETE).
--   If "anyone can view approved testimonials" is still listed, the DROP above
--   did not match its real name — fix the name and re-run.
--
-- 3. Grants. customer_may_review must show authenticated only;
--    get_public_testimonials must show anon and authenticated; neither may show
--    a bare "=X/" entry, because that entry IS the PUBLIC grant:
--
--   select p.proname, pg_get_function_identity_arguments(p.oid) as args,
--          p.prosecdef, p.proconfig, p.proacl
--   from pg_proc p
--   where p.pronamespace = 'public'::regnamespace
--     and p.proname in ('customer_may_review', 'get_public_testimonials');
--
-- 4. The function runs and the tables stay closed — the test that matters, in
--    the same spirit as the anon-role check that found the enquiries issue in
--    schema.sql section 8(a):
--
--   set role anon;
--   select * from public.get_public_testimonials(true, 3);  -- returns rows
--   select count(*) from public.testimonials;               -- must be 0
--   select count(*) from public.customer;                   -- must be 0
--   reset role;
--
-- 5. How many customers can review anything at all right now. If this is 0,
--    nobody can leave a review yet and the feature cannot be exercised end to
--    end without first seeding an order with a past event_date:
--
--   select count(*) from public.orders
--   where event_date < current_date and status <> 'cancelled';
--
-- 6. If the RPC 404s from the browser with PGRST202, PostgREST has not picked
--    up the new function yet:
--
--   notify pgrst, 'reload schema';


-- ── Rollback ──────────────────────────────────────────────────────────────
-- drop function if exists public.get_public_testimonials(boolean, integer);
--
-- drop policy if exists "customer can view own testimonials"      on public.testimonials;
-- drop policy if exists "customer can submit own testimonial"     on public.testimonials;
-- drop policy if exists "customer can edit own pending testimonial" on public.testimonials;
-- create policy "anyone can view approved testimonials"
--   on public.testimonials for select to anon, authenticated
--   using (status = 'approved'::public.testimonial_status or public.is_admin());
-- create policy "customer can submit own testimonial"
--   on public.testimonials for insert to authenticated
--   with check (customer_id = public.current_customer_id());
-- create policy "customer can edit own pending testimonial"
--   on public.testimonials for update to authenticated
--   using (customer_id = public.current_customer_id()
--          and status = 'pending'::public.testimonial_status);
--
-- drop function if exists public.customer_may_review(uuid, uuid);
-- drop trigger  if exists set_testimonials_updated_at on public.testimonials;
--
-- drop index if exists public.idx_testimonials_featured;
-- drop index if exists public.idx_testimonials_one_review_per_order;
-- drop index if exists public.idx_testimonials_order_id;
-- alter table public.testimonials drop constraint if exists testimonials_message_check;
-- alter table public.testimonials drop constraint if exists testimonials_order_id_fkey;
-- alter table public.testimonials
--   drop column if exists display_order,
--   drop column if exists featured,
--   drop column if exists order_id;
