"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { supabase } from "@/services/supabaseClient";
import AnimatedNumber from "../../../shared/AnimatedNumber";
import { Figure, FigureRow, Blank } from "@/app/components/dashboard/ui";
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
  { key: "pendingConsultations", label: "Pending Bookings" },
  { key: "activeOrders", label: "Active Booking" },
  { key: "upcomingEvents", label: "Booked Event" },
  { key: "totalBookings", label: "Total Bookings" },
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
    <section
      ref={sectionRef}
      aria-label="Your bookings at a glance"
      className="border-y border-mgh-line py-6"
    >
      <FigureRow>
        {statConfig.map(({ key, label }) => (
          <Figure
            key={key}
            label={label}
            loading={!error && !values}
            value={
              error ? (
                <Blank label="Unavailable" />
              ) : values ? (
                <AnimatedNumber value={values[key]} start={isInView} />
              ) : null
            }
          />
        ))}
      </FigureRow>
    </section>
  );
}
