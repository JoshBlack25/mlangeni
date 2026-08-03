"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircleMore,
  ArrowUpRight,
  Clock,
  CalendarCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";

function getRelativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.round(diffMs / (1000 * 60));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatEventDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sessionLabel(session) {
  if (!session) return "";
  return session.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusStyles(status) {
  if (status === "confirmed") {
    return "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]";
  }
  if (status === "cancelled") {
    return "border-white/10 bg-white/5 text-[#797676]";
  }
  return "border-white/20 bg-white/10 text-[#A0A0A0]"; // pending
}

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEnquiries() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEnquiries([]);
        return;
      }

      const [recent, pending] = await Promise.all([
        supabase
          .from("enquiries")
          .select(
            "id, status, event_date, session, guests, message, updated_at",
          )
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(2),
        supabase
          .from("enquiries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pending"),
      ]);

      if (recent.error || pending.error) {
        setError((recent.error || pending.error).message);
        return;
      }

      setEnquiries(recent.data ?? []);
      setPendingCount(pending.count ?? 0);
    }

    fetchEnquiries();
  }, []);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center backdrop-blur-md">
        <p className="text-sm text-red-400">
          Couldn&apos;t load your enquiries
        </p>
        <p className="mt-1 text-xs text-[#797676]">{error}</p>
      </div>
    );
  }

  if (enquiries === null) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p className="text-sm text-[#797676]">Loading enquiries…</p>
      </div>
    );
  }

  if (enquiries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md">
        <MessageCircleMore className="mb-4 text-[#D4AF37]" size={26} />
        <h3 className="text-base font-semibold text-white">No enquiries yet</h3>
        <p className="mt-2 max-w-[16rem] text-sm text-[#A0A0A0]">
          Send us an enquiry and it will show up here.
        </p>
        <Link
          href="/dashboard/customer/enquiry"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
        >
          Send an enquiry
        </Link>
      </div>
    );
  }

  const [latest, secondary] = enquiries;

  return (
    <Link
      href="/dashboard/customer/enquiry"
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
          Enquiries
        </p>

        {pendingCount > 0 && (
          <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#D4AF37]">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* LATEST ENQUIRY PREVIEW */}
      <div className="px-6 pt-4">
        {latest.status === "pending" && (
          <PreviewRow
            icon={<Clock size={16} />}
            iconBg="bg-white/10 text-[#A0A0A0]"
            title="Enquiry submitted"
            subtitle={`${formatEventDate(latest.event_date)} · ${sessionLabel(latest.session)} · ${latest.guests} guests`}
            timestamp={getRelativeTime(latest.updated_at)}
          />
        )}

        {latest.status === "confirmed" && (
          <PreviewRow
            icon={<CalendarCheck size={16} />}
            iconBg="bg-[#D4AF37]/10 text-[#D4AF37]"
            title="Enquiry confirmed"
            subtitle={`${formatEventDate(latest.event_date)} · ${sessionLabel(latest.session)} · ${latest.guests} guests`}
            timestamp={getRelativeTime(latest.updated_at)}
          />
        )}

        {latest.status === "cancelled" && (
          <PreviewRow
            icon={<XCircle size={16} />}
            iconBg="bg-white/5 text-[#797676]"
            title="Enquiry cancelled"
            subtitle={latest.message?.slice(0, 60) ?? ""}
            timestamp={getRelativeTime(latest.updated_at)}
          />
        )}
      </div>

      {/* SECONDARY ENQUIRY */}
      {secondary && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 px-6 py-3">
          <p className="truncate text-sm text-white">
            {formatEventDate(secondary.event_date)} ·{" "}
            {sessionLabel(secondary.session)}
          </p>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyles(
              secondary.status,
            )}`}
          >
            {statusLabel(secondary.status)}
          </span>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-auto flex items-center justify-between border-t border-white/10 px-6 py-3 text-sm font-medium text-[#D4AF37] transition-all duration-300 group-hover:gap-1">
        View all enquiries
        <ArrowUpRight
          size={16}
          className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </Link>
  );
}

function PreviewRow({ icon, iconBg, title, subtitle, timestamp }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-[#A0A0A0]">
          {subtitle}
        </p>
        <p className="mt-1 text-xs text-[#797676]">{timestamp}</p>
      </div>
    </div>
  );
}
