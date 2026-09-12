"use client";

import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  Info,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  findConflicts,
  formatDateLong,
  formatRangeLabel,
  freeGaps,
  mergeRanges,
} from "./availability";

/**
 * What's already booked on the chosen date, and whether the customer's own
 * time window clashes with it.
 *
 * When the availability lookup is unavailable this renders a NEUTRAL notice,
 * not an error — nothing is blocked, because the database exclusion constraint
 * is the real gate and a missing lookup must never stop someone booking.
 */
export function AvailabilityPanel({
  date,
  ranges = [],
  loading = false,
  unsupported = false,
  error = null,
  startTime,
  endTime,
  onRefresh,
  onPickWindow,
}) {
  const booked = mergeRanges(ranges);
  const conflicts = unsupported ? [] : findConflicts(booked, startTime, endTime);
  const gaps = freeGaps(booked);

  const shell =
    "rounded-2xl border border-mgh-line bg-mgh-surface-2 p-5";

  if (!date) {
    return (
      <div className={shell} aria-live="polite">
        <Header icon={CalendarClock} title="Availability" />
        <p className="mt-3 text-sm leading-relaxed text-mgh-faint">
          Choose a date and we&apos;ll show you what&apos;s already booked that
          day.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={shell} aria-live="polite" aria-busy="true">
        <Header icon={CalendarClock} title="Availability" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-lg bg-mgh-surface-3"
              style={{ width: `${80 - i * 15}%` }}
            />
          ))}
        </div>
        <span className="sr-only">Checking availability…</span>
      </div>
    );
  }

  if (unsupported || error) {
    return (
      <div className={shell} aria-live="polite">
        <Header icon={Info} title="Availability" />
        <p className="mt-3 text-sm leading-relaxed text-mgh-muted">
          {unsupported
            ? "Live availability isn't connected yet. Your date is still fine to submit — we'll confirm the slot when we review your request."
            : "We couldn't check availability just now. Your date is still fine to submit."}
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mgh-gold transition-opacity hover:opacity-75"
          >
            <RefreshCw size={13} aria-hidden="true" />
            Try again
          </button>
        )}
      </div>
    );
  }

  if (booked.length === 0) {
    return (
      <div className={shell} aria-live="polite">
        <Header icon={CalendarCheck} title="Availability" tone="ok" />
        <p className="mt-3 text-sm leading-relaxed text-mgh-muted">
          <span className="font-medium text-mgh-ok">
            {formatDateLong(date)} is completely open.
          </span>{" "}
          Nothing else is booked that day.
        </p>
      </div>
    );
  }

  return (
    <div className={shell} aria-live="polite">
      <Header
        icon={conflicts.length > 0 ? AlertTriangle : CalendarClock}
        title="Availability"
        tone={conflicts.length > 0 ? "danger" : "default"}
      />

      <p className="mt-3 text-xs uppercase tracking-wider text-mgh-faint">
        Already booked on {formatDateLong(date)}
      </p>

      <ul className="mt-2.5 flex flex-wrap gap-2">
        {booked.map((range) => {
          const clashes = conflicts.some(
            (c) => c.start === range.start && c.end === range.end,
          );
          return (
            <li
              key={`${range.start}-${range.end}`}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium tabular-nums",
                clashes
                  ? "border-mgh-danger/50 bg-mgh-danger/10 text-mgh-danger"
                  : "border-mgh-line-strong bg-mgh-surface-3 text-mgh-dim",
              )}
            >
              {formatRangeLabel(range)}
            </li>
          );
        })}
      </ul>

      {gaps.length > 0 && (
        <>
          <p className="mt-5 text-xs uppercase tracking-wider text-mgh-faint">
            Still open {onPickWindow && "— tap to use"}
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {gaps.map((gap) => (
              <li key={`${gap.start}-${gap.end}`}>
                {onPickWindow ? (
                  <button
                    type="button"
                    onClick={() => onPickWindow(gap)}
                    className="rounded-lg border border-mgh-gold/40 bg-mgh-gold/5 px-2.5 py-1.5 text-xs font-medium tabular-nums text-mgh-gold transition-colors hover:bg-mgh-gold/15 focus:outline-none focus:ring-2 focus:ring-mgh-gold/40"
                  >
                    {formatRangeLabel(gap)}
                  </button>
                ) : (
                  <span className="rounded-lg border border-mgh-gold/40 bg-mgh-gold/5 px-2.5 py-1.5 text-xs font-medium tabular-nums text-mgh-gold">
                    {formatRangeLabel(gap)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {conflicts.length > 0 && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-mgh-danger/40 bg-mgh-danger/10 p-3.5 text-xs leading-relaxed text-mgh-danger"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Your {formatRangeLabel({ start: startTime, end: endTime })} window
            overlaps {conflicts.length === 1 ? "a booking" : "bookings"} at{" "}
            {conflicts.map(formatRangeLabel).join(", ")}. Pick another time or
            another date.
          </span>
        </div>
      )}
    </div>
  );
}

function Header({ icon: Icon, title, tone = "default" }) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        size={15}
        aria-hidden="true"
        className={cn(
          tone === "danger" && "text-mgh-danger",
          tone === "ok" && "text-mgh-ok",
          tone === "default" && "text-mgh-gold",
        )}
      />
      <h3 className="text-xs font-semibold uppercase tracking-widest text-mgh-muted">
        {title}
      </h3>
    </div>
  );
}
