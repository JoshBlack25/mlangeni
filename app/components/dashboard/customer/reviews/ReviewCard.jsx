"use client";

import { Pencil, Trash2, Star } from "lucide-react";
import StarRating from "@/app/components/dashboard/shared/StarRating";
import { formatReviewDate } from "@/services/testimonialsService";

const statusConfig = {
  pending: {
    label: "Awaiting review by our team",
    dot: "bg-yellow-400",
    text: "text-yellow-400",
  },
  approved: {
    label: "Published",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
  },
  rejected: {
    label: "Not published",
    dot: "bg-white/40",
    text: "text-[#A0A0A0]",
  },
};

/**
 * One of the customer's own reviews.
 *
 * Editing is offered only while the review is pending, because the RLS policy
 * "customer can edit own pending testimonial" covers nothing else — offering
 * an Edit button on a rejected review would produce a silent no-op. The card
 * says so in a line rather than leaving the customer to discover it.
 */
export default function ReviewCard({ review, orderLabel, onEdit, onDelete }) {
  const status = statusConfig[review.status] ?? statusConfig.pending;
  const isPending = review.status === "pending";
  const isRejected = review.status === "rejected";

  return (
    <article className="rounded-2xl border border-[#1F1F1F] bg-white/5 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">
            {orderLabel ?? "Your event"}
          </p>
          <p className="mt-0.5 text-xs text-[#797676]">
            Submitted {formatReviewDate(review.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          <span className={`text-xs font-medium ${status.text}`}>
            {status.label}
          </span>
        </div>
      </header>

      <StarRating value={review.rating} size={14} className="mt-4" />

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80">
        {review.message}
      </p>

      {review.featured && review.status === "approved" && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs text-[#D4AF37]">
          <Star size={12} className="fill-[#D4AF37]" />
          Featured on our homepage
        </p>
      )}

      {isRejected && (
        <p className="mt-4 text-xs text-[#797676]">
          This one wasn&rsquo;t published. You can delete it and write a new one
          for the same event.
        </p>
      )}

      {(isPending || isRejected) && (
        <div className="mt-5 flex items-center gap-2">
          {isPending && (
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F1F1F] bg-white/5 px-3 py-2 text-xs text-white transition hover:border-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
            >
              <Pencil size={13} />
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(review)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F1F1F] bg-white/5 px-3 py-2 text-xs text-red-300 transition hover:border-red-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
