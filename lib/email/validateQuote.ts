/**
 * Payload validation for POST /api/quote-email.
 *
 * Hand-rolled rather than pulling in zod for one route — this is the only
 * unvalidated boundary in the app. If more server routes appear, adopt a
 * schema library across all of them in one pass instead of piecemeal.
 */

import type { QuotePayload } from "./quoteTemplates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

export const LIMITS = {
  items: 100,
  name: 120,
  location: 200,
  notes: 2000,
  guestsMax: 5000,
} as const;

export type ValidationResult =
  | { ok: true; payload: QuotePayload }
  | { ok: false; errors: string[] };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const finiteNonNegative = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;

export function validateQuotePayload(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Body must be a JSON object"] };
  }

  const asRecord = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : {};

  const b = asRecord(body);
  const customer = asRecord(b.customer);
  const event = asRecord(b.event);
  const totals = asRecord(b.totals);
  const rawItems = Array.isArray(b.items) ? b.items : null;

  const orderId = b.orderId;
  if (orderId === undefined || orderId === null || String(orderId).length === 0) {
    errors.push("orderId is required");
  }

  const name = str(customer.name);
  if (!name) errors.push("customer.name is required");
  else if (name.length > LIMITS.name)
    errors.push(`customer.name must be under ${LIMITS.name} characters`);

  const email = str(customer.email);
  if (!EMAIL_RE.test(email)) errors.push("customer.email is not a valid address");

  const phone = str(customer.phone);
  if (phone.length > 40) errors.push("customer.phone is too long");

  const date = str(event.date);
  if (!DATE_RE.test(date)) errors.push("event.date must be yyyy-MM-dd");

  const startTime = str(event.startTime);
  const endTime = str(event.endTime);
  if (!TIME_RE.test(startTime)) errors.push("event.startTime must be HH:MM");
  if (!TIME_RE.test(endTime)) errors.push("event.endTime must be HH:MM");

  const location = str(event.location);
  if (!location) errors.push("event.location is required");
  else if (location.length > LIMITS.location)
    errors.push(`event.location must be under ${LIMITS.location} characters`);

  const guests = typeof event.guests === "number" ? event.guests : NaN;
  if (!Number.isInteger(guests) || guests < 1 || guests > LIMITS.guestsMax) {
    errors.push(`event.guests must be a whole number between 1 and ${LIMITS.guestsMax}`);
  }

  const notes = str(event.notes);
  if (notes.length > LIMITS.notes)
    errors.push(`event.notes must be under ${LIMITS.notes} characters`);

  const typeName = str(event.typeName);

  if (!rawItems) errors.push("items must be an array");
  else if (rawItems.length > LIMITS.items)
    errors.push(`items must contain at most ${LIMITS.items} entries`);

  const items = (rawItems ?? []).map((entry: unknown, i: number) => {
    const raw = (entry ?? {}) as Record<string, unknown>;
    const itemName = str(raw.name);
    const quantity = typeof raw.quantity === "number" ? raw.quantity : NaN;
    if (!itemName) errors.push(`items[${i}].name is required`);
    if (!finiteNonNegative(raw.unitPrice))
      errors.push(`items[${i}].unitPrice must be a non-negative number`);
    if (!Number.isInteger(quantity) || quantity < 1)
      errors.push(`items[${i}].quantity must be a positive whole number`);
    return {
      name: itemName.slice(0, LIMITS.name),
      course: str(raw.course).slice(0, 60) || "Menu",
      unitPrice: Number(raw.unitPrice) || 0,
      quantity: Number(quantity) || 1,
    };
  });

  for (const key of ["perGuest", "subtotal", "total"] as const) {
    if (!finiteNonNegative(totals[key]))
      errors.push(`totals.${key} must be a non-negative number`);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      orderId: orderId as string | number,
      customer: { name, email, phone: phone || undefined },
      event: {
        date,
        startTime,
        endTime,
        typeName: typeName || undefined,
        location,
        guests,
        notes: notes || undefined,
      },
      items,
      totals: {
        perGuest: totals.perGuest as number,
        subtotal: totals.subtotal as number,
        total: totals.total as number,
      },
    },
  };
}
