"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSupabase } from "@/services/lazySupabase";
import { cn } from "@/lib/utils";
import {
  getDummyConfirmedOrders,
  mergeOrdersById,
  subscribeDummyInvoicePayments,
} from "@/app/utils/dummyInvoicePayments";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

// Names for months used in headers and sidebar
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Day-of-week labels and display limits
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PILL_MAX = 2; // max event pills shown per cell before "+n more"

const NOW = new Date();
const TODAY_KEY = dateKey(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

// Helper: produce a stable key string for a date in YYYY-MM-DD form
function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatTime(value) {
  if (!value) return "TBC";

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "TBC"
    : date.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      });
}

function formatEventTime(startTime, endTime) {
  const startLabel = formatTime(startTime);
  const endLabel = formatTime(endTime);

  if (startLabel === "TBC" && endLabel === "TBC") {
    return "Time to be confirmed";
  }

  return `${startLabel} - ${endLabel}`;
}

function mapOrderToEvent(order) {
  return {
    id: order.order_id,
    title: `${order.event_type?.event_name ?? "Event"} booked`,
    time: formatEventTime(order.start_time, order.end_time),
    location: order.event_location,
    guests: order.number_of_guest,
  };
}

function groupOrdersByDate(orders) {
  const eventsByDate = {};

  for (const order of orders ?? []) {
    if (!order.event_date) continue;

    eventsByDate[order.event_date] = [
      ...(eventsByDate[order.event_date] ?? []),
      mapOrderToEvent(order),
    ];
  }

  return eventsByDate;
}

function buildCells(year, month) {
  // Build an array of calendar cell objects for the given month/year.
  // Includes preceding and trailing days to fill the week grid.
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstDow - 1; i >= 0; i -= 1) {
    const day = daysInPrev - i;
    const [py, pm] = month === 0 ? [year - 1, 11] : [year, month - 1];
    cells.push({ day, active: false, key: dateKey(py, pm, day) });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, active: true, key: dateKey(year, month, day) });
  }

  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    const [ny, nm] = month === 11 ? [year + 1, 0] : [year, month + 1];
    for (let day = 1; day <= remaining; day += 1) {
      cells.push({ day, active: false, key: dateKey(ny, nm, day) });
    }
  }

  return cells;
}

// CalendarCell: one day, its booked events, and the "today" marker
function CalendarCell({ cell, eventsByDate, monthName }) {
  const events = eventsByDate[cell.key] || [];
  const isToday = cell.key === TODAY_KEY;
  const visible = events.slice(0, PILL_MAX);
  const extra = events.length - PILL_MAX;
  const booked = events.length > 0 && cell.active;

  return (
    <div
      role="gridcell"
      aria-label={
        cell.active
          ? `${cell.day} ${monthName}${isToday ? ", today" : ""}${
              booked ? `, ${events.length} booked` : ""
            }`
          : undefined
      }
      aria-hidden={cell.active ? undefined : true}
      className={cn(
        "flex min-h-12 flex-col bg-mgh-surface p-1 sm:min-h-24 sm:p-2",
        !cell.active && "bg-mgh-bg",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mx-auto grid size-7 place-items-center rounded-full text-[0.8rem] tabular-nums sm:mx-0",
          cell.active ? "text-mgh-text" : "text-mgh-dim/60",
          isToday && "ring-1 ring-mgh-gold text-mgh-gold",
        )}
      >
        {cell.day}
      </span>

      {/* Phones: a gold rule under a booked day. The list below has the detail. */}
      {booked && <span aria-hidden="true" className="mx-auto mt-1 h-0.5 w-4 rounded-full bg-mgh-gold sm:hidden" />}

      <div aria-hidden="true" className="mt-1 hidden min-h-0 flex-1 flex-col gap-1 sm:flex">
        {cell.active &&
          visible.map((event) => (
            <span
              key={event.id}
              title={event.title}
              className="truncate border-l-2 border-mgh-gold bg-mgh-gold/10 px-1.5 py-0.5 text-[0.7rem] leading-tight text-mgh-text"
            >
              {event.title}
            </span>
          ))}
        {cell.active && extra > 0 ? (
          <span className="mt-auto text-[0.7rem] leading-none text-mgh-muted">+{extra} more</span>
        ) : null}
      </div>
    </div>
  );
}

