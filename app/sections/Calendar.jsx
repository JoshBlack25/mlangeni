/* eslint-disable react/prop-types */
"use client";

import { useMemo, useState } from "react";

const EVENT_DB = {
  "2026-03-13": [
    { id: 1, title: "Dara Wedding", time: "9:00–13:00", color: "#9e8329" },
    { id: 2, title: "Joshua's Birthday", time: "15:00–17:00", color: "#b89b33" },
    { id: 3, title: "MGH Company Dinner", time: "19:00–20:00", color: "#c5a637" },
  ],
  "2026-03-15": [
    { id: 4, title: "CPUT AGC Conference", time: "9:00–12:00", color: "#c5a637" },
  ],
  "2026-03-26": [
    { id: 5, title: "CPUT FID AGM", time: "10:00–13:00", color: "#c5a637" },
  ],
};

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

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PILL_MAX = 2;

const NOW = new Date();
const TODAY_KEY = dateKey(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildCells(year, month) {
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

function CalendarCell({ cell }) {
  const events = EVENT_DB[cell.key] || [];
  const isToday = cell.key === TODAY_KEY;
  const visible = events.slice(0, PILL_MAX);
  const extra = events.length - PILL_MAX;

  return (
    <div
      className={`flex min-h-[90px] flex-col overflow-hidden border border-white/5 p-2 ${
        cell.active ? "bg-[#111111] text-white" : "bg-[#0e0e0e] text-white/35"
      } ${events.length && cell.active ? "ring-1 ring-[#D4AF37]/20" : ""}`}
    >
      {isToday ? (
        <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37] text-[0.7rem] font-bold text-[#0A0A0A]">
          {cell.day}
        </div>
      ) : (
        <span className="mb-2 block text-center text-[0.7rem]">{cell.day}</span>
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
    </div>
  );
}

function CalendarWidget({ year, month, onPrev, onNext }) {
  const cells = useMemo(() => buildCells(year, month), [year, month]);

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#161616] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.45)] md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#D4AF37]/80">
            Event Calendar
          </p>
          <h3 className="text-3xl font-bold text-white md:text-4xl">
            {MONTH_NAMES[month]} <span className="font-normal text-white/70">{year}</span>
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
            <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-[0.22em] text-white/70">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-white/10">
          {cells.map((cell) => (
            <CalendarCell key={cell.key} cell={cell} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventsSidebar({ year, month }) {
  const monthEvents = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;

    return Object.entries(EVENT_DB)
      .filter(([key]) => key.startsWith(prefix))
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([key, events]) => {
        const day = Number.parseInt(key.split("-")[2], 10);
        return events.map((event) => ({ ...event, day }));
      });
  }, [year, month]);

  return (
    <aside className="w-full rounded-[24px] border border-white/10 bg-[#161616] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.45)] md:p-8 lg:max-w-[390px]">
      <h3 className="mb-8 text-lg font-bold uppercase tracking-[0.08em] text-[#D4AF37]">
        {MONTH_NAMES[month]}'s events
      </h3>

      {monthEvents.length === 0 ? (
        <p className="m-0 text-sm italic text-white/45">No events this month.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-7 p-0">
          {monthEvents.map((event) => (
            <li key={event.id} className="flex items-start gap-3">
              <span
                className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: event.color }}
              />
              <div>
                <p className="mb-1 text-lg tracking-[0.04em] text-white/90">
                  {event.day} {MONTH_NAMES[month].slice(0, 3)} – {event.title}
                </p>
                <p className="m-0 text-sm tracking-[0.1em] text-white/50">
                  {event.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default function Calendar() {
  const [cursor, setCursor] = useState({
    year: NOW.getFullYear(),
    month: NOW.getMonth(),
  });

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
    <section className="w-full bg-[#0A0A0A] px-5 py-20 text-white md:px-8 md:py-28">
      <div className="mx-auto w-full max-w-[1536px]">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#D4AF37]/80">
            Plan Ahead
          </p>
          <h2 className="text-3xl font-bold md:text-5xl">
            View upcoming dates and event details in one place.
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)] lg:items-start">
          <CalendarWidget
            year={cursor.year}
            month={cursor.month}
            onPrev={handlePrev}
            onNext={handleNext}
          />
          <EventsSidebar year={cursor.year} month={cursor.month} />
        </div>
      </div>
    </section>
  );
}
