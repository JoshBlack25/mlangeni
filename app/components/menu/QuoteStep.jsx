"use client";

import { useState } from "react";
import BookingSuccessModal from "@/app/components/dashboard/customer/BookingSuccessModal";
import { supabase } from "@/services/supabaseClient";
import { useMenu } from "./MenuContext";
import { rowDisplayName } from "./constants";
import { Check, Info } from "lucide-react";

export function QuoteStep() {
  const { state, dispatch } = useMenu();
  const [showSend, setShowSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendErrors, setSendErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successSummary, setSuccessSummary] = useState("");

  const categories = [
    { label: "Starters", items: state.selections.starters },
    { label: "Main Courses", items: state.selections.mains },
    { label: "Desserts", items: state.selections.desserts },
    { label: "Beverages", items: state.selections.beverages },
  ].filter((c) => c.items.length > 0);

  const allSelectedItems = [
    ...state.selections.starters,
    ...state.selections.mains,
    ...state.selections.desserts,
    ...state.selections.beverages,
  ];

  const guests = parseInt(state.guests) || 1;

  const validateSend = () => {
    const e = {};
    if (!state.contactName.trim()) e.contactName = "Full Name is required";
    if (!state.authUser?.email) e.contactEmail = "User email missing";
    return e;
  };

  const selectedEventType = state.eventTypes.find(
    (et) => et.event_id === state.eventTypeId,
  );

  const handleSend = async () => {
    const e = validateSend();
    if (Object.keys(e).length > 0) {
      setSendErrors(e);
      return;
    }

    setSending(true);
    setSendError("");

    try {
      let customerId = state.existingCustomer?.customer_id;

      if (!customerId) {
        const fullName = state.contactName.trim();
        const [first_name, ...rest] = fullName.split(/\s+/);
        const last_name = rest.join(" ");

        const { data: newCustomer, error: custErr } = await supabase
          .from("customer")
          .insert({
            user_id: state.authUser.id,
            email: state.authUser.email,
            first_name: first_name || null,
            last_name: last_name || null,
            phone_number: state.contactPhone || null,
          })
          .select("customer_id")
          .single();

        if (custErr) throw new Error(custErr.message);
        customerId = newCustomer.customer_id;
      }

      const total_price = allSelectedItems.reduce(
        (sum, item) => sum + Number(item.price) * guests,
        0,
      );

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          event_type_id: state.eventTypeId,
          status: "pending",
          total_price,
          event_date: state.eventDate,
          event_location: state.eventLocation,
          start_time: state.startTime,
          end_time: state.endTime,
        })
        .select("order_id")
        .single();

      if (orderErr) {
        if (orderErr.code === "23P01" || /overlap/i.test(orderErr.message)) {
          throw new Error(
            "This venue/time slot conflicts with an existing reservation.",
          );
        }
        throw new Error(orderErr.message);
      }

      const cmiRows = allSelectedItems.map((it) => ({
        order_id: order.order_id,
        item_id: it.item_id,
        quantity: guests,
      }));

      if (cmiRows.length > 0) {
        const { error: cmiErr } = await supabase
          .from("customer_menu_items")
          .insert(cmiRows);

        if (cmiErr) throw new Error(cmiErr.message);
      }

      setSuccessSummary(
        `Quote request submitted for ${selectedEventType ? rowDisplayName(selectedEventType, "event_id") : "your event"} with ${guests} guest${guests === 1 ? "" : "s"}.`,
      );
      setShowSuccessModal(true);
      dispatch({ type: "SEND_QUOTE" });
    } catch (err) {
      setSendError(err.message || "An unexpected error occurred.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <BookingSuccessModal
        isOpen={showSuccessModal}
        title="Your menu request is in"
        message="Your custom booking has been submitted. You can return to the dashboard or jump straight to your orders page to review it again."
        orderLabel={successSummary || "Your quote request has been sent."}
        onClose={() => {
          setShowSuccessModal(false);
          dispatch({ type: "RESET" });
        }}
      />

      <div className="mb-8">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-white md:text-4xl">
          Menu & Quote Summary
        </h2>
        <p className="mt-2 text-sm text-[#A0A0A0] md:text-base">
          Review your selection details prior to dispatching your request to
          Mlangeni Grand Hospitality.
        </p>
      </div>

      {/* OVERVIEW METRICS */}
      <div className="mb-8 grid grid-cols-2 gap-4 border border-[#252525] bg-[#111111] p-6 sm:grid-cols-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#666666]">
            Guests
          </span>
          <p className="mt-1 text-base font-medium text-white">
            {guests} People
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#666666]">
            Occasion
          </span>
          <p className="mt-1 text-base font-medium text-white">
            {selectedEventType
              ? rowDisplayName(selectedEventType, "event_id")
              : "Custom Event"}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#666666]">
            Date
          </span>
          <p className="mt-1 text-base font-medium text-white">
            {state.eventDate}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#666666]">
            Time
          </span>
          <p className="mt-1 text-base font-medium text-white">
            {state.startTime} – {state.endTime}
          </p>
        </div>
      </div>

      {/* COURSES RECAP */}
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.label} className="border border-[#252525] bg-[#111111]">
            <div className="border-b border-[#222222] bg-[#161616] px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
              {cat.label}
            </div>
            <div className="divide-y divide-[#222222] px-5">
              {cat.items.map((item) => (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between py-3.5"
                >
                  <span className="text-sm font-medium text-white">
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold text-[#D4AF37]">
                    R{Number(item.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* NOTICE BOX */}
      <div className="mt-6 flex items-start gap-3 border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 text-xs leading-6 text-[#A0A0A0]">
        <Info size={18} className="mt-0.5 flex-shrink-0 text-[#D4AF37]" />
        <span>
          <strong className="text-white">Note:</strong> Submitting this request
          places an order inquiry in our system. Our catering team will contact
          you to confirm pricing adjustments for staff, transport, and special
          arrangements.
        </span>
      </div>

      {/* SEND FORM OR BUTTON */}
      {!showSend ? (
        <div className="mt-10 flex items-center justify-between border-t border-[#222222] pt-6">
          <button
            type="button"
            onClick={() => dispatch({ type: "PREV_STEP" })}
            className="border border-[#333333] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#A0A0A0] transition-colors hover:border-white hover:text-white"
          >
            ← Edit Details
          </button>

          <button
            type="button"
            onClick={() => setShowSend(true)}
            className="border border-[#D4AF37] bg-[#D4AF37] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-black transition-all hover:bg-transparent hover:text-[#D4AF37]"
          >
            Submit Quote Request →
          </button>
        </div>
      ) : (
        <div className="mt-8 border border-[#252525] bg-[#111111] p-6">
          <h3 className="font-serif text-xl font-medium text-white">
            Contact & Submission
          </h3>

          {sendError && (
            <p className="mt-3 border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400">
              {sendError}
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-[#A0A0A0]">
                Full Name *
              </label>
              <input
                type="text"
                value={state.contactName}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONTACT",
                    field: "contactName",
                    payload: e.target.value,
                  })
                }
                className="w-full border border-[#292929] bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
              {sendErrors.contactName && (
                <p className="mt-1 text-xs text-red-400">
                  {sendErrors.contactName}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-[#A0A0A0]">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+27..."
                value={state.contactPhone}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONTACT",
                    field: "contactPhone",
                    payload: e.target.value,
                  })
                }
                className="w-full border border-[#292929] bg-[#161616] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-4">
            <button
              type="button"
              disabled={sending}
              onClick={() => setShowSend(false)}
              className="px-4 py-2 text-xs uppercase text-[#888888] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={handleSend}
              className="border border-[#D4AF37] bg-[#D4AF37] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-black hover:bg-transparent hover:text-[#D4AF37]"
            >
              {sending ? "Sending Request..." : "Confirm & Send Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