// CalendarWidget: month heading, navigation and the grid
function CalendarWidget({ year, month, eventsByDate, onPrev, onNext }) {
  const cells = useMemo(() => buildCells(year, month), [year, month]);
  const weeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cells]);

  const navButton = cn(
    "inline-flex h-10 items-center gap-1.5 rounded-control border border-mgh-line-strong px-3 text-sm text-mgh-muted transition-colors hover:border-mgh-muted hover:text-mgh-text",
    focusRing,
  );

  return (
    <div className="rounded-card border border-mgh-line bg-mgh-surface p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h3 aria-live="polite" className="font-serif text-3xl font-normal text-mgh-text md:text-4xl">
          {MONTH_NAMES[month]} <span className="text-mgh-muted">{year}</span>
        </h3>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrev} className={navButton}>
            <ChevronLeft size={16} aria-hidden="true" />
            <span className="max-sm:sr-only">Previous</span>
            <span className="sr-only"> month</span>
          </button>
          <button type="button" onClick={onNext} className={navButton}>
            <span className="max-sm:sr-only">Next</span>
            <span className="sr-only"> month</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div role="grid" aria-label={`${MONTH_NAMES[month]} ${year}`} className="overflow-hidden rounded-control border border-mgh-line">
        <div role="rowgroup">
        <div role="row" className="grid grid-cols-7 border-b border-mgh-line">
          {DOW.map((day) => (
            <span
              key={day}
              role="columnheader"
              className="py-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-mgh-muted sm:text-left sm:px-2"
            >
              <span aria-hidden="true" className="sm:hidden">{day.slice(0, 1)}</span>
              <span className="max-sm:sr-only">{day}</span>
            </span>
          ))}
        </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="rowgroup"
            className="flex flex-col gap-px bg-mgh-line"
          >
            {weeks.map((week) => (
              <div key={week[0].key} role="row" className="grid grid-cols-7 gap-px">
                {week.map((cell) => (
                  <CalendarCell
                    key={cell.key}
                    cell={cell}
                    eventsByDate={eventsByDate}
                    monthName={MONTH_NAMES[month]}
                  />
                ))}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// EventsSidebar: the month's booked events as a list, led by their dates
function EventsSidebar({ year, month, eventsByDate, loading, error }) {
  const monthEvents = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;

    return Object.entries(eventsByDate)
      .filter(([key]) => key.startsWith(prefix))
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([key, events]) => {
        const day = Number.parseInt(key.split("-")[2], 10);
        return events.map((event) => ({ ...event, day }));
      });
  }, [eventsByDate, year, month]);

  return (
    <aside aria-labelledby="month-events-title" className="w-full">
      <h3 id="month-events-title" className="border-b border-mgh-line pb-4 font-serif text-2xl text-mgh-text">
        {MONTH_NAMES[month]} events
      </h3>

      {loading ? (
        <div role="status" className="flex flex-col gap-5 pt-6">
          <span className="sr-only">Loading booked events...</span>
          {[0, 1, 2].map((i) => (
            <span key={i} aria-hidden="true" className="mgh-shimmer block h-12 rounded-control" />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="pt-6 text-sm text-mgh-danger">{error}</p>
      ) : monthEvents.length === 0 ? (
        <p className="pt-6 font-serif text-lg italic text-mgh-muted">No booked events this month.</p>
      ) : (
        <ul className="divide-y divide-mgh-line-soft">
          {monthEvents.map((event, index) => (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-5 py-5"
            >
              <span className="flex w-11 shrink-0 flex-col items-center">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-mgh-muted">
                  {MONTH_NAMES[month].slice(0, 3)}
                </span>
                <span className="font-serif text-3xl leading-none tabular-nums text-mgh-text">{event.day}</span>
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[15px] text-mgh-text">{event.title}</p>
                <p className="mt-1 text-sm tabular-nums text-mgh-muted">{event.time}</p>
                {event.location ? (
                  <p className="mt-0.5 truncate text-sm text-mgh-dim">{event.location}</p>
                ) : null}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </aside>
  );
}

// Calendar: top-level container managing visible month and layout
export default function Calendar() {
  const [eventsByDate, setEventsByDate] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [cursor, setCursor] = useState({
    year: NOW.getFullYear(),
    month: NOW.getMonth(),
  });

  useEffect(() => {
    let mounted = true;

    async function loadBookedEvents() {
      try {
        setLoadingEvents(true);
        setEventsError(null);

        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            order_id,
            event_date,
            start_time,
            end_time,
            event_location,
            number_of_guest,
            event_type ( event_name )
          `,
          )
          .eq("status", "confirmed")
          .order("event_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(200);

        const confirmedOrders = mergeOrdersById(
          data ?? [],
          getDummyConfirmedOrders(),
        );

        if (mounted) {
          setEventsByDate(groupOrdersByDate(confirmedOrders));
          setEventsError(
            error && confirmedOrders.length === 0
              ? error.message || "Unable to load booked events right now."
              : null,
          );
        }
      } catch (err) {
        if (mounted) {
          setEventsError(
            err.message || "Unable to load booked events right now.",
          );
          setEventsByDate({});
        }
      } finally {
        if (mounted) {
          setLoadingEvents(false);
        }
      }
    }

    loadBookedEvents();
    const unsubscribe = subscribeDummyInvoicePayments(loadBookedEvents);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handlePrev = () => {
    setCursor(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  };

  const handleNext = () => {
    setCursor(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  };

  return (
    <section aria-labelledby="calendar-title" className="w-full bg-mgh-bg px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="mb-12 max-w-2xl md:mb-16">
          <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-mgh-gold">
            Plan Ahead
          </p>
          <h2
            id="calendar-title"
            className="text-balance font-serif text-[2rem] font-normal leading-[1.15] text-mgh-text md:text-[2.75rem]"
          >
            View upcoming dates and event details in one place.
          </h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)] lg:gap-14">
          <CalendarWidget
            year={cursor.year}
            month={cursor.month}
            eventsByDate={eventsByDate}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          <EventsSidebar
            year={cursor.year}
            month={cursor.month}
            eventsByDate={eventsByDate}
            loading={loadingEvents}
            error={eventsError}
          />
        </div>
      </div>
    </section>
  );
}
