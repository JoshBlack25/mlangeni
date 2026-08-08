"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Link
          href="/dashboard/customer/orders"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[#A0A0A0] transition hover:text-[#D4AF37]"
        >
          <ArrowLeft size={16} />
          Back to orders
        </Link>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md md:p-8">
          {loading ? (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-white/10 bg-[#0A0A0A]/60">
              <p className="text-sm text-[#A0A0A0]">Loading order details…</p>
            </div>
          ) : error ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 text-center">
              <p className="text-sm font-medium text-red-400">
                We couldn&apos;t load this order
              </p>
              <p className="mt-2 max-w-md text-sm text-[#A0A0A0]">{error}</p>
            </div>
          ) : !order ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0A0A0A]/60 text-center">
              <ClipboardList className="mb-4 text-[#D4AF37]" size={28} />
              <h2 className="text-lg font-semibold text-white">Order not found</h2>
              <p className="mt-2 max-w-md text-sm text-[#A0A0A0]">
                This order could not be found for your account.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                    <ClipboardList size={14} />
                    Order #{order.order_id}
                  </div>
                  <h1 className="mt-4 text-3xl font-semibold text-white">
                    {order.event_type?.event_name ?? "Event booking"}
                  </h1>
                  <p className="mt-2 text-sm text-[#A0A0A0]">
                    Placed on {formatDate(order.created_at)}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles(order.status)}`}
                >
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <CalendarDays size={15} className="text-[#D4AF37]" />
                    Event date
                  </div>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {formatDate(order.event_date)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <Clock3 size={15} className="text-[#D4AF37]" />
                    Time
                  </div>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {formatTime(order.start_time)} – {formatTime(order.end_time)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <MapPin size={15} className="text-[#D4AF37]" />
                    Location
                  </div>
                  <p className="mt-3 text-lg font-semibold text-white">
                    {order.event_location || "Location to be confirmed"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/70 p-5">
                <p className="text-sm text-[#797676]">Order total</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {currency.format(Number(order.total_price || 0))}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
