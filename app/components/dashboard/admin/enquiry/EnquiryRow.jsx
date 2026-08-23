"use client";

import { useState } from "react";
import { MessageCircle, User, UserCheck, Users, Calendar } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import StatusDropdown from "./StatusDropdown";

function formatDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toWhatsAppLink(phone) {
  const digitsOnly = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${digitsOnly}`;
}

export default function EnquiryRow({ enquiry, onStatusChange }) {
  const [localError, setLocalError] = useState(null);

  const isCustomer = Boolean(enquiry.user_id);

  async function handleStatusChange(newStatus) {
    setLocalError(null);

    const { error } = await supabase
      .from("enquiries")
      .update({ status: newStatus })
      .eq("id", enquiry.id);

    if (error) {
      console.error("Failed to update enquiry status:", error);
      setLocalError("Couldn't update status. Please try again.");
      return;
    }

    onStatusChange(enquiry.id, newStatus);
  }

  return (
    <div className="rounded-xl border border-[#1F1F1F] bg-white/5 p-5 transition hover:border-[#2A2A2A]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-white">{enquiry.name}</h3>

            <span
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                isCustomer
                  ? "border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37]"
                  : "border-[#1F1F1F] bg-white/5 text-[#A0A0A0]"
              }`}
            >
              {isCustomer ? <UserCheck size={11} /> : <User size={11} />}
              {isCustomer ? "Customer" : "Guest"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#A0A0A0]">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {formatDate(enquiry.event_date)} · {enquiry.session}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={13} />
              {enquiry.guests} guests
            </span>
          </div>

          {enquiry.message && (
            <p className="mt-3 line-clamp-2 text-sm text-[#858585]">
              {enquiry.message}
            </p>
          )}

          <p className="mt-2 text-xs text-[#5F5F5F]">
            {enquiry.email} · {enquiry.phone}
          </p>

          {localError && (
            <p className="mt-2 text-xs text-red-400">{localError}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={toWhatsAppLink(enquiry.phone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open WhatsApp chat"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1F1F1F] text-emerald-400 transition hover:border-emerald-400"
          >
            <MessageCircle size={17} />
          </a>

          <StatusDropdown
            value={enquiry.status}
            onChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}
