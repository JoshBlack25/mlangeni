"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Info,
  MapPin,
  Pencil,
  Sparkles,
  Users,
} from "lucide-react";
import BookingSuccessModal from "@/app/components/dashboard/customer/BookingSuccessModal";
import { sendQuoteEmail } from "@/services/quoteEmailService";
import { useMenu } from "./MenuContext";
import { rowDisplayName } from "./constants";
import { computeTotals, courseGroups, formatZAR, guestCount } from "./pricing";
import { formatDateLong, formatRangeLabel, toDateKey } from "./availability";
import { submitMenuOrder } from "./submitQuote";
import { validateEventDetails } from "./validation";

const EVENT_DETAILS_STEP = 4;

export function QuoteStep() {
  const { state, dispatch } = useMenu();

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successSummary, setSuccessSummary] = useState("");
  const [emailNote, setEmailNote] = useState("");

  const guests = guestCount(state.guests);
  const groups = useMemo(
    () => courseGroups(state.selections, guests),
    [state.selections, guests],
  );
  const totals = useMemo(
    () => computeTotals(state.selections, guests),
    [state.selections, guests],
  );

  const selectedEventType = state.eventTypes.find(
    (et) => String(et.event_id) === String(state.eventTypeId),
  );
  const eventTypeName = selectedEventType
    ? rowDisplayName(selectedEventType, "event_id")
    : "Custom Event";

  const goEditDetails = () =>
    dispatch({ type: "GO_TO_STEP", payload: EVENT_DETAILS_STEP });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Re-run the same rules the details step used, in case anything changed.
    const errors = validateEventDetails(state, { today: new Date() });
    if (Object.keys(errors).length > 0) {
      setSendError(
        "Some event details are missing or invalid. Please review them before submitting.",
      );
      goEditDetails();
      return;
    }

    setSending(true);
    setSendError("");

    try {
      const { orderId } = await submitMenuOrder(state);

      // The booking is saved. Show success now — the email is a courtesy that
      // must never gate or fail this.
      setSuccessSummary(
        `Quote request #${orderId} submitted for ${eventTypeName} with ${guests} guest${guests === 1 ? "" : "s"}.`,
      );
      setShowSuccessModal(true);
      dispatch({ type: "SEND_QUOTE" });

      sendQuoteEmail({
        orderId,
        customer: {
          name: state.contactName.trim(),
          email: state.contactEmail || state.authUser?.email,
          phone: state.contactPhone?.trim() || undefined,
        },
        event: {
          date: toDateKey(state.eventDate),
          startTime: state.startTime,
          endTime: state.endTime,
          typeName: eventTypeName,
          location: state.eventLocation.trim(),
          guests,
          notes: state.notes?.trim() || undefined,
        },
        items: groups.flatMap((g) =>
          g.rows.map((r) => ({
            name: r.name,
            course: r.course,
            unitPrice: r.unitPrice,
            quantity: r.quantity,
          })),
        ),
        totals: {
          perGuest: totals.perGuest,
          subtotal: totals.subtotal,
          total: totals.total,
        },
      })
        .then((result) => {
          // "redirected" means a sandbox build sent it to the developer
          // inbox — delivered, but not to this customer.
          if (!result.ok || result.customer !== "sent") {
            setEmailNote(
              "We couldn't email you a copy of this request, but it's safely in our system — you can view it any time under your orders.",
            );
          }
        })
        .catch((err) => {
          console.warn("[menu] quote email failed:", err);
        });
    } catch (err) {
      setSendError(err.message || "An unexpected error occurred.");
      if (err.code === "23P01") goEditDetails();
    } finally {
      setSending(false);
    }
  };

  const card = "rounded-2xl border border-mgh-line bg-mgh-surface";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <BookingSuccessModal
        isOpen={showSuccessModal}
        title="Your menu request is in"
        message="Your custom booking has been submitted. You can return to the dashboard or jump straight to your orders page to review it again."
        orderLabel={successSummary || "Your quote request has been sent."}
        note={emailNote || undefined}
        onClose={() => {
          setShowSuccessModal(false);
          setEmailNote("");
          dispatch({ type: "RESET" });
        }}
      />

      <header className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-mgh-gold">
          Step 6 of 6
        </p>
        <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-mgh-text md:text-4xl">
          Menu &amp; Quote Summary
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mgh-muted md:text-base">
          Review everything before sending your request to Mlangeni Grand
          Hospitality.
        </p>
      </header>

      {/* ── Event at a glance ──────────────────────────────────────── */}
      <div className={`${card} mb-6 p-6`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mgh-gold">
            Your Event
          </h3>
          <button
            type="button"
            onClick={goEditDetails}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-mgh-dim transition-colors hover:text-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
          >
            <Pencil size={12} aria-hidden="true" />
            Edit
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          <Metric icon={Users} label="Guests" value={`${guests} people`} />
          <Metric icon={Sparkles} label="Occasion" value={eventTypeName} />
          <Metric
            icon={CalendarDays}
            label="Date"
            value={formatDateLong(state.eventDate) || "—"}
          />
          <Metric
            icon={Clock}
            label="Time"
            value={formatRangeLabel({
              start: state.startTime,
              end: state.endTime,
            })}
          />
        </dl>

        <div className="mt-5 flex items-start gap-2.5 border-t border-mgh-line-soft pt-5">
          <MapPin
            size={14}
            className="mt-0.5 shrink-0 text-mgh-gold"
            aria-hidden="true"
          />
          <p className="text-sm text-mgh-muted">
            {state.eventLocation || "No venue given"}
          </p>
        </div>

        {state.notes?.trim() && (
          <div className="mt-4 rounded-xl border border-mgh-line-soft bg-mgh-surface-2 p-4">
            <p className="text-[10px] uppercase tracking-widest text-mgh-faint">
              Notes for the kitchen
            </p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-mgh-muted">
              {state.notes.trim()}
            </p>
          </div>
        )}
      </div>

      {/* ── Itemised menu ──────────────────────────────────────────── */}
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.category} className={`${card} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-mgh-line-soft bg-mgh-surface-2 px-5 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-mgh-gold">
                {group.label}
              </h3>
              <span className="text-[10px] uppercase tracking-wider text-mgh-faint">
                {group.rows.length}{" "}
                {group.rows.length === 1 ? "item" : "items"}
              </span>
            </div>

            <ul className="divide-y divide-mgh-line-soft px-5">
              {group.rows.map((row) => (
                <li
                  key={row.item.item_id}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-mgh-text">
                    {row.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-mgh-faint">
                    {formatZAR(row.unitPrice)} × {row.quantity}
                  </span>
                  <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-mgh-gold">
                    {formatZAR(row.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Totals ─────────────────────────────────────────────────── */}
      <div className={`${card} mt-6 p-6`}>
        <dl className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between text-mgh-muted">
            <dt>Per guest</dt>
            <dd className="tabular-nums">{formatZAR(totals.perGuest)}</dd>
          </div>
          <div className="flex items-center justify-between text-mgh-muted">
            <dt>Guests</dt>
            <dd className="tabular-nums">× {guests}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-mgh-gold/40 pt-4 text-mgh-gold">
            <dt className="text-xs font-semibold uppercase tracking-widest">
              Estimated total
            </dt>
            <dd className="font-serif text-2xl font-medium tabular-nums">
              {formatZAR(totals.total)}
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Contact ────────────────────────────────────────────────── */}
      <div className={`${card} mt-6 p-6`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-mgh-gold">
            Contact
          </h3>
          <button
            type="button"
            onClick={goEditDetails}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-mgh-dim transition-colors hover:text-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
          >
            <Pencil size={12} aria-hidden="true" />
            Edit
          </button>
        </div>

        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <ContactItem label="Name" value={state.contactName} />
          <ContactItem
            label="Email"
            value={state.contactEmail || state.authUser?.email}
          />
          <ContactItem
            label="Phone"
            value={state.contactPhone || "Not provided"}
          />
        </dl>
      </div>

      {/* ── Notice ─────────────────────────────────────────────────── */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-mgh-gold/30 bg-mgh-gold/5 p-4 text-xs leading-6 text-mgh-muted">
        <Info
          size={18}
          className="mt-0.5 shrink-0 text-mgh-gold"
          aria-hidden="true"
        />
        <span>
          <strong className="text-mgh-text">Note:</strong> This is a request,
          not a confirmed booking. The estimate above covers food and beverage
          only — our catering team will contact you to confirm pricing for
          staff, transport and any special arrangements.
        </span>
      </div>

      {sendError && (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-mgh-danger/40 bg-mgh-danger/10 p-4 text-sm text-mgh-danger"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {sendError}
        </p>
      )}

      <div className="mt-10 flex flex-col-reverse items-stretch gap-4 border-t border-mgh-line-soft pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={sending}
          onClick={() => dispatch({ type: "PREV_STEP" })}
          className="rounded-xl border border-mgh-line-strong px-6 py-3 text-xs font-semibold uppercase tracking-widest text-mgh-muted transition-colors hover:border-mgh-text hover:text-mgh-text focus:outline-none focus:ring-2 focus:ring-mgh-gold/40 disabled:opacity-50"
        >
          ← Edit Details
        </button>

        <button
          type="submit"
          disabled={sending || totals.itemCount === 0}
          className="rounded-xl border border-mgh-gold bg-mgh-gold px-8 py-3 text-xs font-semibold uppercase tracking-widest text-mgh-gold-ink transition-all hover:bg-transparent hover:text-mgh-gold focus:outline-none focus:ring-2 focus:ring-mgh-gold/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-mgh-gold disabled:hover:text-mgh-gold-ink"
        >
          {sending ? "Submitting…" : "Confirm & Send Request →"}
        </button>
      </div>
    </form>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-mgh-faint">
        <Icon size={11} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-mgh-text">{value}</dd>
    </div>
  );
}

function ContactItem({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-widest text-mgh-faint">
        {label}
      </dt>
      <dd className="mt-1 truncate text-mgh-muted">{value || "—"}</dd>
    </div>
  );
}
