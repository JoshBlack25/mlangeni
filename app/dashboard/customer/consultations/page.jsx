"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useCustomerConsultations } from "@/app/components/dashboard/customer/consultations/useCustomerConsultations";
import {
  consultationStatusLabel,
  isActiveConsultation,
  formatConsultationDate,
} from "@/app/utils/consultationPresentation";
import {
  PageHeader,
  Panel,
  PanelHeader,
  Figure,
  FigureRow,
  Tabs,
  Button,
  StatusBadge,
  EngravedDate,
  SkeletonRows,
  EmptyState,
} from "@/app/components/dashboard/ui";

export default function CustomerConsultationsPage() {
  const { consultations, error } = useCustomerConsultations();
  const [filter, setFilter] = useState("all");
  const all = consultations ?? [];
  const active = all.filter(isActiveConsultation);
  const past = all.filter((item) => !isActiveConsultation(item));
  const visible =
    filter === "active"
      ? active
      : filter === "past"
        ? past
        : [...active, ...past];
  const loading = consultations === null;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        className="mb-0 md:mb-0"
        title="Consultations"
        lead="Review your booking requests, speak with our team and find your scheduled meeting details."
        actions={
          <Button href="/dashboard/customer/booking" variant="secondary">
            Plan an event
          </Button>
        }
      />
      <FigureRow>
        <Figure
          label="Active"
          value={active.length}
          loading={loading}
          hint="Awaiting a meeting"
          emphasis
        />
        <Figure
          label="History"
          value={past.length}
          loading={loading}
          hint="Scheduled and completed consultations"
        />
        <Figure
          label="Total"
          value={all.length}
          loading={loading}
          hint="Your booking requests"
        />
      </FigureRow>
      <Panel>
        <PanelHeader title="Your consultations" />
        <Tabs
          label="Filter consultations"
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: "All", count: all.length },
            { value: "active", label: "Active", count: active.length },
            { value: "past", label: "History", count: past.length },
          ]}
        />
        {error ? (
          <p role="alert" className="mt-5 text-sm text-mgh-danger">
            {error}
          </p>
        ) : loading ? (
          <SkeletonRows rows={4} label="Loading consultations" />
        ) : !visible.length ? (
          <EmptyState
            title={
              filter === "active"
                ? "No active consultations"
                : filter === "past"
                  ? "No consultation history"
                  : "No consultations yet"
            }
          >
            Your consultations appear here after you submit a booking and remain
            here after a meeting is scheduled.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-mgh-line-soft">
            {visible.map((item) => (
              <li
                key={item.consultations_id}
                className="flex flex-wrap items-center gap-4 py-5"
              >
                <EngravedDate date={item.order?.event_date} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-mgh-text">
                    {item.order?.event_type?.event_name ?? "Event booking"}
                  </p>
                  <p className="mt-1 text-caption tabular-nums text-mgh-dim">
                    ORD-{item.order_id.slice(0, 8).toUpperCase()}
                  </p>
                  {item.meeting_date && (
                    <p className="mt-1 text-sm text-mgh-muted">
                      Meeting: {formatConsultationDate(item.meeting_date)}
                    </p>
                  )}
                </div>
                <StatusBadge
                  status={item.status}
                  label={consultationStatusLabel(item)}
                />
                <Button
                  href={`/dashboard/customer/consultations/${item.consultations_id}`}
                  variant="secondary"
                  size="sm"
                >
                  View consultation <ArrowRight size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
