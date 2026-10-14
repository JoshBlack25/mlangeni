"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { cn } from "@/lib/utils";
import {
  Button,
  Dialog,
  DialogTitle,
  EmptyState,
  Field,
  Figure,
  FigureRow,
  PageHeader,
  Panel,
  PanelHeader,
  Select,
  Skeleton,
  StatusBadge,
  focusRing,
  Money,
} from "@/app/components/dashboard/ui";
import { EASE } from "@/app/components/dashboard/shared/motion";
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

// How long to wait for PayFast's server-to-server confirmation (the ITN) after
// the customer comes back from checkout. The return URL alone proves nothing:
// only the ITN marks an invoice paid, and it usually lands within seconds.
const CONFIRM_POLL_MS = 3000;
const CONFIRM_POLL_ATTEMPTS = 10;

// PayFast checkout is a plain HTML form POST to PayFast's own page, so we build
// one on the fly. Field order is part of the signature — keep it as received.
function submitPayFastForm(action, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;

  for (const [name, value] of fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

// Coming back from PayFast: ?payfast=success|cancelled&invoice=<id>. Read once
// on the client; nothing renders from it until the invoices have loaded, so the
// server-rendered markup (which sees no URL) still matches.
function readPayFastReturn() {
  if (typeof window === "undefined") return { result: null, invoiceId: null };

  const params = new URLSearchParams(window.location.search);

  return { result: params.get("payfast"), invoiceId: params.get("invoice") };
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payfastReturn] = useState(readPayFastReturn);
  const returnedSuccess = payfastReturn.result === "success";
  const [invoices, setInvoices] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [error, setError] = useState(null);
  const [paymentError, setPaymentError] = useState(
    payfastReturn.result === "cancelled"
      ? "Payment was cancelled. You have not been charged."
      : null,
  );
  const [paymentNotice, setPaymentNotice] = useState(
    returnedSuccess ? "Confirming your payment with PayFast..." : null,
  );
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);
  const [confirmingInvoiceId, setConfirmingInvoiceId] = useState(
    returnedSuccess ? payfastReturn.invoiceId : null,
  );

  // Drop the PayFast query string so a refresh doesn't replay the result.
  useEffect(() => {
    if (payfastReturn.result) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [payfastReturn.result]);

  // The back button can restore this page from the bfcache with the button
  // still stuck on "Redirecting to PayFast...".
  useEffect(() => {
    function handlePageShow(event) {
      if (event.persisted) setPayingInvoiceId(null);
    }

    window.addEventListener("pageshow", handlePageShow);

    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Wait for the ITN to flip the invoice to "paid" in the database.
  useEffect(() => {
    if (!confirmingInvoiceId || invoices === null) return;

    let cancelled = false;
    let attempts = 0;

    const timer = setInterval(async () => {
      attempts += 1;

      const { data } = await supabase
        .from("invoices")
        .select("status")
        .eq("invoices_id", confirmingInvoiceId)
        .maybeSingle();

      if (cancelled) return;

      if (data?.status === "paid") {
        clearInterval(timer);
        setConfirmingInvoiceId(null);
        setPaymentNotice(null);
        setInvoices((current) =>
          (current ?? []).map((invoice) =>
            invoice.id === confirmingInvoiceId
              ? { ...invoice, status: "paid" }
              : invoice,
          ),
        );

        const paid = invoices.find((invoice) => invoice.id === confirmingInvoiceId);

        if (paid) {
          setPaymentMessage({
            invoiceReference: paid.reference,
            orderNumber: paid.orderNumber,
          });
        }
      } else if (attempts >= CONFIRM_POLL_ATTEMPTS) {
        clearInterval(timer);
        setConfirmingInvoiceId(null);
        setPaymentNotice(
          "We have not received PayFast's confirmation yet. This can take a minute - refresh this page shortly. If the invoice still shows as due, contact us with your payment details.",
        );
      }
    }, CONFIRM_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [confirmingInvoiceId, invoices]);

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

        const mappedInvoices = (data ?? []).map(mapInvoice);

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
    if (invoice.status === "paid" || !isInvoicePastDue(invoice)) {
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
  const nextDueInvoice =
    invoiceList
      .filter((invoice) => isOutstanding(invoice) && invoice.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] ?? null;
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
      setPaymentNotice(null);
      setPaymentMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setPayingInvoiceId(null);
        router.replace("/login");
        return;
      }

      // The server decides the amount and signs the request; we only say
      // which invoice. See app/api/payfast/checkout/route.ts.
      const response = await fetch("/api/payfast/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ invoiceId: selectedInvoice.id }),
      });
      const checkout = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(checkout.error || "Unable to start PayFast checkout.");
      }

      // The browser leaves for PayFast now, so the button stays on
      // "Redirecting..." rather than flashing back to "Pay".
      submitPayFastForm(checkout.action, checkout.fields);
    } catch (err) {
      setPaymentError(err.message || "Unable to start PayFast checkout.");
      setPayingInvoiceId(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE }}
    >
      <PageHeader
        title="Invoice Payments"
        lead="Review the invoice sent after your in-person meeting, confirm the final event details, and complete payment securely."
        actions={
          <p className="text-sm text-mgh-muted">
            <span className="tabular-nums">
              {invoices === null ? "..." : invoiceList.length}
            </span>{" "}
            invoices ready for payment
          </p>
        }
      />

      <FigureRow>
        <Figure
          label="Outstanding"
          value={<Money value={outstandingTotal} />}
          hint="Invoices awaiting payment"
          loading={invoices === null}
          emphasis={outstandingTotal > 0}
        />
        <Figure
          label="Next Due Date"
          value={nextDueInvoice ? formatDate(nextDueInvoice.dueDate) : "TBC"}
          hint={nextDueInvoice?.reference ?? "Nothing due"}
        />
        <Figure
          label="Selected Invoice"
          value={
            <Money value={selectedInvoice ? selectedTotal : 0} />
          }
          hint={selectedInvoice?.title ?? "Waiting for invoice"}
          className="col-span-2 md:col-span-1"
        />
      </FigureRow>

      <div className="mt-8 md:mt-10">
        {invoices === null ? (
          <LoadingState />
        ) : error ? (
          <Panel>
            <p className="font-serif text-xl text-mgh-text">
              We could not load your invoices
            </p>
            <p className="mt-2 max-w-xl text-sm text-mgh-danger">{error}</p>
          </Panel>
        ) : !selectedInvoice ? (
          <EmptyState title="No invoices yet">
            Invoices sent by the admin after your in-person meeting will show
            here with the due date and payment details.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.35fr] lg:items-start lg:gap-6">
            <div className="flex flex-col gap-6">
              <Panel>
                <PanelHeader title="Select Invoice" />

                <ul className="-mx-2 flex flex-col gap-1">
                  {invoiceList.map((invoice) => {
                    const active = selectedInvoice.id === invoice.id;
                    const amount = getInvoiceTotal(invoice);

                    return (
                      <li key={invoice.id}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleSelectInvoice(invoice.id)}
                          className={cn(
                            "w-full rounded-control border px-3 py-3.5 text-left transition-colors duration-[var(--mgh-dur-fast)]",
                            active
                              ? "border-mgh-gold/40 bg-mgh-surface-2"
                              : "border-transparent hover:bg-mgh-surface-2",
                            focusRing,
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-mgh-text">
                                {invoice.title}
                              </p>
                              <p className="mt-1 text-caption text-mgh-dim">
                                {invoice.reference} · Due{" "}
                                {formatDate(invoice.dueDate)}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-medium tabular-nums text-mgh-text">
                              {currency.format(amount)}
                            </p>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-4">
                            <StatusBadge
                              status={invoice.status}
                              label={statusLabel(invoice.status)}
                            />
                            <span className="text-caption text-mgh-dim">
                              Issued {formatDate(invoice.issuedDate)}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>

              <Panel>
                <PanelHeader title="Payment Protection" />

                <div className="flex flex-col gap-4">
                  <TrustRow
                    icon={ShieldCheck}
                    title="Secure checkout"
                    detail="Payments are processed by PayFast. Card details never touch this site."
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
              </Panel>
            </div>

            <Panel variant="feature" aria-labelledby="invoice-details-title">
              <div className="flex flex-col gap-3 border-b border-mgh-line pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2
                    id="invoice-details-title"
                    className="font-serif text-title font-medium text-mgh-text md:text-display-sm"
                  >
                    {selectedInvoice.reference}
                  </h2>
                  <p className="mt-2 text-sm text-mgh-muted">
                    Issued {formatDate(selectedInvoice.issuedDate)}
                    <span aria-hidden="true" className="mx-2 text-mgh-dim">·</span>
                    Due {formatDate(selectedInvoice.dueDate)}
                  </p>
                </div>

                <StatusBadge
                  status={selectedInvoice.status}
                  label={statusLabel(selectedInvoice.status)}
                  className="sm:mt-2"
                />
              </div>

              <dl className="grid grid-cols-1 gap-5 border-b border-mgh-line py-6 sm:grid-cols-3 sm:gap-6">
                <DetailFact
                  label="Customer"
                  value={selectedInvoice.customerName}
                  caption={`${selectedInvoice.customerEmail} | ${selectedInvoice.customerPhone}`}
                />
                <DetailFact
                  label="Event"
                  value={selectedInvoice.eventType}
                  caption={`${formatDate(selectedInvoice.eventDate)}, ${
                    selectedInvoice.eventTime
                  }`}
                />
                <DetailFact
                  label="Location"
                  value={selectedInvoice.location}
                  caption={`${selectedInvoice.guests} guests`}
                />
              </dl>

              <section className="border-b border-mgh-line py-6">
                <h3 className="font-serif text-xl font-medium text-mgh-text">
                  Final Charges
                </h3>

                <ul className="mt-5 flex flex-col gap-4">
                  {selectedInvoice.items.map((item) => (
                    <li key={item.id}>
                      <div className="flex items-baseline gap-2">
                        <span className="min-w-0 text-sm font-medium text-mgh-text">
                          {item.name}
                        </span>
                        <span
                          aria-hidden="true"
                          className="min-w-4 flex-1 border-b border-dotted border-mgh-line-strong"
                        />
                        <span className="shrink-0 text-sm tabular-nums text-mgh-text">
                          {currency.format(getLineTotal(item))}
                        </span>
                      </div>
                      <p className="mt-1 text-caption text-mgh-dim">
                        {item.description}
                        <span className="tabular-nums">
                          {" "}
                          · Qty {item.quantity} × {currency.format(item.unitPrice)}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-baseline gap-2 border-t border-mgh-line-soft pt-5">
                  <span className="text-label font-semibold uppercase text-mgh-dim">
                    Total
                  </span>
                  <span
                    aria-hidden="true"
                    className="min-w-4 flex-1 border-b border-dotted border-mgh-line-strong"
                  />
                  <span className="shrink-0 font-serif text-[2.25rem] font-medium leading-none text-mgh-text">
                    <Money value={selectedTotal} />
                  </span>
                </div>
              </section>

              <section className="py-6">
                <h3 className="text-label font-semibold uppercase text-mgh-dim">
                  Note From Admin
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mgh-muted">
                  {selectedInvoice.adminNote}
                </p>
              </section>

              {selectedInvoiceCancelled && (
                <section className="rounded-control border border-mgh-danger/30 bg-mgh-danger/5 p-4 md:p-5">
                  <p className="text-label font-semibold uppercase text-mgh-danger">
                    Order Cancelled
                  </p>
                  <h3 className="mt-2 text-base font-medium text-mgh-text">
                    Payment window closed
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-mgh-muted">
                    This order was cancelled because payment was not completed
                    before the due date of {formatDate(selectedInvoice.dueDate)}.
                  </p>
                </section>
              )}

              {!selectedInvoicePaid && !selectedInvoiceCancelled && (
                <section className="border-t border-mgh-line pt-6">
                  <h3 className="font-serif text-xl font-medium text-mgh-text">
                    Pay with PayFast
                  </h3>

                  <div className="mt-5 flex flex-col gap-5">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <ReadOnlyField
                        label="Invoice Amount"
                        value={currency.format(selectedTotal)}
                      />
                      <ReadOnlyField
                        label="Payment Reference"
                        value={selectedInvoice.reference}
                      />
                    </dl>

                    <Field label="Invoice">
                      <Select
                        id="invoice"
                        value={selectedInvoiceId ?? ""}
                        onChange={(event) =>
                          handleSelectInvoice(event.target.value)
                        }
                        className="h-11"
                      >
                        {invoiceList.map((invoice) => (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.reference} - {invoice.title}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <p className="text-sm leading-relaxed text-mgh-muted">
                      You will be taken to PayFast&apos;s secure page to pay by
                      card or instant EFT. Card details are entered on PayFast,
                      never on this site, and PayFast emails you the receipt.
                    </p>

                    {paymentError && (
                      <div
                        role="alert"
                        className="rounded-control border border-mgh-danger/30 bg-mgh-danger/5 px-4 py-3 text-sm text-mgh-danger"
                      >
                        {paymentError}
                      </div>
                    )}

                    {paymentNotice && (
                      <div
                        role="status"
                        className="rounded-control border border-mgh-line bg-mgh-surface-2 px-4 py-3 text-sm text-mgh-text"
                      >
                        {paymentNotice}
                      </div>
                    )}

                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handlePayInvoice}
                      disabled={payingSelectedInvoice || Boolean(confirmingInvoiceId)}
                      className="w-full"
                    >
                      <LockKeyhole size={16} aria-hidden="true" />
                      {payingSelectedInvoice
                        ? "Redirecting to PayFast..."
                        : `Pay ${currency.format(selectedTotal)} with PayFast`}
                    </Button>
                  </div>
                </section>
              )}
            </Panel>
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
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.35fr]"
    >
      <span className="sr-only">Loading your invoices…</span>
      <Skeleton className="h-96 rounded-card" />
      <Skeleton className="h-96 rounded-card" />
    </div>
  );
}

function PaymentCompletedModal({ invoiceReference, orderNumber, onClose }) {
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      size="lg"
      showClose={false}
      describe={false}
    >
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <CheckCircle2 className="mt-1 shrink-0 text-mgh-ok" size={24} />
          <div className="min-w-0 flex-1">
            <p className="text-label font-semibold uppercase text-mgh-ok">
              Payment Received
            </p>
            <DialogTitle asChild>
              <h3 className="mt-2 font-serif text-2xl text-mgh-text">
                Thank You - Payment Confirmed
              </h3>
            </DialogTitle>
            <p className="mt-4 text-sm leading-7 text-mgh-muted">
              PayFast has confirmed your payment and your invoice is now marked
              as paid. The admin can see it straight away, so there is no need
              to send proof of payment. Your booking is confirmed once the admin
              approves it. Keep order number{" "}
              <span className="font-semibold text-mgh-text">{orderNumber}</span>{" "}
              for your records.
            </p>
            <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-control border border-mgh-line bg-mgh-surface-2 px-4 py-3">
                <dt className="text-label font-semibold uppercase text-mgh-dim">
                  Order Number
                </dt>
                <dd className="mt-1 font-semibold text-mgh-text">{orderNumber}</dd>
              </div>
              <div className="rounded-control border border-mgh-line bg-mgh-surface-2 px-4 py-3">
                <dt className="text-label font-semibold uppercase text-mgh-dim">
                  Invoice
                </dt>
                <dd className="mt-1 font-semibold text-mgh-text">
                  {invoiceReference}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                onClick={onClose}
                className="w-full min-w-28 sm:w-auto"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
    </Dialog>
  );
}

function TrustRow({ icon: Icon, title, detail }) {
  return (
    <div className="flex gap-3">
      <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-mgh-dim" />
      <div>
        <p className="text-sm font-medium text-mgh-text">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-mgh-muted">{detail}</p>
      </div>
    </div>
  );
}

function DetailFact({ label, value, caption }) {
  return (
    <div className="min-w-0">
      <dt className="text-label font-semibold uppercase text-mgh-dim">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-mgh-text">{value}</dd>
      <dd className="mt-1 break-words text-caption text-mgh-muted">{caption}</dd>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-label font-semibold uppercase text-mgh-dim">{label}</dt>
      <dd className="mt-1.5 text-sm tabular-nums text-mgh-text">{value}</dd>
    </div>
  );
}
