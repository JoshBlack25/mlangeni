"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";
import {
  getDummyConfirmedOrders,
  mergeOrdersById,
  subscribeDummyInvoicePayments,
} from "@/app/utils/dummyInvoicePayments";

export default function UpcomingConfirmedEvents() {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadEvents() {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          order_id,
          status,
          event_date,
          event_location,
          customer:customer_id ( first_name, last_name )
        `,
        )
        .eq("status", "confirmed")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(6);

      const dummyEvents = getDummyConfirmedOrders().filter(
        (event) => event.event_date >= today,
      );
      const mergedEvents = mergeOrdersById(data ?? [], dummyEvents)
        .sort((a, b) => a.event_date.localeCompare(b.event_date))
        .slice(0, 6);

      if (error && mergedEvents.length === 0) {
        console.error("Failed to load upcoming events:", error);
        if (mounted) {
          setEvents([]);
        }
        return;
      }

      if (mounted) {
        setEvents(mergedEvents);
      }
    }

    loadEvents();
    const unsubscribe = subscribeDummyInvoicePayments(loadEvents);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Upcoming Confirmed Events
        </h3>
      </div>

      {events === null ? (
        <div className="flex flex-1 flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[#1F1F1F] bg-white/5"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-[#A0A0A0]">
          No confirmed events coming up.
        </p>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {events.map((ev) => (
            <Link
              key={ev.order_id}
              href={`/dashboard/admin/orders/${ev.order_id}`}
              className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 p-4 transition hover:border-[#D4AF37]"
            >
              <p className="font-medium text-white">
                {ev.customer
                  ? `${ev.customer.first_name ?? ""} ${ev.customer.last_name ?? ""}`.trim()
                  : "Unknown"}
              </p>
              <p className="text-sm text-[#A0A0A0]">
                {new Date(ev.event_date).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {ev.event_location ? ` · ${ev.event_location}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
