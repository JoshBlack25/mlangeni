/**
 * Booking availability maths.
 *
 * Pure functions, no React, no Supabase — so the awkward parts (overlap,
 * merging, gaps) can be reasoned about and tested on their own.
 *
 * A `Range` is `{ start: "HH:MM", end: "HH:MM" }`.
 *
 * `toDateKey` / `fromDateKey` are the ONLY sanctioned date↔string conversions
 * in the booking flow. They are local-time by construction, which retires the
 * `new Date(iso + "T12:00:00")` noon hack that used to paper over the fact
 * that `new Date("2026-03-01")` parses as UTC midnight and can render as the
 * previous day west of Greenwich.
 */

import { format, parse, startOfDay } from "date-fns";

/** The hours the venue can be booked between. */
export const OPERATING_WINDOW = { start: "06:00", end: "23:59" };

/** Shortest bookable event, in minutes. */
export const MIN_DURATION_MINUTES = 30;

const DATE_KEY_FORMAT = "yyyy-MM-dd";

/** `"09:00"` or `"09:00:00"` → `540`. Returns `null` on anything unparseable. */
export function toMinutes(time) {
  if (typeof time !== "string") return null;
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** `"09:00:00"` → `"09:00"`. */
export function toHHMM(time) {
  const mins = toMinutes(time);
  if (mins === null) return "";
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(
    mins % 60,
  ).padStart(2, "0")}`;
}

export function formatTimeLabel(time) {
  return toHHMM(time);
}

export function formatRangeLabel(range) {
  if (!range) return "";
  return `${toHHMM(range.start)} – ${toHHMM(range.end)}`;
}

export function durationMinutes(start, end) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null) return null;
  return e - s;
}

/** Half-open comparison: an event ending at 14:00 does not clash with one starting at 14:00. */
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const as = toMinutes(aStart);
  const ae = toMinutes(aEnd);
  const bs = toMinutes(bStart);
  const be = toMinutes(bEnd);
  if (as === null || ae === null || bs === null || be === null) return false;
  return as < be && bs < ae;
}

/** Which of `dayRanges` clash with the proposed `start`–`end` window. */
export function findConflicts(dayRanges, start, end) {
  if (!Array.isArray(dayRanges) || dayRanges.length === 0) return [];
  if (toMinutes(start) === null || toMinutes(end) === null) return [];
  return dayRanges.filter((r) => rangesOverlap(start, end, r.start, r.end));
}

/** Sort and coalesce touching or overlapping ranges. */
export function mergeRanges(dayRanges) {
  const valid = (dayRanges ?? [])
    .map((r) => ({ start: toHHMM(r.start), end: toHHMM(r.end) }))
    .filter((r) => {
      const s = toMinutes(r.start);
      const e = toMinutes(r.end);
      return s !== null && e !== null && e > s;
    })
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  const merged = [];
  for (const range of valid) {
    const last = merged[merged.length - 1];
    if (last && toMinutes(range.start) <= toMinutes(last.end)) {
      if (toMinutes(range.end) > toMinutes(last.end)) last.end = range.end;
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

const minutesToHHMM = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/**
 * The open windows left on a day — the inverse of `dayRanges` within the
 * operating window. Gaps shorter than `MIN_DURATION_MINUTES` are dropped,
 * because they can't hold a booking anyway.
 */
export function freeGaps(dayRanges, window = OPERATING_WINDOW) {
  const windowStart = toMinutes(window.start);
  const windowEnd = toMinutes(window.end);
  if (windowStart === null || windowEnd === null) return [];

  const gaps = [];
  let cursor = windowStart;

  for (const range of mergeRanges(dayRanges)) {
    const start = Math.max(toMinutes(range.start), windowStart);
    const end = Math.min(toMinutes(range.end), windowEnd);
    if (start > cursor) {
      gaps.push({ start: cursor, end: Math.min(start, windowEnd) });
    }
    cursor = Math.max(cursor, end);
  }

  if (cursor < windowEnd) gaps.push({ start: cursor, end: windowEnd });

  return gaps
    .filter((g) => g.end - g.start >= MIN_DURATION_MINUTES)
    .map((g) => ({ start: minutesToHHMM(g.start), end: minutesToHHMM(g.end) }));
}

/** Minutes of the operating window already spoken for. */
export function coveredMinutes(dayRanges, window = OPERATING_WINDOW) {
  const windowStart = toMinutes(window.start);
  const windowEnd = toMinutes(window.end);
  if (windowStart === null || windowEnd === null) return 0;

  return mergeRanges(dayRanges).reduce((sum, range) => {
    const start = Math.max(toMinutes(range.start), windowStart);
    const end = Math.min(toMinutes(range.end), windowEnd);
    return sum + Math.max(0, end - start);
  }, 0);
}

/** A day is full when nothing bookable is left in it. */
export function isDayFull(dayRanges, window = OPERATING_WINDOW) {
  if (!dayRanges || dayRanges.length === 0) return false;
  return freeGaps(dayRanges, window).length === 0;
}

/** `Date` → `"yyyy-MM-dd"`, in local time. */
export function toDateKey(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, DATE_KEY_FORMAT);
}

/** `"yyyy-MM-dd"` → local-midnight `Date`. */
export function fromDateKey(key) {
  if (!key) return null;
  if (key instanceof Date) return Number.isNaN(key.getTime()) ? null : key;
  const d = parse(String(key), DATE_KEY_FORMAT, new Date());
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

/** Long, human date for headings and emails: "Saturday, 14 November 2026". */
export function formatDateLong(date) {
  const d = date instanceof Date ? date : fromDateKey(date);
  return d ? format(d, "EEEE, d MMMM yyyy") : "";
}

/** Compact date: "14 Nov 2026". */
export function formatDateShort(date) {
  const d = date instanceof Date ? date : fromDateKey(date);
  return d ? format(d, "d MMM yyyy") : "";
}
