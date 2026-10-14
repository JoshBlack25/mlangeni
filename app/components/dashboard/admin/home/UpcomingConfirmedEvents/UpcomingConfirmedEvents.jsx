"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EngravedDate } from "@/app/components/dashboard/ui";
import HomeSection, { rowLink } from "../HomeSection";
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
    <HomeSection
      title="Upcoming Confirmed Events"
      items={events}
      loadingLabel="Loading upcoming events…"
      emptyText="No confirmed events coming up."
    >
      <ul className="divide-y divide-mgh-line-soft">
        {events?.map((ev, i) => (
          <li key={ev.order_id}>
            <Link href={`/dashboard/admin/orders/${ev.order_id}`} className={rowLink}>
              <EngravedDate date={ev.event_date} size="sm" next={i === 0} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-mgh-text">
                  {ev.customer
                    ? `${ev.customer.first_name ?? ""} ${ev.customer.last_name ?? ""}`.trim()
                    : "Unknown"}
                </span>
                {ev.event_location && (
                  <span className="block truncate text-caption text-mgh-dim">{ev.event_location}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
