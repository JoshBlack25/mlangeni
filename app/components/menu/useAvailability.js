"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { supabase } from "@/services/supabaseClient";
import { toDateKey, toHHMM } from "./availability";

/**
 * Existing bookings for the months around the one the calendar is showing.
 *
 * Reads `get_booked_slots(p_from, p_to)` — a SECURITY DEFINER function that
 * returns only date + time window, because RLS on `orders` hides other
 * customers' rows from the browser. See `db/002_get_booked_slots.sql`.
 *
 * IMPORTANT: if that function isn't installed (or isn't granted), this reports
 * `unsupported` rather than `error`, and every caller must then behave as
 * "no known bookings" — annotate nothing, block nothing. Treating a failed
 * lookup as "everything is taken" would silently make the product unbookable.
 * The exclusion constraint on `orders` is the real gate either way.
 */

const RPC_NAME = "get_booked_slots";
const MONTH_KEY = "yyyy-MM";

// Module-level so a missing function warns once per page load, not per render.
let warnedUnsupported = false;

function isMissingFunction(error) {
  if (!error) return false;
  const code = String(error.code ?? "");
  const message = String(error.message ?? "");
  return (
    code === "PGRST202" || // PostgREST: not found in the schema cache
    code === "42883" || // postgres: undefined_function
    code === "404" ||
    error.status === 404 ||
    /could not find the function|does not exist|schema cache/i.test(message)
  );
}

function isForbidden(error) {
  if (!error) return false;
  const code = String(error.code ?? "");
  return (
    code === "42501" || // insufficient_privilege
    code === "PGRST301" ||
    error.status === 401 ||
    error.status === 403
  );
}

export function useAvailability({
  month,
  horizonMonths = 3,
  enabled = true,
} = {}) {
  const [byDate, setByDate] = useState(() => new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unsupported, setUnsupported] = useState(false);

  // Accumulated across months so paging back and forth doesn't refetch.
  const cacheRef = useRef(new Map());
  const loadedMonthsRef = useRef(new Set());
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const anchor = month instanceof Date && !Number.isNaN(month.getTime())
    ? month
    : new Date();
  const anchorKey = format(startOfMonth(anchor), MONTH_KEY);

  const load = useCallback(
    async (anchorDate, { force = false } = {}) => {
      const first = startOfMonth(anchorDate);
      const last = endOfMonth(addMonths(first, Math.max(1, horizonMonths) - 1));

      const wanted = [];
      for (let i = 0; i < Math.max(1, horizonMonths); i += 1) {
        wanted.push(format(addMonths(first, i), MONTH_KEY));
      }
      const missing = force
        ? wanted
        : wanted.filter((k) => !loadedMonthsRef.current.has(k));
      if (missing.length === 0) return;

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc(RPC_NAME, {
        p_from: toDateKey(first),
        p_to: toDateKey(last),
      });

      // A newer request has already been fired, or we unmounted.
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      if (rpcError) {
        setLoading(false);

        if (isMissingFunction(rpcError) || isForbidden(rpcError)) {
          if (!warnedUnsupported) {
            warnedUnsupported = true;
            console.warn(
              `[menu] availability lookup unavailable (${rpcError.code ?? rpcError.message}). ` +
                "Run db/002_get_booked_slots.sql to enable live booking conflicts. " +
                "The builder will keep working; every date stays selectable.",
            );
          }
          setUnsupported(true);
          setError(null);
          return;
        }

        setError(rpcError.message || "Could not load availability.");
        return;
      }

      setUnsupported(false);
      setError(null);

      if (force) {
        cacheRef.current = new Map();
        loadedMonthsRef.current = new Set();
      }

      const next = new Map(cacheRef.current);
      for (const row of data ?? []) {
        const key = toDateKey(row.event_date);
        if (!key) continue;
        const range = { start: toHHMM(row.start_time), end: toHHMM(row.end_time) };
        if (!range.start || !range.end) continue;
        next.set(key, [...(next.get(key) ?? []), range]);
      }

      cacheRef.current = next;
      for (const k of wanted) loadedMonthsRef.current.add(k);

      setByDate(next);
      setLoading(false);
    },
    [horizonMonths],
  );

  useEffect(() => {
    if (!enabled) return;
    // `load` fetches and then sets state — that's the point of the effect,
    // not derived state that could be computed during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(startOfMonth(anchor));
    // `anchorKey` is the stable identity of `anchor`: a new Date object for
    // the same month must not retrigger the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorKey, enabled, load]);

  const refresh = useCallback(() => {
    if (!enabled) return;
    load(startOfMonth(anchor), { force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorKey, enabled, load]);

  return { byDate, loading, error, unsupported, refresh };
}

/** Ranges for one day, given the map this hook returns. */
export function rangesForDate(byDate, date) {
  const key = toDateKey(date);
  if (!key) return [];
  return byDate?.get(key) ?? [];
}
