"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  Trash2,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";

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

function statusLabel(status) {
  if (!status) return "Requested";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
              href="/dashboard/admin/consultations"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#A0A0A0] transition hover:text-[#D4AF37]"
            >
              <ArrowLeft size={16} />
              Back to consultations
            </Link>

            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <CalendarCheck size={17} />
              <span>Consultation Request</span>
            </div>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              {loading ? "Loading request" : fullName}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Review the submitted order and prepare the in-person meeting
              details for the customer.
            </p>
          </div>

          <div className="border-l-2 border-[#D4AF37] bg-white/[0.03] px-4 py-3 text-sm text-[#D4AF37]">
            {getReference(consultation?.consultations_id)}{" "}
            {statusLabel(consultation?.status)}
          </div>
        </motion.div>

        {loading ? (
          <div className="mt-10 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="h-64 animate-pulse rounded-2xl border border-[#1F1F1F] bg-white/5" />
            <div className="h-64 animate-pulse rounded-2xl border border-[#1F1F1F] bg-white/5" />
          </div>
        ) : loadError ? (
          <div className="mt-10 flex min-h-64 flex-col items-center justify-center border border-red-400/20 bg-red-400/5 px-6 text-center">
            <p className="text-sm font-semibold text-red-300">
              We could not load this consultation
            </p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#A0A0A0]">
              {loadError}
            </p>
          </div>
        ) : !consultation ? (
          <div className="mt-10 flex min-h-64 flex-col items-center justify-center border border-white/10 bg-white/5 px-6 text-center">
            <ClipboardList className="text-[#D4AF37]" size={28} />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Consultation not found
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#A0A0A0]">
              This consultation request is no longer available.
            </p>
          </div>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]"
            >
              <InfoPanel
                icon={UserRound}
                eyebrow="Customer"
                title="Customer Details"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField
                    label="First Name"
                    value={customer?.first_name || "First name pending"}
                  />
                  <DetailField
                    label="Last Name"
                    value={customer?.last_name || "Last name pending"}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <ContactRow
                    icon={Mail}
                    label="Email"
                    value={customer?.email || "Email pending"}
                  />
                  <ContactRow
                    icon={Phone}
                    label="Phone"
                    value={customer?.phone_number || "Phone pending"}
                  />
                </div>
              </InfoPanel>

              <InfoPanel
                icon={ClipboardList}
                eyebrow="Order"
                title="Submitted Event Details"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DetailField label="Event Type" value={eventType} />
                  <DetailField label="Guest Count" value={guestCount} />
                  <DetailField
                    label="Event Date"
                    value={formatDate(order?.event_date)}
                  />
                  <DetailField
                    label="Event Time"
                    value={`${formatTime(order?.start_time)} - ${formatTime(
                      order?.end_time,
                    )}`}
                  />
                  <DetailField label="Order Total" value={totalPrice} />
                  <DetailField
                    label="Order Status"
                    value={statusLabel(order?.status)}
                  />
                </div>

                <div className="mt-4 flex items-center gap-2 border border-white/10 bg-[#0A0A0A]/50 px-4 py-3 text-sm text-[#A0A0A0]">
                  <MapPin size={16} className="text-[#D4AF37]" />
                  <span>{order?.event_location || "Event location pending"}</span>
                </div>
              </InfoPanel>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="mt-6 rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md"
            >
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Ordered Items
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Customer Menu Selection
                  </h2>
                </div>
                <div className="inline-flex rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                  <UtensilsCrossed size={21} />
                </div>
              </div>

              {orderItems.length === 0 ? (
                <div className="border border-white/10 bg-[#0A0A0A]/50 px-4 py-6 text-sm text-[#A0A0A0]">
                  No menu items were found for this order yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#0A0A0A]/50 p-4 md:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-[#797676]">
                          {item.note}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-[#D4AF37] md:text-right">
                        <p>Qty {item.quantity}</p>
                        {item.price !== null && item.price !== undefined && (
                          <p className="mt-1 text-xs text-[#A0A0A0]">
                            {currency.format(Number(item.price))}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {consultation.note && (
                <div className="mt-5 border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#D4AF37]">
                    Customer Notes
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#A0A0A0]">
                    {consultation.note}
                  </p>
                </div>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.22 }}
              className="mt-6 rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md"
            >
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
                    Meeting
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Schedule In-Person Meeting
                  </h2>
                </div>
                <div className="inline-flex rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                  <CalendarDays size={21} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#A0A0A0]">
                    Select Date
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {meetingDates.map((meetingDate) => {
                      const active = selectedMeetingDate === meetingDate.value;

                      return (
                        <button
                          key={meetingDate.value}
                          type="button"
                          onClick={() =>
                            setSelectedMeetingDate(meetingDate.value)
                          }
                          className={`border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] ${
                            active
                              ? "border-[#D4AF37] bg-[#D4AF37]/10"
                              : "border-white/10 bg-[#0A0A0A]/50 hover:border-[#D4AF37]/50"
                          }`}
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-[#797676]">
                            {meetingDate.day}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-white">
                            {meetingDate.date}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <InputField
                    id="meeting-date"
                    label="Custom Date"
                    type="date"
                    value={selectedMeetingDate}
                    onChange={(event) =>
                      setSelectedMeetingDate(event.target.value)
                    }
                    className="mt-5"
                  />
                </div>

                <div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      id="meeting-time"
                      label="Meeting Time"
                      type="time"
                      value={meetingTime}
                      onChange={(event) => setMeetingTime(event.target.value)}
                    />
                    <InputField
                      id="meeting-location"
                      label="Meeting Location"
                      placeholder="Office or venue address"
                      value={meetingLocation}
                      onChange={(event) =>
                        setMeetingLocation(event.target.value)
                      }
                    />
                  </div>

                  <div className="mt-5">
                    <label
                      htmlFor="meeting-notes"
                      className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
                    >
                      Notes To Customer
                    </label>
                    <textarea
                      id="meeting-notes"
                      rows={5}
                      value={meetingNotes}
                      onChange={(event) => setMeetingNotes(event.target.value)}
                      placeholder="Add notes about what the customer should bring, what will be discussed, or where to meet..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#4F4F4F] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            {(actionError || actionMessage) && (
              <div
                className={`mt-5 border px-4 py-4 text-sm ${
                  actionError
                    ? "border-red-400/20 bg-red-400/5 text-red-300"
                    : "border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37]"
                }`}
              >
                {actionError || actionMessage}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28 }}
              className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                disabled={Boolean(savingAction)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-red-400/40 px-5 text-sm font-semibold text-red-400 transition hover:border-red-400 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={16} />
                {savingAction === "cancel" ? "Cancelling..." : "Cancel Event"}
              </button>
              <button
                type="button"
                onClick={handleScheduleMeeting}
                disabled={Boolean(savingAction)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={16} />
                {savingAction === "schedule"
                  ? "Scheduling..."
                  : "Schedule Meeting"}
              </button>
            </motion.div>
          </>
        )}
      </div>

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
    </main>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg border border-[#2A2A2A] bg-[#101010] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="border-b border-white/10 pb-5">
          <p className="text-xs uppercase tracking-[0.22em] text-red-400">
            Cancel Order
          </p>
          <h2
            id="cancel-order-title"
            className="mt-3 font-serif text-2xl font-medium text-white"
          >
            Are you sure you want to cancel this order?
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#A0A0A0]">
            This will permanently delete the consultation and the order from the
            database. This action cannot be undone.
          </p>
        </div>

        <div className="mt-5 border border-white/10 bg-[#0A0A0A]/60 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[#797676]">
            Order Summary
          </p>
          <p className="mt-2 text-sm font-medium text-white">{customerName}</p>
          <p className="mt-1 text-sm text-[#A0A0A0]">{eventType}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 px-5 text-sm font-semibold text-[#A0A0A0] transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-400/50 bg-red-400/10 px-5 text-sm font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} />
            {saving ? "Deleting..." : "Yes, Cancel Order"}
          </button>
        </div>
      </motion.div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-action-confirmation-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-xl border border-[#2A2A2A] bg-[#101010] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <div className="p-6 md:p-8">
          <div className="border-l-2 border-[#D4AF37] pl-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
              <CheckCircle2 size={16} />
              {eyebrow}
            </p>
            <h2
              id="admin-action-confirmation-title"
              className="mt-3 font-serif text-3xl font-medium text-white"
            >
              {title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#A0A0A0]">{message}</p>
          </div>

          {detail && (
            <div className="mt-6 border border-white/10 bg-[#0A0A0A]/60 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#797676]">
                Summary
              </p>
              <p className="mt-2 text-sm font-medium text-white">{detail}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#D4AF37] px-5 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]"
            >
              Back to dashboard
            </button>
          </div>
        </div>

        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </motion.section>
    </div>
  );
}

function InfoPanel({ icon: Icon, eyebrow, title, children }) {
  return (
    <section className="rounded-2xl border border-[#1F1F1F] bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        </div>
        <div className="inline-flex rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
          <Icon size={21} />
        </div>
      </div>
      {children}
    </section>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="border border-white/10 bg-[#0A0A0A]/50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[#797676]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value }) {
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

function InputField({
  id,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  className = "",
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#A0A0A0]"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded-xl border border-white/10 bg-[#101010] px-4 text-sm text-white outline-none transition placeholder:text-[#4F4F4F] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
      />
    </div>
  );
}
