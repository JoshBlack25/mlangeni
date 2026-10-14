"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  Panel,
  Button,
  StatusBadge,
  EngravedDate,
  SkeletonRows,
  focusRing,
  statusLabel,
} from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

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

  const header = (
    <div className="mb-2 flex items-center justify-between gap-4">
      <h2 className="font-serif text-xl font-medium text-mgh-text">Enquiries</h2>
      {pendingCount > 0 && (
        <span className="text-caption tabular-nums text-mgh-muted">
          {pendingCount} pending
        </span>
      )}
    </div>
  );

  if (error) {
    return (
      <Panel className="h-full">
        {header}
        <p role="alert" className="mt-3 text-sm text-mgh-danger">
          Couldn&apos;t load your enquiries
        </p>
        <p className="mt-1 text-caption text-mgh-dim">{error}</p>
      </Panel>
    );
  }

  if (enquiries === null) {
    return (
      <Panel className="h-full">
        {header}
        <SkeletonRows rows={2} label="Loading enquiries…" />
      </Panel>
    );
  }

  if (enquiries.length === 0) {
    return (
      <Panel className="h-full">
        {header}
        <p className="mt-3 font-serif text-lg text-mgh-text">No enquiries yet</p>
        <p className="mt-1 text-sm leading-relaxed text-mgh-muted">
          Send us an enquiry and it will show up here.
        </p>
        <Button href="/dashboard/customer/enquiry" variant="secondary" className="mt-5">
          Send an enquiry
        </Button>
      </Panel>
    );
  }

  const [latest, secondary] = enquiries;
  const latestTitle =
    latest.status === "confirmed"
      ? "Enquiry confirmed"
      : latest.status === "cancelled"
        ? "Enquiry cancelled"
        : "Enquiry submitted";
  const latestDetail =
    latest.status === "cancelled"
      ? (latest.message?.slice(0, 60) ?? "")
      : `${formatEventDate(latest.event_date)} · ${sessionLabel(latest.session)} · ${latest.guests} guests`;

  return (
    <Panel className="flex h-full flex-col">
      {header}
      <ul className="divide-y divide-mgh-line-soft">
        <li className="flex items-start gap-4 py-3">
          <EngravedDate date={latest.event_date} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-mgh-text">{latestTitle}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-mgh-muted">{latestDetail}</p>
            <p className="mt-1 text-caption text-mgh-dim">{getRelativeTime(latest.updated_at)}</p>
          </div>
          <StatusBadge status={latest.status} label={statusLabel(latest.status)} />
        </li>
        {secondary && (
          <li className="flex items-center gap-4 py-3">
            <EngravedDate date={secondary.event_date} size="sm" />
            <p className="min-w-0 flex-1 truncate text-sm text-mgh-muted">
              {formatEventDate(secondary.event_date)} · {sessionLabel(secondary.session)}
            </p>
            <StatusBadge status={secondary.status} label={statusLabel(secondary.status)} />
          </li>
        )}
      </ul>
      <div className="mt-auto pt-4">
        <SectionLink href="/dashboard/customer/enquiry">View all enquiries</SectionLink>
      </div>
    </Panel>
  );
}

function SectionLink({ href, children }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm text-sm text-mgh-muted transition-colors hover:text-mgh-text",
        focusRing,
      )}
    >
      {children}
      <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}
