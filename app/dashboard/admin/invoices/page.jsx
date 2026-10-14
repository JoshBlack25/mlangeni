"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Search } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Figure,
  FigureRow,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  SkeletonRows,
  StatusBadge,
} from "@/app/components/dashboard/ui";
import {
  approveDummyInvoicePayment,
  getDummyPaidInvoice,
} from "@/app/utils/dummyInvoicePayments";
import {
  getPaymentFailureNote,
  getRuntimeInvoiceStatus,
  isInvoicePastDue,
  PAYMENT_FAILURE_CANCELLATION_REASON,
} from "@/app/utils/invoiceDueDates";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

function formatDate(dateString) {
  if (!dateString) return "TBC";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "TBC";

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getReference(id) {
  if (!id) return "INV-TBC";

  return `INV-${id.slice(0, 8).toUpperCase()}`;
}

function getCustomerName(customer) {
  if (!customer) return "Unknown customer";

  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  return name || customer.email || "Unknown customer";
}

function statusLabel(status) {
  if (!status) return "Pending";
  if (status === "sent") return "Sent";
  if (status === "overdue") return "Overdue";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getLatestPayment(payments) {
  return [...(payments ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];
}

function mapInvoice(invoice) {
  const consultation = invoice.consultation;
  const order = consultation?.order;
  const latestPayment = getLatestPayment(invoice.payments);
  const dummyPayment = getDummyPaidInvoice(invoice.invoices_id);
  const customerMarkedPaid =
    invoice.status === "paid" || Boolean(dummyPayment);
  const cancelledForPaymentFailure =
    !customerMarkedPaid &&
    isInvoicePastDue(invoice) &&
    order?.status !== "confirmed";
  const eventConfirmed =
    !cancelledForPaymentFailure &&
    (order?.status === "confirmed" || Boolean(dummyPayment?.eventConfirmed));
  const runtimeStatus = customerMarkedPaid
    ? "paid"
    : getRuntimeInvoiceStatus(invoice);

  return {
    id: invoice.invoices_id,
    consultationId: consultation?.consultations_id ?? null,
    orderId: order?.order_id ?? null,
    reference: getReference(invoice.invoices_id),
    customerName: getCustomerName(consultation?.customer),
    customerEmail: consultation?.customer?.email ?? "Email pending",
    customerPhone: consultation?.customer?.phone_number ?? "Phone pending",
    eventType: order?.event_type?.event_name ?? "Event type pending",
    eventDate: order?.event_date,
    startTime: order?.start_time,
    endTime: order?.end_time,
    eventLocation: order?.event_location ?? "Event location pending",
    guests: order?.number_of_guest ?? "TBC",
    orderStatus: cancelledForPaymentFailure
      ? "cancelled"
      : order?.status ?? "pending",
    amount: Number(invoice.total_amount || 0),
    dueDate: invoice.due_date,
    issuedDate: invoice.created_at,
    status: runtimeStatus,
    paymentSignal: cancelledForPaymentFailure
      ? "Payment missed"
      : eventConfirmed
      ? "Payment approved"
      : latestPayment?.status === "succeeded"
      ? "Paid via PayFast"
      : customerMarkedPaid
      ? "Customer marked paid"
      : latestPayment
        ? statusLabel(latestPayment.status)
        : "Awaiting customer",
    eventConfirmed,
    cancellationReason: cancelledForPaymentFailure
      ? PAYMENT_FAILURE_CANCELLATION_REASON
      : null,
  };
}

function getSearchText(invoice) {
  return [
    invoice.reference,
    invoice.customerName,
    invoice.customerEmail,
    invoice.customerPhone,
    invoice.eventType,
    invoice.eventDate,
    invoice.eventLocation,
    invoice.guests,
    invoice.amount,
    invoice.status,
    invoice.orderStatus,
    invoice.paymentSignal,
  ]
    .join(" ")
    .toLowerCase();
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [approvingInvoiceId, setApprovingInvoiceId] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const invoiceList = invoices ?? [];
  const filteredInvoices = normalizedSearch
    ? invoiceList.filter((invoice) =>
        getSearchText(invoice).includes(normalizedSearch),
      )
    : invoiceList;
  const awaitingPaymentCount = invoiceList.filter(
    (invoice) => invoice.status === "sent" && !invoice.cancellationReason,
  ).length;
  const paymentSignalCount = invoiceList.filter(
    (invoice) =>
      invoice.status === "paid" || invoice.paymentSignal !== "Awaiting customer",
  ).length;
  const confirmedEventCount = invoiceList.filter(
    (invoice) => invoice.eventConfirmed,
  ).length;

  useEffect(() => {
    let mounted = true;

    async function loadInvoices() {
      try {
        setError(null);

        const { data, error: invoicesError } = await supabase
          .from("invoices")
          .select(
            `
            invoices_id,
            total_amount,
            status,
            due_date,
            notes,
            created_at,
            payments (
              payments_id,
              amount,
              status,
              date
            ),
            consultation:consultation_id (
              consultations_id,
              meeting_date,
              note,
              customer:customer_id (
                first_name,
                last_name,
                email,
                phone_number
              ),
              order:order_id (
                order_id,
                event_date,
                start_time,
                end_time,
                event_location,
                status,
                number_of_guest,
                event_type ( event_name )
              )
            )
          `,
          )
          .neq("status", "draft")
          .order("created_at", { ascending: false });

        if (invoicesError) {
          throw invoicesError;
        }

        await Promise.all((data ?? []).map(markInvoicePaymentFailure));

        if (mounted) {
          setInvoices((data ?? []).map(mapInvoice));
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load invoices right now.");
          setInvoices([]);
        }
      }
    }

    loadInvoices();

    return () => {
      mounted = false;
    };
  }, []);

  async function markInvoicePaymentFailure(invoice) {
    const dummyPayment = getDummyPaidInvoice(invoice.invoices_id);
    const order = invoice.consultation?.order;

    if (
      dummyPayment ||
      invoice.status === "paid" ||
      !isInvoicePastDue(invoice) ||
      !order?.order_id ||
      order.status === "cancelled" ||
      order.status === "confirmed"
    ) {
      return;
    }

    try {
      const updates = [
        supabase
          .from("invoices")
          .update({ status: "overdue" })
          .eq("invoices_id", invoice.invoices_id),
        supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("order_id", order.order_id),
      ];

      if (invoice.consultation?.consultations_id) {
        updates.push(
          supabase
            .from("consultations")
            .update({
              note: getPaymentFailureNote(invoice.consultation.note),
            })
            .eq("consultations_id", invoice.consultation.consultations_id),
        );
      }

      const results = await Promise.all(updates);
      const failedUpdate = results.find((result) => result.error);

      if (failedUpdate) {
        console.warn(
          "The overdue invoice was shown as cancelled, but one database update was blocked.",
          failedUpdate.error,
        );
      }
    } catch (err) {
      console.warn("Unable to persist overdue invoice cancellation.", err);
    }
  }

  // Approval confirms the booking as an event, so it asks first.
  function handleApprovePayment(invoice) {
    if (invoice.status !== "paid" || invoice.eventConfirmed || !invoice.orderId) {
      return;
    }
    setPendingApproval(invoice);
  }

  function confirmPendingApproval() {
    const invoice = pendingApproval;
    setPendingApproval(null);
    if (invoice) approvePayment(invoice);
  }

  async function approvePayment(invoice) {
    try {
      setActionError(null);
      setActionMessage(null);
      setApprovingInvoiceId(invoice.id);

      approveDummyInvoicePayment({
        invoiceId: invoice.id,
        invoiceReference: invoice.reference,
        orderId: invoice.orderId,
        orderNumber: invoice.orderId
          ? `ORD-${invoice.orderId.slice(0, 8).toUpperCase()}`
          : "ORD-TBC",
        amount: invoice.amount,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        customerPhone: invoice.customerPhone,
        eventType: invoice.eventType,
        eventDate: invoice.eventDate,
        startTime: invoice.startTime,
        endTime: invoice.endTime,
        eventLocation: invoice.eventLocation,
        guests: invoice.guests,
      });

      const [invoiceUpdate, orderUpdate] = await Promise.all([
        supabase
          .from("invoices")
          .update({ status: "paid" })
          .eq("invoices_id", invoice.id),
        supabase
          .from("orders")
          .update({ status: "confirmed" })
          .eq("order_id", invoice.orderId),
      ]);

      setInvoices((current) =>
        (current ?? []).map((item) =>
          item.id === invoice.id
            ? {
                ...item,
                status: "paid",
                orderStatus: "confirmed",
                eventConfirmed: true,
                paymentSignal: "Payment approved",
              }
            : item,
        ),
      );

      if (invoiceUpdate.error || orderUpdate.error) {
        console.warn(
          "Dummy approval saved, but Supabase blocked one of the permanent updates.",
          invoiceUpdate.error || orderUpdate.error,
        );
      }

      setActionMessage(
        `${invoice.reference} has been approved and the booking is now a confirmed event.`,
      );
    } catch (err) {
      setActionError(err.message || "Unable to approve this payment right now.");
    } finally {
      setApprovingInvoiceId(null);
    }
  }

  const loadingFigures = invoices === null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        density="dense"
        title="Sent Invoices"
        lead="Track invoices sent after client meetings and prepare to approve payments once customers indicate that they have paid."
        actions={
          <>
            <p className="text-sm tabular-nums text-mgh-muted">
              {invoices === null ? "..." : invoiceList.length} invoices in review
            </p>
            <Button variant="quiet" size="sm" href="/dashboard/admin">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to dashboard
            </Button>
          </>
        }
      />

      <FigureRow>
        <Figure
          label="Sent Invoices"
          value={invoiceList.length}
          hint="Moved from active meetings"
          loading={loadingFigures}
        />
        <Figure
          label="Awaiting Payment"
          value={awaitingPaymentCount}
          hint="Visible to customers"
          loading={loadingFigures}
        />
        <Figure
          label="Payment Signals"
          value={paymentSignalCount}
          hint="Ready for admin approval"
          loading={loadingFigures}
        />
        <Figure
          label="Confirmed Events"
          value={confirmedEventCount}
          hint="Approved booked events"
          loading={loadingFigures}
        />
      </FigureRow>

      <Panel density="dense">
        <PanelHeader
          density="dense"
          title="Customer Payment Review"
          description="Approve paid invoices to confirm bookings"
        />

        <div className="mb-4 flex flex-col gap-1.5 sm:max-w-md">
          <label
            htmlFor="admin-invoice-search"
            className="text-[13px] font-medium text-mgh-muted"
          >
            Search invoices
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mgh-dim"
            />
            <Input
              id="admin-invoice-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by client, invoice, event, date, or status"
              className="pl-9"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-control border border-mgh-danger/30 bg-mgh-danger/10 px-3 py-2.5 text-sm text-mgh-danger">
            {error}
          </p>
        )}

        {actionError && (
          <p role="alert" className="mb-4 rounded-control border border-mgh-danger/30 bg-mgh-danger/10 px-3 py-2.5 text-sm text-mgh-danger">
            {actionError}
          </p>
        )}

        {actionMessage && (
          <p role="status" className="mb-4 rounded-control border border-mgh-ok/30 bg-mgh-ok/10 px-3 py-2.5 text-sm text-mgh-ok">
            {actionMessage}
          </p>
        )}

        {invoices === null ? (
          <SkeletonRows rows={4} label="Loading invoices..." />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            title={
              normalizedSearch
                ? "No invoices match your search."
                : "No invoices have been sent yet."
            }
          />
        ) : (
          <>
            <table className="hidden w-full border-collapse text-left text-body-dense md:table">
              <caption className="sr-only">Sent invoices</caption>
              <thead>
                <tr className="border-b border-mgh-line">
                  {[
                    ["Invoice", ""],
                    ["Event", ""],
                    ["Due", ""],
                    ["Payment", ""],
                    ["Booking", ""],
                    ["Amount", "text-right"],
                    ["Actions", "text-right"],
                  ].map(([label, align]) => (
                    <th
                      key={label}
                      scope="col"
                      className={`h-10 px-3 text-label font-semibold uppercase text-mgh-dim first:pl-0 last:pr-0 ${align}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    approving={approvingInvoiceId === invoice.id}
                    onApprove={handleApprovePayment}
                  />
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-mgh-line-soft border-y border-mgh-line-soft md:hidden">
              {filteredInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  approving={approvingInvoiceId === invoice.id}
                  onApprove={handleApprovePayment}
                />
              ))}
            </ul>
          </>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(pendingApproval)}
        onOpenChange={(open) => {
          if (!open) setPendingApproval(null);
        }}
        title="Approve this payment?"
        description={
          pendingApproval
            ? `${pendingApproval.reference} will be approved and the booking confirmed as an event.`
            : undefined
        }
        confirmLabel="Approve payment"
        onConfirm={confirmPendingApproval}
      />
    </div>
  );
}

function isApprovalLocked(invoice) {
  return (
    invoice.status !== "paid" ||
    invoice.eventConfirmed ||
    invoice.cancellationReason ||
    !invoice.orderId
  );
}

function PaymentStatus({ invoice }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <StatusBadge status={invoice.status} label={statusLabel(invoice.status)} />
      <span
        className={`text-caption ${
          invoice.cancellationReason ? "text-mgh-danger" : "text-mgh-dim"
        }`}
      >
        {invoice.cancellationReason ||
          (invoice.paymentSignal === "Payment missed"
            ? "Cancelled - failure to pay before due date"
            : invoice.paymentSignal)}
      </span>
    </div>
  );
}

function BookingStatus({ invoice }) {
  return invoice.cancellationReason ? (
    <StatusBadge status="cancelled" label="Cancelled" />
  ) : invoice.eventConfirmed ? (
    <StatusBadge status="confirmed" label="Confirmed" />
  ) : (
    <StatusBadge status="pending" label="Pending" />
  );
}

function ApproveButton({ invoice, approving, onApprove, className }) {
  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => onApprove(invoice)}
      disabled={isApprovalLocked(invoice) || approving}
      className={className}
    >
      <CheckCircle2 size={16} aria-hidden="true" />
      {approving
        ? "Approving..."
        : invoice.eventConfirmed
          ? "Approved"
          : "Approve"}
    </Button>
  );
}

function InvoiceRow({ invoice, approving, onApprove }) {
  return (
    <tr className="border-b border-mgh-line-soft align-top transition-colors duration-[var(--mgh-dur-fast)] hover:bg-mgh-surface-2">
      <td className="px-3 py-2.5 first:pl-0">
        <p className="font-medium text-mgh-text">{invoice.customerName}</p>
        <p className="text-caption tabular-nums text-mgh-dim">
          {invoice.reference} · {invoice.customerEmail}
        </p>
      </td>
      <td className="px-3 py-2.5">
        <p className="text-mgh-text">{invoice.eventType}</p>
        <p className="text-caption tabular-nums text-mgh-dim">
          {formatDate(invoice.eventDate)} | {invoice.guests} guests
        </p>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
        <p className="text-mgh-text">Due {formatDate(invoice.dueDate)}</p>
        <p className="text-caption text-mgh-dim">
          Issued {formatDate(invoice.issuedDate)}
        </p>
      </td>
      <td className="px-3 py-2.5">
        <PaymentStatus invoice={invoice} />
      </td>
      <td className="px-3 py-2.5">
        <BookingStatus invoice={invoice} />
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-mgh-text">
        {currency.format(invoice.amount)}
      </td>
      <td className="px-3 py-2 text-right last:pr-0">
        <ApproveButton
          invoice={invoice}
          approving={approving}
          onApprove={onApprove}
        />
      </td>
    </tr>
  );
}

function InvoiceCard({ invoice, approving, onApprove }) {
  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-mgh-text">
            {invoice.customerName}
          </p>
          <p className="truncate text-caption tabular-nums text-mgh-dim">
            {invoice.reference} · {invoice.customerEmail}
          </p>
        </div>
        <p className="shrink-0 text-sm tabular-nums text-mgh-text">
          {currency.format(invoice.amount)}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mgh-dim">
            Event
          </dt>
          <dd className="text-sm text-mgh-text">{invoice.eventType}</dd>
          <dd className="text-caption tabular-nums text-mgh-dim">
            {formatDate(invoice.eventDate)} | {invoice.guests} guests
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mgh-dim">
            Due
          </dt>
          <dd className="text-sm tabular-nums text-mgh-text">
            {formatDate(invoice.dueDate)}
          </dd>
          <dd className="text-caption tabular-nums text-mgh-dim">
            Issued {formatDate(invoice.issuedDate)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mgh-dim">
            Payment
          </dt>
          <dd className="mt-0.5">
            <PaymentStatus invoice={invoice} />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mgh-dim">
            Booking
          </dt>
          <dd className="mt-0.5">
            <BookingStatus invoice={invoice} />
          </dd>
        </div>
      </dl>

      <ApproveButton
        invoice={invoice}
        approving={approving}
        onApprove={onApprove}
        className="mt-4 h-10 w-full"
      />
    </li>
  );
}
