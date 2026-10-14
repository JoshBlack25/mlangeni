"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { cn } from "@/lib/utils";
import {
  Panel,
  Figure,
  Skeleton,
  formatCurrency,
  focusRing,
} from "@/app/components/dashboard/ui";

export default function AdminStats() {
  const [counts, setCounts] = useState(null); // null = still loading

  useEffect(() => {
    async function loadCounts() {
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();
      const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const today = now.toISOString().split("T")[0];

      const [
        pendingEnquiries,
        consultationRequests,
        overdueInvoices,
        pendingTestimonials,
        upcomingEvents,
        payments,
        activeOrders,
      ] = await Promise.all([
        supabase
          .from("enquiries")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("consultations")
          .select("consultations_id", { count: "exact", head: true })
          .eq("status", "requested"),
        supabase
          .from("invoices")
          .select("invoices_id", { count: "exact", head: true })
          .eq("status", "overdue"),
        supabase
          .from("testimonials")
          .select("testimonial_id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("orders")
          .select("order_id", { count: "exact", head: true })
          .neq("status", "cancelled")
          .gte("event_date", today)
          .lte("event_date", sevenDaysOut),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "succeeded")
          .gte("date", startOfMonth),
        supabase
          .from("orders")
          .select("order_id", { count: "exact", head: true })
          .in("status", ["pending", "confirmed", "in_progress"]),
      ]);

      const revenueThisMonth = (payments.data ?? []).reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      setCounts({
        pendingEnquiries: pendingEnquiries.count ?? 0,
        consultationRequests: consultationRequests.count ?? 0,
        overdueInvoices: overdueInvoices.count ?? 0,
        pendingTestimonials: pendingTestimonials.count ?? 0,
        upcomingEvents: upcomingEvents.count ?? 0,
        revenueThisMonth,
        activeOrders: activeOrders.count ?? 0,
      });
    }

    loadCounts();
  }, []);

  const attentionCards = counts
    ? [
        {
          label: "Pending Enquiries",
          value: counts.pendingEnquiries,
          href: "/dashboard/admin/enquiries",
        },
        {
          label: "Consultation Requests",
          value: counts.consultationRequests,
          href: "/dashboard/admin/consultations",
        },
        {
          label: "Overdue Invoices",
          value: counts.overdueInvoices,
          href: "/dashboard/admin/invoices",
        },
        {
          label: "Pending Testimonials",
          value: counts.pendingTestimonials,
          href: "/dashboard/admin/tools/testimonials",
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Panel density="dense" aria-labelledby="attention-title">
        <h2 id="attention-title" className="text-[15px] font-semibold text-mgh-text">
          Needs attention
        </h2>
        {counts === null ? (
          <div className="mt-3 flex flex-col gap-3" role="status">
            <span className="sr-only">Loading counts…</span>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-mgh-line-soft">
            {attentionCards.map((card) => {
              const urgent = card.label === "Overdue Invoices" && card.value > 0;
              return (
                <li key={card.label}>
                  <Link
                    href={card.href}
                    className={cn(
                      "-mx-2 flex h-11 items-center gap-4 rounded-control px-2 text-sm transition-colors hover:bg-mgh-surface-2",
                      focusRing,
                    )}
                  >
                    <span className={cn("flex-1", card.value > 0 ? "text-mgh-text" : "text-mgh-dim")}>
                      {card.label}
                    </span>
                    <span
                      className={cn(
                        "font-serif text-xl tabular-nums",
                        urgent ? "text-mgh-gold" : card.value > 0 ? "text-mgh-text" : "text-mgh-dim",
                      )}
                    >
                      {card.value}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" className="text-mgh-dim" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel density="dense" className="flex flex-col justify-between gap-5">
        <Figure
          label="Revenue This Month"
          loading={counts === null}
          value={counts ? formatCurrency(counts.revenueThisMonth) : null}
        />
        <div className="grid grid-cols-2 gap-4 border-t border-mgh-line pt-4">
          <Figure
            label="Active Orders"
            loading={counts === null}
            value={counts?.activeOrders}
          />
          <Figure
            label="Upcoming Events"
            hint="Next 7 days"
            loading={counts === null}
            value={counts?.upcomingEvents}
          />
        </div>
      </Panel>
    </div>
  );
}
