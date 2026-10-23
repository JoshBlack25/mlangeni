"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useNotifications } from "@/app/components/dashboard/shared/notifications/hooks/useNotifications";
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
  Tabs,
  Textarea,
  StatusBadge,
  EngravedDate,
  EmptyState,
  Skeleton,
  formatDate,
} from "@/app/components/dashboard/ui";

const TAB_ITEMS = [
  { value: "new", label: "New Enquiry" },
  { value: "history", label: "My Enquiries" },
];

function sessionLabel(session) {
  const normalized = normalizeSession(session);
  const match = SESSION_OPTIONS.find((o) => o.value === normalized);
  return match ? match.label : String(session ?? "").replace(/_/g, " ");
}

export default function EnquiryContent() {
  const { notifyAllAdmins } = useNotifications();

  const [tab, setTab] = useState("new");

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

  // history tab
  const [history, setHistory] = useState(null); // null = not yet loaded
  const [historyError, setHistoryError] = useState(null);

  if (eventDate !== prevEventDate) {
    setPrevEventDate(eventDate);
    setSession("");
  }

  // Load enquiry history when the history tab is first opened.
  useEffect(() => {
    if (tab !== "history" || history !== null) return;

    let active = true;

    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setHistory([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("enquiries")
        .select("id, event_date, session, guests, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (fetchError) {
        setHistoryError("Couldn't load your enquiries.");
        setHistory([]);
      } else {
        setHistory(data ?? []);
      }
    }

    loadHistory();
    return () => { active = false; };
  }, [tab, history]);

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

    // Notify all admins of the new enquiry (non-blocking).
    notifyAllAdmins({
      category: "enquiry",
      title: "New Enquiry Received",
      message: `${customer.first_name ?? "A customer"} submitted an enquiry for ${formatDate(eventDate)}.`,
      linkUrl: "/dashboard/admin/enquiries",
    }).catch((err) => console.error("Admin enquiry notification failed:", err));

    // Reset form and switch to history so they can see what they sent.
    setEventDate("");
    setSession("");
    setGuests("");
    setMessage("");
    setHistory(null); // force history to reload with the new entry
    setTab("history");
  }

  return (
    <div>
      <PageHeader
        title="Enquiries"
        lead={
          tab === "new" && !loadError && customer
            ? `We already have your details on file${
                customer.first_name ? `, ${customer.first_name}` : ""
              }. Just fill in the event specifics below.`
            : undefined
        }
      />

      <Tabs
        items={TAB_ITEMS}
        value={tab}
        onChange={setTab}
        label="Enquiry sections"
        className="mb-8"
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
      ) : tab === "history" ? (
        <Panel>
          <PanelHeader title="My Enquiries" className="mb-4" />
          {history === null ? (
            <ul className="divide-y divide-mgh-line-soft">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="flex items-center gap-4 py-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-40 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </li>
              ))}
            </ul>
          ) : historyError ? (
            <p role="alert" className="text-sm text-mgh-danger">{historyError}</p>
          ) : history.length === 0 ? (
            <EmptyState title="No enquiries yet">
              Submit your first enquiry using the New Enquiry tab.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-mgh-line-soft">
              {history.map((enquiry) => (
                <li key={enquiry.id} className="flex items-center gap-4 py-4">
                  <EngravedDate date={enquiry.event_date} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm tabular-nums text-mgh-text">
                      {sessionLabel(enquiry.session)} · {enquiry.guests} guests
                    </p>
                    <p className="mt-0.5 text-caption text-mgh-dim">
                      Submitted {formatDate(enquiry.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={enquiry.status} />
                </li>
              ))}
            </ul>
          )}
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
