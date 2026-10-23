"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Trash2,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { cn } from "@/lib/utils";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogDescription,
  EmptyState,
  EngravedDate,
  Field,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  Skeleton,
  StatusBadge,
  Textarea,
  focusRing,
  statusLabel,
  Blank,
} from "@/app/components/dashboard/ui";

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
    ? value
    : date.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      });
}

function toDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function toTimeInput(value) {
  if (!value) return "10:00";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "10:00";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getCustomerName(customer) {
  if (!customer) return "Unknown customer";

  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  return name || customer.email || "Unknown customer";
}

function getReference(id) {
  if (!id) return "REQ-TBC";

  return `REQ-${id.slice(0, 8).toUpperCase()}`;
}


function buildMeetingDates() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 6; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    dates.push({
      day: date.toLocaleDateString("en-ZA", { weekday: "short" }),
      date: String(date.getDate()).padStart(2, "0"),
      value: date.toISOString().slice(0, 10),
    });
  }

  return dates;
}

function getOrderItems(order) {
  if (!order) return [];

  const customItems = (order.customer_menu_items ?? [])
    .map((item) => ({
      id: item.custom_menu_id ?? item.menu_item?.item_id ?? item.menu_item?.name,
      name: item.menu_item?.name ?? "Menu item",
      quantity: item.quantity ?? 1,
      note: item.menu_item?.description ?? "Custom menu selection",
      price: item.menu_item?.price,
    }))
    .filter((item) => item.name);

  if (customItems.length > 0) return customItems;

  return (order.premade_menu?.premade_menu_items ?? [])
    .map((item, index) => ({
      id: item.menu_item?.item_id ?? `${order.premade_menu?.name}-${index}`,
      name: item.menu_item?.name ?? "Package item",
      quantity: 1,
      note: order.premade_menu?.name ?? "Package menu selection",
      price: item.menu_item?.price,
    }))
    .filter((item) => item.name);
}

function buildMeetingNote(currentNote, meetingLocation, meetingNotes) {
  const parts = [];

  if (currentNote?.trim()) {
    parts.push(currentNote.trim());
  }

  if (meetingLocation?.trim()) {
    parts.push(`Meeting location: ${meetingLocation.trim()}`);
  }

  if (meetingNotes?.trim()) {
    parts.push(`Admin meeting notes: ${meetingNotes.trim()}`);
  }

  return parts.join("\n\n") || "In-person meeting scheduled.";
}

async function markConsultationOpened(consultationId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: admin, error: adminError } = await supabase
    .from("admin")
    .select("admin_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin?.admin_id) {
    if (adminError) {
      console.error("Failed to load admin profile:", adminError);
    }

    return null;
  }

  const { data, error } = await supabase
    .from("consultations")
    .update({ admin_id: admin.admin_id })
    .eq("consultations_id", consultationId)
    .is("admin_id", null)
    .select("admin_id")
    .maybeSingle();

  if (error) {
    console.error("Failed to mark consultation as opened:", error);
    return null;
  }

  return data?.admin_id ?? null;
}

