"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Receipt,
  Search,
  Send,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
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

function statusStyles(status) {
  if (status === "paid") return "text-emerald-400";
  if (status === "overdue") return "text-red-400";

  return "text-[#D4AF37]";
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

  async function handleApprovePayment(invoice) {
    if (invoice.status !== "paid" || invoice.eventConfirmed || !invoice.orderId) {
      return;
    }

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

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <Link
              href="/dashboard/admin"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#A0A0A0] transition hover:text-[#D4AF37]"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>

            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <Receipt size={17} />
              <span>Invoices</span>
            </div>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Sent Invoices
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Track invoices sent after client meetings and prepare to approve
              payments once customers indicate that they have paid.
            </p>
          </div>

          <div className="border-l-2 border-[#D4AF37] bg-white/[0.03] px-4 py-3 text-sm text-[#D4AF37]">
            {invoices === null ? "..." : invoiceList.length} invoices in review
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          <OverviewCard
            label="Sent Invoices"
            value={invoices === null ? "..." : invoiceList.length}
            caption="Moved from active meetings"
          />
          <OverviewCard
            label="Awaiting Payment"
            value={invoices === null ? "..." : awaitingPaymentCount}
            caption="Visible to customers"
          />
          <OverviewCard
            label="Payment Signals"
            value={invoices === null ? "..." : paymentSignalCount}
            caption="Ready for admin approval"
          />
          <OverviewCard
            label="Confirmed Events"
            value={invoices === null ? "..." : confirmedEventCount}
            caption="Approved booked events"
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mt-8 rounded-2xl border border-[#1F1F1F] bg-white/5 p-5 backdrop-blur-md md:p-6"
        >
          <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                Invoice List
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Customer Payment Review
              </h2>
            </div>

            <p className="border-l border-white/10 pl-3 text-xs uppercase tracking-[0.16em] text-[#797676]">
              Approve paid invoices to confirm bookings
            </p>
          </div>

          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label
              htmlFor="admin-invoice-search"
              className="text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
            >
              Search invoices
            </label>
            <div className="relative w-full md:max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
              />
              <input
                id="admin-invoice-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by client, invoice, event, date, or status"
                className="h-12 w-full rounded-lg border border-white/10 bg-[#0A0A0A]/50 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-[#4F4F4F] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
              />
            </div>
          </div>

          {error && (
            <div className="mb-5 border border-red-400/20 bg-red-400/5 px-4 py-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {actionError && (
            <div className="mb-5 border border-red-400/20 bg-red-400/5 px-4 py-4 text-sm text-red-300">
              {actionError}
            </div>
          )}

          {actionMessage && (
            <div className="mb-5 border border-emerald-400/20 bg-emerald-400/5 px-4 py-4 text-sm text-emerald-300">
              {actionMessage}
            </div>
          )}

          <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_0.75fr_0.95fr] gap-4 border-b border-white/10 px-4 pb-3 text-xs uppercase tracking-[0.18em] text-[#797676] xl:grid">
            <span>Client</span>
            <span>Invoice</span>
            <span>Event</span>
            <span>Payment</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="mt-3 space-y-3">
            {invoices === null ? (
              [...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40"
                />
              ))
            ) : filteredInvoices.length === 0 ? (
              <div className="border border-white/10 bg-[#0A0A0A]/40 px-4 py-8 text-center text-sm text-[#A0A0A0]">
                {normalizedSearch
                  ? "No invoices match your search."
                  : "No invoices have been sent yet."}
              </div>
            ) : (
              filteredInvoices.map((invoice, index) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  index={index}
                  approving={approvingInvoiceId === invoice.id}
                  onApprove={handleApprovePayment}
                />
              ))
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function InvoiceRow({ invoice, index, approving, onApprove }) {
  const approvalLocked =
    invoice.status !== "paid" ||
    invoice.eventConfirmed ||
    invoice.cancellationReason ||
    !invoice.orderId;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.22 + index * 0.04 }}
      className="grid grid-cols-1 gap-4 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 p-4 transition-all duration-300 hover:border-[#D4AF37]/70 hover:bg-white/[0.04] xl:grid-cols-[1fr_0.8fr_0.8fr_0.75fr_0.95fr] xl:items-center"
    >
      <div>
        <p className="text-sm font-semibold text-white md:text-base">
          {invoice.customerName}
        </p>
        <p className="mt-1 text-xs text-[#797676]">{invoice.customerEmail}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          {currency.format(invoice.amount)}
        </p>
        <p className="mt-1 text-xs text-[#797676]">{invoice.reference}</p>
        <p className="mt-1 flex items-center gap-2 text-xs text-[#797676]">
          <CalendarDays size={13} className="text-[#D4AF37]" />
          Due {formatDate(invoice.dueDate)}
        </p>
      </div>

      <div>
        <p className="text-sm text-[#A0A0A0]">{invoice.eventType}</p>
        <p className="mt-1 text-xs text-[#797676]">
          {formatDate(invoice.eventDate)} | {invoice.guests} guests
        </p>
      </div>

      <div className="border-l border-white/10 pl-3">
        <p className={`text-sm font-medium ${statusStyles(invoice.status)}`}>
          {statusLabel(invoice.status)}
        </p>
        <p
          className={`mt-1 text-xs ${
            invoice.cancellationReason ? "text-red-300" : "text-[#797676]"
          }`}
        >
          {invoice.cancellationReason ||
            (invoice.paymentSignal === "Payment missed"
              ? "Cancelled - failure to pay before due date"
              : invoice.paymentSignal)}
        </p>
        <p className="mt-1 text-xs text-[#797676]">
          Event{" "}
          {invoice.cancellationReason
            ? "cancelled"
            : invoice.eventConfirmed
              ? "confirmed"
              : "not confirmed"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:justify-items-end">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-[#A0A0A0] transition hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
        >
          <Clock3 size={14} />
          Review
        </button>
        <button
          type="button"
          onClick={() => onApprove(invoice)}
          disabled={approvalLocked || approving}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/40 px-3 text-xs font-medium text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:text-[#5F5F5F] disabled:hover:bg-transparent"
        >
          <CheckCircle2 size={14} />
          {approving
            ? "Approving..."
            : invoice.eventConfirmed
              ? "Approved"
              : "Approve"}
        </button>
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-3 text-xs font-semibold text-black transition hover:bg-[#e0bd4a] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#5F5F5F]"
        >
          <Send size={14} />
          {invoice.cancellationReason
            ? "Cancelled"
            : invoice.eventConfirmed
              ? "Confirmed"
              : "Pending"}
        </button>
      </div>
    </motion.article>
  );
}

function OverviewCard({ label, value, caption }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:bg-white/10 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]">
      <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-[#797676]">{caption}</p>
    </div>
  );
}
