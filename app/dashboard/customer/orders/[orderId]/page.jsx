"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  Button,
  EmptyState,
  EngravedDate,
  Panel,
  PanelHeader,
  Skeleton,
  StatusBadge,
  statusLabel,
  Money,
  toDate,
} from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

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


export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
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
            setOrder(null);
          }
          return;
        }

        const { data, error: orderError } = await supabase
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
          .eq("order_id", orderId)
          .eq("customer_id", customerRow.customer_id)
          .maybeSingle();

        if (orderError) {
          throw orderError;
        }

        if (mounted) {
          setOrder(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load this order.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (orderId) {
      loadOrder();
    }

    return () => {
      mounted = false;
    };
  }, [orderId, router]);

  const isCancelled = order?.status === "cancelled";
  const isPast = order?.event_date ? order.event_date < new Date().toISOString().slice(0, 10) : false;
  const isConfirmed = ["confirmed", "in_progress", "completed"].includes(order?.status);
  const progressStep = order?.status === "completed" || (isConfirmed && isPast) ? 2 : isConfirmed ? 1 : 0;

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <Button
        variant="quiet"
        size="sm"
        href="/dashboard/customer/orders"
        className="-ml-3 w-fit"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to orders
      </Button>

      {loading ? (
        <div role="status" className="flex flex-col gap-8">
          <span className="sr-only">Loading order details…</span>
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-20" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-2/3 max-w-sm" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <Panel>
          <p className="font-serif text-xl text-mgh-text">
            We couldn&apos;t load this order
          </p>
          <p className="mt-2 max-w-md text-sm text-mgh-danger">{error}</p>
        </Panel>
      ) : !order ? (
        <EmptyState
          title="Order not found"
          action={
            <Button variant="secondary" href="/dashboard/customer/orders">
              Back to orders
            </Button>
          }
        >
          This order could not be found for your account.
        </EmptyState>
      ) : (
        <>
          <header className="flex items-start gap-5 border-b border-mgh-line pb-8 sm:gap-8 md:pb-10">
            <EngravedDate date={order.event_date} size="lg" next={!isPast && !isCancelled} />
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className="text-label font-semibold uppercase tabular-nums text-mgh-dim"
                  title={`Order #${order.order_id}`}
                >
                  Ref ORD-{String(order.order_id).slice(0, 8).toUpperCase()}
                </span>
                <StatusBadge
                  status={order.status ?? "pending"}
                  label={statusLabel(order.status, "Pending")}
                />
              </div>
              <h1 className="mt-2 text-balance font-serif text-display-sm font-medium text-mgh-text md:text-display">
                {order.event_type?.event_name ?? "Event booking"}
              </h1>
              <p className="mt-2 text-sm text-mgh-muted">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
          </header>

          {!isCancelled && <OrderProgress step={progressStep} />}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Panel variant="feature" aria-labelledby="occasion-title">
              <PanelHeader titleId="occasion-title" title="The occasion" />
              <dl className="divide-y divide-mgh-line-soft border-y border-mgh-line-soft">
                {[
                  {
                    label: "Date",
                    value: toDate(order.event_date)
                      ? toDate(order.event_date).toLocaleDateString("en-ZA", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "TBC",
                  },
                  {
                    label: "Time",
                    value: `${formatTime(order.start_time)} - ${formatTime(order.end_time)}`,
                  },
                  {
                    label: "Location",
                    value: order.event_location || "Location to be confirmed",
                  },
                ].map((fact) => (
                  <div
                    key={fact.label}
                    className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <dt className="text-label font-semibold uppercase text-mgh-dim sm:w-24 sm:shrink-0">
                      {fact.label}
                    </dt>
                    <dd className="text-[15px] tabular-nums text-mgh-text">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel aria-labelledby="account-title" className="flex flex-col">
              <PanelHeader titleId="account-title" title="The account" />
              <p className="text-label font-semibold uppercase text-mgh-dim">Order total</p>
              <p className="mt-2 font-serif text-[2.25rem] font-medium leading-none text-mgh-text">
                <Money value={Number(order.total_price || 0)} />
              </p>
              <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-mgh-muted">
                Invoices for this booking, and anything still to pay, live under Payments.
              </p>
              <div className="mt-auto pt-6">
                <Button variant="secondary" href="/dashboard/customer/payments" className="w-full sm:w-auto">
                  View payments
                </Button>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

const PROGRESS = ["Booking received", "Confirmed", "The day"];

/** Where the booking stands, read from its status alone. */
function OrderProgress({ step }) {
  return (
    <ol aria-label="Booking progress" className="grid grid-cols-3 gap-3">
      {PROGRESS.map((label, i) => {
        const done = i <= step;
        const current = i === step;
        return (
          <li key={label} aria-current={current ? "step" : undefined} className="flex flex-col gap-2.5">
            <span
              aria-hidden="true"
              className={cn("h-px w-full", done ? (current ? "bg-mgh-gold" : "bg-mgh-muted") : "bg-mgh-line-strong")}
            />
            <span className={cn("text-caption sm:text-sm", done ? "text-mgh-text" : "text-mgh-dim")}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
