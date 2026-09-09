"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Send,
  Trash2,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  getDueDateTimestamp,
  getInvoiceDueDateValidationMessage,
  getLatestInvoiceDueDate,
} from "@/app/utils/invoiceDueDates";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

const defaultInvoiceNote =
  "Thank you for meeting with Mlangeni Grand Hospitality and confirming the final event details. We are pleased to proceed with your booking. Please review the invoice below and complete payment by the due date so we can secure your event arrangements.";

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

function toMoney(value) {
  return currency.format(Number(value || 0));
}

function getLineTotal(item) {
  return Number(item.quantity || 0) * Number(item.unitPrice || 0);
}

function getCustomerName(customer) {
  if (!customer) return "Unknown customer";

  const name =
    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  return name || customer.email || "Unknown customer";
}

function getReference(id) {
  if (!id) return "REQ-TBC";

  return `REQ-${id.slice(0, 8).toUpperCase()}`;
}

function getMeetingLocation(note, fallbackLocation) {
  const match = note?.match(/Meeting location:\s*([^\n]+)/i);

  return match?.[1]?.trim() || fallbackLocation || "Location pending";
}

function getOrderItems(order) {
  if (!order) return [];

  const customItems = (order.customer_menu_items ?? [])
    .map((item) => ({
      id:
        item.custom_menu_id ?? item.menu_item?.item_id ?? item.menu_item?.name,
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

  if (order.total_price !== null && order.total_price !== undefined) {
    return [
      {
        id: "order-total",
        name: "Event catering total",
        description: "Confirmed order amount",
        quantity: 1,
        unitPrice: Number(order.total_price),
      },
    ];
  }

  return [];
}

function mapConsultation(data) {
  const order = data?.order;

  return {
    reference: getReference(data?.consultations_id),
    customer: {
      name: getCustomerName(data?.customer),
      email: data?.customer?.email || "Email pending",
      phone: data?.customer?.phone_number || "Phone pending",
    },
    order: {
      eventType: order?.event_type?.event_name ?? "Event type pending",
      eventDate: order?.event_date,
      meetingDate: data?.meeting_date,
      guests: order?.number_of_guest ?? "TBC",
      location: order?.event_location || "Event location pending",
      meetingLocation: getMeetingLocation(data?.note, order?.event_location),
      totalPrice: order?.total_price,
    },
    items: getOrderItems(order),
    note: defaultInvoiceNote,
  };
}

export default function AdminCreateInvoicePage() {
  return (
    <Suspense fallback={<InvoicePageFallback />}>
      <AdminCreateInvoiceContent />
    </Suspense>
  );
}

function AdminCreateInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultationId = searchParams.get("consultationId");
  const [invoiceData, setInvoiceData] = useState(null);
  const [items, setItems] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [invoiceNote, setInvoiceNote] = useState("");
  const [loading, setLoading] = useState(Boolean(consultationId));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [draftMessage, setDraftMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadInvoiceSource() {
      if (!consultationId) {
        setInvoiceData(null);
        setItems([]);
        setDueDate("");
        setInvoiceNote("");
        setDraftMessage("");
        setLoading(false);
        setError(
          "Open this page from an active meeting to load order details.",
        );
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setDraftMessage("");
        setInvoiceData(null);
        setItems([]);
        setDueDate("");
        setInvoiceNote("");

        const { data, error: consultationError } = await supabase
          .from("consultations")
          .select(
            `
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
              total_price,
              event_date,
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
          `,
          )
          .eq("consultations_id", consultationId)
          .maybeSingle();

        if (consultationError) {
          throw consultationError;
        }

        if (!data) {
          throw new Error("This active meeting could not be found.");
        }

        const mapped = mapConsultation(data);

        if (mounted) {
          setInvoiceData(mapped);
          setItems(mapped.items);
          setDueDate(getLatestInvoiceDueDate(mapped.order.eventDate));
          setInvoiceNote(mapped.note);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load invoice details.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInvoiceSource();

    return () => {
      mounted = false;
    };
  }, [consultationId]);

  const subtotal = items.reduce((sum, item) => sum + getLineTotal(item), 0);
  const total = subtotal;

  function updateItem(id, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "quantity" || field === "unitPrice"
                  ? Number(value)
                  : value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: `item-${Date.now()}`,
        name: "Additional service",
        description: "Add description",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleSendInvoice() {
    if (!consultationId) {
      setDraftMessage("Open this page from an active meeting before sending.");
      return;
    }

    try {
      setSending(true);
      setError(null);
      setDraftMessage("");

      const dueDateError = getInvoiceDueDateValidationMessage(
        dueDate,
        invoiceData?.order?.eventDate,
      );

      if (dueDateError) {
        setError(dueDateError);
        return;
      }

      const { data: existingInvoice, error: existingError } = await supabase
        .from("invoices")
        .select("invoices_id")
        .eq("consultation_id", consultationId)
        .neq("status", "draft")
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingInvoice) {
        setDraftMessage("This invoice has already been sent to the customer.");
        router.push("/dashboard/admin/invoices");
        return;
      }

      const { error: invoiceError } = await supabase.from("invoices").insert({
        consultation_id: consultationId,
        total_amount: total,
        status: "sent",
        due_date: getDueDateTimestamp(dueDate),
        notes: invoiceNote.trim() || defaultInvoiceNote,
      });

      if (invoiceError) {
        throw invoiceError;
      }

      setDraftMessage("Invoice sent to the customer's payment page.");
      router.push("/dashboard/admin/invoices");
    } catch (err) {
      setError(err.message || "Unable to send this invoice right now.");
    } finally {
      setSending(false);
    }
  }

  const customer = invoiceData?.customer ?? {
    name: "Loading customer",
    email: "Loading email",
    phone: "Loading phone",
  };
  const order = invoiceData?.order ?? {
    eventType: "Loading event",
    eventDate: null,
    meetingDate: null,
    guests: "TBC",
    location: "Loading location",
    meetingLocation: "Loading meeting location",
  };
  const reference = invoiceData?.reference ?? "REQ-TBC";
  const latestAllowedDueDate = getLatestInvoiceDueDate(order.eventDate);
  const dueDateError =
    invoiceData && getInvoiceDueDateValidationMessage(dueDate, order.eventDate);

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
              href="/dashboard/admin/active-meetings"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#A0A0A0] transition hover:text-[#D4AF37]"
            >
              <ArrowLeft size={16} />
              Back to active meetings
            </Link>

            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <Receipt size={17} />
              <span>Create Invoice</span>
            </div>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Invoice Draft
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Review the customer order, adjust invoice items, and prepare the
              note that will be sent with the payment request.
            </p>
          </div>

          <div className="border-l-2 border-[#D4AF37] bg-white/[0.03] px-4 py-3 text-sm text-[#D4AF37]">
            {reference} invoice pending
          </div>
        </motion.div>

        {loading ? (
          <div className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_1.3fr]">
            <div className="h-80 animate-pulse rounded-2xl border border-[#1F1F1F] bg-white/5" />
            <div className="h-80 animate-pulse rounded-2xl border border-[#1F1F1F] bg-white/5" />
          </div>
        ) : error ? (
          <div className="mt-10 flex min-h-64 flex-col items-center justify-center border border-red-400/20 bg-red-400/5 px-6 text-center">
            <p className="text-sm font-semibold text-red-300">
              We could not load this invoice draft
            </p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#A0A0A0]">
              {error}
            </p>
          </div>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.3fr]"
            >
              <section className="rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
                <div className="border-b border-white/10 pb-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Customer
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Billing Details
                  </h2>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <DetailRow
                    icon={UsersRound}
                    label="Customer"
                    value={customer.name}
                  />
                  <DetailRow icon={Mail} label="Email" value={customer.email} />
                  <DetailRow
                    icon={Phone}
                    label="Phone"
                    value={customer.phone}
                  />
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Order
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailBlock label="Event Type" value={order.eventType} />
                    <DetailBlock
                      label="Event Date"
                      value={formatDate(order.eventDate)}
                    />
                    <DetailBlock
                      label="Meeting Date"
                      value={formatDate(order.meetingDate)}
                    />
                    <DetailBlock label="Guests" value={order.guests} />
                  </div>

                  <div className="mt-4 flex items-center gap-2 border border-white/10 bg-[#0A0A0A]/50 px-4 py-3 text-sm text-[#A0A0A0]">
                    <MapPin size={16} className="text-[#D4AF37]" />
                    <span>{order.location}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
                <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                      Invoice Items
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      Order Charges
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/40 px-4 text-sm font-medium text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                  >
                    <Plus size={15} />
                    Add Item
                  </button>
                </div>

                <div className="hidden grid-cols-[1fr_0.45fr_0.55fr_0.55fr_0.2fr] gap-3 border-b border-white/10 px-3 pb-3 text-xs uppercase tracking-[0.16em] text-[#797676] lg:grid">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Unit Price</span>
                  <span>Total</span>
                  <span />
                </div>

                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="border border-white/10 bg-[#0A0A0A]/40 px-4 py-8 text-center text-sm text-[#A0A0A0]">
                      No order items were found. Add invoice items manually.
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 gap-3 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/40 p-3 lg:grid-cols-[1fr_0.45fr_0.55fr_0.55fr_0.2fr] lg:items-center"
                      >
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(event) =>
                              updateItem(item.id, "name", event.target.value)
                            }
                            className="h-10 w-full rounded-lg border border-white/10 bg-[#101010] px-3 text-sm font-medium text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                          />
                          <input
                            type="text"
                            value={item.description}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "description",
                                event.target.value,
                              )
                            }
                            className="h-10 w-full rounded-lg border border-white/10 bg-[#101010] px-3 text-xs text-[#A0A0A0] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                          />
                        </div>

                        <NumberField
                          label="Qty"
                          value={item.quantity}
                          min="0"
                          onChange={(event) =>
                            updateItem(item.id, "quantity", event.target.value)
                          }
                        />

                        <NumberField
                          label="Unit Price"
                          value={item.unitPrice}
                          min="0"
                          onChange={(event) =>
                            updateItem(item.id, "unitPrice", event.target.value)
                          }
                        />

                        <div className="border-l border-white/10 pl-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-[#797676] lg:hidden">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white lg:mt-0">
                            {toMoney(getLineTotal(item))}
                          </p>
                        </div>

                        <div className="flex lg:justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/30 text-red-400 transition hover:border-red-400 hover:bg-red-400/10"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
              className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]"
            >
              <section className="rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
                <div className="border-b border-white/10 pb-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Customer Note
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Invoice Message
                  </h2>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[0.35fr_1fr]">
                  <div>
                    <label
                      htmlFor="invoice-due-date"
                      className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
                    >
                      Due Date
                    </label>
                    <div className="relative">
                      <CalendarDays
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"
                      />
                      <input
                        id="invoice-due-date"
                        type="date"
                        value={dueDate}
                        max={latestAllowedDueDate || undefined}
                        onChange={(event) => setDueDate(event.target.value)}
                        className="h-12 w-full rounded-lg border border-white/10 bg-[#101010] pl-11 pr-4 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                      />
                    </div>
                    {latestAllowedDueDate && (
                      <p className="mt-2 text-xs leading-5 text-[#797676]">
                        Latest due date: {formatDate(latestAllowedDueDate)}.
                        Payment must be due at least one week before the event.
                      </p>
                    )}
                    {dueDateError && (
                      <p className="mt-2 text-xs leading-5 text-red-300">
                        {dueDateError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="invoice-note"
                      className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
                    >
                      Note Under Invoice
                    </label>
                    <textarea
                      id="invoice-note"
                      rows={5}
                      value={invoiceNote}
                      onChange={(event) => setInvoiceNote(event.target.value)}
                      className="w-full resize-none rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#4F4F4F] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
                <div className="border-b border-white/10 pb-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Summary
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Invoice Total
                  </h2>
                </div>

                <div className="mt-5 space-y-3">
                  <SummaryRow label="Subtotal" value={toMoney(subtotal)} />
                  <div className="border-t border-white/10 pt-4">
                    <SummaryRow
                      label="Total Due"
                      value={toMoney(total)}
                      strong
                    />
                  </div>
                </div>

                {draftMessage && (
                  <div className="mt-5 border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3 text-sm text-[#D4AF37]">
                    {draftMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSendInvoice}
                  disabled={
                    sending || loading || !invoiceData || Boolean(dueDateError)
                  }
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] disabled:cursor-not-allowed disabled:bg-[#6f5c1e] disabled:text-black/60"
                >
                  <Send size={16} />
                  {sending ? "Sending Invoice..." : "Send Invoice"}
                </button>
              </section>
            </motion.section>
          </>
        )}
      </div>
    </main>
  );
}

function InvoicePageFallback() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1400px]">
        <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-8 h-12 w-72 animate-pulse rounded bg-white/10" />
        <div className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_1.3fr]">
          <div className="h-80 animate-pulse rounded-2xl border border-[#1F1F1F] bg-white/5" />
          <div className="h-80 animate-pulse rounded-2xl border border-[#1F1F1F] bg-white/5" />
        </div>
      </div>
    </main>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border border-white/10 bg-[#0A0A0A]/50 px-4 py-3">
      <Icon size={16} className="text-[#D4AF37]" />
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#797676]">
          {label}
        </p>
        <p className="mt-1 text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="border border-white/10 bg-[#0A0A0A]/50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[#797676]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function NumberField({ label, value, min, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#797676] lg:hidden">
        {label}
      </label>
      <input
        type="number"
        min={min}
        value={value}
        onChange={onChange}
        className="h-10 w-full rounded-lg border border-white/10 bg-[#101010] px-3 text-sm text-white outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
      />
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p
        className={
          strong ? "text-sm font-semibold text-white" : "text-sm text-[#A0A0A0]"
        }
      >
        {label}
      </p>
      <p
        className={
          strong
            ? "text-lg font-semibold text-[#D4AF37]"
            : "text-sm font-medium text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}
