"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useNotifications } from "@/app/components/dashboard/shared/notifications/hooks/useNotifications";
import RecordPicker from "./RecordPicker";
import CustomerPicker from "./CustomerPicker";

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
    mode === "admin" ? "/dashboard/admin" : "/dashboard/customer";

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
      linkUrl: record?.linkPath ?? null,
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0B0A09] shadow-2xl"
        >
          <div className="absolute left-0 right-0 top-0 h-[2px] bg-[#D4AF37]" />

          <div className="flex items-center justify-between border-b border-[#1F1F1F] px-6 py-5">
            <h2 className="font-serif text-xl text-white">Send Notification</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#666666] transition hover:bg-white/5 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
                <Send size={20} />
              </div>
              <p className="text-white">
                {mode === "admin"
                  ? "Notification sent."
                  : "Sent to all admins."}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSend}
              className="flex flex-col gap-5 px-6 py-6"
            >
              {mode === "admin" && (
                <CustomerPicker
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                />
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#A0A0A0]">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => resetCategory(c.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        category === c.value
                          ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                          : "border-[#1F1F1F] text-[#A0A0A0] hover:border-[#333333]"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

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

              <div>
                <label className="mb-2 block text-sm font-medium text-[#A0A0A0]">
                  Subject
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief subject line"
                  className="w-full rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#A0A0A0]">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Write your message..."
                  className="w-full rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#c4a132] disabled:opacity-60"
              >
                <Send size={16} />
                {sending ? "Sending..." : "Send Notification"}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
