"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
  MapPin,
  Receipt,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  isDummyInvoicePaid,
  markDummyInvoicePaid,
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

function formatTime(value) {
  if (!value) return "TBC";

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "TBC"
    : date.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      });
}

function getLineTotal(item) {
  return Number(item.quantity || 0) * Number(item.unitPrice || 0);
}

function getInvoiceTotal(invoice) {
  return Number(invoice?.totalAmount || 0);
}

function statusLabel(status) {
  if (!status) return "Pending";
  if (status === "sent") return "Due";
  if (status === "overdue") return "Cancelled";

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

function isOutstanding(invoice) {
  return invoice?.status === "sent" || invoice?.status === "pending";
}

function getCustomerName(customer) {
  if (!customer) return "Unknown customer";

  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  return name || customer.email || "Unknown customer";
}

function getReference(id) {
  if (!id) return "INV-TBC";

  return `INV-${id.slice(0, 8).toUpperCase()}`;
}

function getOrderNumber(id) {
  if (!id) return "ORD-TBC";

  return `ORD-${id.slice(0, 8).toUpperCase()}`;
}

function getOrderItems(order) {
  if (!order) return [];

  const customItems = (order.customer_menu_items ?? [])
    .map((item) => ({
      id: item.custom_menu_id ?? item.menu_item?.item_id ?? item.menu_item?.name,
      name: item.menu_item?.name ?? "Menu item",
      description: item.menu_item?.description ?? "Custom menu selection",
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(item.menu_item?.price ?? 0),
    }))
    .filter((item) => item.name);

  if (customItems.length > 0) return customItems;

  const packageItems = (order.premade_menu?.premade_menu_items ?? [])
    .map((item, index) => ({
      id: item.menu_item?.item_id ?? `${order.premade_menu?.name}-${index}`,
      name: item.menu_item?.name ?? "Package item",
      description: order.premade_menu?.name ?? "Package menu selection",
      quantity: 1,
      unitPrice: Number(item.menu_item?.price ?? 0),
    }))
    .filter((item) => item.name);

  if (packageItems.length > 0) return packageItems;

  return [];
}

function normalizeInvoiceItems(items, invoiceTotal) {
  const itemTotal = items.reduce((total, item) => total + getLineTotal(item), 0);

  if (items.length === 0) {
    return [
      {
        id: "invoice-total",
        name: "Final invoice total",
        description: "Amount sent by the admin after meeting review",
        quantity: 1,
        unitPrice: invoiceTotal,
      },
    ];
  }

  if (Math.abs(itemTotal - invoiceTotal) <= 0.01) {
    return items;
  }

  return [
    ...items,
    {
      id: "invoice-adjustment",
      name:
        itemTotal > invoiceTotal
          ? "Final invoice discount"
          : "Final invoice adjustment",
      description: "Admin final amount after the in-person meeting",
      quantity: 1,
      unitPrice: invoiceTotal - itemTotal,
    },
  ];
}

function mapInvoice(invoice) {
  const consultation = invoice.consultation;
  const order = consultation?.order;
  const invoiceTotal = Number(invoice.total_amount || 0);
  const eventTime = `${formatTime(order?.start_time)} - ${formatTime(
    order?.end_time,
  )}`;

  return {
    id: invoice.invoices_id,
    consultationId: consultation?.consultations_id ?? null,
    reference: getReference(invoice.invoices_id),
    orderId: order?.order_id ?? null,
    orderNumber: getOrderNumber(order?.order_id),
    title: `${order?.event_type?.event_name ?? "Event"} Invoice`,
    customerName: getCustomerName(consultation?.customer),
    customerEmail: consultation?.customer?.email ?? "Email pending",
    customerPhone: consultation?.customer?.phone_number ?? "Phone pending",
    eventType: order?.event_type?.event_name ?? "Event type pending",
    eventDate: order?.event_date,
    eventTime,
    guests: order?.number_of_guest ?? "TBC",
    location: order?.event_location || "Event location pending",
    issuedDate: invoice.created_at,
    dueDate: invoice.due_date,
    status: getRuntimeInvoiceStatus(invoice),
    orderStatus: order?.status ?? "pending",
    cancellationReason: isInvoicePastDue(invoice)
      ? PAYMENT_FAILURE_CANCELLATION_REASON
      : null,
    totalAmount: invoiceTotal,
    adminNote: invoice.notes || "No note was added to this invoice.",
    items: normalizeInvoiceItems(getOrderItems(order), invoiceTotal),
  };
}

function applyDummyPaymentStatus(invoice) {
  if (!isDummyInvoicePaid(invoice.id)) {
    return invoice;
  }

  return {
    ...invoice,
    status: "paid",
    cancellationReason: null,
  };
}

export default function PaymentsPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [error, setError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadInvoices() {
      try {
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: customerRow, error: customerError } = await supabase
          .from("customer")
          .select("customer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        if (!customerRow) {
          if (mounted) {
            setInvoices([]);
            setSelectedInvoiceId(null);
          }
          return;
        }

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
            consultation:consultation_id!inner (
              consultations_id,
              customer_id,
              note,
              customer:customer_id (
                first_name,
                last_name,
                email,
                phone_number
              ),
              order:order_id (
                order_id,
                status,
                total_price,
                event_date,
                start_time,
                end_time,
                event_location,
                number_of_guest,
                event_type ( event_name ),
                customer_menu_items (
                  custom_menu_id,
                  quantity,
                  menu_item ( item_id, name, description, price )
                ),
                premade_menu (
                  premade_menu_id,
                  name,
                  description,
                  premade_menu_items (
                    menu_item ( item_id, name, description, price )
                  )
                )
              )
            )
          `,
          )
          .eq("consultation.customer_id", customerRow.customer_id)
          .neq("status", "draft")
          .order("due_date", { ascending: true });

        if (invoicesError) {
          throw invoicesError;
        }

        await Promise.all((data ?? []).map(markInvoicePaymentFailure));

        const mappedInvoices = (data ?? [])
          .map(mapInvoice)
          .map(applyDummyPaymentStatus);

        if (mounted) {
          setInvoices(mappedInvoices);
          setSelectedInvoiceId((current) =>
            current && mappedInvoices.some((invoice) => invoice.id === current)
              ? current
              : mappedInvoices[0]?.id ?? null,
          );
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load your invoices right now.");
          setInvoices([]);
          setSelectedInvoiceId(null);
        }
      }
    }

    loadInvoices();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function markInvoicePaymentFailure(invoice) {
    if (
      isDummyInvoicePaid(invoice.invoices_id) ||
      invoice.status === "paid" ||
      !isInvoicePastDue(invoice)
    ) {
      return;
    }

    const consultation = invoice.consultation;
    const order = consultation?.order;

    if (
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

      if (consultation?.consultations_id) {
        updates.push(
          supabase
            .from("consultations")
            .update({ note: getPaymentFailureNote(consultation.note) })
            .eq("consultations_id", consultation.consultations_id),
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

  const invoiceList = invoices ?? [];
  const selectedInvoice =
    invoiceList.find((invoice) => invoice.id === selectedInvoiceId) ??
    invoiceList[0] ??
    null;
  const selectedTotal = selectedInvoice ? getInvoiceTotal(selectedInvoice) : 0;
  const outstandingTotal = invoiceList
    .filter((invoice) => isOutstanding(invoice))
    .reduce((total, invoice) => total + getInvoiceTotal(invoice), 0);
  const selectedInvoicePaid = selectedInvoice?.status === "paid";
  const selectedInvoiceCancelled = Boolean(selectedInvoice?.cancellationReason);
  const payingSelectedInvoice = payingInvoiceId === selectedInvoice?.id;

  function handleSelectInvoice(invoiceId) {
    setSelectedInvoiceId(invoiceId);
    setPaymentError(null);
    setPaymentMessage(null);
  }

  async function handlePayInvoice() {
    if (!selectedInvoice || selectedInvoice.status === "paid") {
      return;
    }

    if (selectedInvoiceCancelled) {
      setPaymentError(PAYMENT_FAILURE_CANCELLATION_REASON);
      return;
    }

    try {
      setPayingInvoiceId(selectedInvoice.id);
      setPaymentError(null);
      setPaymentMessage(null);

      markDummyInvoicePaid({
        invoiceId: selectedInvoice.id,
        invoiceReference: selectedInvoice.reference,
        orderId: selectedInvoice.orderId,
        orderNumber: selectedInvoice.orderNumber,
        amount: selectedTotal,
      });

      setInvoices((current) =>
        (current ?? []).map((invoice) =>
          invoice.id === selectedInvoice.id
            ? { ...invoice, status: "paid" }
            : invoice,
        ),
      );
      setPaymentMessage({
        invoiceReference: selectedInvoice.reference,
        orderNumber: selectedInvoice.orderNumber,
      });
    } catch (err) {
      setPaymentError(err.message || "Unable to complete this dummy payment.");
    } finally {
      setPayingInvoiceId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1300px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <Receipt size={17} />
              <span>Payments</span>
            </div>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Invoice Payments
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Review the invoice sent after your in-person meeting, confirm the
              final event details, and complete payment securely.
            </p>
          </div>

          <div className="border-l-2 border-[#D4AF37] bg-white/[0.03] px-4 py-3 text-sm text-[#D4AF37]">
            {invoices === null ? "..." : invoiceList.length} invoices ready for
            payment
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          <SummaryCard
            label="Outstanding"
            value={invoices === null ? "..." : currency.format(outstandingTotal)}
            caption="Invoices awaiting payment"
          />
          <SummaryCard
            label="Next Due Date"
            value={selectedInvoice ? formatDate(selectedInvoice.dueDate) : "TBC"}
            caption={selectedInvoice?.reference ?? "No invoice selected"}
          />
          <SummaryCard
            label="Selected Invoice"
            value={
              selectedInvoice ? currency.format(selectedTotal) : currency.format(0)
            }
            caption={selectedInvoice?.title ?? "Waiting for invoice"}
          />
        </motion.section>

        {invoices === null ? (
          <LoadingState />
        ) : error ? (
          <EmptyState
            tone="error"
            title="We could not load your invoices"
            message={error}
          />
        ) : !selectedInvoice ? (
          <EmptyState
            title="No invoices yet"
            message="Invoices sent by the admin after your in-person meeting will show here with the due date and payment details."
          />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.35fr]">
            <motion.aside
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="flex flex-col gap-6"
            >
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="mb-5 border-b border-white/10 pb-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Invoices
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Select Invoice
                  </h2>
                </div>

                <div className="space-y-3">
                  {invoiceList.map((invoice) => {
                    const active = selectedInvoice.id === invoice.id;
                    const amount = getInvoiceTotal(invoice);

                    return (
                      <button
                        key={invoice.id}
                        type="button"
                        onClick={() => handleSelectInvoice(invoice.id)}
                        className={`w-full rounded-xl border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] ${
                          active
                            ? "border-[#D4AF37]/70 bg-[#D4AF37]/10"
                            : "border-white/10 bg-[#101010] hover:border-[#D4AF37]/40 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {invoice.title}
                            </p>
                            <p className="mt-1 text-xs text-[#797676]">
                              {invoice.reference}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 border-l border-white/10 pl-3 text-[11px] font-medium uppercase tracking-[0.16em] ${statusStyles(
                              invoice.status,
                            )}`}
                          >
                            {statusLabel(invoice.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#797676]">
                          <span>Issued {formatDate(invoice.issuedDate)}</span>
                          <span className="text-right">
                            Due {formatDate(invoice.dueDate)}
                          </span>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
                          <span className="text-xs text-[#797676]">
                            {invoice.eventType}
                          </span>
                          <span className="text-lg font-semibold text-white">
                            {currency.format(amount)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="border-b border-white/10 pb-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Security
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-white">
                    Payment Protection
                  </h2>
                </div>

                <div className="mt-5 space-y-4">
                  <TrustRow
                    icon={ShieldCheck}
                    title="Secure checkout"
                    detail="Payment details are entered only after reviewing the invoice."
                  />
                  <TrustRow
                    icon={Receipt}
                    title="Invoice matched"
                    detail="The payment amount follows the invoice selected above."
                  />
                  <TrustRow
                    icon={AlertCircle}
                    title="Review before paying"
                    detail="Confirm the event, line items, and note before continuing."
                  />
                </div>
              </section>
            </motion.aside>

            <motion.section
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.22 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
            >
              <div className="border-b border-white/10 px-6 py-6 md:px-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                  Invoice Details
                </p>

                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-serif text-3xl text-white">
                      {selectedInvoice.reference}
                    </h2>
                    <p className="mt-2 text-sm text-[#797676]">
                      Issued {formatDate(selectedInvoice.issuedDate)} - Due{" "}
                      {formatDate(selectedInvoice.dueDate)}
                    </p>
                  </div>

                  <span
                    className={`w-fit border-l border-white/10 pl-3 text-xs font-medium uppercase tracking-[0.16em] ${statusStyles(
                      selectedInvoice.status,
                    )}`}
                  >
                    {statusLabel(selectedInvoice.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <InfoTile
                    icon={UserRound}
                    label="Customer"
                    value={selectedInvoice.customerName}
                    caption={`${selectedInvoice.customerEmail} | ${selectedInvoice.customerPhone}`}
                  />
                  <InfoTile
                    icon={CalendarDays}
                    label="Event"
                    value={selectedInvoice.eventType}
                    caption={`${formatDate(selectedInvoice.eventDate)} - ${
                      selectedInvoice.eventTime
                    }`}
                  />
                  <InfoTile
                    icon={MapPin}
                    label="Location"
                    value={selectedInvoice.location}
                    caption={`${selectedInvoice.guests} guests`}
                  />
                </section>

                <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
                  <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#A0A0A0]">
                        Invoice Items
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        Final Charges
                      </h3>
                    </div>

                    <p className="border-l border-white/10 pl-3 text-sm font-semibold text-[#D4AF37]">
                      {currency.format(selectedTotal)}
                    </p>
                  </div>

                  <div className="hidden grid-cols-[1fr_0.35fr_0.5fr_0.5fr] gap-4 border-b border-white/10 px-3 pb-3 text-xs uppercase tracking-[0.16em] text-[#797676] md:grid">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span className="text-right">Total</span>
                  </div>

                  <div className="space-y-3">
                    {selectedInvoice.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 gap-3 border border-white/10 bg-[#0A0A0A]/50 p-4 md:grid-cols-[1fr_0.35fr_0.5fr_0.5fr] md:items-center"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-[#797676]">
                            {item.description}
                          </p>
                        </div>

                        <p className="text-sm text-[#A0A0A0]">
                          <span className="md:hidden">Qty </span>
                          {item.quantity}
                        </p>

                        <p className="text-sm text-[#A0A0A0]">
                          {currency.format(item.unitPrice)}
                        </p>

                        <p className="text-sm font-semibold text-white md:text-right">
                          {currency.format(getLineTotal(item))}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">
                    Note From Admin
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#A0A0A0]">
                    {selectedInvoice.adminNote}
                  </p>
                </section>

                {selectedInvoiceCancelled && (
                  <section className="rounded-xl border border-red-400/25 bg-red-400/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-red-300">
                      Order Cancelled
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      Payment window closed
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#A0A0A0]">
                      This order was cancelled because payment was not completed
                      before the due date of {formatDate(selectedInvoice.dueDate)}.
                    </p>
                  </section>
                )}

                {!selectedInvoicePaid && !selectedInvoiceCancelled && (
                  <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
                    <div className="mb-5 border-b border-white/10 pb-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#A0A0A0]">
                        Payment Details
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        Card Checkout
                      </h3>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <ReadOnlyField
                          label="Invoice Amount"
                          value={currency.format(selectedTotal)}
                        />
                        <ReadOnlyField
                          label="Payment Reference"
                          value="Generated on payment"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="invoice"
                          className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
                        >
                          Invoice
                        </label>

                        <div className="relative">
                          <select
                            id="invoice"
                            value={selectedInvoiceId ?? ""}
                            onChange={(event) =>
                              handleSelectInvoice(event.target.value)
                            }
                            className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#0A0A0A] px-4 pr-11 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                          >
                            {invoiceList.map((invoice) => (
                              <option key={invoice.id} value={invoice.id}>
                                {invoice.reference} - {invoice.title}
                              </option>
                            ))}
                          </select>
                          <WalletCards
                            size={18}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                          id="cardholder"
                          label="Cardholder Name"
                          placeholder="Name on card"
                        />
                        <TextField
                          id="email"
                          type="email"
                          label="Email Address"
                          placeholder={selectedInvoice.customerEmail}
                        />
                      </div>

                      <TextField
                        id="card-number"
                        label="Card Number"
                        placeholder="1234 1234 1234 1234"
                        inputMode="numeric"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <TextField
                          id="expiry"
                          label="Expiry"
                          placeholder="MM / YY"
                          inputMode="numeric"
                        />
                        <TextField
                          id="cvc"
                          label="CVC"
                          placeholder="123"
                          inputMode="numeric"
                        />
                      </div>

                      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0A0A0A] p-4 text-sm text-[#A0A0A0]">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0A0A0A] accent-[#D4AF37]"
                        />
                        <span>
                          Send the payment receipt to my account email once
                          payment is complete.
                        </span>
                      </label>

                      {paymentError && (
                        <div className="border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                          {paymentError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handlePayInvoice}
                        disabled={payingSelectedInvoice}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] disabled:cursor-not-allowed disabled:bg-[#6f5c1e] disabled:text-black/60"
                      >
                        <LockKeyhole size={17} />
                        {payingSelectedInvoice
                          ? "Completing Payment..."
                          : `Pay ${currency.format(selectedTotal)}`}
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </motion.section>
          </div>
        )}
      </div>

      {paymentMessage && (
        <PaymentCompletedModal
          invoiceReference={paymentMessage.invoiceReference}
          orderNumber={paymentMessage.orderNumber}
          onClose={() => setPaymentMessage(null)}
        />
      )}
    </main>
  );
}

function LoadingState() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.35fr]">
      <div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      <div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    </div>
  );
}

function EmptyState({ title, message, tone = "default" }) {
  const isError = tone === "error";

  return (
    <section
      className={`mt-10 flex min-h-64 flex-col items-center justify-center border px-6 text-center ${
        isError
          ? "border-red-400/20 bg-red-400/5"
          : "border-white/10 bg-white/5"
      }`}
    >
      <Receipt
        size={28}
        className={isError ? "mb-4 text-red-300" : "mb-4 text-[#D4AF37]"}
      />
      <h2
        className={
          isError
            ? "text-base font-semibold text-red-300"
            : "text-lg font-semibold text-white"
        }
      >
        {title}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#A0A0A0]">
        {message}
      </p>
    </section>
  );
}

function PaymentCompletedModal({ invoiceReference, orderNumber, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-2xl rounded-2xl border border-emerald-400/30 bg-[#111917] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-completed-title"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <CheckCircle2 className="mt-1 shrink-0 text-emerald-400" size={24} />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">
              Payment Completed
            </p>
            <h3
              id="payment-completed-title"
              className="mt-2 font-serif text-2xl text-white"
            >
              Send Proof Of Payment
            </h3>
            <p className="mt-4 text-sm leading-7 text-[#A0A0A0]">
              Your invoice has been marked as paid. Please send proof of payment
              to the admin through your usual communication channel, such as
              WhatsApp or email, and include order number{" "}
              <span className="font-semibold text-white">{orderNumber}</span>.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="border border-white/10 bg-[#0A0A0A]/50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#797676]">
                  Order Number
                </p>
                <p className="mt-1 font-semibold text-white">{orderNumber}</p>
              </div>
              <div className="border border-white/10 bg-[#0A0A0A]/50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#797676]">
                  Invoice
                </p>
                <p className="mt-1 font-semibold text-white">
                  {invoiceReference}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-11 min-w-28 rounded-xl bg-[#D4AF37] px-6 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111917]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function SummaryCard({ label, value, caption }) {
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

function TrustRow({ icon: Icon, title, detail }) {
  return (
    <div className="flex gap-3 border-l border-white/10 pl-3">
      <Icon size={16} className="mt-1 shrink-0 text-[#D4AF37]" />
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#797676]">{detail}</p>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, caption }) {
  return (
    <div className="border border-white/10 bg-[#101010] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#797676]">
        <Icon size={14} className="text-[#D4AF37]" />
        {label}
      </div>
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#797676]">{caption}</p>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#A0A0A0]">
        {label}
      </p>
      <div className="flex h-12 items-center rounded-xl border border-white/10 bg-[#0D0D0D] px-4 text-sm text-[#D0D0D0]">
        {value}
      </div>
    </div>
  );
}

function TextField({ id, label, placeholder, type = "text", inputMode }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 text-sm text-white outline-none transition placeholder:text-[#4F4F4F] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
      />
    </div>
  );
}
