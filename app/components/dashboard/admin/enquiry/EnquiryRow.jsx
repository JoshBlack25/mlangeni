"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { Button, formatDate, toDate, Blank, NOT_SET } from "@/app/components/dashboard/ui";
import StatusDropdown from "./StatusDropdown";

function toWhatsAppLink(phone) {
  const digitsOnly = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return `https://wa.me/${digitsOnly}`;
}

const relativeFormatter = new Intl.RelativeTimeFormat("en-ZA", {
  numeric: "auto",
});

const RELATIVE_STEPS = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

function formatRelative(value) {
  const date = toDate(value);
  if (!date) return NOT_SET;

  const seconds = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

function Received({ value }) {
  const date = toDate(value);
  if (!date) return <Blank />;

  return (
    <time
      dateTime={date.toISOString()}
      title={formatDate(date, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
      className="whitespace-nowrap text-mgh-muted"
    >
      {formatRelative(date)}
    </time>
  );
}

/**
 * One enquiry. `layout="table"` renders a <tr> for the md+ table;
 * `layout="stacked"` renders an <li> for the phone list.
 */
export default function EnquiryRow({ enquiry, onStatusChange, layout = "table" }) {
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

    // Notify the customer when their enquiry is confirmed or cancelled.
    // Guest enquiries have no user_id — nothing to deliver to.
    if (enquiry.user_id && (newStatus === "confirmed" || newStatus === "cancelled")) {
      const title = newStatus === "confirmed" ? "Enquiry Confirmed" : "Enquiry Cancelled";
      const message =
        newStatus === "confirmed"
          ? "Your event enquiry has been confirmed. Our team will be in touch shortly."
          : "Your event enquiry has been cancelled. Contact us if you have any questions.";

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from("notifications")
          .insert({
            user_id: enquiry.user_id,
            sender_id: user.id,
            category: "enquiry",
            title,
            message,
            link_url: "/dashboard/customer/enquiry",
          })
          .then(({ error: notifError }) => {
            if (notifError) console.error("Enquiry notification failed:", notifError);
          });
      });
    }
  }

  const customer = (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium text-mgh-text">{enquiry.name}</span>
        <span className="text-label font-semibold uppercase text-mgh-dim">
          {isCustomer ? "Customer" : "Guest"}
        </span>
      </div>
      <p className="truncate text-caption text-mgh-dim">
        {enquiry.email}
        {enquiry.phone ? ` · ${enquiry.phone}` : ""}
      </p>
      {enquiry.message && (
        <p className="mt-0.5 line-clamp-1 max-w-md text-caption text-mgh-muted">
          {enquiry.message}
        </p>
      )}
      {localError && (
        <p role="alert" className="mt-1 text-caption text-mgh-danger">
          {localError}
        </p>
      )}
    </div>
  );

  const eventDate = (
    <span className="whitespace-nowrap">
      <span className="text-mgh-text">{formatDate(enquiry.event_date)}</span>
      {enquiry.session && (
        <span className="text-mgh-muted"> · {enquiry.session}</span>
      )}
    </span>
  );

  const guests = (
    <span className="tabular-nums text-mgh-text">{enquiry.guests}</span>
  );

  const status = (
    <StatusDropdown value={enquiry.status} onChange={handleStatusChange} />
  );

  // phone is nullable — no number, no WhatsApp button.
  const whatsApp = enquiry.phone ? (
    <Button
      variant="quiet"
      size="sm"
      href={toWhatsAppLink(enquiry.phone)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open WhatsApp chat with ${enquiry.name}`}
    >
      <MessageCircle size={16} aria-hidden="true" className="text-mgh-dim" />
      WhatsApp
    </Button>
  ) : null;

  if (layout === "stacked") {
    return (
      <li className="flex flex-col gap-3 py-4">
        {customer}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mgh-dim">
              Event date
            </dt>
            <dd className="truncate text-sm">{eventDate}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mgh-dim">
              Guests
            </dt>
            <dd className="text-sm">{guests}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mgh-dim">
              Received
            </dt>
            <dd className="text-sm">
              <Received value={enquiry.created_at} />
            </dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-3">
          {status}
          {whatsApp}
        </div>
      </li>
    );
  }

  return (
    <tr className="border-b border-mgh-line-soft transition-colors duration-(--mgh-dur-fast) hover:bg-mgh-surface-2">
      <td className="h-11 py-2.5 pl-0 pr-3 align-middle">{customer}</td>
      <td className="h-11 px-3 align-middle">{eventDate}</td>
      <td className="h-11 px-3 text-right align-middle">{guests}</td>
      <td className="h-11 px-3 align-middle">
        <Received value={enquiry.created_at} />
      </td>
      <td className="h-11 px-3 align-middle">{status}</td>
      <td className="h-11 pl-3 pr-0 text-right align-middle">{whatsApp}</td>
    </tr>
  );
}
