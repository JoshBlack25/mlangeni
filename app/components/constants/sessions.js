export const SESSION_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "full_day", label: "All Day" },
];

// Old guest-form values, kept so previously submitted rows still count
// toward availability without needing a database migration.
const LEGACY_SESSION_MAP = {
  Morning: "morning",
  Afternoon: "afternoon",
  "Evening/Night": "evening",
};

export function normalizeSession(raw) {
  return LEGACY_SESSION_MAP[raw] ?? raw;
}

// A session is unavailable if:
// - "All Day" is already confirmed (blocks everything), OR
// - this session itself is confirmed, OR
// - this session IS "All Day" and anything else that day is confirmed
export function isSessionUnavailable(sessionValue, bookedSessions) {
  if (bookedSessions.includes("full_day")) return true;
  if (sessionValue === "full_day") return bookedSessions.length > 0;
  return bookedSessions.includes(sessionValue);
}

/**
 * The actual clock window each session occupies.
 *
 * `orders` stores start_time / end_time (both NOT NULL) and the
 * orders_no_overlap exclusion constraint works on those, so a session picked in
 * the menu builder still has to become a real time range. This is the single
 * place that conversion happens — keep it in step with OPERATING_WINDOW in
 * app/components/menu/availability.js, which is 06:00–23:59.
 */
export const SESSION_WINDOWS = {
  morning: { start: "06:00", end: "12:00" },
  afternoon: { start: "12:00", end: "17:00" },
  evening: { start: "17:00", end: "23:59" },
  full_day: { start: "06:00", end: "23:59" },
};

export function windowForSession(session) {
  return SESSION_WINDOWS[normalizeSession(session)] ?? null;
}

/**
 * The reverse lookup, so a booking saved before the builder used sessions can
 * still show the right label instead of falling back to a blank select.
 */
export function sessionForWindow(start, end) {
  const hhmm = (t) => String(t ?? "").slice(0, 5);
  const entry = Object.entries(SESSION_WINDOWS).find(
    ([, w]) => w.start === hhmm(start) && w.end === hhmm(end),
  );
  return entry ? entry[0] : "";
}
