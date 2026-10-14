"use client";

import { Pencil, Trash2, Star } from "lucide-react";
import StarRating from "@/app/components/dashboard/shared/StarRating";
import { formatReviewDate } from "@/services/testimonialsService";
import { Button, StatusBadge } from "@/app/components/dashboard/ui";

const statusConfig = {
  pending: { status: "pending", label: "Awaiting review by our team", tone: "warn" },
  approved: { status: "approved", label: "Published", tone: "ok" },
  rejected: { status: "rejected", label: "Not published", tone: "quiet" },
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
    <article className="py-6 first:pt-0 last:pb-0">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-medium text-mgh-text">
            {orderLabel ?? "Your event"}
          </h3>
          <p className="mt-0.5 text-caption text-mgh-dim">
            Submitted {formatReviewDate(review.created_at)}
          </p>
        </div>

        <StatusBadge
          status={status.status}
          label={status.label}
          tone={status.tone}
        />
      </header>

      <StarRating value={review.rating} size={14} className="mt-4" />

      <blockquote className="mt-3 max-w-prose whitespace-pre-line font-serif text-base italic leading-relaxed text-mgh-text">
        {review.message}
      </blockquote>

      {review.featured && review.status === "approved" && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-caption text-mgh-muted">
          <Star size={16} aria-hidden="true" className="text-mgh-dim" />
          Featured on our homepage
        </p>
      )}

      {isRejected && (
        <p className="mt-4 text-sm text-mgh-muted">
          This one wasn&rsquo;t published. You can delete it and write a new one
          for the same event.
        </p>
      )}

      {(isPending || isRejected) && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isPending && (
            <Button size="md" onClick={() => onEdit(review)}>
              <Pencil size={16} aria-hidden="true" />
              Edit
            </Button>
          )}
          <Button variant="danger" size="md" onClick={() => onDelete(review)}>
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </Button>
        </div>
      )}
    </article>
  );
}
