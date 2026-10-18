-- =============================================================================
-- 009 — Security hardening: stop customers writing fields only staff may set
-- =============================================================================
--
-- WHY
-- The write policies on several tables check only WHO owns a row, never WHAT
-- is written into it. Through the public REST API (the anon key is in every
-- browser) a signed-in customer could:
--
--   * orders         insert/update with status 'confirmed'/'completed', any
--                    total_price, or reschedule onto a taken slot (event_range
--                    is not recomputed on UPDATE — schema.sql §8b)
--   * testimonials   insert their own review as status='approved', featured
--                    — and it goes straight onto the homepage
--   * enquiries      (even anonymously) insert status='confirmed', blocking a
--                    session in the public availability check, or plant an
--                    enquiry under another customer's user_id
--   * consultations  insert as 'scheduled', assign an admin, or attach another
--                    customer's order
--   * order_items /  add or remove line items on an order that is already
--     customer_menu_items  confirmed
--   * customer       re-point their profile at another auth user
--   * notifications  send an admin a link to an off-site/javascript: URL
--
-- HOW
-- Guard triggers rather than rewritten policies. Triggers are additive: they
-- cannot widen access the way a mistyped replacement policy could, and they
-- do not depend on the exact policy names in the live database. Admins
-- (is_admin()) and server-side roles (service_role, postgres, SECURITY
-- DEFINER functions) are untouched — the checks apply only when the session
-- role is anon or authenticated and the caller is not an admin.
--
-- The app's own customer flows were checked against these rules:
--   orders        insert status 'pending'; update only { status: 'cancelled' }
--   testimonials  insert {customer_id, order_id, rating, message};
--                 update {rating, message} while pending
--   enquiries     insert with user_id = own uid or none
--   consultations insert status 'requested', own order
--   customer      update first/last name, phone, address
--
-- Safe to re-run.
-- =============================================================================

begin;

-- Is this a direct client request from a non-admin?
create or replace function public.is_untrusted_writer()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select current_user in ('anon', 'authenticated') and not coalesce(public.is_admin(), false);
$$;

revoke all on function public.is_untrusted_writer() from public, anon, authenticated;


-- ── orders ──────────────────────────────────────────────────────────────────
create or replace function public.guard_orders_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.is_untrusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    return new;
  end if;

  -- UPDATE: a customer may cancel their own order and change nothing else.
  if (to_jsonb(new) - 'status' - 'updated_at') is distinct from
     (to_jsonb(old) - 'status' - 'updated_at') then
    raise exception 'Only staff can change order details'
      using errcode = '42501';
  end if;
  if new.status is distinct from old.status and new.status <> 'cancelled' then
    raise exception 'Customers can only cancel an order'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_orders_write on public.orders;
create trigger guard_orders_write
  before insert or update on public.orders
  for each row execute function public.guard_orders_write();


-- ── testimonials ────────────────────────────────────────────────────────────
create or replace function public.guard_testimonials_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.is_untrusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status        := 'pending';
    new.featured      := false;
    new.display_order := 0;
    return new;
  end if;

  -- UPDATE: wording and rating only; moderation fields stay as they were.
  new.status        := old.status;
  new.featured      := old.featured;
  new.display_order := old.display_order;
  new.customer_id   := old.customer_id;
  new.order_id      := old.order_id;
  return new;
end;
$$;

drop trigger if exists guard_testimonials_write on public.testimonials;
create trigger guard_testimonials_write
  before insert or update on public.testimonials
  for each row execute function public.guard_testimonials_write();


-- ── enquiries ───────────────────────────────────────────────────────────────
-- Only INSERT is reachable by non-admins (UPDATE/DELETE are admin-only).
create or replace function public.guard_enquiries_insert()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.is_untrusted_writer() then
    return new;
  end if;

  new.status := 'pending';

  -- Same limits as the form and /api/send-email; the REST API skips both.
  if length(coalesce(new.name, ''))    > 120
  or length(coalesce(new.email, ''))   > 254
  or length(coalesce(new.phone, ''))   > 32
  or length(coalesce(new.message, '')) > 2000
  or coalesce(new.guests, 1) not between 1 and 5000 then
    raise exception 'Enquiry field out of range'
      using errcode = '22001';
  end if;

  if new.user_id is not null and new.user_id is distinct from auth.uid() then
    raise exception 'Cannot submit an enquiry for another account'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_enquiries_insert on public.enquiries;
create trigger guard_enquiries_insert
  before insert on public.enquiries
  for each row execute function public.guard_enquiries_insert();


