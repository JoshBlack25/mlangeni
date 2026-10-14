"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import PendingEnquiries from "./PendingEnquiries";
import {
  SESSION_OPTIONS,
  normalizeSession,
  isSessionUnavailable,
} from "@/app/components/constants/sessions";
import {
  PageHeader,
  Panel,
  PanelHeader,
  Button,
  Field,
  Input,
  Select,
  Textarea,
  StatusBadge,
  EmptyState,
  formatDate,
} from "@/app/components/dashboard/ui";

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

      // Must be the RPC: availability depends on OTHER customers' confirmed
      // enquiries, and a signed-in customer can only see their own rows. A
      // table read here reports every date as free instead of erroring.
      const { data, error } = await supabase.rpc("get_booked_sessions", {
        p_date: eventDate,
      });

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
    <div>
      <PageHeader
        title="Tell us what you need"
        lead={
          loadError || submitted
            ? undefined
            : customer
              ? `We already have your details on file${
                  customer.first_name ? `, ${customer.first_name}` : ""
                }. Just fill in the event specifics below.`
              : "Loading your details…"
        }
      />

      {loadError ? (
        <Panel>
          <p
            role="alert"
            className="mx-auto max-w-sm py-10 text-center text-sm leading-relaxed text-mgh-danger"
          >
            {loadError}
          </p>
        </Panel>
      ) : submitted ? (
        <Panel>
          <EmptyState title="Enquiry sent">
            Thanks. Our team will be in touch shortly to discuss your event.
          </EmptyState>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <Panel>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Event Date" required>
                  <Input
                    id="event_date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="[color-scheme:dark]"
                  />
                </Field>

                <Field label="Session" required>
                  <Select
                    id="session"
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    disabled={!eventDate || checkingAvailability}
                  >
                    <option value="" disabled className="bg-mgh-surface-2">
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
                        className="bg-mgh-surface-2"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Number of Guests" required className="sm:col-span-2">
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    max="5000"
                    inputMode="numeric"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    placeholder="e.g. 80"
                    className="tabular-nums"
                  />
                </Field>

                <Field
                  label={
                    <>
                      Tell us more{" "}
                      <span className="font-normal text-mgh-dim">(optional)</span>
                    </>
                  }
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="message"
                    rows={4}
                    value={message}
                    maxLength={2000}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Anything specific about the event we should know?"
                    className="resize-none"
                  />
                </Field>
              </div>

              {submitError && (
                <p role="alert" className="mt-5 text-sm text-mgh-danger">
                  {submitError}
                </p>
              )}

              <div className="mt-7 border-t border-mgh-line-soft pt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!customer}
                  loading={submitting}
                  className="w-full sm:w-auto"
                >
                  <Send size={16} aria-hidden="true" />
                  {submitting ? "Sending…" : "Submit Enquiry"}
                </Button>
              </div>
            </form>
          </Panel>

          {/* SIDEBAR — what you've already sent, then what's still free */}
          <aside className="flex flex-col gap-8">
            <PendingEnquiries />

            {/* AVAILABILITY TRACKER */}
            <Panel>
              <PanelHeader
                title="Session Availability"
                description={
                  eventDate
                    ? formatDate(eventDate, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : undefined
                }
                className="mb-3"
              />

              {eventDate ? (
                <ul className="divide-y divide-mgh-line-soft">
                  {SESSION_OPTIONS.map((opt) => {
                    const unavailable = isSessionUnavailable(
                      opt.value,
                      bookedSessions,
                    );
                    return (
                      <li
                        key={opt.value}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <span className="text-sm text-mgh-text">
                          {opt.label} Session
                        </span>
                        <StatusBadge
                          status={unavailable ? "unavailable" : "available"}
                          label={unavailable ? "Unavailable" : "Available"}
                          tone={unavailable ? "danger" : "ok"}
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-mgh-muted">
                  Select a date to view real-time session availability
                </p>
              )}
            </Panel>
          </aside>
        </div>
      )}
    </div>
  );
}
