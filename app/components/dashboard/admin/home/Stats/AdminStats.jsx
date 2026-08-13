"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import AnimatedNumber from "@/app/components/dashboard/shared/AnimatedNumber";

const sections = ["attention", "overview"];

export default function AdminStats() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("attention");
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

  const attentionTotal = counts
    ? counts.pendingEnquiries +
      counts.consultationRequests +
      counts.overdueInvoices +
      counts.pendingTestimonials
    : 0;

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

  const overviewCards = counts
    ? [
        { label: "Upcoming Events", value: counts.upcomingEvents, prefix: "" },
        {
          label: "Revenue This Month",
          value: counts.revenueThisMonth,
          prefix: "R",
        },
        { label: "Active Orders", value: counts.activeOrders, prefix: "" },
      ]
    : [];

  const currentCards =
    activeSection === "attention" ? attentionCards : overviewCards;

  function cycle(direction) {
    const currentIndex = sections.indexOf(activeSection);
    const nextIndex =
      (currentIndex + direction + sections.length) % sections.length;
    setActiveSection(sections[nextIndex]);
  }

  return (
    <section className="rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
      {/* HEADER: title + urgency badge + arrows */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">
            {activeSection === "attention"
              ? "Needs Your Attention"
              : "Overview"}
          </h2>

          {/* Persistent urgency badge — visible on both panels */}
          {attentionTotal > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#D4AF37] px-2 text-xs font-semibold text-black">
              {attentionTotal}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => cycle(-1)}
            aria-label="Previous section"
            className="rounded-lg border border-[#1F1F1F] p-2 text-[#A0A0A0] transition hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => cycle(1)}
            aria-label="Next section"
            className="rounded-lg border border-[#1F1F1F] p-2 text-[#A0A0A0] transition hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* CARDS — skeleton while loading, crossfade between sections once ready */}
      {counts === null ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-[#1F1F1F] bg-white/5"
            />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {currentCards.map((card) => {
              const isAttention = activeSection === "attention";
              const CardWrapper = isAttention ? "button" : "div";

              return (
                <CardWrapper
                  key={card.label}
                  {...(isAttention && {
                    onClick: () => router.push(card.href),
                    type: "button",
                  })}
                  className={`
                    rounded-xl border p-5 text-left transition
                    ${
                      isAttention
                        ? "cursor-pointer border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:border-[#D4AF37]"
                        : "border-[#1F1F1F] bg-white/5"
                    }
                  `}
                >
                  <p className="text-sm text-[#A0A0A0]">{card.label}</p>

                  <p className="mt-2 text-3xl font-bold text-white">
                    {card.prefix}
                    <AnimatedNumber value={card.value} />
                  </p>
                </CardWrapper>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}
