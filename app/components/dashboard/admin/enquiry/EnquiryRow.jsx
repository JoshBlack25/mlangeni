"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  User,
  UserCheck,
  Users,
  Calendar,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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

export default function EnquiryRow({
  enquiry,
  onStatusChange,
  autoOpen = false,
}) {
  const [localError, setLocalError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const rowRef = useRef(null);
  const hasAutoOpened = useRef(false);

  const isCustomer = Boolean(enquiry.user_id);

  useEffect(() => {
    if (autoOpen && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      setShowDetails(true);
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [autoOpen]);

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

  const rowBorderClass = autoOpen ? "border-[#D4AF37]/40" : "border-[#1F1F1F]";

  return (
    <>
      <div
        ref={rowRef}
        onClick={() => setShowDetails(true)}
        className={
          "cursor-pointer rounded-xl border bg-white/5 p-5 transition hover:border-[#2A2A2A] " +
          rowBorderClass
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-white">{enquiry.name}</h3>

              <span
                className={
                  isCustomer
                    ? "flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-2 py-0.5 text-xs text-[#D4AF37]"
                    : "flex items-center gap-1 rounded-full border border-[#1F1F1F] bg-white/5 px-2 py-0.5 text-xs text-[#A0A0A0]"
                }
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
              {enquiry.email}
              {enquiry.phone ? " · " + enquiry.phone : ""}
            </p>

            {localError && (
              <p className="mt-2 text-xs text-red-400">{localError}</p>
            )}
          </div>

          <div
            className="flex shrink-0 items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {enquiry.phone && (
              <a
                href={toWhatsAppLink(enquiry.phone)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open WhatsApp chat"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1F1F1F] text-emerald-400 transition hover:border-emerald-400"
              >
                <MessageCircle size={17} />
              </a>
            )}

            {enquiry.customer_id && (
              <Link
                href={`/dashboard/admin/chat?customerId=${enquiry.customer_id}`}
                aria-label={`Open chat with ${enquiry.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
              >
                <MessageCircle size={17} />
              </Link>
            )}

            <StatusDropdown
              value={enquiry.status}
              onChange={handleStatusChange}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0B0A09] shadow-2xl"
            >
              <div className="absolute left-0 right-0 top-0 h-[2px] bg-[#D4AF37]" />

              <div className="flex items-start justify-between border-b border-[#1F1F1F] px-6 py-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                    Enquiry
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-white">
                    {enquiry.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  aria-label="Close"
                  className="rounded-lg p-2 text-[#666666] transition hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <Calendar size={14} className="text-[#D4AF37]" />
                    {formatDate(enquiry.event_date)} · {enquiry.session}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <Users size={14} className="text-[#D4AF37]" />
                    {enquiry.guests} guests
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                    <Mail size={14} className="text-[#D4AF37]" />
                    {enquiry.email}
                  </div>
                  {enquiry.phone && (
                    <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                      <Phone size={14} className="text-[#D4AF37]" />
                      {enquiry.phone}
                    </div>
                  )}
                </div>

                {enquiry.message && (
                  <div className="mt-5 border-t border-[#1F1F1F] pt-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#5F5F5F]">
                      Message
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#B0B0B0]">
                      {enquiry.message}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-[#1F1F1F] pt-6">
                  <StatusDropdown
                    value={enquiry.status}
                    onChange={handleStatusChange}
                  />

                  <button
                    type="button"
                    onClick={() => setShowDetails(false)}
                    className="rounded-lg border border-[#2A2A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                  >
                    Close
                  </button>
                </div>

                {localError && (
                  <p className="mt-3 text-xs text-red-400">{localError}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
