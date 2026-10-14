"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { getCustomerForUser } from "@/app/utils/customerBookingRules";
import {
  Panel,
  Button,
  StatusBadge,
  EngravedDate,
  SkeletonRows,
  formatCurrency,
  focusRing,
  statusLabel,
} from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

// Real enum: pending | confirmed | in_progress | completed | cancelled

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setOrders([]);
          return;
        }

        const customer = await getCustomerForUser(supabase, user.id);

        if (!customer) {
          setOrders([]);
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select(
            "order_id, status, total_price, event_date, event_type(event_name)",
          )
          .eq("customer_id", customer.customer_id)
          .order("event_date", { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }

        setOrders(data ?? []);
      } catch (err) {
        setError(err.message || "Unable to load your orders.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const header = (
    <div className="mb-2 flex items-center justify-between gap-4">
      <h2 className="font-serif text-xl font-medium text-mgh-text">Recent Orders</h2>
      {!loading && !error && orders.length > 0 && (
        <SectionLink href="/dashboard/customer/orders">View all</SectionLink>
      )}
    </div>
  );

  if (loading) {
    return (
      <Panel className="h-full">
        {header}
        <SkeletonRows rows={3} label="Loading recent orders…" />
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="h-full">
        {header}
        <p role="alert" className="mt-3 text-sm text-mgh-danger">
          Couldn&apos;t load your orders
        </p>
        <p className="mt-1 text-caption text-mgh-dim">{error}</p>
      </Panel>
    );
  }

  if (orders.length === 0) {
    return (
      <Panel className="h-full">
        {header}
        <p className="mt-3 font-serif text-lg text-mgh-text">No orders yet</p>
        <p className="mt-1 text-sm leading-relaxed text-mgh-muted">
          Your order history will show up here once you place your first
          booking.
        </p>
        <Button href="/dashboard/customer/booking" variant="secondary" className="mt-5">
          Start a new booking
        </Button>
      </Panel>
    );
  }

  return (
    <Panel className="h-full">
      {header}
      <ul className="divide-y divide-mgh-line-soft">
        {orders.map((order) => (
          <li key={order.order_id}>
            <Link
              href={`/dashboard/customer/orders/${order.order_id}`}
              className={cn(
                "-mx-2 flex items-center gap-4 rounded-control px-2 py-3 transition-colors hover:bg-mgh-surface-2",
                focusRing,
              )}
            >
              <EngravedDate date={order.event_date} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-mgh-text">
                  {order.event_type?.event_name ?? "Event"}
                </span>
                <span className="block text-caption tabular-nums text-mgh-dim">
                  ORD-{order.order_id.slice(0, 8).toUpperCase()}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm tabular-nums text-mgh-text">
                  {formatCurrency(order.total_price)}
                </span>
                <StatusBadge status={order.status} label={statusLabel(order.status)} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function SectionLink({ href, children }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm text-sm text-mgh-muted transition-colors hover:text-mgh-text",
        focusRing,
      )}
    >
      {children}
      <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}
