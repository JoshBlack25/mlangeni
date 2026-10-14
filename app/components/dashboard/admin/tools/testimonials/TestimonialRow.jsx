"use client";

import { useState } from "react";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import Monogram from "@/app/components/dashboard/shared/Monogram";
import StarRating from "@/app/components/dashboard/shared/StarRating";
import { Button, StatusBadge, focusRing, Blank } from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";
import {
  formatReviewDate,
  initialsFrom,
} from "@/services/testimonialsService";

function eventLabel(testimonial) {
  const order = testimonial.orders;
  if (!order) return null;
  const name = order.event_type?.event_name ?? "Event";
  const date = order.event_date
    ? new Date(order.event_date).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  return date ? `${name} · ${date}` : name;
}

/**
 * One review. `layout="row"` renders a <tr> for the desktop table;
 * `layout="item"` renders a stacked <li> for phones and tablets.
 */
export default function TestimonialRow({
  testimonial,
  busy = false,
  onModerate,
  onToggleFeature,
  onMove,
  canMoveUp = false,
  canMoveDown = false,
  layout = "row",
}) {
  const [expanded, setExpanded] = useState(false);
  const customer = testimonial.customer;
  const fullName =
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
    "Unnamed customer";
  const isApproved = testimonial.status === "approved";
  const isPending = testimonial.status === "pending";
  const event = eventLabel(testimonial);
  const isLong = (testimonial.message ?? "").length > 140;

  const customerCell = (
    <div className="flex min-w-0 items-center gap-3">
      <Monogram
        initials={initialsFrom(customer?.first_name, customer?.last_name)}
        size={32}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-mgh-text">{fullName}</p>
        <p className="truncate text-caption text-mgh-dim">{customer?.email}</p>
      </div>
    </div>
  );

  const reviewCell = (
    <div className="min-w-0">
      <p
        className={cn(
          "whitespace-pre-line text-sm leading-relaxed text-mgh-muted",
          !expanded && "line-clamp-2",
        )}
      >
        {testimonial.message}
      </p>
      <p className="mt-1 text-caption text-mgh-dim">
        {event && <>{event} · </>}Submitted{" "}
        {formatReviewDate(testimonial.created_at)}
        {isLong && (
          <>
            {" · "}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className={cn(
                "rounded-sm text-mgh-muted underline decoration-mgh-line-strong underline-offset-4 hover:text-mgh-text hover:decoration-mgh-gold",
                focusRing,
              )}
            >
              {expanded ? "Show less" : "Show full review"}
            </button>
          </>
        )}
      </p>
    </div>
  );

  const statusCell = (
    <span className="inline-flex items-center gap-2">
      <StatusBadge status={testimonial.status} />
      {busy && (
        <Loader2
          size={14}
          className="animate-spin text-mgh-dim"
          aria-label="Saving"
        />
      )}
    </span>
  );

  // Featured flag and homepage order. Ordering lives on featured rows only —
  // it has no meaning anywhere else.
  const homepageCell = isApproved ? (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant={testimonial.featured ? "secondary" : "quiet"}
        disabled={busy}
        onClick={() => onToggleFeature(testimonial)}
        aria-pressed={testimonial.featured}
      >
        {testimonial.featured ? "Remove from homepage" : "Show on homepage"}
      </Button>
      {testimonial.featured && onMove && (
        <>
          <Button
            size="sm"
            variant="quiet"
            className="w-8 px-0"
            disabled={busy || !canMoveUp}
            onClick={() => onMove(testimonial, -1)}
            aria-label={`Move ${fullName}'s review up`}
          >
            <ArrowUp size={14} />
          </Button>
          <Button
            size="sm"
            variant="quiet"
            className="w-8 px-0"
            disabled={busy || !canMoveDown}
            onClick={() => onMove(testimonial, 1)}
            aria-label={`Move ${fullName}'s review down`}
          >
            <ArrowDown size={14} />
          </Button>
        </>
      )}
    </div>
  ) : (
    <Blank label="No actions" />
  );

  const actionsCell = (
    <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
      {testimonial.status !== "approved" && (
        <>
          {/* The row's primary action while pending, because approving without
              featuring leaves the homepage empty and the admin wondering why. */}
          <Button
            size="sm"
            variant={isPending ? "primary" : "secondary"}
            disabled={busy}
            onClick={() => onModerate(testimonial, "approved", true)}
          >
            Approve &amp; show on site
          </Button>
          <Button
            size="sm"
            variant="quiet"
            disabled={busy}
            onClick={() => onModerate(testimonial, "approved", false)}
          >
            Approve only
          </Button>
        </>
      )}
      {testimonial.status !== "rejected" && (
        <Button
          size="sm"
          variant="danger"
          disabled={busy}
          onClick={() => onModerate(testimonial, "rejected", false)}
        >
          Reject
        </Button>
      )}
    </div>
  );

  if (layout === "item") {
    return (
      <li className="py-4">
        <div className="flex items-start justify-between gap-3">
          {customerCell}
          {statusCell}
        </div>
        <div className="mt-3">
          <StarRating value={testimonial.rating} size={12} />
        </div>
        <div className="mt-2">{reviewCell}</div>
        {isApproved && <div className="mt-3">{homepageCell}</div>}
        <div className="mt-3">{actionsCell}</div>
      </li>
    );
  }

  return (
    <tr className="border-b border-mgh-line-soft align-top">
      <td className="py-3 pl-0 pr-3">{customerCell}</td>
      <td className="px-3 py-3 pt-4">
        <StarRating value={testimonial.rating} size={12} />
      </td>
      <td className="max-w-md px-3 py-3">{reviewCell}</td>
      <td className="px-3 py-3 pt-4">{statusCell}</td>
      <td className="px-3 py-3">{homepageCell}</td>
      <td className="py-3 pl-3 pr-0">{actionsCell}</td>
    </tr>
  );
}
