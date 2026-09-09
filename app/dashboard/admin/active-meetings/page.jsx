"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarCheck,
  ClipboardList,
  MapPin,
  Search,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";

function formatDate(dateString) {
  if (!dateString) return "TBC";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "TBC";

  return new Date(dateString).toLocaleDateString("en-ZA", {
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
  if (!customer) return "Unknown customer";

  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  return name || customer.email || "Unknown customer";
}

function getMeetingLocation(note, fallbackLocation) {
  const match = note?.match(/Meeting location:\s*([^\n]+)/i);

  return match?.[1]?.trim() || fallbackLocation || "Location pending";
}

function mapConsultationToMeeting(consultation) {
  const order = consultation.order;

  return {
    id: consultation.consultations_id,
    orderId: order?.order_id,
    customerName: getCustomerName(consultation.customer),
    customerEmail: consultation.customer?.email,
    customerPhone: consultation.customer?.phone_number,
    eventType: order?.event_type?.event_name ?? "Event type pending",
    eventDate: order?.event_date,
    meetingDate: consultation.meeting_date,
    meetingTime: consultation.meeting_date,
    guests: order?.number_of_guest ?? "TBC",
    location: getMeetingLocation(consultation.note, order?.event_location),
    orderTotal: order?.total_price,
  };
}

function getSearchText(meeting) {
  return [
    meeting.customerName,
    meeting.customerEmail,
    meeting.customerPhone,
    meeting.eventType,
    meeting.eventDate,
    meeting.meetingDate,
    meeting.meetingTime,
    meeting.guests,
    meeting.location,
    meeting.orderTotal,
  ]
    .join(" ")
    .toLowerCase();
}

export default function AdminActiveMeetingsPage() {
  const [meetings, setMeetings] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const activeMeetings = meetings ?? [];
  const filteredMeetings = normalizedSearch
    ? activeMeetings.filter((meeting) =>
        getSearchText(meeting).includes(normalizedSearch),
      )
    : activeMeetings;
  const meetingCount = meetings?.length ?? 0;

  useEffect(() => {
    let mounted = true;

    async function loadActiveMeetings() {
      try {
        setError(null);

        const { data, error: meetingsError } = await supabase
          .from("consultations")
          .select(
            `
            consultations_id,
            meeting_date,
            note,
            customer:customer_id (
              first_name,
              last_name,
              email,
              phone_number
            ),
            order:order_id (
              order_id,
              total_price,
              event_date,
              event_location,
              number_of_guest,
              event_type ( event_name )
            ),
            invoices (
              invoices_id,
              status
            )
          `,
          )
          .eq("status", "scheduled")
          .not("order_id", "is", null)
          .order("meeting_date", { ascending: true });

        if (meetingsError) {
          throw meetingsError;
        }

        const uninvoicedMeetings = (data ?? []).filter(
          (consultation) =>
            !(consultation.invoices ?? []).some(
              (invoice) => invoice.status !== "draft",
            ),
        );

        if (mounted) {
          setMeetings(uninvoicedMeetings.map(mapConsultationToMeeting));
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load active meetings right now.");
          setMeetings([]);
        }
      }
    }

    loadActiveMeetings();

    return () => {
      mounted = false;
    };
  }, []);

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
            <Link
              href="/dashboard/admin"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#A0A0A0] transition hover:text-[#D4AF37]"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>

            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <CalendarCheck size={17} />
              <span>Active Meetings</span>
            </div>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Scheduled Client Meetings
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Review meetings that were scheduled from consultation requests and
              prepare invoices once meeting details are confirmed.
            </p>
          </div>

          <div className="border-l-2 border-[#D4AF37] bg-white/[0.03] px-4 py-3 text-sm text-[#D4AF37]">
            {meetings === null ? "..." : meetingCount} meetings awaiting invoice
            creation
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          <OverviewCard
            label="Meetings"
            value={meetings === null ? "..." : meetingCount}
            caption="Scheduled with customers"
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mt-8 rounded-2xl border border-[#1F1F1F] bg-white/5 p-5 backdrop-blur-md md:p-6"
        >
          <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                Meeting List
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Active Meetings
              </h2>
            </div>

            <p className="border-l border-white/10 pl-3 text-xs uppercase tracking-[0.16em] text-[#797676]">
              Scheduled meetings
            </p>
          </div>

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label
              htmlFor="active-meetings-search"
              className="text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
            >
              Search order details
            </label>
            <div className="relative w-full md:max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
              />
              <input
                id="active-meetings-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by client, event, date, guests, or location"
                className="h-12 w-full rounded-lg border border-white/10 bg-[#0A0A0A]/50 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#4F4F4F] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>
          </div>

          {error && (
            <div className="mb-5 border border-red-400/20 bg-red-400/5 px-4 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="hidden grid-cols-[1fr_0.85fr_0.85fr_0.7fr_0.75fr] gap-4 border-b border-white/10 px-4 pb-3 text-xs uppercase tracking-[0.18em] text-[#797676] lg:grid">
            <span>Client</span>
            <span>Meeting</span>
            <span>Event</span>
            <span>Guests</span>
            <span className="text-right">Action</span>
          </div>

          <div className="mt-3 space-y-3">
            {meetings === null ? (
              [...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40"
                />
              ))
            ) : filteredMeetings.length === 0 ? (
              <div className="border border-white/10 bg-[#0A0A0A]/40 px-4 py-8 text-center text-sm text-[#A0A0A0]">
                {normalizedSearch
                  ? "No active meetings match your search."
                  : "No active meetings have been scheduled yet."}
              </div>
            ) : (
              filteredMeetings.map((meeting, index) => (
                <motion.article
                  key={meeting.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.22 + index * 0.04 }}
                  className="grid grid-cols-1 gap-4 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 p-4 transition-all duration-300 hover:border-[#D4AF37]/70 hover:bg-white/[0.04] lg:grid-cols-[1fr_0.85fr_0.85fr_0.7fr_0.75fr] lg:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-white md:text-base">
                      {meeting.customerName}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-[#797676]">
                      <MapPin size={13} className="text-[#D4AF37]" />
                      {meeting.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      {formatDate(meeting.meetingDate)}
                    </p>
                    <p className="mt-1 text-xs text-[#797676]">
                      {formatTime(meeting.meetingTime)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-[#A0A0A0]">
                      {meeting.eventType}
                    </p>
                    <p className="mt-1 text-xs text-[#797676]">
                      {formatDate(meeting.eventDate)}
                    </p>
                  </div>

                  <div className="border-l border-white/10 pl-3">
                    <p className="text-sm font-medium text-white">
                      {meeting.guests}
                    </p>
                    <p className="mt-1 text-xs text-[#797676]">Guests</p>
                  </div>

                  <div className="flex lg:justify-end">
                    <Link
                      href={`/dashboard/admin/invoices/create?consultationId=${meeting.id}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/40 px-4 text-sm font-medium text-[#D4AF37] transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                    >
                      <ClipboardList size={15} />
                      Create Invoice
                    </Link>
                  </div>
                </motion.article>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function OverviewCard({ label, value, caption }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:bg-white/10 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
      <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-[#797676]">{caption}</p>
    </div>
  );
}
