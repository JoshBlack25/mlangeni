"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Clock3,
  MapPin,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

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

function statusLabel(status) {
  if (!status) return "Pending";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusStyles(status) {
  const normalized = status?.toLowerCase();

  if (normalized === "confirmed") {
    return "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]";
  }

  if (normalized === "pending") {
    return "border-white/20 bg-white/10 text-[#A0A0A0]";
  }

  if (normalized === "cancelled") {
    return "border-white/10 bg-white/5 text-[#797676]";
  }

  return "border-white/20 bg-white/10 text-[#A0A0A0]";
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
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                <ClipboardList size={14} />
                Orders
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  Your orders
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#A0A0A0] sm:text-base">
                  Every booking you place through the website appears here with
                  its current status and event details.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/70 px-4 py-3 text-sm text-[#A0A0A0]">
              <p className="font-medium text-white">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </p>
              <p className="mt-1">Tracked from the customer dashboard</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md sm:p-6">
          {loading ? (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-white/10 bg-[#0A0A0A]/60">
              <p className="text-sm text-[#A0A0A0]">Loading your orders…</p>
            </div>
          ) : error ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 text-center">
              <p className="text-sm font-medium text-red-400">
                We couldn&apos;t load your orders
              </p>
              <p className="mt-2 max-w-md text-sm text-[#A0A0A0]">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0A0A0A]/60 text-center">
              <ClipboardList className="mb-4 text-[#D4AF37]" size={28} />
              <h2 className="text-lg font-semibold text-white">
                No orders yet
              </h2>
              <p className="mt-2 max-w-md text-sm text-[#A0A0A0]">
                Your bookings will appear here as soon as they are submitted
                through the website.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="rounded-2xl border border-white/10 bg-[#0A0A0A]/70 p-5 transition-all duration-200 hover:border-[#D4AF37]/40"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#797676]">
                          Order #{order.order_id}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {order.event_type?.event_name ?? "Event booking"}
                        </h3>
                        <p className="mt-1 text-sm text-[#A0A0A0]">
                          Placed on {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="grid gap-3 text-sm text-[#A0A0A0] sm:grid-cols-2 xl:grid-cols-3">
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          <CalendarDays size={15} className="text-[#D4AF37]" />
                          <span>{formatDate(order.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          <Clock3 size={15} className="text-[#D4AF37]" />
                          <span>
                            {formatTime(order.start_time)} – {formatTime(order.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          <MapPin size={15} className="text-[#D4AF37]" />
                          <span>{order.event_location || "Location to be confirmed"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <div className="text-left lg:text-right">
                        <p className="text-sm text-[#797676]">Total</p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                          {currency.format(Number(order.total_price || 0))}
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/customer/orders/${order.order_id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2 text-sm font-medium text-[#D4AF37] transition-all duration-300 hover:bg-[#D4AF37]/20"
                      >
                        View details
                        <ArrowUpRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
