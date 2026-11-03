"use client";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCustomerConsultations } from "@/app/components/dashboard/customer/consultations/useCustomerConsultations";
import ConsultationChat from "@/app/components/dashboard/shared/consultations/ConsultationChat";
import {
  consultationStatusLabel,
  formatConsultationDate,
  formatConsultationTime,
  getConsultationCustomerName,
  getConsultationOrderItems,
} from "@/app/utils/consultationPresentation";
import {
  PageHeader,
  Panel,
  PanelHeader,
  Button,
  StatusBadge,
  SkeletonRows,
  EmptyState,
  formatCurrency,
  statusLabel,
} from "@/app/components/dashboard/ui";

export default function CustomerConsultationDetailsPage() {
  const { consultationId } = useParams();
  const { consultations, error } = useCustomerConsultations(consultationId);
  const consultation = consultations?.[0];
  const customer = consultation?.customer;
  const order = consultation?.order;
  const items = getConsultationOrderItems(order);
  return (
    <div>
      <PageHeader
        title="Consultation details"
        lead="Your event details and conversation with our team."
        actions={
          <Button href="/dashboard/customer/consultations" variant="quiet">
            <ArrowLeft size={16} />
            Back to consultations
          </Button>
        }
      />
      {error ? (
        <Panel>
          <p role="alert" className="text-sm text-mgh-danger">
            {error}
          </p>
        </Panel>
      ) : consultations === null ? (
        <Panel>
          <SkeletonRows rows={5} label="Loading consultation" />
        </Panel>
      ) : !consultation ? (
        <Panel>
          <EmptyState title="Consultation not found">
            This consultation is no longer available for your account.
          </EmptyState>
        </Panel>
      ) : (
        <div className="flex flex-col gap-6">
          <Panel className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-serif text-title text-mgh-text">
                {order?.event_type?.event_name ?? "Event booking"}
              </p>
              <p className="mt-1 text-caption tabular-nums text-mgh-dim">
                ORD-{consultation.order_id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <StatusBadge
              status={consultation.status}
              label={consultationStatusLabel(consultation)}
            />
          </Panel>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Panel>
              <PanelHeader title="Customer details" />
              <dl className="divide-y divide-mgh-line-soft">
                <Detail
                  label="Name"
                  value={getConsultationCustomerName(customer)}
                />
                <Detail label="Email" value={customer?.email} />
                <Detail label="Phone" value={customer?.phone_number} />
              </dl>
            </Panel>
            <Panel>
              <PanelHeader title="Event details" />
              <dl className="divide-y divide-mgh-line-soft">
                <Detail
                  label="Event date"
                  value={formatConsultationDate(order?.event_date)}
                />
                <Detail
                  label="Event time"
                  value={`${formatConsultationTime(order?.start_time)} – ${formatConsultationTime(order?.end_time)}`}
                />
                <Detail label="Guests" value={order?.number_of_guest} />
                <Detail label="Location" value={order?.event_location} />
                <Detail
                  label="Order total"
                  value={formatCurrency(order?.total_price)}
                />
                <Detail
                  label="Order status"
                  value={statusLabel(order?.status)}
                />
              </dl>
              <Button
                className="mt-4"
                href={`/dashboard/customer/orders/${consultation.order_id}`}
                variant="quiet"
                size="sm"
              >
                View order
              </Button>
            </Panel>
          </div>
          <Panel>
            <PanelHeader title="Menu selection" />
            {!items.length ? (
              <p className="text-sm text-mgh-muted">
                No menu items were found for this order yet.
              </p>
            ) : (
              <ul className="divide-y divide-mgh-line-soft">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-mgh-text">
                        {item.name} × {item.quantity}
                      </p>
                      <p className="mt-1 text-caption text-mgh-dim">
                        {item.note}
                      </p>
                    </div>
                    {item.price != null && (
                      <span className="shrink-0 text-sm tabular-nums text-mgh-text">
                        {formatCurrency(item.price)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {(consultation.note || consultation.meeting_date) && (
            <Panel>
              <PanelHeader title="Meeting details" />
              {consultation.meeting_date && (
                <p className="text-sm text-mgh-text">
                  {formatConsultationDate(consultation.meeting_date)} at{" "}
                  {formatConsultationTime(consultation.meeting_date)}
                </p>
              )}
              {consultation.note && (
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-mgh-muted">
                  {consultation.note}
                </p>
              )}
            </Panel>
          )}
          <ConsultationChat
            key={consultation.consultations_id}
            consultation={consultation}
          />
        </div>
      )}
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2.5 text-sm">
      <dt className="text-mgh-dim">{label}</dt>
      <dd className="break-words text-mgh-text">{value ?? "TBC"}</dd>
    </div>
  );
}
