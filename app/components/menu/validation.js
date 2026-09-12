/**
 * Booking form validation.
 *
 * Shared between the Event Details step (which validates live, per field) and
 * the Quote step (which re-checks everything before writing), so the rules
 * exist in exactly one place.
 */

import { startOfDay } from "date-fns";
import { MIN_DURATION_MINUTES, durationMinutes, toMinutes } from "./availability";

export const GUEST_MIN = 1;
export const GUEST_MAX = 2000;
export const LOCATION_MIN = 3;
export const LOCATION_MAX = 200;
export const NOTES_MAX = 2000;
/** How far ahead a booking can be made. */
export const MAX_MONTHS_AHEAD = 18;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function maxBookingDate(today = new Date()) {
  const d = startOfDay(today);
  return new Date(d.getFullYear(), d.getMonth() + MAX_MONTHS_AHEAD, d.getDate());
}

function validateGuests(guests) {
  const raw = String(guests ?? "").trim();
  if (!raw) return "Please enter how many guests you're expecting";
  const n = Number(raw);
  if (!Number.isInteger(n)) return "Guest count must be a whole number";
  if (n < GUEST_MIN) return `At least ${GUEST_MIN} guest is required`;
  if (n > GUEST_MAX) return `For more than ${GUEST_MAX} guests, please call us`;
  return null;
}

function validateDate(eventDate, today) {
  if (!eventDate) return "Please choose an event date";
  const chosen = startOfDay(
    eventDate instanceof Date ? eventDate : new Date(eventDate),
  );
  if (Number.isNaN(chosen.getTime())) return "That date isn't valid";
  if (chosen < startOfDay(today)) return "Please choose a date in the future";
  if (chosen > maxBookingDate(today))
    return `We take bookings up to ${MAX_MONTHS_AHEAD} months ahead`;
  return null;
}

function validateLocation(location) {
  const raw = String(location ?? "").trim();
  if (!raw) return "Please enter the venue or address";
  if (raw.length < LOCATION_MIN) return "That looks too short to be an address";
  if (raw.length > LOCATION_MAX)
    return `Please keep this under ${LOCATION_MAX} characters`;
  return null;
}

function validateTimes(startTime, endTime) {
  const errors = {};
  if (toMinutes(startTime) === null) {
    errors.startTime = "Please set a start time";
    return errors;
  }
  if (toMinutes(endTime) === null) {
    errors.endTime = "Please set an end time";
    return errors;
  }
  const mins = durationMinutes(startTime, endTime);
  if (mins <= 0) errors.endTime = "End time must be after the start time";
  else if (mins < MIN_DURATION_MINUTES)
    errors.endTime = `Events run for at least ${MIN_DURATION_MINUTES} minutes`;
  return errors;
}

/**
 * @param {object} state       the menu wizard state
 * @param {object} ctx
 * @param {Array}  ctx.conflicts  overlapping bookings, from `findConflicts`
 * @param {Date}   ctx.today
 * @returns {Record<string, string>} field name → message, empty when valid
 */
export function validateEventDetails(state, { conflicts = [], today = new Date() } = {}) {
  const errors = {};

  const guests = validateGuests(state.guests);
  if (guests) errors.guests = guests;

  const date = validateDate(state.eventDate, today);
  if (date) errors.eventDate = date;

  if (!state.eventTypeId) errors.eventTypeId = "Please choose an occasion";

  const location = validateLocation(state.eventLocation);
  if (location) errors.eventLocation = location;

  Object.assign(errors, validateTimes(state.startTime, state.endTime));

  if (String(state.notes ?? "").length > NOTES_MAX) {
    errors.notes = `Please keep notes under ${NOTES_MAX} characters`;
  }

  Object.assign(errors, validateContact(state));

  // Only surface a clash when we actually have availability data — a failed
  // lookup must never block a booking.
  if (conflicts.length > 0 && !errors.endTime) {
    errors.endTime = "This time overlaps an existing booking";
  }

  return errors;
}

export function validateContact(state) {
  const errors = {};

  if (!String(state.contactName ?? "").trim()) {
    errors.contactName = "Please enter your full name";
  }

  const email = String(state.contactEmail ?? "").trim();
  if (!email) errors.contactEmail = "We need an email to send your quote to";
  else if (!EMAIL_RE.test(email)) errors.contactEmail = "That email doesn't look right";

  const phone = String(state.contactPhone ?? "").trim();
  if (phone && phone.replace(/\D/g, "").length < 7) {
    errors.contactPhone = "That phone number looks too short";
  }

  return errors;
}

/** Validate one field, for blur/change handling. */
export function validateField(name, state, ctx = {}) {
  const all = validateEventDetails(state, ctx);
  return all[name] ?? "";
}

/** The order fields appear in, so submit can focus the first broken one. */
export const FIELD_ORDER = [
  "guests",
  "eventTypeId",
  "eventDate",
  "startTime",
  "endTime",
  "eventLocation",
  "notes",
  "contactName",
  "contactEmail",
  "contactPhone",
];

export function firstInvalidField(errors) {
  return FIELD_ORDER.find((f) => errors[f]) ?? null;
}
