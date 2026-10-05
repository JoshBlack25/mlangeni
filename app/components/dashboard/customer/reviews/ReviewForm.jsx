"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Send } from "lucide-react";
import StarRating from "@/app/components/dashboard/shared/StarRating";

const inputStyles =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-[#797676] outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]";

// Mirrors testimonials_message_check in db/005, so the form can say what is
// wrong before the database has to.
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

/**
 * Writes a review, or edits one that is still pending.
 *
 * When `initial` is supplied the form is in edit mode: rating and message are
 * prefilled and the event cannot be changed, because repointing a review at a
 * different event would make the approved text describe the wrong occasion.
 */
export default function ReviewForm({
  orders,
  initial = null,
  onSubmit,
  onCancel,
  submitting = false,
  error = null,
}) {
  const editing = Boolean(initial);

  const [orderId, setOrderId] = useState(
    initial?.order_id ?? orders[0]?.order_id ?? "",
  );
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [message, setMessage] = useState(initial?.message ?? "");

  const trimmed = message.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MESSAGE_MIN;
  const tooLong = trimmed.length > MESSAGE_MAX;
  const canSubmit =
    !submitting &&
    rating > 0 &&
    trimmed.length >= MESSAGE_MIN &&
    !tooLong &&
    (editing || Boolean(orderId));

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ orderId, rating, message: trimmed });
  }

  const selectedOrder = orders.find((o) => o.order_id === orderId);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <h2 className="text-lg font-semibold text-white">
        {editing ? "Edit your review" : "Leave a review"}
      </h2>
      <p className="mt-1 text-sm text-[#A0A0A0]">
        {editing
          ? "You can change this until one of our team has looked at it."
          : "Tell other guests how it went. We read every one before it goes on the site."}
      </p>

      {/* Which event */}
      <div className="mt-6">
        <label
          htmlFor="review-order"
          className="mb-2 block text-sm font-medium text-white"
        >
          Which event?
        </label>

        {editing ? (
          <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#A0A0A0]">
            {initial.orderLabel ?? "Your event"}
          </p>
        ) : orders.length === 1 ? (
          <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
            {selectedOrder?.label}
          </p>
        ) : (
          <div className="relative">
            <select
              id="review-order"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className={`${inputStyles} appearance-none pr-10`}
            >
              {orders.map((order) => (
                <option
                  key={order.order_id}
                  value={order.order_id}
                  className="bg-[#0F0F0F]"
                >
                  {order.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]"
            />
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mt-6">
        <span className="mb-2 block text-sm font-medium text-white">
          Your rating
        </span>
        <StarRating
          value={rating}
          onChange={setRating}
          size={30}
          label="Your rating"
        />
      </div>

      {/* Message */}
      <div className="mt-6">
        <label
          htmlFor="review-message"
          className="mb-2 block text-sm font-medium text-white"
        >
          Your review
        </label>
        <textarea
          id="review-message"
          rows={5}
          value={message}
          maxLength={MESSAGE_MAX + 200}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What did we get right? What should other guests know?"
          className={`${inputStyles} resize-y`}
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={tooShort ? "text-amber-400" : "text-[#797676]"}>
            {tooShort
              ? `A little more — at least ${MESSAGE_MIN} characters.`
              : " "}
          </span>
          <span className={tooLong ? "text-red-400" : "text-[#797676]"}>
            {trimmed.length}/{MESSAGE_MAX}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#c4a032] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {editing ? "Save changes" : "Submit review"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-5 py-3 text-sm text-[#A0A0A0] transition hover:border-white/30 hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
