"use client"

import { useState } from "react"
import { X } from "lucide-react"
import {supabase} from "@/services/supabaseClient"

const currency = new Intl.NumberFormat("en-ZA",{
    style: "currency",
    currency: "ZAR",
});

export default function AdminOrderModal ({order, onClose, onConsultCreated}){
    const [showConsultForm, setShowConsultForm] = useState(false);
    const [meetingDate, setMeetingDate] = useState("");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    if(!order) return null;

    async function handleConsult(e){
        e.preventDefault();
        setError(null);

    if(!meetingDate || !note){
        setError("Meeting date and note are both required.");
        return;
    }

    setSaving(true);

    const {data : userData} = await supabase.auth.getUser();

    const {data : adminRow, error: adminError } = await supabase.
    from("admin")
    .select("admin_id")
    .eq("user_id", userData.user.id)
    .single();

    if(adminError || !adminRow){
        setError("Could not verify admin account");
        setSaving(false);
        return;
    }

    const {error: insertError} = await supabase.from("consultations").insert({
        order_id: order.order_id,
        customer_id: order.customer_id,
        admin_id: adminRow.admin_id,
        meeting_date: new Date(meetingDate).toISOString(),
        note,
    });

    setSaving(false);

    if(insertError){
        setError(insertError.message);
        return;
    }

    setShowConsultForm(form);
    setMeetingDate("");
    setNote("");
    onConsultCreated?.();


    }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
              Order #{order.order_id}
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {order.event_type?.event_name ?? "Event booking"}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#A0A0A0] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-2 text-sm text-[#A0A0A0]">
          <p>
            <span className="text-white">Customer:</span>{" "}
            {order.customer?.first_name} {order.customer?.last_name} (
            {order.customer?.email})
          </p>
          <p>
            <span className="text-white">Date:</span> {order.event_date}
          </p>
          <p>
            <span className="text-white">Time:</span> {order.start_time} –{" "}
            {order.end_time}
          </p>
          <p>
            <span className="text-white">Location:</span> {order.event_location}
          </p>
          <p>
            <span className="text-white">Status:</span> {order.status}
          </p>
          <p>
            <span className="text-white">Total:</span>{" "}
            {currency.format(Number(order.total_price || 0))}
          </p>
        </div>

        {!showConsultForm ? (
          <button
            onClick={() => setShowConsultForm(true)}
            className="mt-6 w-full rounded-lg bg-[#D4AF37] py-2 text-sm font-semibold text-black hover:bg-[#c8a022]"
          >
            Consult
          </button>
        ) : (
          <form onSubmit={handleConsult} className="mt-6 space-y-3">
            <div>
              <label className="text-sm text-[#A0A0A0]">Meeting date & time</label>
              <input
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-[#A0A0A0]">Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[#D4AF37] py-2 text-sm font-semibold text-black hover:bg-[#c8a022] disabled:opacity-50"
            >
              {saving ? "Scheduling..." : "Schedule Consultation"}
            </button>
          </form>
        )}
      </div>
    </div>
  );

}