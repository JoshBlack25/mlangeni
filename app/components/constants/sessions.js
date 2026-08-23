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
