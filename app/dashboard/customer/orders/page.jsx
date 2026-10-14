"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { cn } from "@/lib/utils";
import {
  Button,
  EmptyState,
  EngravedDate,
  PageHeader,
  Panel,
  SkeletonRows,
  StatusBadge,
  focusRing,
  formatCurrency,
  statusLabel,
} from "@/app/components/dashboard/ui";

function formatDate(dateString) {
  if (!dateString) return "TBC";

  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "TBC";

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      });
}


export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: customerRow, error: customerError } = await supabase
          .from("customer")
          .select("customer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        if (!customerRow) {
          if (mounted) {
            setOrders([]);
          }
          return;
        }

        const { data, error: ordersError } = await supabase
          .from("orders")
          .select(
            `
            order_id,
            status,
            total_price,
            event_date,
            start_time,
            end_time,
            event_location,
            created_at,
            event_type(event_name)
          `,
          )
          .eq("customer_id", customerRow.customer_id)
          .order("event_date", { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        if (mounted) {
          setOrders(data ?? []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load your orders right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div>
      <PageHeader
        title="Your orders"
        lead="Every booking you place through the website appears here with its current status and event details."
        actions={
          !loading && !error ? (
            <p className="text-sm text-mgh-muted">
              <span className="font-medium tabular-nums text-mgh-text">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </span>
              <span className="text-mgh-dim"> · Tracked from the customer dashboard</span>
            </p>
          ) : null
        }
      />

      {loading ? (
        <SkeletonRows rows={4} label="Loading your orders…" />
      ) : error ? (
        <Panel>
          <p className="font-serif text-xl text-mgh-text">
            We couldn&apos;t load your orders
          </p>
          <p className="mt-2 max-w-md text-sm text-mgh-danger">{error}</p>
        </Panel>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          action={
            <Button variant="secondary" href="/dashboard/customer/booking">
              Start a new booking
            </Button>
          }
        >
          Your bookings will appear here as soon as they are submitted through
          the website.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-mgh-line-soft border-y border-mgh-line-soft">
          {orders.map((order) => (
            <li key={order.order_id}>
              <Link
                href={`/dashboard/customer/orders/${order.order_id}`}
                className={cn(
                  "group flex items-center gap-4 rounded-sm py-5 transition-colors duration-[var(--mgh-dur-fast)] hover:bg-mgh-surface-2 sm:gap-6 sm:px-3",
                  focusRing,
                )}
              >
                <EngravedDate date={order.event_date} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-label font-semibold uppercase text-mgh-dim">
                      Order #{order.order_id}
                    </span>
                    <StatusBadge
                      status={order.status ?? "pending"}
                      label={statusLabel(order.status, "Pending")}
                    />
                  </div>
                  <h2 className="mt-1.5 truncate text-[15px] font-medium text-mgh-text sm:text-base">
                    {order.event_type?.event_name ?? "Event booking"}
                  </h2>
                  <p className="mt-1 text-sm text-mgh-muted">
                    <span>{order.event_location || "Location to be confirmed"}</span>
                    <span className="text-mgh-dim"> · </span>
                    <span className="tabular-nums">
                      {formatTime(order.start_time)} - {formatTime(order.end_time)}
                    </span>
                  </p>
                  <p className="mt-1 text-caption text-mgh-dim">
                    Placed on {formatDate(order.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 self-start pt-1 sm:self-center sm:pt-0">
                  <div className="text-right">
                    <p className="sr-only">Total</p>
                    <p className="font-serif text-lg font-medium tabular-nums text-mgh-text sm:text-xl">
                      {formatCurrency(Number(order.total_price || 0))}
                    </p>
                    <p className="mt-1 hidden text-caption text-mgh-dim sm:block">
                      View details
                    </p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="hidden text-mgh-dim transition-colors group-hover:text-mgh-text sm:block"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