export default function AdminConsultationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const consultationId = params?.consultationId;
  const meetingDates = useMemo(() => buildMeetingDates(), []);

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [savingAction, setSavingAction] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionConfirmation, setActionConfirmation] = useState(null);
  const [selectedMeetingDate, setSelectedMeetingDate] = useState(
    meetingDates[0]?.value ?? "",
  );
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadConsultation() {
      try {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
          .from("consultations")
          .select(
            `
            consultations_id,
            admin_id,
            status,
            meeting_date,
            note,
            customer:customer_id (
              customer_id,
              user_id,
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
          `,
          )
          .eq("consultations_id", consultationId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        let loadedConsultation = data;

        if (data && !data.admin_id) {
          const adminId = await markConsultationOpened(data.consultations_id);

          if (adminId) {
            loadedConsultation = {
              ...data,
              admin_id: adminId,
            };
          }
        }

        if (!mounted) return;

        setConsultation(loadedConsultation);

        if (loadedConsultation?.meeting_date) {
          setSelectedMeetingDate(toDateInput(loadedConsultation.meeting_date));
          setMeetingTime(toTimeInput(loadedConsultation.meeting_date));
        }
      } catch (err) {
        if (mounted) {
          setLoadError(
            err.message || "Unable to load this consultation request.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (consultationId) {
      loadConsultation();
    }

    return () => {
      mounted = false;
    };
  }, [consultationId]);

  const customer = consultation?.customer;
  const order = consultation?.order;
  const orderItems = useMemo(() => getOrderItems(order), [order]);
  const fullName = getCustomerName(customer);
  const eventType = order?.event_type?.event_name ?? "Event type pending";
  const guestCount = order?.number_of_guest
    ? `${order.number_of_guest} guests`
    : "Guest count pending";
  const totalPrice =
    order?.total_price !== null && order?.total_price !== undefined
      ? currency.format(Number(order.total_price))
      : "TBC";

  async function handleScheduleMeeting() {
    setActionError(null);
    setActionMessage(null);

    if (!selectedMeetingDate) {
      setActionError("Please select a meeting date.");
      return;
    }

    setSavingAction("schedule");

    const meetingDate = `${selectedMeetingDate}T${meetingTime || "10:00"}:00`;
    const note = buildMeetingNote(
      consultation?.note,
      meetingLocation,
      meetingNotes,
    );

    try {
      const { error } = await supabase
        .from("consultations")
        .update({
          status: "scheduled",
          meeting_date: meetingDate,
          note,
        })
        .eq("consultations_id", consultationId);

      if (error) {
        throw error;
      }

      setConsultation((current) =>
        current
          ? {
              ...current,
              status: "scheduled",
              meeting_date: meetingDate,
              note,
            }
          : current,
      );
      setActionConfirmation({
        eyebrow: "Meeting Scheduled",
        title: "Consultation moved to active meetings",
        message:
          "The in-person meeting has been saved. This request will no longer sit in consultations and can now be handled from active meetings.",
        detail: `${fullName} - ${eventType} - ${formatDate(
          meetingDate,
        )} at ${formatTime(meetingDate)}`,
      });

      // Non-blocking: notify the customer their meeting has been scheduled.
      const customerUserId = consultation?.customer?.user_id;
      if (customerUserId) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          return supabase.from("notifications").insert({
            user_id: customerUserId,
            sender_id: user.id,
            category: "consultation",
            title: "Meeting Scheduled",
            message: `Your in-person meeting has been scheduled for ${formatDate(meetingDate)} at ${formatTime(meetingDate)}. We look forward to seeing you.`,
            link_url: "/dashboard/customer/enquiry",
          });
        }).catch((err) => console.error("Meeting notification failed:", err));
      }
    } catch (err) {
      setActionError(err.message || "Unable to schedule this meeting.");
    } finally {
      setSavingAction(null);
    }
  }

  async function handleCancelEvent() {
    setActionError(null);
    setActionMessage(null);
    setSavingAction("cancel");

    try {
      const orderId = order?.order_id;

      const { error: consultationError } = await supabase
        .from("consultations")
        .delete()
        .eq("consultations_id", consultationId);

      if (consultationError) {
        throw consultationError;
      }

      if (order?.order_id) {
        const { error: orderError } = await supabase
          .from("orders")
          .delete()
          .eq("order_id", orderId);

        if (orderError) {
          throw orderError;
        }
      }

      setShowCancelDialog(false);
      setActionConfirmation({
        eyebrow: "Order Cancelled",
        title: "Consultation and order removed",
        message:
          "The consultation request and the linked customer order have been cancelled and removed from the workflow.",
        detail: `${fullName} - ${eventType}`,
      });
    } catch (err) {
      setShowCancelDialog(false);
      setActionError(err.message || "Unable to cancel this event request.");
    } finally {
      setSavingAction(null);
    }
  }

  return (
    <div>
      <PageHeader
        density="dense"
        title={loading ? "Loading request" : fullName}
        lead="Review the submitted order and prepare the in-person meeting details for the customer."
        actions={
          <Button variant="quiet" href="/dashboard/admin/consultations">
            <ArrowLeft size={16} className="text-mgh-dim" />
            Back to consultations
          </Button>
        }
      />

      {loading ? (
        <div role="status" className="flex flex-col gap-6">
          <span className="sr-only">Loading request</span>
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="flex flex-col gap-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      ) : loadError ? (
        <Panel density="dense" className="border-mgh-danger/30">
          <p className="text-sm font-semibold text-mgh-danger">
            We could not load this consultation
          </p>
          <p className="mt-2 max-w-lg text-sm leading-6 text-mgh-muted">
            {loadError}
          </p>
        </Panel>
      ) : !consultation ? (
        <Panel density="dense">
          <EmptyState title="Consultation not found">
            This consultation request is no longer available.
          </EmptyState>
        </Panel>
      ) : (
        <div className="flex flex-col gap-6">
          <Panel
            density="dense"
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6"
          >
            <EngravedDate date={order?.event_date} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-mgh-text">{eventType}</p>
              <p className="mt-1 text-sm text-mgh-muted">
                {formatDate(order?.event_date)} · {guestCount}
              </p>
              <p className="mt-1 text-caption tabular-nums text-mgh-dim">
                {getReference(consultation?.consultations_id)}
              </p>
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-3 sm:justify-end">
              <div>
                <dt className="text-label font-semibold uppercase text-mgh-dim">
                  Consultation
                </dt>
                <dd className="mt-1.5">
                  <StatusBadge
                    status={consultation?.status || "requested"}
                    label={statusLabel(consultation?.status, "Requested")}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-label font-semibold uppercase text-mgh-dim">
                  Order Status
                </dt>
                <dd className="mt-1.5">
                  <StatusBadge
                    status={order?.status || "requested"}
                    label={statusLabel(order?.status, "Requested")}
                  />
                </dd>
              </div>
            </dl>
          </Panel>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <Panel density="dense">
                <PanelHeader density="dense" title="Customer Details" />
                <dl className="divide-y divide-mgh-line-soft border-t border-mgh-line-soft">
                  <DetailRow
                    label="First Name"
                    value={customer?.first_name || "First name pending"}
                  />
                  <DetailRow
                    label="Last Name"
                    value={customer?.last_name || "Last name pending"}
                  />
                  <DetailRow
                    icon={Mail}
                    label="Email"
                    value={customer?.email || "Email pending"}
                  />
                  <DetailRow
                    icon={Phone}
                    label="Phone"
                    value={customer?.phone_number || "Phone pending"}
                  />
                </dl>
              </Panel>

              <Panel density="dense">
                <PanelHeader density="dense" title="Submitted Event Details" />
                <dl className="divide-y divide-mgh-line-soft border-t border-mgh-line-soft">
                  <DetailRow label="Event Type" value={eventType} />
                  <DetailRow label="Guest Count" value={guestCount} />
                  <DetailRow
                    label="Event Date"
                    value={formatDate(order?.event_date)}
                  />
                  <DetailRow
                    label="Event Time"
                    value={`${formatTime(order?.start_time)} - ${formatTime(
                      order?.end_time,
                    )}`}
                  />
                  <DetailRow
                    icon={MapPin}
                    label="Location"
                    value={order?.event_location || "Event location pending"}
                  />
                </dl>
              </Panel>

              <Panel density="dense">
                <PanelHeader density="dense" title="Customer Menu Selection" />

                {orderItems.length === 0 ? (
                  <p className="text-sm text-mgh-muted">
                    No menu items were found for this order yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-mgh-line-soft border-t border-mgh-line-soft">
                    {orderItems.map((item) => (
                      <li key={item.id} className="py-2.5">
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="min-w-0 font-medium text-mgh-text">
                            {item.name}
                          </span>
                          <span className="shrink-0 tabular-nums text-mgh-dim">
                            × {item.quantity}
                          </span>
                          <span
                            aria-hidden="true"
                            className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-mgh-line-strong"
                          />
                          {item.price !== null && item.price !== undefined ? (
                            <span className="shrink-0 tabular-nums text-mgh-text">
                              {currency.format(Number(item.price))}
                            </span>
                          ) : (
                            <Blank label="Price not set" className="shrink-0" />
                          )}
                        </div>
                        {item.note && (
                          <p className="mt-0.5 text-caption text-mgh-dim">
                            {item.note}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-mgh-line pt-3">
                  <span className="text-label font-semibold uppercase text-mgh-dim">
                    Order Total
                  </span>
                  <span className="font-serif text-xl font-medium tabular-nums text-mgh-text">
                    {totalPrice}
                  </span>
                </div>
              </Panel>

              {consultation.note && (
                <Panel density="dense">
                  <PanelHeader density="dense" title="Customer Notes" />
                  <p className="whitespace-pre-line text-sm leading-6 text-mgh-muted">
                    {consultation.note}
                  </p>
                </Panel>
              )}
            </div>

            <Panel density="dense" className="lg:sticky lg:top-6">
              <PanelHeader density="dense" title="Schedule In-Person Meeting" />

              <div className="flex flex-col gap-4">
                <fieldset>
                  <legend className="mb-1.5 text-[13px] font-medium text-mgh-muted">
                    Select Date
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {meetingDates.map((meetingDate) => {
                      const active = selectedMeetingDate === meetingDate.value;

                      return (
                        <button
                          key={meetingDate.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setSelectedMeetingDate(meetingDate.value)
                          }
                          className={cn(
                            "flex flex-col items-center rounded-control border px-2 py-2 transition-colors",
                            active
                              ? "border-mgh-gold bg-mgh-gold/10"
                              : "border-mgh-line bg-mgh-surface-2 hover:border-mgh-line-strong",
                            focusRing,
                          )}
                        >
                          <span className="text-label font-semibold uppercase text-mgh-dim">
                            {meetingDate.day}
                          </span>
                          <span className="mt-0.5 font-serif text-xl tabular-nums text-mgh-text">
                            {meetingDate.date}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <Field label="Custom Date">
                  <Input
                    id="meeting-date"
                    type="date"
                    value={selectedMeetingDate}
                    onChange={(event) =>
                      setSelectedMeetingDate(event.target.value)
                    }
                  />
                </Field>

                <Field label="Meeting Time">
                  <Input
                    id="meeting-time"
                    type="time"
                    value={meetingTime}
                    onChange={(event) => setMeetingTime(event.target.value)}
                  />
                </Field>

                <Field label="Meeting Location">
                  <Input
                    id="meeting-location"
                    placeholder="Office or venue address"
                    value={meetingLocation}
                    onChange={(event) => setMeetingLocation(event.target.value)}
                  />
                </Field>

                <Field label="Notes To Customer">
                  <Textarea
                    id="meeting-notes"
                    rows={5}
                    value={meetingNotes}
                    onChange={(event) => setMeetingNotes(event.target.value)}
                    placeholder="Add notes about what the customer should bring, what will be discussed, or where to meet..."
                    className="resize-none"
                  />
                </Field>

                {(actionError || actionMessage) && (
                  <p
                    role={actionError ? "alert" : "status"}
                    className={cn(
                      "rounded-control border px-3 py-2.5 text-sm",
                      actionError
                        ? "border-mgh-danger/30 bg-mgh-danger/5 text-mgh-danger"
                        : "border-mgh-line bg-mgh-surface-2 text-mgh-muted",
                    )}
                  >
                    {actionError || actionMessage}
                  </p>
                )}

                <div className="flex flex-col gap-2 border-t border-mgh-line pt-4">
                  <Button
                    variant="primary"
                    onClick={handleScheduleMeeting}
                    disabled={Boolean(savingAction)}
                    className="w-full"
                  >
                    <Check size={16} />
                    {savingAction === "schedule"
                      ? "Scheduling..."
                      : "Schedule Meeting"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={Boolean(savingAction)}
                    className="w-full"
                  >
                    <Trash2 size={16} />
                    {savingAction === "cancel" ? "Cancelling..." : "Cancel Event"}
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {showCancelDialog && (
        <CancelOrderDialog
          customerName={fullName}
          eventType={eventType}
          saving={savingAction === "cancel"}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleCancelEvent}
        />
      )}

      {actionConfirmation && (
        <AdminActionConfirmationDialog
          {...actionConfirmation}
          onClose={() => {
            setActionConfirmation(null);
            router.replace("/dashboard/admin");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CancelOrderDialog({
  customerName,
  eventType,
  saving,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      size="md"
      dismissible={!saving}
      showClose={false}
    >
      <div>
        <p className="text-label font-semibold uppercase text-mgh-danger">
          Cancel Order
        </p>
        <DialogTitle asChild>
          <h2 className="mt-2 font-serif text-title font-medium text-mgh-text">
            Are you sure you want to cancel this order?
          </h2>
        </DialogTitle>
        <DialogDescription asChild>
          <p className="mt-2 text-sm leading-relaxed text-mgh-muted">
            This will permanently delete the consultation and the order from the
            database. This action cannot be undone.
          </p>
        </DialogDescription>
      </div>

      <div className="mt-5 rounded-control border border-mgh-line bg-mgh-surface-2 px-4 py-3">
        <p className="text-label font-semibold uppercase text-mgh-dim">
          Order Summary
        </p>
        <p className="mt-1.5 text-sm font-medium text-mgh-text">
          {customerName}
        </p>
        <p className="mt-0.5 text-sm text-mgh-muted">{eventType}</p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="quiet" onClick={onClose} disabled={saving}>
          Keep Order
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={saving}>
          <Trash2 size={16} />
          {saving ? "Deleting..." : "Yes, Cancel Order"}
        </Button>
      </div>
    </Dialog>
  );
}

function AdminActionConfirmationDialog({
  eyebrow,
  title,
  message,
  detail,
  onClose,
}) {
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      size="lg"
      showClose={false}
      dismissible={false}
    >
      <div>
        <p className="flex items-center gap-2 text-label font-semibold uppercase text-mgh-dim">
          <CheckCircle2 size={16} className="text-mgh-ok" />
          {eyebrow}
        </p>
        <DialogTitle asChild>
          <h2 className="mt-2 font-serif text-title font-medium text-mgh-text">
            {title}
          </h2>
        </DialogTitle>
        <DialogDescription asChild>
          <p className="mt-2 text-sm leading-relaxed text-mgh-muted">
            {message}
          </p>
        </DialogDescription>
      </div>

      {detail && (
        <div className="mt-5 rounded-control border border-mgh-line bg-mgh-surface-2 px-4 py-3">
          <p className="text-label font-semibold uppercase text-mgh-dim">
            Summary
          </p>
          <p className="mt-1.5 text-sm font-medium text-mgh-text">{detail}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={onClose} className="w-full sm:w-auto">
          Back to dashboard
        </Button>
      </div>
    </Dialog>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2.5 text-sm">
      <dt className="flex items-center gap-2 text-mgh-dim">
        {Icon && <Icon size={16} aria-hidden="true" className="text-mgh-dim" />}
        {label}
      </dt>
      <dd className="break-words text-mgh-text">{value}</dd>
    </div>
  );
}
