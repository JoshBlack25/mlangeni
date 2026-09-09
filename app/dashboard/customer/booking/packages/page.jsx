"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import BookingSuccessModal from "@/app/components/dashboard/customer/BookingSuccessModal";
import { PackageCalendar } from "@/app/components/PackageCalendar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/app/components/package/carousel";
import "@/app/globals.css";
import {
  getActiveBookingMessage,
  getActiveCustomerBooking,
  getAdvanceBookingMessage,
  getCustomerForUser,
  getMinimumEventDate,
  isBeforeMinimumEventDate,
} from "@/app/utils/customerBookingRules";

export default function Packages() {
  const router = useRouter();

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
          `
          )
          .order("name"),
        supabase.from("event_type").select("event_id, event_name").order("event_name"),
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
      (sum, pmi) => sum + (pmi.menu_item?.price ?? 0),//note: pmi loop variable stands for premade menu item
      0
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

    const selectedMenu = premadeMenus.find((m) => m.premade_menu_id === selectedMenuId);
    const total = menuTotal(selectedMenu);

    const { data: order, error: orderError } = await supabase.from("orders").insert({
      customer_id: orderCustomerId,
      event_type_id: eventTypeId,
      premade_menu_id: selectedMenuId,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      event_location: eventLocation,
      total_price: total,
    }).select("order_id").single();

    if (orderError) {
      setSubmitting(false);

      if (orderError.code === "23P01") {
        setError("That date and time is already booked. Please pick a different slot.");
      } else {
        setError(orderError.message);
      }
      return;
    }

    const { error: consultationError } = await supabase.from("consultations").insert({
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

    setSuccess(`Package request submitted using "${selectedMenu.name}". Total: R${total.toFixed(2)}`);
    setShowSuccessModal(true);
    setSelectedMenuId(null);
    setEventTypeId("");
    setEventDate("");
    setEventLocation("");
  }

  if (checkingAuth || loadingData) {
    return (
    <div className="mgh-menu">
    <div className="mgh-menu-page">
      <div className="mgh-spinner-wrap">
        <div className="mgh-spinner"></div>
        <p>Loading menu...</p>
      </div>
    </div>
  </div>
    );
  }

  if (activeBooking) {
    return (
      <div className="mgh-menu">
        <div className="mgh-menu-page">
          <h1>Active Booking In Progress</h1>
          <div className="mgh-menu-line"></div>
          <div className="mgh-menu-card selected">
            <p>{getActiveBookingMessage(activeBooking)}</p>
            <button
              type="button"
              className="mgh-menu-submit-btn"
              onClick={() => router.push("/dashboard/customer/orders")}
            >
              VIEW MY BOOKINGS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mgh-menu">
      <div className="mgh-menu-page">
        <h1>Choose a Package</h1>
        <div className="mgh-menu-line"></div>

        {premadeMenus.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.7)" }}>
            No premade menus available yet.
          </p>
        )}

        <Carousel className="mgh-menu-carousel">
          <CarouselContent>
          {premadeMenus.map((menu) => {
            const items = menu.premade_menu_items ?? [];
            const isSelected = selectedMenuId === menu.premade_menu_id;

            return (
              <CarouselItem
                key={menu.premade_menu_id}>
                <div className={`mgh-menu-card${isSelected ? " selected" : ""}`}
                onClick={() => setSelectedMenuId(menu.premade_menu_id)}
              >
                <h3>{menu.name}</h3>
                <p>{menu.description}</p>

                <ul>
                  {items.map((pmi, i) => (
                    <li key={i}>
                      {pmi.menu_item?.name} - R{pmi.menu_item?.price?.toFixed(2)}
                      {pmi.menu_item?.is_alcoholic && " (alcoholic)"}
                    </li>
                  ))}
                </ul>

                <strong>Total: R{menuTotal(menu).toFixed(2)}</strong>
              </div>
              </CarouselItem>
            );
          })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext/>
        </Carousel>

        <h2>Event Details</h2>
        <form className="mgh-menu-form" onSubmit={handleSubmit}>
          <div>
            <div className="mgh-menu-label">Event Type</div>
            <div className="mgh-menu-input-box">
              <select value={eventTypeId} onChange={(e) => setEventTypeId(e.target.value)}>
                <option value="">Select an event type</option>
                {eventTypes.map((et) => (
                  <option key={et.event_id} value={et.event_id}>
                    {et.event_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mgh-menu-label">Event Date</div>
            <PackageCalendar
              value={eventDate ? new Date(eventDate) : undefined}//setting up eventDate value
              minDate={minimumEventDate}
              onChange={(selectedDate)=>{
                if(selectedDate){
                  const yyyy = selectedDate.getFullYear();
                  const mm = String(selectedDate.getMonth() +1).padStart(2,"0");
                  const dd = String(selectedDate.getDate()).padStart(2,"0");
                  setEventDate(`${yyyy}-${mm}-${dd}`);
                }
              }}
              />
            {/* <div className="mgh-menu-input-box">
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div> */}
          </div>

          <div>
            <div className="mgh-menu-label">Start Time</div>
            <div className="mgh-menu-input-box">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mgh-menu-label">End Time</div>
            <div className="mgh-menu-input-box">
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mgh-menu-label">Event Location</div>
            <div className="mgh-menu-input-box">
              <input
                type="text"
                placeholder="Venue or address"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="mgh-menu-submit-btn" disabled={submitting || Boolean(activeBooking)}>
            {submitting ? "SUBMITTING..." : "SUBMIT ORDER REQUEST"}
          </button>
        </form>

        {error && <p className="mgh-menu-error">{error}</p>}
        {success && <p className="mgh-menu-success">{success}</p>}
      </div>

      <BookingSuccessModal
        isOpen={showSuccessModal}
        title="Your package request is in"
        message="You can head back to your dashboard or open your orders page to review the booking request you just submitted."
        orderLabel={success || "Your booking has been submitted."}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
