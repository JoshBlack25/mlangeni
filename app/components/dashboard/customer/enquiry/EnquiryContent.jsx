"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Send, ChevronDown } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  SESSION_OPTIONS,
  normalizeSession,
  isSessionUnavailable,
} from "@/app/components/constants/sessions";

const inputStyles =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-[#797676] outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]";

export default function EnquiryContent() {
  const [customer, setCustomer] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [eventDate, setEventDate] = useState("");
  const [session, setSession] = useState("");
  const [guests, setGuests] = useState("");
  const [message, setMessage] = useState("");

  const [bookedSessions, setBookedSessions] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [prevEventDate, setPrevEventDate] = useState(eventDate);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (eventDate !== prevEventDate) {
    setPrevEventDate(eventDate);
    setSession("");
  }

  useEffect(() => {
    async function loadCustomer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadError("You need to be signed in to submit an enquiry.");
        return;
      }

      const { data, error } = await supabase
        .from("customer")
        .select("first_name, last_name, email, phone_number")
        .eq("user_id", user.id)
        .single();

      if (error) {
        setLoadError(error.message);
        return;
      }

      setCustomer({ ...data, user_id: user.id });
    }

    loadCustomer();
  }, []);

  useEffect(() => {
    if (!eventDate) {
      return;
    }

    async function fetchBooked() {
      setCheckingAvailability(true);

      const { data, error } = await supabase
        .from("enquiries")
        .select("session")
        .eq("event_date", eventDate)
        .eq("status", "confirmed");

      if (error) {
        console.error("Failed to check availability:", error);
        setBookedSessions([]);
      } else {
        setBookedSessions((data ?? []).map((r) => normalizeSession(r.session)));
      }

      setCheckingAvailability(false);
    }

    fetchBooked();
  }, [eventDate]);

  const availableSessions = eventDate
    ? SESSION_OPTIONS.filter(
        (s) => !isSessionUnavailable(s.value, bookedSessions),
      )
    : SESSION_OPTIONS;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customer) return;

    setSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase.from("enquiries").insert({
      user_id: customer.user_id,
      name: `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
      email: customer.email,
      phone: customer.phone_number,
      event_date: eventDate,
      session,
      guests: Number(guests),
      message: message || null,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSubmitted(true);
  }

  return (
    <div
      className="relative min-h-screen w-full bg-fixed bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.75) 40%, rgba(10,10,10,0.92) 100%), url('/images/gallery_images/dining_table.jpeg')",
      }}
    >
      <div className="flex min-h-screen w-full items-center justify-center px-4 py-16">
        {loadError ? (
          <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 p-10 text-center backdrop-blur-md">
            <p className="text-sm text-red-400">{loadError}</p>
          </div>
        ) : submitted ? (
          <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-12 text-center shadow-2xl backdrop-blur-md">
            <CheckCircle2 className="mb-4 text-[#D4AF37]" size={32} />
            <h2 className="text-xl font-semibold text-white">Enquiry sent</h2>
            <p className="mt-2 max-w-sm text-sm text-[#A0A0A0]">
              Thanks — our team will be in touch shortly to discuss your event.
            </p>
          </div>
        ) : (
          <div className="flex w-full max-w-5xl flex-col gap-8">
            <div className="text-center">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
                Enquire
              </p>
              <h1 className="text-3xl font-bold text-white">
                Tell us what you need
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-[#A0A0A0]">
                {customer
                  ? `We already have your details on file${
                      customer.first_name ? `, ${customer.first_name}` : ""
                    }. Just fill in the event specifics below.`
                  : "Loading your details…"}
              </p>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <form
                onSubmit={handleSubmit}
                className="flex-1 rounded-2xl border border-white/10 bg-black/40 p-8 text-left shadow-2xl backdrop-blur-md"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="event_date"
                      className="mb-2 block text-sm font-medium text-white"
                    >
                      Event Date
                    </label>
                    <input
                      id="event_date"
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={`${inputStyles} [&::-webkit-calendar-picker-indicator]:invert`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="session"
                      className="mb-2 block text-sm font-medium text-white"
                    >
                      Session
                    </label>
                    <div className="relative">
                      <select
                        id="session"
                        required
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        disabled={!eventDate || checkingAvailability}
                        className={`${inputStyles} appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <option
                          value=""
                          disabled
                          className="bg-[#0B0A09] text-white"
                        >
                          {!eventDate
                            ? "Select a date first"
                            : checkingAvailability
                              ? "Checking availability…"
                              : availableSessions.length === 0
                                ? "No sessions available"
                                : "Select a time of day"}
                        </option>
                        {availableSessions.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="bg-[#0B0A09] text-white"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="guests"
                      className="mb-2 block text-sm font-medium text-white"
                    >
                      Number of Guests
                    </label>
                    <input
                      id="guests"
                      type="number"
                      min="1"
                      required
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      placeholder="e.g. 80"
                      className={inputStyles}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-medium text-white"
                    >
                      Tell us more{" "}
                      <span className="font-normal text-[#797676]">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Anything specific about the event we should know?"
                      className={`${inputStyles} resize-none`}
                    />
                  </div>
                </div>

                {submitError && (
                  <p className="mt-4 text-sm text-red-400">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={!customer || submitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] sm:w-auto"
                >
                  <Send size={16} />
                  {submitting ? "Sending…" : "Submit Enquiry"}
                </button>
              </form>

              {/* AVAILABILITY TRACKER */}
              <div className="w-full shrink-0 rounded-2xl border border-white/10 bg-black/40 p-8 text-left shadow-2xl backdrop-blur-md lg:w-[300px]">
                <h3 className="mb-1 text-sm font-bold tracking-wide text-white">
                  Session Availability
                </h3>

                {eventDate ? (
                  <>
                    <p className="mb-5 text-[10px] tracking-[0.15em] text-white/30">
                      {new Date(eventDate + "T00:00:00")
                        .toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                        .toUpperCase()}
                    </p>

                    <div className="flex flex-col">
                      {SESSION_OPTIONS.map((opt, i) => {
                        const unavailable = isSessionUnavailable(
                          opt.value,
                          bookedSessions,
                        );
                        return (
                          <div
                            key={opt.value}
                            className={`flex items-center justify-between py-3.5 ${
                              i < SESSION_OPTIONS.length - 1
                                ? "border-b border-white/10"
                                : ""
                            }`}
                          >
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                              {opt.label} Session
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  unavailable ? "bg-red-500" : "bg-emerald-400"
                                }`}
                              />
                              <span
                                className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
                                  unavailable
                                    ? "text-red-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {unavailable ? "Unavailable" : "Available"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-[11px] italic text-white/30">
                    Select a date to view real-time session availability
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
