"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";

function formatDate(dateString) {
  if (!dateString) return "TBC";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "TBC";

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

function getCustomerName(customer) {
  if (!customer) return "Unknown";

  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  return name || "Unknown";
}

export default function ConsultationRequests() {
  const [consultations, setConsultations] = useState(null);

  useEffect(() => {
    async function loadConsultations() {
      const { data, error } = await supabase
        .from("consultations")
        .select(
          `
          consultations_id,
          created_at,
          customer:customer_id ( first_name, last_name ),
          order:order_id (
            event_date,
            event_location,
            number_of_guest,
            event_type ( event_name )
          )
        `,
        )
        .eq("status", "requested")
        .not("order_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Failed to load consultation requests:", error);
        setConsultations([]);
        return;
      }

      setConsultations(data ?? []);
    }

    loadConsultations();
  }, []);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#1F1F1F] bg-white/5 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Consultations</h3>
        <Link
          href="/dashboard/admin/consultations"
          className="text-xs font-medium text-[#D4AF37] hover:underline"
        >
          View all
        </Link>
      </div>

      {consultations === null ? (
        <div className="flex flex-1 flex-col gap-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-[#1F1F1F] bg-white/5"
            />
          ))}
        </div>
      ) : consultations.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-[#A0A0A0]">
          No consultation requests.
        </p>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {consultations.map((consultation) => {
            const order = consultation.order;
            const eventType = order?.event_type?.event_name ?? "Event pending";
            const guestCount = order?.number_of_guest
              ? `${order.number_of_guest} guests`
              : "Guests pending";

            return (
              <Link
                key={consultation.consultations_id}
                href={`/dashboard/admin/consultations/${consultation.consultations_id}`}
                className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]/40 px-3 py-2.5 text-sm transition hover:border-[#D4AF37]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {getCustomerName(consultation.customer)}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#797676]">
                      {eventType} - {guestCount}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-[#A0A0A0]">
                    {formatDate(order?.event_date)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                  <p className="truncate text-xs text-[#797676]">
                    {order?.event_location || "Location pending"}
                  </p>
                  <span className="shrink-0 text-xs font-medium text-[#D4AF37]">
                    View more
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
