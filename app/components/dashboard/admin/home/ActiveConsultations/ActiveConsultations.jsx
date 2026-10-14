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
    year: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "TBC";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "TBC";

  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCustomerName(customer) {
  if (!customer) return "Unknown client";

  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  return name || "Unknown client";
}

export default function ActiveConsultations() {
  const [meetings, setMeetings] = useState(null);

  useEffect(() => {
    async function loadMeetings() {
      const { data, error } = await supabase
        .from("consultations")
        .select(
          `
          consultations_id,
          meeting_date,
          customer:customer_id ( first_name, last_name ),
          order:order_id (
            event_date,
            event_type ( event_name )
          ),
          invoices (
            invoices_id,
            status
          )
        `,
        )
        .eq("status", "scheduled")
        .order("meeting_date", { ascending: true })
        .limit(6);

      if (error) {
        console.error("Failed to load active meetings:", error);
        setMeetings([]);
        return;
      }

      const mapped = (data ?? [])
        .filter(
          (consultation) =>
            !(consultation.invoices ?? []).some(
              (invoice) => invoice.status !== "draft",
            ),
        )
        .map((consultation) => ({
          id: consultation.consultations_id,
          meetingDate: consultation.meeting_date,
          clientName: getCustomerName(consultation.customer),
          eventDate: consultation.order?.event_date,
          eventType:
            consultation.order?.event_type?.event_name ?? "Event type pending",
        }));

      setMeetings(mapped);
    }

    loadMeetings();
  }, []);

  return (
    <HomeSection
      title="Active Meetings"
      href="/dashboard/admin/active-meetings"
      items={meetings}
      loadingLabel="Loading active meetings…"
      emptyText="No active meetings right now."
    >
      <ul className="divide-y divide-mgh-line-soft">
        {meetings?.map((meeting) => (
          <li key={meeting.id}>
            <Link href={`/dashboard/admin/consultations/${meeting.id}`} className={rowLink}>
              <EngravedDate date={meeting.meetingDate} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-mgh-text">{meeting.clientName}</span>
                <span className="block truncate text-caption text-mgh-dim">
                  {meeting.eventType} - Event {formatDate(meeting.eventDate)}
                </span>
              </span>
              <span className="shrink-0 text-right text-caption tabular-nums text-mgh-muted">
                {formatTime(meeting.meetingDate)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
