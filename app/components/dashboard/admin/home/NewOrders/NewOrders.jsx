"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";

export default function NewOrders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          order_id,
          event_date,
          total_price,
          customer:customer_id ( first_name, last_name )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Failed to load new orders:", error);
        setOrders([]);
        return;
      }

      setOrders(data ?? []);
    }

    loadOrders();
  }, []);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#1F1F1F] bg-white/5 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">New Orders</h3>
        <Link
          href="/dashboard/admin/orders"
          className="text-xs font-medium text-[#D4AF37] hover:underline"
        >
          View all
        </Link>
      </div>

      {orders === null ? (
        <div className="flex flex-1 flex-col gap-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg border border-[#1F1F1F] bg-white/5"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-[#A0A0A0]">
          No new orders.
        </p>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {orders.map((o) => (
            <Link
              key={o.order_id}
              href={`/dashboard/admin/orders/${o.order_id}`}
              className="flex items-center justify-between rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]/40 px-3 py-2 text-sm transition hover:border-[#D4AF37]"
            >
              <span className="text-white">
                {o.customer
                  ? `${o.customer.first_name ?? ""} ${o.customer.last_name ?? ""}`.trim()
                  : "Unknown"}
              </span>
              <span className="text-[#A0A0A0]">
                {new Date(o.event_date).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
