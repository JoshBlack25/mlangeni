"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Send, Trash2 } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  Button,
  Field,
  Figure,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  Skeleton,
  Textarea,
} from "@/app/components/dashboard/ui";
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
  const [customerUserId, setCustomerUserId] = useState(null);
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
              user_id,
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
          setCustomerUserId(data?.customer?.user_id ?? null);
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

      // Non-blocking: notify the customer their invoice is ready.
      if (customerUserId) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          return supabase.from("notifications").insert({
            user_id: customerUserId,
            sender_id: user.id,
            category: "invoice",
            title: "Invoice Ready",
            message:
              "Your invoice is ready. Please review and complete payment by the due date to secure your event.",
            link_url: "/dashboard/customer/payments",
          });
        }).catch((err) => console.error("Invoice notification failed:", err));
      }

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
    <div className="flex flex-col gap-6">
      <PageHeader
        density="dense"
        title="Invoice Draft"
        lead="Review the customer order, adjust invoice items, and prepare the note that will be sent with the payment request."
        actions={
          <>
            <p className="text-sm tabular-nums text-mgh-muted">
              {reference} invoice pending
            </p>
            <Button
              variant="quiet"
              size="sm"
              href="/dashboard/admin/active-meetings"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to active meetings
            </Button>
          </>
        }
      />

      {loading ? (
        <DraftSkeleton />
      ) : error ? (
        <Panel density="dense">
          <div role="alert" className="flex min-h-48 flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-mgh-danger">
              We could not load this invoice draft
            </p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-mgh-muted">
              {error}
            </p>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <Panel density="dense">
              <PanelHeader density="dense" title="Billing Details" />

              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
                <DetailItem label="Customer" value={customer.name} />
                <DetailItem label="Email" value={customer.email} />
                <DetailItem label="Phone" value={customer.phone} />
              </dl>

              <p className="mt-5 border-t border-mgh-line-soft pt-4 text-label font-semibold uppercase text-mgh-dim">
                Order
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                <DetailItem label="Event Type" value={order.eventType} />
                <DetailItem
                  label="Event Date"
                  value={formatDate(order.eventDate)}
                />
                <DetailItem
                  label="Meeting Date"
                  value={formatDate(order.meetingDate)}
                />
                <DetailItem label="Guests" value={order.guests} />
                <DetailItem
                  label="Location"
                  value={order.location}
                  className="col-span-2 sm:col-span-4"
                />
              </dl>
            </Panel>

            <Panel density="dense">
              <PanelHeader
                density="dense"
                title="Order Charges"
                action={
                  <Button variant="secondary" size="sm" onClick={addItem}>
                    <Plus size={16} aria-hidden="true" />
                    Add Item
                  </Button>
                }
              />

              <div
                aria-hidden="true"
                className="hidden grid-cols-[minmax(0,1fr)_5rem_7.5rem_7rem_2rem] gap-3 border-b border-mgh-line pb-2 text-label font-semibold uppercase text-mgh-dim lg:grid"
              >
                <span>Item</span>
                <span>Qty</span>
                <span>Unit Price</span>
                <span className="text-right">Total</span>
                <span />
              </div>

              {items.length === 0 ? (
                <p className="border-y border-mgh-line-soft py-8 text-center text-sm text-mgh-muted lg:border-t-0">
                  No order items were found. Add invoice items manually.
                </p>
              ) : (
                <ul className="divide-y divide-mgh-line-soft border-b border-mgh-line-soft">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-2 gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_5rem_7.5rem_7rem_2rem] lg:items-start"
                    >
                      <div className="col-span-2 grid grid-cols-1 gap-2 lg:col-span-1">
                        <CellLabel label="Item">
                          <Input
                            type="text"
                            value={item.name}
                            onChange={(event) =>
                              updateItem(item.id, "name", event.target.value)
                            }
                            className="h-9 font-medium"
                          />
                        </CellLabel>
                        <CellLabel label="Description">
                          <Input
                            type="text"
                            value={item.description}
                            onChange={(event) =>
                              updateItem(
                                item.id,
                                "description",
                                event.target.value,
                              )
                            }
                            className="h-9 text-[13px] text-mgh-muted"
                          />
                        </CellLabel>
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

                      <div className="flex items-center justify-between gap-2 lg:block lg:pt-2 lg:text-right">
                        <span className="text-label font-semibold uppercase text-mgh-dim lg:hidden">
                          Total
                        </span>
                        <span className="text-sm tabular-nums text-mgh-text">
                          {toMoney(getLineTotal(item))}
                        </span>
                      </div>

                      <div className="flex justify-end lg:pt-0.5">
                        <Button
                          variant="quiet"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="size-10 px-0 hover:text-mgh-danger lg:size-8"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel density="dense">
              <PanelHeader density="dense" title="Invoice Message" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
                <div className="flex flex-col gap-1.5">
                  <Field label="Due Date" error={dueDateError || undefined}>
                    <Input
                      id="invoice-due-date"
                      type="date"
                      value={dueDate}
                      max={latestAllowedDueDate || undefined}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </Field>
                  {latestAllowedDueDate && (
                    <p className="text-caption leading-5 text-mgh-dim">
                      Latest due date: {formatDate(latestAllowedDueDate)}.
                      Payment must be due at least one week before the event.
                    </p>
                  )}
                </div>

                <Field label="Note Under Invoice">
                  <Textarea
                    id="invoice-note"
                    rows={5}
                    value={invoiceNote}
                    onChange={(event) => setInvoiceNote(event.target.value)}
                    className="resize-none"
                  />
                </Field>
              </div>
            </Panel>
          </div>

          <Panel density="dense" className="lg:sticky lg:top-6">
            <PanelHeader density="dense" title="Invoice Total" />

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-mgh-muted">Subtotal</span>
              <span className="tabular-nums text-mgh-text">
                {toMoney(subtotal)}
              </span>
            </div>

            <div className="mt-4 border-t border-mgh-line-soft pt-4">
              <Figure label="Total Due" value={toMoney(total)} emphasis />
            </div>

            {draftMessage && (
              <p
                role="status"
                className="mt-4 rounded-control border border-mgh-line bg-mgh-surface-2 px-3 py-2.5 text-sm text-mgh-text"
              >
                {draftMessage}
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={handleSendInvoice}
              disabled={
                sending || loading || !invoiceData || Boolean(dueDateError)
              }
              className="mt-5 w-full"
            >
              <Send size={16} aria-hidden="true" />
              {sending ? "Sending Invoice..." : "Send Invoice"}
            </Button>
          </Panel>
        </div>
      )}
    </div>
  );
}

function DraftSkeleton() {
  return (
    <div
      role="status"
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <span className="sr-only">Loading invoice draft...</span>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
      <Skeleton className="h-56 rounded-card" />
    </div>
  );
}

function InvoicePageFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="mb-6 md:mb-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <DraftSkeleton />
    </div>
  );
}

function DetailItem({ label, value, className }) {
  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <dt className="text-label font-semibold uppercase text-mgh-dim">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm text-mgh-text">{value}</dd>
    </div>
  );
}

function CellLabel({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-mgh-muted lg:sr-only">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberField({ label, value, min, onChange }) {
  return (
    <CellLabel label={label}>
      <Input
        type="number"
        min={min}
        value={value}
        onChange={onChange}
        className="h-9 tabular-nums"
      />
    </CellLabel>
  );
}
