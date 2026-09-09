"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display } from "next/font/google";
import { supabase } from "@/services/supabaseClient";
import {
  getDummyConfirmedOrders,
  mergeOrdersById,
  subscribeDummyInvoicePayments,
} from "@/app/utils/dummyInvoicePayments";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const BOOKED_EVENT_COLOR = "#c5a637";

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
    color: BOOKED_EVENT_COLOR,
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

// CalendarCell: renders one day square, its events, and "today" marker
function CalendarCell({ cell, index, eventsByDate }) {
  const events = eventsByDate[cell.key] || [];
  const isToday = cell.key === TODAY_KEY;
  const visible = events.slice(0, PILL_MAX);
  const extra = events.length - PILL_MAX;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index % 7) * 0.03 }}
      className={`flex min-h-[90px] flex-col overflow-hidden border border-white/5 p-2 ${
        cell.active ? "bg-[#111111] text-white" : "bg-[#0e0e0e] text-white/35"
      } ${events.length && cell.active ? "ring-1 ring-[#D4AF37]/20" : ""}`}
    >
      {isToday ? (
        <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-[0.7rem] font-bold text-[#0A0A0A]">
          {cell.day}
        </div>
      ) : (
        <span className="mb-2 block text-center text-[0.7rem]">
          {cell.day}
        </span>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-1">
        {visible.map((event) => (
          <div
            key={event.id}
            title={event.title}
            className="w-full overflow-hidden truncate rounded-[3px] px-1.5 py-0.5 text-[0.62rem] leading-tight text-[#0A0A0A]"
            style={{ backgroundColor: event.color }}
          >
            {event.title}
          </div>
        ))}
        {extra > 0 ? (
          <span className="mt-auto text-right text-[0.55rem] leading-none text-[#D4AF37]">
            +{extra} more
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

// CalendarWidget: main calendar UI with header, navigation and the grid
function CalendarWidget({ year, month, eventsByDate, onPrev, onNext }) {
  const cells = useMemo(() => buildCells(year, month), [year, month]);

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#161616] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.45)] md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#D4AF37]/80">
            Event Calendar
          </p>
          <h3 className="text-3xl font-bold text-white md:text-4xl">
            {MONTH_NAMES[month]}{" "}
            <span className="font-normal text-white/70">{year}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/80 transition hover:border-[#D4AF37]/40 hover:text-white"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/80 transition hover:border-[#D4AF37]/40 hover:text-white"
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-7 border-b border-white/10 bg-black/30">
          {DOW.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-bold uppercase tracking-[0.22em] text-white/70"
            >
              {day}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-7 gap-px bg-white/10"
          >
            {cells.map((cell, index) => (
              <CalendarCell
                key={cell.key}
                cell={cell}
                index={index}
                eventsByDate={eventsByDate}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// EventsSidebar: lists all events for the given month in a sidebar
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
    <aside className="w-full rounded-[24px] border border-white/10 bg-[#161616] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.45)] md:p-8 lg:max-w-[390px]">
      <h3 className="mb-8 text-lg font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
        {MONTH_NAMES[month]} events
      </h3>

      {loading ? (
        <p className="m-0 text-sm italic text-white/45">
          Loading booked events...
        </p>
      ) : error ? (
        <p className="m-0 text-sm italic text-red-300">{error}</p>
      ) : monthEvents.length === 0 ? (
        <p className="m-0 text-sm italic text-white/45">
          No booked events this month.
        </p>
      ) : (
        <motion.ul className="m-0 flex list-none flex-col gap-7 p-0" layout>
          <AnimatePresence>
            {monthEvents.map((event, index) => (
              <motion.li
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3"
              >
                <span
                  className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div>
                  <p className="mb-1 text-lg tracking-[0.04em] text-white/90">
                    {event.day} {MONTH_NAMES[month].slice(0, 3)} -{" "}
                    {event.title}
                  </p>
                  <p className="m-0 text-sm tracking-[0.1em] text-white/50">
                    {event.time}
                  </p>
                  {event.location ? (
                    <p className="m-0 mt-1 text-xs tracking-[0.08em] text-white/35">
                      {event.location}
                    </p>
                  ) : null}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
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
    <section
      className={`w-full bg-[#0A0A0A] px-5 py-20 text-white md:px-8 md:py-28 ${playfair.className}`}
    >
      <div className="mx-auto w-full max-w-[1536px]">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#D4AF37]/80">
            Plan Ahead
          </p>
          <h2 className="text-l font-regular md:text-xl">
            View upcoming dates and event details in one place.
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)] lg:items-start">
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
