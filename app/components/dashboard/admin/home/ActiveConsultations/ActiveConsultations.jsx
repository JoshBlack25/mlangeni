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
    <div className="flex h-full flex-col rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Active Meetings</h3>
        <Link
          href="/dashboard/admin/active-meetings"
          className="text-sm font-medium text-[#D4AF37] hover:underline"
        >
          View all
        </Link>
      </div>

      {meetings === null ? (
        <div className="flex flex-1 flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[#1F1F1F] bg-white/5"
            />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-[#A0A0A0]">
          No active meetings right now.
        </p>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/dashboard/admin/consultations/${meeting.id}`}
              className="grid grid-cols-1 gap-3 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 p-4 transition hover:border-[#D4AF37] md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="font-medium text-white">{meeting.clientName}</p>
                <p className="mt-1 text-sm text-[#A0A0A0]">
                  {meeting.eventType} - Event {formatDate(meeting.eventDate)}
                </p>
              </div>

              <div className="border-l border-white/10 pl-4 text-left md:text-right">
                <p className="text-sm font-medium text-[#D4AF37]">
                  {formatDate(meeting.meetingDate)}
                </p>
                <p className="mt-1 text-xs text-[#797676]">
                  {formatTime(meeting.meetingDate)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
