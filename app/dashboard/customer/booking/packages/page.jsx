"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useNotifications } from "@/app/components/dashboard/shared/notifications/hooks/useNotifications";
import BookingSuccessModal from "@/app/components/dashboard/customer/BookingSuccessModal";
import { PackageCalendar } from "@/app/components/PackageCalendar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/app/components/package/carousel";
import {
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  Select,
  Skeleton,
  focusRing,
  formatCurrency,
} from "@/app/components/dashboard/ui";
import { EASE } from "@/app/components/dashboard/shared/motion";
import { cn } from "@/lib/utils";
import {
  getActiveBookingMessage,
  getActiveCustomerBooking,
  getAdvanceBookingMessage,
  getCustomerForUser,
  getMinimumEventDate,
  isBeforeMinimumEventDate,
} from "@/app/utils/customerBookingRules";

// Carousel arrows sit under the cards (not in the gutter) so nothing
// overflows on phones.
const carouselNavClass =
  "static size-10 rounded-control border-mgh-line-strong bg-mgh-surface text-mgh-text hover:bg-mgh-surface-2 hover:text-mgh-text dark:bg-mgh-surface dark:hover:bg-mgh-surface-2";

export default function Packages() {
  const router = useRouter();
  const { notifyAllAdmins } = useNotifications();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const [premadeMenus, setPremadeMenus] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);

  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [eventTypeId, setEventTypeId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [eventLocation, setEventLocation] = useState("");
  const [numberOfGuest, setNumberOfGuest] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const minimumEventDate = getMinimumEventDate();

  useEffect(() => {
    let mounted = true;

    async function checkAuthAndBooking() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        const customer = await getCustomerForUser(supabase, user.id);
        const booking = customer
          ? await getActiveCustomerBooking(supabase, customer.customer_id)
          : null;

        if (mounted) {
          setCustomerId(customer?.customer_id ?? null);
          setActiveBooking(booking);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to check your booking availability.");
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuthAndBooking();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return;

    async function loadData() {
      setLoadingData(true);

      const [menuRes, eventTypeRes] = await Promise.all([
        supabase
          .from("premade_menu")
          .select(
            `
            premade_menu_id,
            name,
            description,
            premade_menu_items (
              menu_item ( item_id, name, price, is_alcoholic )
            )
          `,
          )
          .order("name"),
        supabase
          .from("event_type")
          .select("event_id, event_name")
          .order("event_name"),
      ]);

      if (menuRes.error) setError(menuRes.error.message);
      if (eventTypeRes.error) setError(eventTypeRes.error.message);

      setPremadeMenus(menuRes.data ?? []);
      setEventTypes(eventTypeRes.data ?? []);
      setLoadingData(false);
    }

    loadData();
  }, [checkingAuth]);

  function menuTotal(menu) {
    return (menu.premade_menu_items ?? []).reduce(
      (sum, pmi) => sum + (pmi.menu_item?.price ?? 0), //note: pmi loop variable stands for premade menu item
      0,
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedMenuId) {
      setError("Pick a menu first.");
      return;
    }
    if (!eventTypeId || !eventDate || !eventLocation) {
      setError("Event type, date, and location are all required.");
      return;
    }
    if (isBeforeMinimumEventDate(eventDate, minimumEventDate)) {
      setError(getAdvanceBookingMessage(minimumEventDate));
      return;
    }
    if (activeBooking) {
      setError(getActiveBookingMessage(activeBooking));
      return;
    }

    setSubmitting(true);
    setShowSuccessModal(false);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("You're not logged in.");
      setSubmitting(false);
      return;
    }

    let orderCustomerId = customerId;

    try {
      if (!orderCustomerId) {
        const customer = await getCustomerForUser(supabase, userData.user.id);
        orderCustomerId = customer?.customer_id;
        setCustomerId(orderCustomerId ?? null);
      }

      if (!orderCustomerId) {
        setError("Could not find your customer profile.");
        setSubmitting(false);
        return;
      }

      const blockingBooking = await getActiveCustomerBooking(
        supabase,
        orderCustomerId,
      );

      if (blockingBooking) {
        setActiveBooking(blockingBooking);
        setError(getActiveBookingMessage(blockingBooking));
        setSubmitting(false);
        return;
      }
    } catch (err) {
      setError(err.message || "Unable to check your booking availability.");
      setSubmitting(false);
      return;
    }

    const selectedMenu = premadeMenus.find(
      (m) => m.premade_menu_id === selectedMenuId,
    );
    const total = menuTotal(selectedMenu);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: orderCustomerId,
        event_type_id: eventTypeId,
        premade_menu_id: selectedMenuId,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        event_location: eventLocation,
        number_of_guest: numberOfGuest,
        total_price: total,
      })
      .select("order_id")
      .single();

    if (orderError) {
      setSubmitting(false);

      if (orderError.code === "23P01") {
        setError(
          "That date and time is already booked. Please pick a different slot.",
        );
      } else {
        setError(orderError.message);
      }
      return;
    }

    const { error: consultationError } = await supabase
      .from("consultations")
      .insert({
        order_id: order.order_id,
        customer_id: orderCustomerId,
        status: "requested",
        meeting_date: `${eventDate}T${startTime || "09:00"}:00`,
        note: "Customer submitted a package order request and is awaiting admin consultation.",
      });

    setSubmitting(false);

    if (consultationError) {
      setError(consultationError.message);
      return;
    }

    notifyAllAdmins({
      category: "order",
      title: "New Package Booking",
      message: `A customer submitted a package booking (${selectedMenu?.name ?? "package"}) for ${eventDate}. Review and schedule a consultation.`,
      linkUrl: "/dashboard/admin/orders",
    }).catch((err) => console.error("Admin package notification failed:", err));

    setSuccess(
      `Package request submitted using "${selectedMenu.name}". Total: R${total.toFixed(2)}`,
    );
    setShowSuccessModal(true);
    setSelectedMenuId(null);
    setEventTypeId("");
    setEventDate("");
    setEventLocation("");
    setNumberOfGuest("");
  }

  if (checkingAuth || loadingData) {
    return (
      <div role="status">
        <span className="sr-only">Loading menu...</span>
        <Skeleton className="h-10 w-64 md:h-12" />
        <div className="mt-8 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-2">
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="hidden h-72 rounded-card md:block" />
        </div>
        <Skeleton className="mt-8 h-80 rounded-card md:mt-10" />
      </div>
    );
  }

  if (activeBooking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE }}
      >
        <PageHeader title="Active Booking In Progress" />
        <Panel className="max-w-2xl">
          <p className="text-body text-mgh-muted">
            {getActiveBookingMessage(activeBooking)}
          </p>
          <Button
            variant="primary"
            className="mt-6 w-full sm:w-auto"
            onClick={() => router.push("/dashboard/customer/orders")}
          >
            View My Bookings
          </Button>
        </Panel>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="flex flex-col gap-8 md:gap-10"
    >
      <PageHeader title="Choose a Package" className="mb-0 md:mb-0" />

      {premadeMenus.length === 0 ? (
        <EmptyState title="No premade menus available yet." align="start" />
      ) : (
        <Carousel aria-label="Packages">
          <CarouselContent>
            {premadeMenus.map((menu) => {
              const items = menu.premade_menu_items ?? [];
              const isSelected = selectedMenuId === menu.premade_menu_id;

              return (
                <CarouselItem
                  key={menu.premade_menu_id}
                  className="md:basis-1/2"
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedMenuId(menu.premade_menu_id)}
                    className={cn(
                      "flex h-full min-h-72 w-full flex-col rounded-card border p-5 text-left md:p-7",
                      "transition-colors duration-(--mgh-dur-fast) ease-mgh",
                      isSelected
                        ? "border-mgh-gold bg-mgh-gold/5"
                        : "border-mgh-line bg-mgh-surface hover:border-mgh-line-strong hover:bg-mgh-surface-2",
                      focusRing,
                    )}
                  >
                    <span className="flex items-start justify-between gap-4">
                      <span className="font-serif text-xl font-medium text-mgh-text md:text-title">
                        {menu.name}
                      </span>
                      {isSelected && (
                        <Check
                          size={16}
                          aria-hidden="true"
                          className="mt-1.5 shrink-0 text-mgh-gold"
                        />
                      )}
                    </span>
                    {menu.description && (
                      <span className="mt-2 block text-sm leading-relaxed text-mgh-muted">
                        {menu.description}
                      </span>
                    )}

                    <ul className="mt-5 flex-1 divide-y divide-mgh-line-soft border-y border-mgh-line-soft">
                      {items.map((pmi, i) => (
                        <li
                          key={i}
                          className="flex items-baseline justify-between gap-4 py-2 text-sm"
                        >
                          <span className="min-w-0 text-mgh-text">
                            {pmi.menu_item?.name}
                            {pmi.menu_item?.is_alcoholic && (
                              <span className="text-mgh-dim"> (alcoholic)</span>
                            )}
                          </span>
                          <span className="shrink-0 tabular-nums text-mgh-muted">
                            {formatCurrency(pmi.menu_item?.price)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <span className="mt-5 flex items-baseline justify-between gap-4">
                      <span className="text-label font-semibold uppercase text-mgh-dim">
                        Total
                      </span>
                      <span className="font-serif text-2xl font-medium tabular-nums text-mgh-text">
                        {formatCurrency(menuTotal(menu))}
                      </span>
                    </span>
                  </button>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <div className="mt-4 flex justify-end gap-2">
            <CarouselPrevious className={carouselNavClass} />
            <CarouselNext className={carouselNavClass} />
          </div>
        </Carousel>
      )}

      <Panel>
        <PanelHeader title="Event Details" />
        <form
          className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          onSubmit={handleSubmit}
          noValidate
        >
          <Field label="Event Type">
            <Select
              value={eventTypeId}
              onChange={(e) => setEventTypeId(e.target.value)}
            >
              <option value="">Select an event type</option>
              {eventTypes.map((et) => (
                <option key={et.event_id} value={et.event_id}>
                  {et.event_name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-col gap-1.5">
            <span
              id="package-event-date-label"
              className="text-[13px] font-medium text-mgh-muted"
            >
              Event Date
            </span>
            <div role="group" aria-labelledby="package-event-date-label">
              <PackageCalendar
                value={eventDate ? new Date(eventDate) : undefined} //setting up eventDate value
                minDate={minimumEventDate}
                onChange={(selectedDate) => {
                  if (selectedDate) {
                    const yyyy = selectedDate.getFullYear();
                    const mm = String(selectedDate.getMonth() + 1).padStart(
                      2,
                      "0",
                    );
                    const dd = String(selectedDate.getDate()).padStart(2, "0");
                    setEventDate(`${yyyy}-${mm}-${dd}`);
                  }
                }}
              />
            </div>
          </div>

          <Field label="Start Time">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Field>

          <Field label="End Time">
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>

          <Field label="Event Location">
            <Input
              type="text"
              placeholder="Venue or address"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
            />
          </Field>

          <Field label="Number Of Guest">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={numberOfGuest}
              onChange={(e) => setNumberOfGuest(e.target.value)}
            />
          </Field>

          <div className="flex flex-col gap-4 border-t border-mgh-line-soft pt-6 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm">
              {error && (
                <p role="alert" className="text-mgh-danger">
                  {error}
                </p>
              )}
              {success && (
                <p role="status" className="text-mgh-ok">
                  {success}
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              loading={submitting}
              disabled={submitting || Boolean(activeBooking)}
            >
              {submitting ? "Submitting..." : "Submit Order Request"}
            </Button>
          </div>
        </form>
      </Panel>

      <BookingSuccessModal
        isOpen={showSuccessModal}
        title="Your package request is in"
        message="You can head back to your dashboard or open your orders page to review the booking request you just submitted."
        orderLabel={success || "Your booking has been submitted."}
        onClose={() => setShowSuccessModal(false)}
      />
    </motion.div>
  );
}
