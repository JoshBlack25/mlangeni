"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";

function getStage(consultation) {
  const { status, invoice } = consultation;

  if (status === "requested")
    return { label: "New — Needs Scheduling", tone: "gold" };
  if (status === "scheduled")
    return { label: "Planning In Progress", tone: "neutral" };

  // status === "completed" from here
  if (!invoice) return { label: "Invoice Pending", tone: "neutral" };
  if (invoice.status === "paid")
    return { label: "Paid — Ready for Calendar", tone: "green" };
  if (invoice.status === "overdue")
    return { label: "Payment Overdue", tone: "red" };
  return { label: "Awaiting Payment", tone: "gold" }; // draft or sent
}

const toneStyles = {
  gold: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30",
  neutral: "bg-white/5 text-[#A0A0A0] border-[#1F1F1F]",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function ActiveConsultations() {
  const [consultations, setConsultations] = useState(null); // null = loading

  useEffect(() => {
    async function loadConsultations() {
      const { data, error } = await supabase
        .from("consultations")
        .select(
          `
          consultations_id,
          status,
          meeting_date,
          customer:customer_id ( first_name, last_name ),
          invoices ( status )
        `,
        )
        .neq("status", "cancelled")
        .order("meeting_date", { ascending: true })
        .limit(6);

      if (error) {
        console.error("Failed to load consultations:", error);
        setConsultations([]);
        return;
      }

      const mapped = (data ?? []).map((c) => ({
        id: c.consultations_id,
        status: c.status,
        meetingDate: c.meeting_date,
        clientName: c.customer
          ? `${c.customer.first_name ?? ""} ${c.customer.last_name ?? ""}`.trim()
          : "Unknown client",
        invoice: Array.isArray(c.invoices) ? c.invoices[0] : c.invoices,
      }));

      setConsultations(mapped);
    }

    loadConsultations();
  }, []);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Active Consultations
        </h3>
        <Link
          href="/dashboard/admin/consultations"
          className="text-sm font-medium text-[#D4AF37] hover:underline"
        >
          View all
        </Link>
      </div>

      {consultations === null ? (
        <div className="flex flex-1 flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[#1F1F1F] bg-white/5"
            />
          ))}
        </div>
      ) : consultations.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-[#A0A0A0]">
          No active consultations right now.
        </p>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {consultations.map((c) => {
            const stage = getStage(c);

            return (
              <Link
                key={c.id}
                href={`/dashboard/admin/consultations/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 p-4 transition hover:border-[#D4AF37]"
              >
                <div>
                  <p className="font-medium text-white">{c.clientName}</p>
                  <p className="text-sm text-[#A0A0A0]">
                    {new Date(c.meetingDate).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${toneStyles[stage.tone]}`}
                >
                  {stage.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
