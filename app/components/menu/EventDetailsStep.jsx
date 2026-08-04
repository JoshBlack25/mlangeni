"use client";

import { useState } from "react";
import { useMenu } from "./MenuContext";
import { rowDisplayName } from "./constants";

export function EventDetailsStep() {
  const { state, dispatch } = useMenu();
  const [errors, setErrors] = useState({});
  const today = new Date().toISOString().split("T")[0];

  const validate = () => {
    const e = {};
    if (!state.guests || parseInt(state.guests) < 1)
      e.guests = "Please enter guest count";
    if (!state.eventDate) e.eventDate = "Please select an event date";
    else if (state.eventDate < today)
      e.eventDate = "Date must be in the future";
    if (!state.eventTypeId) e.eventTypeId = "Please select event type";
    if (!state.eventLocation.trim())
      e.eventLocation = "Please enter venue location";
    if (state.endTime <= state.startTime)
      e.endTime = "End time must be after start time";
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    dispatch({ type: "NEXT_STEP" });
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-white md:text-4xl">
          Event & Booking Logistics
        </h2>
        <p className="mt-2 text-sm text-[#A0A0A0] md:text-base">
          Provide your event specifications so our culinary directors can tailor
          your estimate.
        </p>
      </div>

      <div className="max-w-2xl space-y-6 border border-[#252525] bg-[#111111] p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-[#A0A0A0]">
              Number of Guests *
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 75"
              value={state.guests}
              onChange={(e) => {
                dispatch({ type: "SET_GUESTS", payload: e.target.value });
                setErrors((p) => ({ ...p, guests: "" }));
              }}
              className={`w-full border bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none ${
                errors.guests ? "border-red-500" : "border-[#292929]"
              }`}
            />
            {errors.guests && (
              <p className="mt-1 text-xs text-red-400">{errors.guests}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-[#A0A0A0]">
              Event Date *
            </label>
            <input
              type="date"
              min={today}
              value={state.eventDate}
              onChange={(e) => {
                dispatch({ type: "SET_DATE", payload: e.target.value });
                setErrors((p) => ({ ...p, eventDate: "" }));
              }}
              className={`w-full border bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none ${
                errors.eventDate ? "border-red-500" : "border-[#292929]"
              }`}
            />
            {errors.eventDate && (
              <p className="mt-1 text-xs text-red-400">{errors.eventDate}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-[#A0A0A0]">
            Event Occasion / Type *
          </label>
          <select
            value={state.eventTypeId}
            onChange={(e) => {
              dispatch({ type: "SET_EVENT_TYPE", payload: e.target.value });
              setErrors((p) => ({ ...p, eventTypeId: "" }));
            }}
            className={`w-full border bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none ${
              errors.eventTypeId ? "border-red-500" : "border-[#292929]"
            }`}
          >
            <option value="">Select event category...</option>
            {state.eventTypes.map((et) => (
              <option key={et.event_id} value={et.event_id}>
                {rowDisplayName(et, "event_id")}
              </option>
            ))}
          </select>
          {errors.eventTypeId && (
            <p className="mt-1 text-xs text-red-400">{errors.eventTypeId}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-[#A0A0A0]">
            Event Venue / Address *
          </label>
          <input
            type="text"
            placeholder="e.g. Constantia Winelands, Cape Town"
            value={state.eventLocation}
            onChange={(e) => {
              dispatch({ type: "SET_EVENT_LOCATION", payload: e.target.value });
              setErrors((p) => ({ ...p, eventLocation: "" }));
            }}
            className={`w-full border bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none ${
              errors.eventLocation ? "border-red-500" : "border-[#292929]"
            }`}
          />
          {errors.eventLocation && (
            <p className="mt-1 text-xs text-red-400">{errors.eventLocation}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-[#A0A0A0]">
              Start Time *
            </label>
            <input
              type="time"
              value={state.startTime}
              onChange={(e) =>
                dispatch({ type: "SET_START_TIME", payload: e.target.value })
              }
              className="w-full border border-[#292929] bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-[#A0A0A0]">
              End Time *
            </label>
            <input
              type="time"
              value={state.endTime}
              onChange={(e) => {
                dispatch({ type: "SET_END_TIME", payload: e.target.value });
                setErrors((p) => ({ ...p, endTime: "" }));
              }}
              className={`w-full border bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none ${
                errors.endTime ? "border-red-500" : "border-[#292929]"
              }`}
            />
            {errors.endTime && (
              <p className="mt-1 text-xs text-red-400">{errors.endTime}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-[#A0A0A0]">
            Special Culinary or Dietary Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Dietary requirements, kitchen facilities on site, timing notes..."
            value={state.notes}
            onChange={(e) =>
              dispatch({ type: "SET_NOTES", payload: e.target.value })
            }
            className="w-full border border-[#292929] bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-[#222222] pt-6">
        <button
          type="button"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          className="border border-[#333333] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#A0A0A0] transition-colors hover:border-white hover:text-white"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="border border-[#D4AF37] bg-[#D4AF37] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-black transition-all hover:bg-transparent hover:text-[#D4AF37]"
        >
          Review Final Quote →
        </button>
      </div>
    </div>
  );
}
