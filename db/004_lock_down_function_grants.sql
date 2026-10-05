-- 004 — Close the SECURITY DEFINER functions that Postgres left open to the
--       public, and pin the last mutable search_path.
--
-- WHY THIS EXISTS
-- Postgres grants EXECUTE on every new function to PUBLIC by default, and both
-- `anon` and `authenticated` inherit from PUBLIC. In an exposed schema that
-- makes each one a live REST endpoint at /rest/v1/rpc/<name>. Combined with
-- SECURITY DEFINER — which runs as the owner and therefore bypasses RLS — a
-- function nobody meant to publish becomes an unauthenticated read of data RLS
-- was carefully written to protect.
--
-- Two of these were genuinely reachable with nothing but the publishable key
-- that ships in the browser bundle:
--
--   get_admin_user_ids()    returned every admin's auth user_id to anon.
--   get_calendar_events()   returned the date, time window and event type of
--                           EVERY order to anon, with no range cap. This is
--                           the same data 002 deliberately withheld: that
--                           function is authenticated-only, capped at 400
--                           days, and returns no event type. The lock on the
--                           front door meant little while this window was open.
--
-- WHAT IS DELIBERATELY LEFT ALONE
-- public.is_admin() KEEPS its EXECUTE grant to anon. It is called from inside
-- the {anon,authenticated} policy "anyone can view approved testimonials" on
-- public.testimonials. Policy expressions are evaluated with the *caller's*
-- privileges, so revoking EXECUTE from anon would not tighten that policy — it
-- would make the public testimonials list fail outright with 42501. The
-- function itself leaks nothing: it takes no arguments and answers only
-- "is the current caller an admin", which is `false` for every anonymous
-- caller by construction.
--
-- Safe to re-run.

-- ── Trigger and event-trigger functions ───────────────────────────────────
-- These are only ever invoked by the trigger machinery, which does not consult
-- EXECUTE privileges at fire time. Nothing needs to call them directly, so no
-- role keeps a grant.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.set_updated_at()  from public, anon, authenticated;

-- set_updated_at was the one function left with a role-mutable search_path.
-- Its body touches only NEW and now(); now() lives in pg_catalog, which is
-- always searched implicitly, so the empty path is safe here.
alter function public.set_updated_at() set search_path = '';

-- ── SECURITY DEFINER helpers: signed-in callers only ──────────────────────
-- Revoke from PUBLIC first. Revoking from anon alone would leave the inherited
-- PUBLIC grant in place and change nothing.

revoke all on function public.get_admin_user_ids() from public, anon;
grant execute on function public.get_admin_user_ids() to authenticated;

revoke all on function public.current_customer_id() from public, anon;
grant execute on function public.current_customer_id() to authenticated;

revoke all on function public.is_admin_user(uuid) from public, anon;
grant execute on function public.is_admin_user(uuid) to authenticated;

-- No caller in the app references get_calendar_events; it is kept available to
-- authenticated rather than dropped, in case an admin view is built on it. If
-- it is ever exposed to anon again it needs the range cap and the identifying
-- columns removed first — see 002 for the shape that is safe to publish.
revoke all on function public.get_calendar_events(date, date) from public, anon;
grant execute on function public.get_calendar_events(date, date) to authenticated;

-- ── Verify ────────────────────────────────────────────────────────────────
-- Every row should show no bare "=X/" entry (that entry IS the PUBLIC grant),
-- except is_admin, which keeps anon on purpose:
--
--   select p.proname,
--          pg_get_function_identity_arguments(p.oid) as args,
--          p.prosecdef, p.proconfig, p.proacl
--   from pg_proc p
--   where p.pronamespace = 'public'::regnamespace
--   order by p.proname;

-- ── Rollback ──────────────────────────────────────────────────────────────
-- grant execute on function public.handle_new_user()  to public;
-- grant execute on function public.rls_auto_enable()  to public;
-- grant execute on function public.set_updated_at()   to public;
-- alter function public.set_updated_at() reset search_path;
-- grant execute on function public.get_admin_user_ids()            to public;
-- grant execute on function public.current_customer_id()           to public;
-- grant execute on function public.is_admin_user(uuid)             to public;
-- grant execute on function public.get_calendar_events(date, date) to public;
