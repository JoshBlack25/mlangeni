"use client";
import { ArrowRight } from "lucide-react";
import { useCustomerConsultations } from "@/app/components/dashboard/customer/consultations/useCustomerConsultations";
import {
  consultationStatusLabel,
  isActiveConsultation,
} from "@/app/utils/consultationPresentation";
import {
  Panel,
  PanelHeader,
  Button,
  EngravedDate,
  StatusBadge,
  SkeletonRows,
  EmptyState,
} from "@/app/components/dashboard/ui";

export default function Consultations() {
  const { consultations, error } = useCustomerConsultations();
  const all = consultations ?? [];
  const visible = [
    ...all.filter(isActiveConsultation),
    ...all.filter((item) => !isActiveConsultation(item)),
  ].slice(0, 3);
  return (
    <Panel>
      <PanelHeader
        title="Consultations"
        description="Discuss your booking with our team and review meeting details."
        action={
          <Button
            href="/dashboard/customer/consultations"
            variant="quiet"
            size="sm"
          >
            View all <ArrowRight size={14} />
          </Button>
        }
      />
      {error ? (
        <p role="alert" className="text-sm text-mgh-danger">
          {error}
        </p>
      ) : consultations === null ? (
        <SkeletonRows rows={2} label="Loading consultations" />
      ) : !visible.length ? (
        <EmptyState title="No consultations yet">
          Your consultations will appear here after you submit a booking.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-mgh-line-soft">
          {visible.map((item) => (
            <li
              key={item.consultations_id}
              className="flex flex-wrap items-center gap-4 py-3"
            >
              <EngravedDate date={item.order?.event_date} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-mgh-text">
                  {item.order?.event_type?.event_name ?? "Event booking"}
                </p>
                <StatusBadge
                  className="mt-1"
                  status={item.status}
                  label={consultationStatusLabel(item)}
                />
              </div>
              <Button
                href={`/dashboard/customer/consultations/${item.consultations_id}`}
                variant="secondary"
                size="sm"
              >
                View conversation <ArrowRight size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
