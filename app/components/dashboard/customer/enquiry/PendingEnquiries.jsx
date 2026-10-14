"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import {
  SESSION_OPTIONS,
  normalizeSession,
} from "@/app/components/constants/sessions";
import {
  Panel,
  PanelHeader,
  EngravedDate,
  StatusBadge,
} from "@/app/components/dashboard/ui";

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
    <Panel>
      <PanelHeader
        title="Awaiting Review"
        action={
          enquiries.length > 0 ? (
            <span className="font-serif text-xl tabular-nums text-mgh-text">
              <span className="sr-only">Count: </span>
              {enquiries.length}
            </span>
          ) : undefined
        }
        className="mb-3"
      />

      {error ? (
        <p role="alert" className="text-sm text-mgh-danger">
          {error}
        </p>
      ) : enquiries.length === 0 ? (
        <p className="text-sm leading-relaxed text-mgh-muted">
          Nothing awaiting review. Anything you send appears here until our team
          confirms it.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-mgh-line-soft">
            {shown.map((enquiry) => (
              <li key={enquiry.id} className="flex items-center gap-4 py-4">
                <EngravedDate date={enquiry.event_date} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm tabular-nums text-mgh-text">
                    {sessionLabel(enquiry.session)} · {enquiry.guests} guests
                  </p>
                  <StatusBadge status="pending" className="mt-1.5" />
                </div>
              </li>
            ))}
          </ul>

          {overflow > 0 && (
            <p className="mt-3 text-caption text-mgh-muted">+{overflow} more</p>
          )}
        </>
      )}
    </Panel>
  );
}
