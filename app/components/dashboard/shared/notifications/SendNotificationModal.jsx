"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useNotifications } from "@/app/components/dashboard/shared/notifications/hooks/useNotifications";
import { cn } from "@/lib/utils";
import RecordPicker from "./RecordPicker";
import CustomerPicker from "./CustomerPicker";
import { Dialog, Field, Input, Textarea, focusRing } from "@/app/components/dashboard/ui";

const categories = [
  { value: "general", label: "General" },
  { value: "order", label: "Order" },
  { value: "consultation", label: "Consultation" },
  { value: "invoice", label: "Invoice" },
  { value: "enquiry", label: "Enquiry" },
];

export default function SendNotificationModal({
  mode,
  currentUserId,
  onClose,
}) {
  const { sendNotification, notifyAllAdmins } = useNotifications();

  const [selectedCustomer, setSelectedCustomer] = useState(null); // admin mode only
  const [ownCustomerId, setOwnCustomerId] = useState(null); // customer mode only
  const [category, setCategory] = useState("general");
  const [record, setRecord] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const basePath =
    mode === "admin" ? "/dashboard/customer" : "/dashboard/admin";

  // Resolve the logged-in customer's own customer_id once, for their own record pickers
  useEffect(() => {
    if (mode !== "customer" || !currentUserId) return;

    let active = true;

    supabase
      .from("customer")
      .select("customer_id")
      .eq("user_id", currentUserId)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Failed to resolve customer_id:", error);
          return;
        }
        setOwnCustomerId(data?.customer_id ?? null);
      });

    return () => {
      active = false;
    };
  }, [mode, currentUserId]);

  const effectiveCustomerId =
    mode === "admin" ? selectedCustomer?.customer_id : ownCustomerId;
  const effectiveUserId =
    mode === "admin" ? selectedCustomer?.user_id : currentUserId;

  function resetCategory(newCategory) {
    setCategory(newCategory);
    setRecord(null);
  }

  async function handleSend(e) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !message.trim()) {
      setError("Please add a title and message.");
      return;
    }

    if (mode === "admin" && !selectedCustomer) {
      setError("Please select which customer this is about.");
      return;
    }

    setSending(true);

    const payload = {
      category,
      title: title.trim(),
      message: message.trim(),
      linkUrl: record?.linkUrl ?? null,
    };

    const { error: sendError } =
      mode === "admin"
        ? await sendNotification({
            recipientId: selectedCustomer.user_id,
            ...payload,
          })
        : await notifyAllAdmins(payload);

    setSending(false);

    if (sendError) {
      setError(
        typeof sendError === "string"
          ? sendError
          : "Something went wrong sending this. Please try again.",
      );
      return;
    }

    setSent(true);
    setTimeout(() => onClose(), 1200);
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Send Notification"
      size="md"
      dismissible={!sending}
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mgh-gold/10 text-mgh-gold">
            <Send size={20} />
          </div>
          <p className="text-mgh-text">
            {mode === "admin"
              ? "Notification sent."
              : "Sent to all admins."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex flex-col gap-5">
          {mode === "admin" && (
            <CustomerPicker
              value={selectedCustomer}
              onChange={setSelectedCustomer}
            />
          )}

          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium text-mgh-muted">Category</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={category === c.value}
                  onClick={() => resetCategory(c.value)}
                  className={cn(
                    "h-9 rounded-control border px-3 text-sm transition-colors duration-(--mgh-dur-fast)",
                    category === c.value
                      ? "border-mgh-gold/60 bg-mgh-surface-2 text-mgh-text"
                      : "border-mgh-line text-mgh-muted hover:border-mgh-line-strong hover:text-mgh-text",
                    focusRing,
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>

          {category !== "general" && (
            <RecordPicker
              key={category}
              category={category}
              customerId={effectiveCustomerId}
              userId={effectiveUserId}
              basePath={basePath}
              value={record?.id}
              onChange={setRecord}
            />
          )}

          <Field label="Subject">
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief subject line"
            />
          </Field>

          <Field label="Message">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Write your message..."
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm text-mgh-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="flex items-center justify-center gap-2 rounded-lg bg-mgh-gold px-5 py-3 text-sm font-semibold text-mgh-gold-ink transition hover:bg-mgh-gold-hover disabled:opacity-60"
          >
            <Send size={16} />
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </form>
      )}
    </Dialog>
  );
}
