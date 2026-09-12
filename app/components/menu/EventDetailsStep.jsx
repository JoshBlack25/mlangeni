"use client";

import { useMemo, useState } from "react";
import { startOfDay, startOfMonth } from "date-fns";
import { CalendarClock, MapPin, Users } from "lucide-react";
import { useMenu } from "./MenuContext";
import { rowDisplayName } from "./constants";
import { findConflicts, isDayFull } from "./availability";
import { useAvailability, rangesForDate } from "./useAvailability";
import { DateField } from "./DateField";
import { AvailabilityPanel } from "./AvailabilityPanel";
import {
  ReadOnlyField,
  SelectField,
  TextAreaField,
  TextField,
  TimeField,
} from "./fields";
import {
  GUEST_MAX,
  NOTES_MAX,
  firstInvalidField,
  maxBookingDate,
  validateEventDetails,
} from "./validation";

export function EventDetailsStep() {
  const { state, dispatch } = useMenu();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const today = useMemo(() => startOfDay(new Date()), []);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(state.eventDate ?? today),
  );

  const { byDate, loading, error, unsupported, refresh } = useAvailability({
    month: calendarMonth,
  });

  // Days the calendar annotates. Both stay empty when the lookup is
  // unavailable, so nothing gets disabled on the strength of missing data.
  const { busyDates, fullDates } = useMemo(() => {
    const busy = new Set();
    const full = new Set();
    if (!unsupported) {
      for (const [key, ranges] of byDate.entries()) {
        if (!ranges?.length) continue;
        busy.add(key);
        if (isDayFull(ranges)) full.add(key);
      }
    }
    return { busyDates: busy, fullDates: full };
  }, [byDate, unsupported]);

  const dayRanges = useMemo(
    () => (unsupported ? [] : rangesForDate(byDate, state.eventDate)),
    [byDate, state.eventDate, unsupported],
  );

  // Recomputed on every keystroke of the time fields — this is what makes a
  // clash visible before submit rather than after.
  const conflicts = useMemo(() => {
    if (unsupported || !state.eventDate) return [];
    return findConflicts(dayRanges, state.startTime, state.endTime);
  }, [dayRanges, state.startTime, state.endTime, state.eventDate, unsupported]);

  const ctx = { conflicts, today };

  /** Revalidate a field only once the customer has already left it. */
  const revalidate = (nextState, alsoTouch) => {
    const all = validateEventDetails(nextState, ctx);
    setErrors((prev) => {
      const next = {};
      for (const key of Object.keys({ ...prev, ...all })) {
        const isTouched = touched[key] || key === alsoTouch;
        if (isTouched && all[key]) next[key] = all[key];
      }
      return next;
    });
  };

  const set = (type, payload, field) => {
    dispatch({ type, payload });
    revalidate({ ...state, [field]: payload });
  };

  const setContact = (field, payload) => {
    dispatch({ type: "SET_CONTACT", field, payload });
    revalidate({ ...state, [field]: payload });
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    revalidate(state, field);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const all = validateEventDetails(state, ctx);

    if (Object.keys(all).length > 0) {
      setErrors(all);
      setTouched(
        Object.keys(all).reduce((acc, k) => ({ ...acc, [k]: true }), touched),
      );
      const first = firstInvalidField(all);
      if (first) {
        const el = document.getElementById(first);
        el?.focus();
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return;
    }

    setErrors({});
    dispatch({ type: "NEXT_STEP" });
  };

  const eventTypeOptions = state.eventTypes.map((et) => ({
    value: String(et.event_id),
    label: rowDisplayName(et, "event_id"),
  }));

  const card =
    "rounded-2xl border border-mgh-line bg-mgh-surface p-6 sm:p-7";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <header className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-mgh-gold">
          Step 5 of 6
        </p>
        <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-mgh-text md:text-4xl">
          Event &amp; Booking Logistics
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mgh-muted md:text-base">
          Tell us where and when. We&apos;ll check the date against our diary as
          you go.
        </p>
      </header>

      <div className="space-y-6">
        {/* ── The occasion ─────────────────────────────────────────── */}
        <fieldset className={card}>
          <Legend icon={Users}>The Occasion</Legend>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TextField
              id="guests"
              label="Number of Guests"
              required
              type="number"
              inputMode="numeric"
              min={1}
              max={GUEST_MAX}
              placeholder="e.g. 75"
              value={state.guests}
              error={errors.guests}
              onBlur={() => handleBlur("guests")}
              onChange={(e) => set("SET_GUESTS", e.target.value, "guests")}
            />

            <SelectField
              id="eventTypeId"
              label="Event Occasion / Type"
              required
              placeholder="Select an occasion…"
              options={eventTypeOptions}
              value={state.eventTypeId}
              error={errors.eventTypeId}
              onBlur={() => handleBlur("eventTypeId")}
              onChange={(e) =>
                set("SET_EVENT_TYPE", e.target.value, "eventTypeId")
              }
            />
          </div>
        </fieldset>

        {/* ── Date & time, with live availability ──────────────────── */}
        <fieldset className={card}>
          <Legend icon={CalendarClock}>Date &amp; Time</Legend>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <DateField
                id="eventDate"
                label="Event Date"
                required
                value={state.eventDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                minDate={today}
                maxDate={maxBookingDate(today)}
                busyDates={busyDates}
                fullDates={fullDates}
                error={errors.eventDate}
                hint={
                  !unsupported && busyDates.size > 0
                    ? "Dots mark dates with an existing booking."
                    : undefined
                }
                onChange={(date) => {
                  dispatch({ type: "SET_DATE", payload: date });
                  setTouched((p) => ({ ...p, eventDate: true }));
                  revalidate({ ...state, eventDate: date }, "eventDate");
                  if (date) setCalendarMonth(startOfMonth(date));
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <TimeField
                  id="startTime"
                  label="Start Time"
                  required
                  value={state.startTime}
                  error={errors.startTime}
                  onBlur={() => handleBlur("startTime")}
                  onChange={(e) =>
                    set("SET_START_TIME", e.target.value, "startTime")
                  }
                />
                <TimeField
                  id="endTime"
                  label="End Time"
                  required
                  value={state.endTime}
                  error={errors.endTime}
                  onBlur={() => handleBlur("endTime")}
                  onChange={(e) =>
                    set("SET_END_TIME", e.target.value, "endTime")
                  }
                />
              </div>
            </div>

            <AvailabilityPanel
              date={state.eventDate}
              ranges={dayRanges}
              loading={loading}
              unsupported={unsupported}
              error={error}
              startTime={state.startTime}
              endTime={state.endTime}
              onRefresh={refresh}
              onPickWindow={(gap) => {
                dispatch({ type: "SET_START_TIME", payload: gap.start });
                dispatch({ type: "SET_END_TIME", payload: gap.end });
                revalidate({
                  ...state,
                  startTime: gap.start,
                  endTime: gap.end,
                });
              }}
            />
          </div>
        </fieldset>

        {/* ── Venue & notes ────────────────────────────────────────── */}
        <fieldset className={card}>
          <Legend icon={MapPin}>Venue &amp; Notes</Legend>

          <div className="mt-5 space-y-6">
            <TextField
              id="eventLocation"
              label="Event Venue / Address"
              required
              placeholder="e.g. Constantia Winelands, Cape Town"
              value={state.eventLocation}
              error={errors.eventLocation}
              onBlur={() => handleBlur("eventLocation")}
              onChange={(e) =>
                set("SET_EVENT_LOCATION", e.target.value, "eventLocation")
              }
            />

            <TextAreaField
              id="notes"
              label="Special Culinary or Dietary Notes"
              rows={3}
              maxLength={NOTES_MAX}
              placeholder="Dietary requirements, kitchen facilities on site, timing notes…"
              value={state.notes}
              error={errors.notes}
              hint="Optional — allergies, service style, anything our chefs should know."
              onChange={(e) => set("SET_NOTES", e.target.value, "notes")}
            />
          </div>
        </fieldset>

        {/* ── Contact ──────────────────────────────────────────────── */}
        <fieldset className={card}>
          <Legend icon={Users}>Contact Details</Legend>
          <p className="mt-2 text-sm text-mgh-faint">
            Who should we reach about this quote?
          </p>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TextField
              id="contactName"
              label="Full Name"
              required
              autoComplete="name"
              value={state.contactName}
              error={errors.contactName}
              onBlur={() => handleBlur("contactName")}
              onChange={(e) => setContact("contactName", e.target.value)}
            />

            <TextField
              id="contactPhone"
              label="Phone Number"
              type="tel"
              autoComplete="tel"
              placeholder="+27…"
              value={state.contactPhone}
              error={errors.contactPhone}
              hint="Optional, but it speeds things up."
              onBlur={() => handleBlur("contactPhone")}
              onChange={(e) => setContact("contactPhone", e.target.value)}
            />

            <div className="sm:col-span-2">
              <ReadOnlyField
                id="contactEmail"
                label="Email"
                value={state.contactEmail || state.authUser?.email}
                hint="Your quote is sent here — it comes from your account."
              />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-mgh-line-soft pt-6">
        <button
          type="button"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          className="rounded-xl border border-mgh-line-strong px-6 py-3 text-xs font-semibold uppercase tracking-widest text-mgh-muted transition-colors hover:border-mgh-text hover:text-mgh-text focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
        >
          ← Back
        </button>

        <button
          type="submit"
          className="rounded-xl border border-mgh-gold bg-mgh-gold px-8 py-3 text-xs font-semibold uppercase tracking-widest text-mgh-gold-ink transition-all hover:bg-transparent hover:text-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
        >
          Review Final Quote →
        </button>
      </div>
    </form>
  );
}

function Legend({ icon: Icon, children }) {
  return (
    <legend className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-widest text-mgh-gold">
      <Icon size={15} aria-hidden="true" />
      {children}
    </legend>
  );
}
