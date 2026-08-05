"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircleMore,
  ArrowUpRight,
  Clock,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import {supabase} from "@/services/supabaseClient";

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

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusStyles(status) {
  if (status === "scheduled") {
    return "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]";
  }
  if (status === "cancelled") {
    return "border-white/10 bg-white/5 text-[#797676]";
  }
  return "border-white/20 bg-white/10 text-[#A0A0A0]"; // requested, completed
}

export default function Consultations() {
  const [consultations, setConsultations] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchConsultations() {
      const [recent, pending] = await Promise.all([
        supabase
          .from("consultations")
          .select(
            `
            consultations_id,
            status,
            meeting_date,
            note,
            updated_at,
            admin:admin_id ( first_name, last_name )
          `,
          )
          .order("updated_at", { ascending: false })
          .limit(2),
        supabase
          .from("consultations")
          .select("*", { count: "exact", head: true })
          .eq("status", "requested"),
      ]);

      if (recent.error || pending.error) {
        setError((recent.error || pending.error).message);
        return;
      }

      setConsultations(recent.data ?? []);
      setPendingCount(pending.count ?? 0);
    }

    fetchConsultations();
  }, []);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center backdrop-blur-md">
        <p className="text-sm text-red-400">
          Couldn&apos;t load your consultations
        </p>
        <p className="mt-1 text-xs text-[#797676]">{error}</p>
      </div>
    );
  }

  if (consultations === null) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p className="text-sm text-[#797676]">Loading consultations…</p>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md">
        <MessageCircleMore className="mb-4 text-[#D4AF37]" size={26} />
        <h3 className="text-base font-semibold text-white">
          No consultations yet
        </h3>
        <p className="mt-2 max-w-[16rem] text-sm text-[#A0A0A0]">
          Reach out to our team and your conversations will show up here.
        </p>
        <Link
          href="/dashboard/customer/consultations"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
        >
          Request a consultation
        </Link>
      </div>
    );
  }

  const [latest, secondary] = consultations;
  const adminName = latest.admin
    ? `${latest.admin.first_name} ${latest.admin.last_name}`
    : null;

  return (
    <Link
      href={`/dashboard/customer/consultations/${latest.consultations_id}`}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
          Consultations
        </p>

        {pendingCount > 0 && (
          <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#D4AF37]">
            {pendingCount} new
          </span>
        )}
      </div>

      {/* LATEST CONSULTATION PREVIEW */}
      <div className="px-6 pt-4">
        {latest.status === "requested" && (
          <PreviewRow
            icon={<Clock size={16} />}
            iconBg="bg-white/10 text-[#A0A0A0]"
            title="Consultation requested"
            subtitle="Awaiting a reply from our team"
            timestamp={getRelativeTime(latest.updated_at)}
          />
        )}

        {latest.status === "scheduled" && (
          <PreviewRow
            icon={<CalendarCheck size={16} />}
            iconBg="bg-[#D4AF37]/10 text-[#D4AF37]"
            title={adminName ?? "Consultation scheduled"}
            subtitle={`Meeting on ${formatDateTime(latest.meeting_date)}`}
            timestamp={getRelativeTime(latest.updated_at)}
          />
        )}

        {latest.status === "completed" && (
          <PreviewRow
            icon={<CheckCircle2 size={16} />}
            iconBg="bg-white/10 text-[#A0A0A0]"
            title="Consultation completed"
            subtitle={latest.note?.slice(0, 60) ?? "No notes added"}
            timestamp={getRelativeTime(latest.updated_at)}
          />
        )}

        {latest.status === "cancelled" && (
          <PreviewRow
            icon={<Clock size={16} />}
            iconBg="bg-white/5 text-[#797676]"
            title="Consultation cancelled"
            subtitle={latest.note?.slice(0, 60) ?? ""}
            timestamp={getRelativeTime(latest.updated_at)}
          />
        )}
      </div>

      {/* SECONDARY CONSULTATION */}
      {secondary && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 px-6 py-3">
          <p className="truncate text-sm text-white">
            {secondary.note?.slice(0, 40) ?? "Consultation"}
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
        View all consultations
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
