-- 002 — Availability lookup for the booking flows.
--
-- WHY THIS EXISTS
-- Customers need to see when the venue is already taken *before* they fill in
-- a whole quote, but RLS on public.orders quite rightly hides other customers'
-- rows. This function is SECURITY DEFINER so it can see every booking, and it
-- returns ONLY the shape of each booking — date and time window. No customer,
-- no order id, no price, no location, no event type. Nothing identifying.
--
-- The Postgres exclusion constraint on public.orders remains the authority on
-- whether a slot can actually be taken; this is purely so the UI can warn
-- early. The app degrades gracefully if this function is absent.
--
-- Safe to re-run.

create or replace function public.get_booked_slots(
  p_from date,
  p_to   date
)
returns table (
  event_date date,
  start_time time,
  end_time   time
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_from is null or p_to is null then
    raise exception 'get_booked_slots: p_from and p_to are required'
      using errcode = '22004';
  end if;

  if p_to < p_from then
    raise exception 'get_booked_slots: p_to must not be before p_from'
      using errcode = '22007';
  end if;

  -- Hard cap the window. A SECURITY DEFINER function should never be usable
  -- to dump the entire booking history in a single call.
  if (p_to - p_from) > 400 then
    raise exception 'get_booked_slots: range must be 400 days or fewer'
      using errcode = '22023';
  end if;

  return query
    select o.event_date::date,
           o.start_time::time,
           o.end_time::time
    from public.orders o
    where o.event_date between p_from and p_to
      and o.event_date is not null
      and o.start_time is not null
      and o.end_time   is not null
      -- NOTE: keep this in sync with the WHERE clause of the exclusion
      -- constraint orders_no_overlap, or the UI and the database will disagree
      -- about which dates are free. As of this migration that constraint is:
      --   EXCLUDE USING gist (event_range WITH &&) WHERE (status <> 'cancelled')
      --
      -- public.order_status has exactly five labels:
      --   pending, confirmed, in_progress, completed, cancelled
      -- Naming a label that does not exist is NOT a harmless no-op here — the
      -- literal is cast to the enum and the whole function dies with 22P02
      -- invalid_text_representation. An earlier version of this file listed
      -- 'declined' and 'rejected' (those are testimonial_status labels), which
      -- made every call fail and left the availability panel permanently in
      -- its "not connected" fallback.
      and coalesce(o.status, 'pending'::public.order_status)
            <> 'cancelled'::public.order_status
    order by o.event_date, o.start_time;
end;
$$;

revoke all on function public.get_booked_slots(date, date) from public;
revoke all on function public.get_booked_slots(date, date) from anon;
grant execute on function public.get_booked_slots(date, date) to authenticated;

-- ── Verify ────────────────────────────────────────────────────────────────
-- select * from public.get_booked_slots(current_date, current_date + 60);

-- ── Rollback ──────────────────────────────────────────────────────────────
-- drop function if exists public.get_booked_slots(date, date);
