"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  SESSION_OPTIONS,
  normalizeSession,
} from "@/app/components/constants/sessions";

/**
 * The customer's outstanding requests, shown on the enquiry page.
 *
 * This page is a submission form, but it is also where the dashboard's
 * Enquiries widget sends anyone who wants to *see* their enquiries — so
 * arriving here and finding only an empty form answered the wrong question.
 *
 * Deliberately pending-only and read-only. Confirmed enquiries are a booking
 * the team has accepted and belong on the Orders page; a cancelled one is not
 * something to leave sitting in front of the customer.
 *
 * Note this covers enquiries only. Menu-builder submissions are orders, not
 * enquiries, so they appear under Orders and never here.
 */

const MAX_SHOWN = 4;

function formatDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sessionLabel(session) {
  const normalized = normalizeSession(session);
  const match = SESSION_OPTIONS.find((o) => o.value === normalized);
  if (match) return match.label;
  // Unrecognised value (a legacy row, say) — show it rather than hiding it.
  return String(session ?? "").replace(/_/g, " ");
}

export default function PendingEnquiries() {
  const [enquiries, setEnquiries] = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setEnquiries([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("enquiries")
        .select("id, event_date, session, guests")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("event_date", { ascending: true });

      if (!active) return;

      if (fetchError) {
        console.error("Failed to load pending enquiries:", fetchError);
        setError("Couldn't load your requests.");
        setEnquiries([]);
        return;
      }

      setEnquiries(data ?? []);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  // Nothing to say yet — don't push the availability panel down with a spinner.
  if (enquiries === null) return null;

  const shown = enquiries.slice(0, MAX_SHOWN);
  const overflow = enquiries.length - shown.length;

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-6 text-left shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold tracking-wide text-white">
          Awaiting Review
        </h3>

        {enquiries.length > 0 && (
          <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#D4AF37]">
            {enquiries.length}
          </span>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-[11px] text-red-400">{error}</p>
      ) : enquiries.length === 0 ? (
        <p className="mt-3 text-[11px] italic text-white/30">
          Nothing awaiting review. Anything you send appears here until our team
          confirms it.
        </p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col">
            {shown.map((enquiry, i) => (
              <li
                key={enquiry.id}
                className={`py-3 ${
                  i < shown.length - 1 ? "border-b border-white/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {formatDate(enquiry.event_date)}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/40">
                      {sessionLabel(enquiry.session)} · {enquiry.guests} guests
                    </p>
                  </div>

                  <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]">
                    <Clock3 size={11} />
                    Pending
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {overflow > 0 && (
            <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-white/30">
              +{overflow} more
            </p>
          )}
        </>
      )}
    </div>
  );
}
