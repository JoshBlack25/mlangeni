"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EngravedDate } from "@/app/components/dashboard/ui";
import HomeSection, { rowLink } from "../HomeSection";
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
    <HomeSection
      title="Consultations"
      href="/dashboard/admin/consultations"
      items={consultations}
      loadingLabel="Loading consultation requests…"
      emptyText="No consultation requests."
    >
      <ul className="divide-y divide-mgh-line-soft">
        {consultations?.map((consultation) => {
          const order = consultation.order;
          const eventType = order?.event_type?.event_name ?? "Event pending";
          const guestCount = order?.number_of_guest
            ? `${order.number_of_guest} guests`
            : "Guests pending";

          return (
            <li key={consultation.consultations_id}>
              <Link
                href={`/dashboard/admin/consultations/${consultation.consultations_id}`}
                className={rowLink}
              >
                <EngravedDate date={order?.event_date} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-mgh-text">
                    {getCustomerName(consultation.customer)}
                  </span>
                  <span className="block truncate text-caption text-mgh-dim">
                    {eventType} - {guestCount} · {order?.event_location || "Location pending"}
                  </span>
                </span>
                <span className="sr-only">{formatDate(order?.event_date)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </HomeSection>
  );
}
