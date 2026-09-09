"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircleMore,
  ClipboardList,
  CalendarClock,
  CalendarCheck,
} from "lucide-react";
import { useInView } from "framer-motion";
import { supabase } from "@/services/supabaseClient";
import AnimatedNumber from "../../../shared/AnimatedNumber";
import {
  BOOKED_ORDER_STATUSES,
  getCustomerForUser,
} from "@/app/utils/customerBookingRules";
import {
  getDummyConfirmedOrders,
  isDummyOrderConfirmed,
  mergeOrdersById,
  subscribeDummyInvoicePayments,
} from "@/app/utils/dummyInvoicePayments";

const statConfig = [
  {
    key: "pendingConsultations",
    label: "Pending Bookings",
    icon: MessageCircleMore,
  },
  { key: "activeOrders", label: "Active Booking", icon: ClipboardList },
  { key: "upcomingEvents", label: "Booked Event", icon: CalendarClock },
  { key: "totalBookings", label: "Total Bookings", icon: CalendarCheck },
];

export default function Stats() {
  const [values, setValues] = useState(null);
  const [error, setError] = useState(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    async function fetchStats() {
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
          setValues({
            pendingConsultations: 0,
            activeOrders: 0,
            upcomingEvents: 0,
            totalBookings: 0,
          });
          return;
        }

        const customer = await getCustomerForUser(supabase, user.id);

        if (!customer) {
          setValues({
            pendingConsultations: 0,
            activeOrders: 0,
            upcomingEvents: 0,
            totalBookings: 0,
          });
          return;
        }

        const [pending, pendingOrders, bookedEvents, total] = await Promise.all([
          supabase
            .from("consultations")
            .select("*", { count: "exact", head: true })
            .eq("customer_id", customer.customer_id)
            .eq("status", "requested")
            .is("admin_id", null),
          supabase
            .from("orders")
            .select("order_id")
            .eq("customer_id", customer.customer_id)
            .eq("status", "pending"),
          supabase
            .from("orders")
            .select("order_id, event_date")
            .eq("customer_id", customer.customer_id)
            .in("status", BOOKED_ORDER_STATUSES)
            .gte("event_date", today)
            .neq("status", "cancelled"),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("customer_id", customer.customer_id),
        ]);

        const firstError =
          pending.error ||
          pendingOrders.error ||
          bookedEvents.error ||
          total.error;

        if (firstError) {
          throw firstError;
        }

        const pendingBookingCount = pending.count ?? 0;
        const pendingOrderCount = (pendingOrders.data ?? []).filter(
          (order) => !isDummyOrderConfirmed(order.order_id),
        ).length;
        const dummyBookedEvents = getDummyConfirmedOrders(customer.email).filter(
          (event) => event.event_date >= today,
        );
        const bookedEventCount = mergeOrdersById(
          bookedEvents.data ?? [],
          dummyBookedEvents,
        ).length;

        setValues({
          pendingConsultations: pendingBookingCount,
          activeOrders: Math.max(pendingOrderCount - pendingBookingCount, 0),
          upcomingEvents: bookedEventCount,
          totalBookings: total.count ?? 0,
        });
      } catch (err) {
        setError(err.message || "Unable to load customer dashboard stats.");
      }
    }

    fetchStats();
    const unsubscribe = subscribeDummyInvoicePayments(fetchStats);

    return unsubscribe;
  }, []);

  return (
    <section ref={sectionRef} className="mt-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map(({ key, label, icon }) => (
          <StatCard
            key={key}
            label={label}
            icon={icon}
            value={values ? values[key] : null}
            error={error}
            start={isInView}
          />
        ))}
      </div>
    </section>
  );
}

function StatCard({ label, value, icon: Icon, error, start }) {
  return (
    <div
      className="
        group
        rounded-2xl
        border
        border-white/10
        bg-white/5
        p-6
        backdrop-blur-md
        transition-all
        duration-300
        hover:border-[#D4AF37]
        hover:bg-white/10
        hover:-translate-y-1
        hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]
      "
    >
      <div className="mb-5 inline-flex rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37] transition-all duration-300 group-hover:bg-[#D4AF37] group-hover:text-black">
        <Icon size={22} />
      </div>

      {error ? (
        <p className="text-sm text-red-400">—</p>
      ) : value === null ? (
        <div className="h-9 w-12 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="text-3xl font-bold text-white">
          <AnimatedNumber value={value} start={start} />
        </p>
      )}

      <p className="mt-2 text-sm text-[#A0A0A0]">{label}</p>
    </div>
  );
}
