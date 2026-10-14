// Display formatters shared by the dashboards (South African locale).
const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

// Shown for a value that has not been set yet (never a dash: screen readers
// announce it as punctuation).
export const NOT_SET = "Not set";

export function formatCurrency(value) {
  const n = Number(value);
  return Number.isFinite(n) ? currencyFormatter.format(n) : NOT_SET;
}

/** { sign: "", symbol: "R", whole: "1 250", fraction: ",00" } for <Money>, or null. */
export function currencyParts(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const out = { sign: "", symbol: "", whole: "", fraction: "" };
  for (const part of currencyFormatter.formatToParts(n)) {
    if (part.type === "minusSign") out.sign = part.value;
    else if (part.type === "currency") out.symbol = part.value;
    else if (part.type === "decimal" || part.type === "fraction") out.fraction += part.value;
    else if (part.type !== "literal" || out.whole) out.whole += part.value;
  }
  out.whole = out.whole.trim();
  return out;
}

export function toDate(value) {
  if (!value) return null;
  // Date-only strings ("2026-10-12") are calendar days, not UTC midnights.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, day] = value.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  const d = toDate(value);
  return d ? d.toLocaleDateString("en-ZA", options) : NOT_SET;
}
