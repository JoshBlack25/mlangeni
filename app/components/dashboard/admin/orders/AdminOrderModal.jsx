"use client"

import { useState } from "react"
import {
  Button,
  Dialog,
  DialogTitle,
  Field,
  Input,
  StatusBadge,
  Textarea,
  formatCurrency,
  formatDate,
} from "@/app/components/dashboard/ui"
import {supabase} from "@/services/supabaseClient"
import { Blank } from "@/app/components/dashboard/ui";

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

    setShowConsultForm(false);
    setMeetingDate("");
    setNote("");
    onConsultCreated?.();

    // Non-blocking: notify the customer a consultation has been scheduled.
    supabase
      .from("customer")
      .select("user_id")
      .eq("customer_id", order.customer_id)
      .single()
      .then(({ data: customerRow }) => {
        if (!customerRow?.user_id) return;
        return supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          return supabase.from("notifications").insert({
            user_id: customerRow.user_id,
            sender_id: user.id,
            category: "consultation",
            title: "Consultation Scheduled",
            message:
              "A consultation has been scheduled for your booking. Our team will be in touch with the meeting details.",
            link_url: "/dashboard/customer/enquiry",
          });
        });
      })
      .catch((err) => console.error("Consultation notification failed:", err));
    }
  const customerName = [order.customer?.first_name, order.customer?.last_name]
    .filter(Boolean)
    .join(" ");

  const facts = [
    {
      label: "Customer",
      value: (
        <>
          {customerName || <Blank />}
          {order.customer?.email && (
            <span className="block text-mgh-muted">{order.customer.email}</span>
          )}
        </>
      ),
    },
    { label: "Date", value: formatDate(order.event_date) },
    {
      label: "Time",
      value: (
        <span className="tabular-nums">
          {order.start_time} - {order.end_time}
        </span>
      ),
    },
    { label: "Location", value: order.event_location || <Blank /> },
    { label: "Status", value: <StatusBadge status={order.status} /> },
    {
      label: "Total",
      value: (
        <span className="tabular-nums">
          {formatCurrency(Number(order.total_price || 0))}
        </span>
      ),
    },
  ];

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      size="md"
      dismissible={!saving}
      describe={false}
    >
        <div className="pr-10">
            <p className="text-caption tabular-nums text-mgh-dim">
              Order #{order.order_id}
            </p>
            <DialogTitle asChild>
              <h2 className="mt-1 font-serif text-title font-medium text-mgh-text">
                {order.event_type?.event_name ?? "Event booking"}
              </h2>
            </DialogTitle>
        </div>

        <dl className="mt-5 divide-y divide-mgh-line-soft border-y border-mgh-line-soft text-sm">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3 py-2.5"
            >
              <dt className="text-label font-semibold uppercase text-mgh-dim">
                {fact.label}
              </dt>
              <dd className="min-w-0 break-words text-mgh-text">{fact.value}</dd>
            </div>
          ))}
        </dl>

        {!showConsultForm ? (
          <Button
            variant="primary"
            onClick={() => setShowConsultForm(true)}
            className="mt-6 w-full sm:w-auto sm:self-end"
          >
            Consult
          </Button>
        ) : (
          <form onSubmit={handleConsult} className="mt-6 flex flex-col gap-4">
            <Field label="Meeting date & time">
              <Input
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
            </Field>
            <Field label="Note">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </Field>
            {error && (
              <p role="alert" className="text-sm text-mgh-danger">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="quiet"
                onClick={() => setShowConsultForm(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {saving ? "Scheduling..." : "Schedule Consultation"}
              </Button>
            </div>
          </form>
        )}
    </Dialog>
  );

}
