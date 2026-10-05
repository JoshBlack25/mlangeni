/**
 * Shared email palette, formatters and escaping.
 *
 * Email clients don't reliably support CSS custom properties or stylesheets,
 * so these are plain constants inlined at render time — the app's design
 * tokens can't reach in here.
 */

export const PALETTE = {
  bg: "#0a0a0a",
  surface: "#0f0f0f",
  surfaceAlt: "#141414",
  line: "#1e1e1e",
  lineSoft: "#161616",
  gold: "#D4AF37",
  goldInk: "#0a0a0a",
  text: "#ffffff",
  textMuted: "#cccccc",
  textDim: "#8a8a8a",
  textFaint: "#555555",
  textGhost: "#333333",
} as const;

export const FONT_STACK = `Georgia, 'Times New Roman', Times, serif`;

/** HTML-entity escape. Every interpolated value must pass through this. */
export function sanitize(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

export function formatZAR(amount: unknown): string {
  const n = Number(amount);
  return zar.format(Number.isFinite(n) ? n : 0);
}

/** `"2026-11-14"` → `"Saturday, 14 November 2026"`. Local, never UTC-shifted. */
export function formatDateLong(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate ?? ""));
  if (!m) return String(isoDate ?? "");
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return String(isoDate);
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** `"2026-11-14"` → `"14 Nov 2026"`, for subject lines. */
export function formatDateShort(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate ?? ""));
  if (!m) return String(isoDate ?? "");
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return String(isoDate);
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatTime(time: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(time ?? ""));
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : String(time ?? "");
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function firstName(fullName: string): string {
  return String(fullName ?? "").trim().split(/\s+/)[0] || "there";
}
