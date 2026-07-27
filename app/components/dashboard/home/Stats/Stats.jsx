"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircleMore,
  ClipboardList,
  CalendarClock,
  CalendarCheck,
} from "lucide-react";
import { useInView } from "framer-motion";
import {supabase} from "@/services/supabaseClient";
import AnimatedNumber from "@/app/components/dashboard/shared/AnimatedNumber";

const statConfig = [
  {
    key: "pendingConsultations",
    label: "Pending Consultations",
    icon: MessageCircleMore,
  },
  { key: "activeOrders", label: "Active Orders", icon: ClipboardList },
  { key: "upcomingEvents", label: "Upcoming Events", icon: CalendarClock },
  { key: "totalBookings", label: "Total Bookings", icon: CalendarCheck },
];

export default function Stats() {
  const [values, setValues] = useState(null);
  const [error, setError] = useState(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    async function fetchStats() {
      const today = new Date().toISOString().slice(0, 10);

      const [pending, active, upcoming, total] = await Promise.all([
        supabase
          .from("consultations")
          .select("*", { count: "exact", head: true })
          .eq("status", "requested"),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .in("status", ["confirmed", "in_progress"]),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("event_date", today)
          .neq("status", "cancelled"),
        supabase.from("orders").select("*", { count: "exact", head: true }),
      ]);

      const firstError =
        pending.error || active.error || upcoming.error || total.error;

      if (firstError) {
        setError(firstError.message);
        return;
      }

      setValues({
        pendingConsultations: pending.count ?? 0,
        activeOrders: active.count ?? 0,
        upcomingEvents: upcoming.count ?? 0,
        totalBookings: total.count ?? 0,
      });
    }

    fetchStats();
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
