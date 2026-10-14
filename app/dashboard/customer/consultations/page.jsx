"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  ListFilter,
} from "lucide-react";
import { useCustomerConsultations } from "@/app/components/dashboard/customer/consultations/useCustomerConsultations";
import {
  consultationStatusLabel,
  formatConsultationDate,
  getConsultationCustomerName,
  isActiveConsultation,
} from "@/app/utils/consultationPresentation";

const filters = [
  { value: "all", label: "All", icon: ListFilter },
  { value: "active", label: "Active", icon: CalendarClock },
  { value: "past", label: "Past", icon: CalendarCheck },
];

export default function CustomerConsultationsPage() {
  const { consultations, error } = useCustomerConsultations();
  const [filter, setFilter] = useState("all");
  const all = consultations ?? [];
  const active = all.filter(isActiveConsultation);
  const past = all.filter(
    (consultation) => !isActiveConsultation(consultation),
  );
  const visible =
    filter === "active"
      ? active
      : filter === "past"
        ? past
        : [...active, ...past];

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1300px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <CalendarCheck size={17} />
              <span>Consultations</span>
            </div>
            <h1 className="font-serif text-4xl font-medium text-white md:text-5xl">
              Consultation Requests
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Your event bookings and scheduled consultation meetings.
            </p>
          </div>
          <div className="border-l-2 border-[#D4AF37] bg-white/[0.03] px-4 py-3 text-sm text-[#D4AF37]">
            {consultations === null ? "..." : all.length} consultations
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          <OverviewCard
            icon={CalendarClock}
            label="Active Consultations"
            value={consultations === null ? "..." : active.length}
            caption="Bookings awaiting a meeting"
          />
          <OverviewCard
            icon={CalendarCheck}
            label="Meeting Scheduled"
            value={consultations === null ? "..." : past.length}
            caption="Past consultations"
          />
          <OverviewCard
            icon={ClipboardList}
            label="Total Consultations"
            value={consultations === null ? "..." : all.length}
            caption="Your consultation requests"
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-8 rounded-2xl border border-[#1F1F1F] bg-white/5 p-5 backdrop-blur-md md:p-6"
        >
          <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                Consultation List
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Your Booking Requests
              </h2>
            </div>
            <div
              role="group"
              aria-label="Filter consultations"
              className="inline-flex w-fit max-w-full border border-white/10"
            >
              {filters.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`inline-flex h-10 items-center gap-2 px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D4AF37] ${filter === value ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-[#797676] hover:bg-white/5 hover:text-white"}`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_184px] gap-4 border-b border-white/10 px-4 pb-3 text-xs uppercase tracking-[0.18em] text-[#797676] lg:grid">
            <span>Customer</span>
            <span>Event Date</span>
            <span>Event Type</span>
            <span className="pl-3">Status</span>
            <span className="text-right">Action</span>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 border border-red-400/20 bg-red-400/5 px-4 py-4 text-sm text-red-300"
            >
              {error}
            </div>
          ) : consultations === null ? (
            <div className="mt-5 space-y-3">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40"
                />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-5 flex min-h-56 flex-col items-center justify-center rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 px-6 py-6 text-center">
              <CalendarCheck size={28} className="text-[#D4AF37]" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                {filter === "active"
                  ? "No active consultations"
                  : filter === "past"
                    ? "No past consultations"
                    : "No consultation requests"}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#A0A0A0]">
                {filter === "past"
                  ? "Your consultations remain here after a meeting is scheduled."
                  : "Your consultation appears here once you submit a booking."}
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {visible.map((consultation, index) => (
                <motion.article
                  key={consultation.consultations_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(0.25 + index * 0.04, 0.6),
                  }}
                  className="grid grid-cols-1 gap-4 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 p-4 transition-all duration-300 hover:border-[#D4AF37]/70 hover:bg-white/[0.04] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_184px] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-white md:text-base">
                      {getConsultationCustomerName(consultation.customer)}
                    </p>
                    <p className="mt-1 text-xs text-[#797676]">
                      ORD-{consultation.order_id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {formatConsultationDate(consultation.order?.event_date)}
                    </p>
                    <p className="mt-1 text-xs text-[#797676]">Event date</p>
                  </div>
                  <p className="min-w-0 break-words text-sm text-[#A0A0A0]">
                    {consultation.order?.event_type?.event_name ??
                      "Event type pending"}
                  </p>
                  <div className="border-l border-white/10 pl-3">
                    <p
                      className={`text-sm font-medium ${isActiveConsultation(consultation) ? "text-[#D4AF37]" : "text-[#A0A0A0]"}`}
                    >
                      {consultationStatusLabel(consultation)}
                    </p>
                    <p className="mt-1 text-xs text-[#797676]">
                      Consultation status
                    </p>
                  </div>
                  <div className="flex lg:justify-end">
                    <Link
                      href={`/dashboard/customer/consultations/${consultation.consultations_id}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/40 px-4 text-sm font-medium text-[#D4AF37] transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                    >
                      View Consultation
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}

function OverviewCard({ icon: Icon, label, value, caption }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:bg-white/10 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
      <div className="mb-5 inline-flex rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37] transition-all duration-300 group-hover:bg-[#D4AF37] group-hover:text-black">
        <Icon size={22} />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-[#797676]">{caption}</p>
    </div>
  );
}
