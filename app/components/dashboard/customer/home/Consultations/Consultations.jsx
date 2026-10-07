"use client";

import Link from "next/link";
import { CalendarClock, ArrowUpRight } from "lucide-react";
import { useCustomerConsultations } from "@/app/components/dashboard/customer/consultations/useCustomerConsultations";
import {
  consultationStatusLabel,
  isActiveConsultation,
} from "@/app/utils/consultationPresentation";

function formatEventDate(dateString) {
  if (!dateString) return "Date to be confirmed";

  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Consultations() {
  const { consultations: all, error } = useCustomerConsultations();
  const active = (all ?? []).filter(isActiveConsultation);
  const past = (all ?? []).filter(
    (consultation) => !isActiveConsultation(consultation),
  );
  const consultations = all === null ? null : [...active, ...past].slice(0, 2);
  const requestCount = active.length;

  return (
    <Link
      href="/dashboard/customer/consultations"
      aria-label="View all consultations"
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D4AF37]"
    >
      <div className="flex items-center justify-between gap-3 px-6 pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
          Consultations
        </p>
        {requestCount > 0 && (
          <span className="shrink-0 text-xs font-medium text-[#D4AF37]">
            {requestCount} active
          </span>
        )}
      </div>

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 text-center">
          <p className="text-sm text-red-400">
            Couldn&apos;t load your consultations
          </p>
          <p className="mt-1 text-xs text-[#797676]">{error}</p>
        </div>
      ) : consultations === null ? (
        <div className="flex flex-1 items-center justify-center px-6 py-6">
          <p className="text-sm text-[#797676]">Loading consultations...</p>
        </div>
      ) : consultations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 text-center">
          <CalendarClock className="mb-4 text-[#D4AF37]" size={26} />
          <h3 className="text-base font-semibold text-white">
            No consultations yet
          </h3>
          <p className="mt-2 max-w-[16rem] text-sm text-[#A0A0A0]">
            Your consultations will appear here after you submit a booking.
          </p>
        </div>
      ) : (
        <div className="flex-1 py-4">
          {consultations.map((consultation) => {
            const order = consultation.order;

            return (
              <div
                key={consultation.consultations_id}
                className="group flex flex-col gap-2 border-t border-white/5 px-6 py-3 transition-colors duration-200 hover:bg-white/5"
              >
                <p className="truncate text-sm font-medium text-white">
                  {order?.event_type?.event_name ?? "Event booking"}
                </p>
                <p className="text-xs text-[#A0A0A0]">
                  {formatEventDate(order?.event_date)}
                  {order?.number_of_guest != null &&
                    ` - ${order.number_of_guest} guests`}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[#797676]">
                    {consultationStatusLabel(consultation)}
                  </p>
                  <ArrowUpRight size={14} className="text-[#D4AF37]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="mt-auto flex items-center justify-between border-t border-white/10 px-6 py-3 text-sm font-medium text-[#D4AF37] transition-all duration-300 hover:gap-1"
      >
        View all consultations
        <ArrowUpRight size={16} />
      </div>
    </Link>
  );
}
