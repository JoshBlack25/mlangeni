"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  Panel,
  Button,
  StatusBadge,
  EngravedDate,
  EmptyState,
  Skeleton,
  formatDate,
  focusRing,
  statusLabel,
} from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";
import {
  BOOKED_ORDER_STATUSES,
  getCustomerForUser,
} from "@/app/utils/customerBookingRules";
import {
  getDummyConfirmedOrders,
  mergeOrdersById,
  subscribeDummyInvoicePayments,
} from "@/app/utils/dummyInvoicePayments";


function getDaysUntil(dateStr) {
  const target = new Date(dateStr);
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchEvents() {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (mounted) {
            setEvents([]);
          }
          return;
        }

        const customer = await getCustomerForUser(supabase, user.id);

        if (!customer) {
          if (mounted) {
            setEvents([]);
          }
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select(
            "order_id, status, event_date, event_location, event_type(event_name)",
          )
          .eq("customer_id", customer.customer_id)
          .in("status", BOOKED_ORDER_STATUSES)
          .gte("event_date", today)
          .order("event_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(3);

        if (error) {
          throw error;
        }

        const dummyEvents = getDummyConfirmedOrders(customer.email).filter(
          (event) => event.event_date >= today,
        );
        const mergedEvents = mergeOrdersById(data ?? [], dummyEvents)
          .sort((a, b) => a.event_date.localeCompare(b.event_date))
          .slice(0, 3);

        if (mounted) {
          setEvents(mergedEvents);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load your booked events.");
          setEvents([]);
        }
      }
    }

    fetchEvents();
    const unsubscribe = subscribeDummyInvoicePayments(fetchEvents);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (error) {
    return (
      <Panel variant="feature" aria-labelledby="next-event-title">
        <h2 id="next-event-title" className="text-label font-semibold uppercase text-mgh-dim">
          Your next event
        </h2>
        <p role="alert" className="mt-4 text-sm text-mgh-danger">
          Couldn&apos;t load your events
        </p>
        <p className="mt-1 text-caption text-mgh-dim">{error}</p>
      </Panel>
    );
  }

  if (events === null) {
    return (
      <Panel variant="feature" aria-busy="true">
        <span className="sr-only" role="status">
          Loading booked events…
        </span>
        <div className="flex gap-6">
          <Skeleton className="h-24 w-20" />
          <div className="flex flex-1 flex-col gap-3 pt-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Panel>
    );
  }

  const [next, ...upNext] = events;

  if (!next) {
    return (
      <Panel variant="feature">
        <EmptyState
          align="start"
          className="py-2"
          title="No booked events yet"
          action={
            <Button href="/dashboard/customer/booking" variant="secondary">
              Start a new booking
            </Button>
          }
        >
          Once your booking is fully booked, it&apos;ll show up right here.
        </EmptyState>
      </Panel>
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
    <Panel variant="feature" className="flex flex-col" aria-labelledby="next-event-title">
      <div className="flex items-center justify-between gap-4">
        <h2 id="next-event-title" className="text-label font-semibold uppercase text-mgh-dim">
          Your next event
        </h2>
        <span className="font-serif text-base italic text-mgh-muted">{countdownLabel}</span>
      </div>

      <Link
        href={`/dashboard/customer/orders/${next.order_id}`}
        className={cn("group -mx-2 mt-6 flex gap-5 rounded-control px-2 py-1 sm:gap-8", focusRing)}
      >
        <EngravedDate date={next.event_date} size="lg" next />
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-balance font-serif text-[1.625rem] font-medium leading-tight text-mgh-text decoration-mgh-line-strong underline-offset-[6px] group-hover:underline md:text-[2rem]">
            {next.event_type?.event_name ?? "Event"}
          </p>
          <p className="mt-3 text-sm text-mgh-muted">{formatDate(next.event_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          {next.event_location && (
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-mgh-muted">
              <MapPin size={14} aria-hidden="true" className="shrink-0 text-mgh-dim" />
              <span className="truncate">{next.event_location}</span>
            </p>
          )}
          <StatusBadge className="mt-4" status={next.status} label={statusLabel(next.status)} />
        </div>
      </Link>

      {upNext.length > 0 && (
        <ul className="mt-6 divide-y divide-mgh-line-soft border-t border-mgh-line">
          {upNext.map((event) => (
            <li key={event.order_id}>
              <Link
                href={`/dashboard/customer/orders/${event.order_id}`}
                className={cn(
                  "-mx-2 flex items-center gap-4 rounded-control px-2 py-3 transition-colors hover:bg-mgh-surface-2",
                  focusRing,
                )}
              >
                <EngravedDate date={event.event_date} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-mgh-text">
                  {event.event_type?.event_name ?? "Event"}
                </span>
                <StatusBadge status={event.status} label={statusLabel(event.status)} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-5">
        <Link
          href="/dashboard/customer/orders"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm text-sm text-mgh-muted transition-colors hover:text-mgh-text",
            focusRing,
          )}
        >
          View all booked events
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </Panel>
  );
}
