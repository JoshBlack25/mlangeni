"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ClipboardList, ArrowUpRight, ChevronRight } from "lucide-react";
import {supabase} from "@/services/supabaseClient";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

// Real enum: pending | confirmed | in_progress | completed | cancelled
function statusLabel(status) {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function statusStyles(status) {
  if (status === "in_progress" || status === "confirmed") {
    return "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]";
  }
  if (status === "cancelled") {
    return "border-white/10 bg-white/5 text-[#797676]";
  }
  // pending, completed
  return "border-white/20 bg-white/10 text-[#A0A0A0]";
}

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select(
          "order_id, status, total_price, event_date, event_type(event_name)",
        )
        .order("event_date", { ascending: false })
        .limit(5);

      if (error) {
        setError(error.message);
      } else {
        setOrders(data ?? []);
      }

      setLoading(false);
    }

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <p className="text-sm text-[#797676]">Loading recent orders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center backdrop-blur-md">
        <p className="text-sm text-red-400">Couldn&apos;t load your orders</p>
        <p className="mt-1 text-xs text-[#797676]">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
        <ClipboardList className="mb-4 text-[#D4AF37]" size={26} />
        <h3 className="text-base font-semibold text-white">No orders yet</h3>
        <p className="mt-2 max-w-[18rem] text-sm text-[#A0A0A0]">
          Your order history will show up here once you place your first
          booking.
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

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
          Recent Orders
        </p>

        <Link
          href="/dashboard/customer/orders"
          className="flex items-center gap-1 text-sm font-medium text-[#D4AF37] transition-all duration-300 hover:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
        >
          View all
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* ORDER ROWS */}
      <div className="flex-1">
        {orders.map((order) => (
          <Link
            key={order.order_id}
            href={`/dashboard/customer/orders/${order.order_id}`}
            className="group flex items-center justify-between gap-4 border-t border-white/5 px-6 py-3 transition-colors duration-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D4AF37]"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="shrink-0 text-xs font-medium text-[#797676]">
                ORD-{order.order_id.slice(0, 8).toUpperCase()}
              </span>
              <span className="truncate text-sm text-white">
                {order.event_type?.event_name ?? "Event"}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <span className="text-sm font-medium text-white">
                {currency.format(order.total_price)}
              </span>

              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles(
                  order.status,
                )}`}
              >
                {statusLabel(order.status)}
              </span>

              <ChevronRight
                size={16}
                className="text-[#797676] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#D4AF37]"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
