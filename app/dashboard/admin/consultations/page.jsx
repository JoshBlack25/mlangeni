"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";

function formatDate(dateString) {
  if (!dateString) return "TBC";

  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCustomerName(customer) {
  if (!customer) return "Unknown customer";

  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  return name || customer.email || "Unknown customer";
}

function getEventType(consultation) {
  return consultation.order?.event_type?.event_name ?? "Event type pending";
}

function getEventDate(consultation) {
  return consultation.order?.event_date ?? null;
}

function getInitialStatusFilter() {
  if (typeof window === "undefined") return "requested";

  const status = new URLSearchParams(window.location.search).get("status");

  return status === "scheduled" ? "scheduled" : "requested";
}

function getRelevantDate(consultation, statusFilter) {
  if (statusFilter === "scheduled") {
    return consultation.meeting_date ?? null;
  }

  return getEventDate(consultation);
}

function getReviewStatus(consultation) {
  return consultation.admin_id ? "Viewed Order" : "Not Opened";
}

export default function AdminConsultationsPage() {
  const [statusFilter] = useState(getInitialStatusFilter);
  const [consultations, setConsultations] = useState(null);
  const [error, setError] = useState(null);
  const isMeetingView = statusFilter === "scheduled";

  useEffect(() => {
    let mounted = true;

    async function loadConsultations() {
      try {
        setError(null);

        const { data, error: consultationError } = await supabase
          .from("consultations")
          .select(
            `
            consultations_id,
            admin_id,
            status,
            created_at,
            meeting_date,
            customer:customer_id (
              first_name,
              last_name,
              email
            ),
            order:order_id (
              order_id,
              event_date,
              event_type ( event_name )
            )
          `,
          )
          .eq("status", statusFilter)
          .not("order_id", "is", null)
          .order("created_at", { ascending: false });

        if (consultationError) {
          throw consultationError;
        }

        if (mounted) {
          setConsultations(data ?? []);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.message || "Unable to load consultation requests right now.",
          );
          setConsultations([]);
        }
      }
    }

    loadConsultations();

    return () => {
      mounted = false;
    };
  }, [statusFilter]);

  const requestCount = consultations?.length ?? 0;
  const nextConsultation = useMemo(() => {
    if (!consultations?.length) return null;

    return [...consultations]
      .filter((consultation) => getRelevantDate(consultation, statusFilter))
      .sort(
        (a, b) =>
          new Date(getRelevantDate(a, statusFilter)).getTime() -
          new Date(getRelevantDate(b, statusFilter)).getTime(),
      )[0];
  }, [consultations, statusFilter]);

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
              <span>{isMeetingView ? "Meetings" : "Consultations"}</span>
            </div>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              {isMeetingView ? "Active Meetings" : "Consultation Requests"}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              {isMeetingView
                ? "Review scheduled in-person meetings that were created from consultation requests."
                : "Review customer orders that need an admin consultation before the client is contacted to discuss their event in more detail."}
            </p>
          </div>

          <div className="border-l-2 border-[#D4AF37] bg-white/[0.03] px-4 py-3 text-sm text-[#D4AF37]">
            {requestCount}{" "}
            {isMeetingView ? "meetings scheduled" : "requests awaiting review"}
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          <OverviewCard
            icon={UsersRound}
            label={isMeetingView ? "Meetings" : "Requests"}
            value={consultations === null ? "..." : requestCount}
            caption={
              isMeetingView
                ? "Consultations already scheduled"
                : "Customer orders submitted"
            }
          />
          <OverviewCard
            icon={CalendarDays}
            label={isMeetingView ? "Next Meeting" : "Next Event Date"}
            value={
              nextConsultation
                ? formatDate(getRelevantDate(nextConsultation, statusFilter))
                : "TBC"
            }
            caption={
              nextConsultation
                ? getEventType(nextConsultation)
                : isMeetingView
                  ? "No meetings"
                  : "No requests"
            }
          />
          <OverviewCard
            icon={ClipboardList}
            label={isMeetingView ? "Meeting Details" : "Order Review"}
            value={
              consultations === null
                ? "..."
                : isMeetingView
                  ? "Scheduled"
                  : "Pending"
            }
            caption={
              isMeetingView
                ? "Open a meeting to view the order"
                : "Open a request to view the order"
            }
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="mt-8 rounded-2xl border border-[#1F1F1F] bg-white/5 p-5 backdrop-blur-md md:p-6"
        >
          <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                {isMeetingView ? "Meeting List" : "Consultation List"}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {isMeetingView ? "Scheduled Meetings" : "Customer Order Requests"}
              </h2>
            </div>

            <p className="border-l border-white/10 pl-3 text-xs uppercase tracking-[0.16em] text-[#797676]">
              {isMeetingView ? "Scheduled meetings" : "Requested orders"}
            </p>
          </div>

          <div className="hidden grid-cols-[1fr_0.8fr_0.9fr_0.7fr_0.5fr] gap-4 border-b border-white/10 px-4 pb-3 text-xs uppercase tracking-[0.18em] text-[#797676] md:grid">
            <span>Client</span>
            <span>{isMeetingView ? "Meeting Date" : "Event Date"}</span>
            <span>Event Type</span>
            <span>Review</span>
            <span className="text-right">Action</span>
          </div>

          {error && (
            <div className="mt-5 border border-red-400/20 bg-red-400/5 px-4 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {consultations === null ? (
            <div className="mt-5 space-y-3">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40"
                />
              ))}
            </div>
          ) : consultations.length === 0 ? (
            <div className="mt-5 flex min-h-56 flex-col items-center justify-center rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 px-6 text-center">
              <CalendarCheck className="text-[#D4AF37]" size={28} />
              <h3 className="mt-4 text-lg font-semibold text-white">
                {isMeetingView ? "No active meetings" : "No consultation requests"}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#A0A0A0]">
                {isMeetingView
                  ? "Scheduled meetings will appear here after an admin sets them up."
                  : "Customer orders that need admin consultation will appear here."}
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {consultations.map((consultation, index) => (
                <motion.article
                  key={consultation.consultations_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 + index * 0.04 }}
                  className="grid grid-cols-1 gap-4 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 p-4 transition-all duration-300 hover:border-[#D4AF37]/70 hover:bg-white/[0.04] md:grid-cols-[1fr_0.8fr_0.9fr_0.7fr_0.5fr] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-white md:text-base">
                      {getCustomerName(consultation.customer)}
                    </p>
                    <p className="mt-1 text-xs text-[#797676]">
                      Request #{index + 1}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      {formatDate(getRelevantDate(consultation, statusFilter))}
                    </p>
                    <p className="mt-1 text-xs text-[#797676]">
                      {isMeetingView ? "Meeting date" : "Event date"}
                    </p>
                  </div>

                  <p className="text-sm text-[#A0A0A0]">
                    {getEventType(consultation)}
                  </p>

                  <div className="border-l border-white/10 pl-3">
                    <p
                      className={`text-sm font-medium ${
                        consultation.admin_id
                          ? "text-[#D4AF37]"
                          : "text-[#797676]"
                      }`}
                    >
                      {getReviewStatus(consultation)}
                    </p>
                    <p className="mt-1 text-xs text-[#797676]">
                      Review status
                    </p>
                  </div>

                  <div className="flex md:justify-end">
                    <Link
                      href={`/dashboard/admin/consultations/${consultation.consultations_id}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/40 px-4 text-sm font-medium text-[#D4AF37] transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                    >
                      {isMeetingView ? "View Meeting" : "View Order"}
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
