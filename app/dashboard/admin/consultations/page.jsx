"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  PageHeader,
  Panel,
  PanelHeader,
  DataTable,
  StatusBadge,
  Figure,
  FigureRow,
  EmptyState,
  SkeletonRows,
} from "@/app/components/dashboard/ui";

function formatDate(dateString) {
  if (!dateString) return "TBC";

  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  // Date-only values carry no meeting time.
  if (typeof dateString === "string" && !dateString.includes("T")) return null;

  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
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

  const rows = (consultations ?? []).map((consultation, index) => ({
    ...consultation,
    requestNumber: index + 1,
  }));

  const columns = [
    {
      key: "customer",
      header: "Client",
      primary: true,
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-mgh-text">
            {getCustomerName(row.customer)}
          </span>
          <span className="text-caption text-mgh-dim">
            Request #{row.requestNumber}
          </span>
        </span>
      ),
    },
    {
      key: "event",
      header: "Event Type",
      render: (row) => (
        <span className="text-mgh-muted">{getEventType(row)}</span>
      ),
    },
    {
      key: "date",
      header: isMeetingView ? "Meeting Date" : "Event Date",
      render: (row) => {
        const date = getRelevantDate(row, statusFilter);
        return (
          <span className="whitespace-nowrap tabular-nums">
            {formatDate(date)}
            {isMeetingView && formatTime(date) && (
              <span className="text-mgh-muted"> · {formatTime(date)}</span>
            )}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "review",
      header: "Review",
      render: (row) => (
        <span className={row.admin_id ? "text-mgh-text" : "text-mgh-dim"}>
          {getReviewStatus(row)}
        </span>
      ),
    },
    {
      key: "action",
      header: <span className="sr-only">Action</span>,
      align: "right",
      hideOnMobile: true,
      render: () => (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-mgh-muted">
          {isMeetingView ? "View Meeting" : "View Order"}
          <ArrowUpRight size={16} aria-hidden="true" className="text-mgh-dim" />
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        density="dense"
        className="mb-0 md:mb-0"
        title={isMeetingView ? "Active Meetings" : "Consultation Requests"}
        lead={
          isMeetingView
            ? "Review scheduled in-person meetings that were created from consultation requests."
            : "Review customer orders that need an admin consultation before the client is contacted to discuss their event in more detail."
        }
        actions={
          <p className="text-sm tabular-nums text-mgh-muted">
            {requestCount}{" "}
            {isMeetingView ? "meetings scheduled" : "requests awaiting review"}
          </p>
        }
      />

      <FigureRow>
        <Figure
          label={isMeetingView ? "Meetings" : "Requests"}
          value={requestCount}
          loading={consultations === null}
          hint={
            isMeetingView
              ? "Consultations already scheduled"
              : "Customer orders submitted"
          }
        />
        <Figure
          label={isMeetingView ? "Next Meeting" : "Next Event Date"}
          value={
            nextConsultation
              ? formatDate(getRelevantDate(nextConsultation, statusFilter))
              : "TBC"
          }
          loading={consultations === null}
          hint={
            nextConsultation
              ? getEventType(nextConsultation)
              : isMeetingView
                ? "No meetings"
                : "No requests"
          }
        />
        <Figure
          label={isMeetingView ? "Meeting Details" : "Order Review"}
          value={isMeetingView ? "Scheduled" : "Pending"}
          loading={consultations === null}
          hint={
            isMeetingView
              ? "Open a meeting to view the order"
              : "Open a request to view the order"
          }
        />
      </FigureRow>

      <Panel density="dense">
        <PanelHeader
          density="dense"
          title={isMeetingView ? "Scheduled Meetings" : "Customer Order Requests"}
        />

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-control border border-mgh-danger/30 bg-mgh-danger/10 px-4 py-3 text-sm text-mgh-danger"
          >
            {error}
          </p>
        )}

        {consultations === null ? (
          <SkeletonRows
            rows={4}
            label={isMeetingView ? "Loading meetings" : "Loading consultation requests"}
          />
        ) : (
          <DataTable
            density="dense"
            caption={isMeetingView ? "Scheduled meetings" : "Customer order requests"}
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.consultations_id}
            rowHref={(row) =>
              `/dashboard/admin/consultations/${row.consultations_id}`
            }
            empty={
              <EmptyState
                title={
                  isMeetingView ? "No active meetings" : "No consultation requests"
                }
              >
                {isMeetingView
                  ? "Scheduled meetings will appear here after an admin sets them up."
                  : "Customer orders that need admin consultation will appear here."}
              </EmptyState>
            }
          />
        )}
      </Panel>
    </div>
  );
}