-- ── consultations ───────────────────────────────────────────────────────────
create or replace function public.guard_consultations_insert()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.is_untrusted_writer() then
    return new;
  end if;

  new.status   := 'requested';
  new.admin_id := null;
  if new.order_id is not null and not exists (
    select 1 from public.orders o
    where o.order_id = new.order_id
      and o.customer_id = public.current_customer_id()
  ) then
    raise exception 'That order does not belong to this account'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_consultations_insert on public.consultations;
create trigger guard_consultations_insert
  before insert on public.consultations
  for each row execute function public.guard_consultations_insert();


-- ── order line items: frozen once the order leaves 'pending' ────────────────
create or replace function public.guard_line_items_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid := case when tg_op = 'DELETE' then old.order_id else new.order_id end;
begin
  if not public.is_untrusted_writer() then
    return coalesce(new, old);
  end if;

  if not exists (
    select 1 from public.orders o
    where o.order_id = v_order_id and o.status = 'pending'
  ) then
    raise exception 'This order can no longer be changed'
      using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists guard_order_items_write on public.order_items;
create trigger guard_order_items_write
  before insert or update or delete on public.order_items
  for each row execute function public.guard_line_items_write();

drop trigger if exists guard_customer_menu_items_write on public.customer_menu_items;
create trigger guard_customer_menu_items_write
  before insert or update or delete on public.customer_menu_items
  for each row execute function public.guard_line_items_write();


-- ── customer: identity columns are not self-editable ────────────────────────
create or replace function public.guard_customer_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.is_untrusted_writer() then
    new.user_id     := old.user_id;
    new.email       := old.email;
    new.customer_id := old.customer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_customer_update on public.customer;
create trigger guard_customer_update
  before update on public.customer
  for each row execute function public.guard_customer_update();


-- ── notifications: links must be same-site paths ────────────────────────────
-- Not a CHECK constraint, so existing rows are not re-validated and admins'
-- server-side tooling is unaffected.
create or replace function public.guard_notifications_link()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.link_url is not null and new.link_url !~ '^/[^/\\]' then
    raise exception 'link_url must be a path on this site, like /dashboard/...'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_notifications_link on public.notifications;
create trigger guard_notifications_link
  before insert or update of link_url on public.notifications
  for each row execute function public.guard_notifications_link();


-- ── enquiries PII leak: make sure it is closed even if 006/007 never ran ────
-- Same function as 006/007; recreated here so this file alone is sufficient.
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

drop policy if exists "Allow public read on enquiries" on public.enquiries;
drop policy if exists "Allow public insert" on public.enquiries;


-- ── Unused RPC that returns every booking's date and time ───────────────────
-- Nothing in the app calls it. Admin-only until something needs it.
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'get_calendar_events') then
    execute 'revoke execute on function public.get_calendar_events(date, date) from public, anon, authenticated';
  end if;
end $$;


-- ── Storage: menu-images is admin-written, images only, 5 MB ────────────────
-- The browser check in hooks/use-supabase-upload.ts is a convenience, not a
-- control. SVG is excluded on purpose: it can carry script.
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
       file_size_limit    = 5242880
 where id = 'menu-images';

-- RESTRICTIVE policies are AND'd with whatever permissive ones exist, so this
-- can only narrow access, whatever the live bucket policies currently say.
drop policy if exists "menu-images writes are admin only (insert)" on storage.objects;
create policy "menu-images writes are admin only (insert)" on storage.objects
  as restrictive for insert to anon, authenticated
  with check (bucket_id <> 'menu-images' or (select public.is_admin()));

drop policy if exists "menu-images writes are admin only (update)" on storage.objects;
create policy "menu-images writes are admin only (update)" on storage.objects
  as restrictive for update to anon, authenticated
  using (bucket_id <> 'menu-images' or (select public.is_admin()));

drop policy if exists "menu-images writes are admin only (delete)" on storage.objects;
create policy "menu-images writes are admin only (delete)" on storage.objects
  as restrictive for delete to anon, authenticated
  using (bucket_id <> 'menu-images' or (select public.is_admin()));

commit;


-- =============================================================================
-- VERIFY (run as the anon / a customer role after applying)
-- =============================================================================
--   select tgname from pg_trigger where tgname like 'guard_%';   -- expect 8
--   set role anon; select count(*) from public.enquiries; reset role;  -- expect 0
--
-- STILL TO CHECK BY HAND in the dashboard — not visible from this repo:
--   * handle_new_user(): must NOT read a role/admin flag from
--     raw_user_meta_data. Users can set their own metadata at signup.
--   * The body of is_admin(): it should read public.admin by auth.uid() only.
--   * customer_may_review(): require p_customer_id = current_customer_id().
-- =============================================================================
