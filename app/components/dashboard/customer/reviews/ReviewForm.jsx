"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import StarRating from "@/app/components/dashboard/shared/StarRating";
import {
  Button,
  Field,
  Panel,
  PanelHeader,
  Select,
  Textarea,
} from "@/app/components/dashboard/ui";

// Matches the label style inside Field, for rows that are not form controls.
const labelClass = "text-[13px] font-medium text-mgh-muted";

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
    <Panel as="form" onSubmit={handleSubmit}>
      <PanelHeader
        title={editing ? "Edit your review" : "Leave a review"}
        description={
          editing
            ? "You can change this until one of our team has looked at it."
            : "Tell other guests how it went. We read every one before it goes on the site."
        }
        className="mb-6"
      />

      <div className="flex flex-col gap-6">
        {/* Which event */}
        {editing || orders.length === 1 ? (
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Which event?</span>
            <p className="text-[15px] text-mgh-text">
              {editing
                ? (initial.orderLabel ?? "Your event")
                : selectedOrder?.label}
            </p>
          </div>
        ) : (
          <Field label="Which event?">
            <Select
              id="review-order"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            >
              {orders.map((order) => (
                <option
                  key={order.order_id}
                  value={order.order_id}
                  className="bg-mgh-surface-2"
                >
                  {order.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {/* Rating */}
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Your rating</span>
          <StarRating
            value={rating}
            onChange={setRating}
            size={30}
            label="Your rating"
          />
        </div>

        {/* Message */}
        <div>
          <Field label="Your review">
            <Textarea
              id="review-message"
              rows={5}
              value={message}
              maxLength={MESSAGE_MAX + 200}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What did we get right? What should other guests know?"
              className="resize-y"
            />
          </Field>
          <div className="mt-2 flex items-center justify-between gap-3 text-caption">
            <span
              aria-live="polite"
              className={tooShort ? "text-mgh-warn" : "text-mgh-dim"}
            >
              {tooShort
                ? `A little more: at least ${MESSAGE_MIN} characters.`
                : " "}
            </span>
            <span
              className={`tabular-nums ${tooLong ? "text-mgh-danger" : "text-mgh-dim"}`}
            >
              {trimmed.length}/{MESSAGE_MAX}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 text-sm text-mgh-danger">
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-2 border-t border-mgh-line-soft pt-6 sm:flex-row sm:items-center">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canSubmit}
          aria-busy={submitting || undefined}
          className="w-full sm:w-auto"
        >
          {submitting ? (
            <Loader2 size={16} aria-hidden="true" className="animate-spin" />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
          {editing ? "Save changes" : "Submit review"}
        </Button>

        {onCancel && (
          <Button
            variant="quiet"
            size="lg"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
      </div>
    </Panel>
  );
}
