"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";
import {supabase} from "@/services/supabaseClient";

// Static placeholder — orders don't have a per-event photo in the schema yet
const PLACEHOLDER_IMAGE = "/images/gallery_images/food_1.jpg";

function statusLabel(status) {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function statusStyles(status) {
  if (status === "confirmed" || status === "in_progress") {
    return "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]";
  }
  return "border-white/20 bg-white/10 text-[#A0A0A0]"; // pending, completed
}

function getDaysUntil(dateStr) {
  const target = new Date(dateStr);
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      const today = new Date().toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("orders")
        .select(
          "order_id, status, event_date, event_location, event_type(event_name)",
        )
        .gte("event_date", today)
        .neq("status", "cancelled")
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(3);

      if (error) {
        setError(error.message);
      } else {
        setEvents(data ?? []);
      }
    }

    fetchEvents();
  }, []);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center backdrop-blur-md">
        <p className="text-sm text-red-400">Couldn&apos;t load your events</p>
        <p className="mt-1 text-xs text-[#797676]">{error}</p>
      </div>
    );
  }

  if (events === null) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <p className="text-sm text-[#797676]">Loading upcoming events…</p>
      </div>
    );
  }

  const [next, ...upNext] = events;

  if (!next) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
        <CalendarDays className="mb-4 text-[#D4AF37]" size={28} />
        <h3 className="text-lg font-semibold text-white">
          No events booked yet
        </h3>
        <p className="mt-2 max-w-xs text-sm text-[#A0A0A0]">
          Once you book your first event with us, it&apos;ll show up right here.
        </p>
        <Link
          href="/dashboard/customer/bookings"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
        >
          Start a new booking
        </Link>
      </div>
    );
  }

  const daysUntil = getDaysUntil(next.event_date);
  const countdownLabel =
    daysUntil === 0
      ? "Today"
      : daysUntil === 1
        ? "Tomorrow"
        : `in ${daysUntil} days`;

  return (
    <Link
      href={`/dashboard/customer/orders/${next.order_id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
    >
      {/* HERO SLOT — next event */}
      <div className="relative flex min-h-[220px] flex-1 flex-col justify-end overflow-hidden p-6">
        <img
          src={PLACEHOLDER_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-[#0A0A0A]/10" />

        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles(
                next.status,
              )}`}
            >
              {statusLabel(next.status)}
            </span>

            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
              {countdownLabel}
            </span>
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
            Next event
          </p>

          <h3 className="mt-1 text-xl font-semibold leading-snug text-white">
            {next.event_type?.event_name ?? "Event"}
          </h3>

          <div className="mt-3 flex items-center gap-4 text-sm text-[#A0A0A0]">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              {formatDate(next.event_date)}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{next.event_location}</span>
            </span>
          </div>
        </div>
      </div>

      {/* MINI LIST — the events after that */}
      {upNext.length > 0 && (
        <div className="border-t border-white/10 bg-[#0A0A0A]/40">
          {upNext.map((event) => (
            <div
              key={event.order_id}
              className="flex items-center justify-between gap-3 border-b border-white/5 px-6 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {event.event_type?.event_name ?? "Event"}
                </p>
                <p className="text-xs text-[#797676]">
                  {formatDate(event.event_date)}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles(
                  event.status,
                )}`}
              >
                {statusLabel(event.status)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-sm font-medium text-[#D4AF37] transition-all duration-300 group-hover:gap-1">
        View all events
        <ArrowUpRight
          size={16}
          className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </Link>
  );
}
