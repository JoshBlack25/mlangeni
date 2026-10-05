"use client";

import { Check, Loader2, Star, X, ArrowUp, ArrowDown } from "lucide-react";
import Monogram from "@/app/components/dashboard/shared/Monogram";
import StarRating from "@/app/components/dashboard/shared/StarRating";
import {
  formatReviewDate,
  initialsFrom,
} from "@/services/testimonialsService";

const statusConfig = {
  pending: { label: "Pending", dot: "bg-yellow-400", text: "text-yellow-400" },
  approved: {
    label: "Approved",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
  },
  rejected: { label: "Rejected", dot: "bg-red-400", text: "text-red-400" },
};

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

export default function TestimonialRow({
  testimonial,
  busy = false,
  onModerate,
  onToggleFeature,
  onMove,
  canMoveUp = false,
  canMoveDown = false,
}) {
  const status = statusConfig[testimonial.status] ?? statusConfig.pending;
  const customer = testimonial.customer;
  const fullName =
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
    "Unnamed customer";
  const isApproved = testimonial.status === "approved";
  const event = eventLabel(testimonial);

  return (
    <article className="rounded-2xl border border-[#1F1F1F] bg-white/5 p-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Monogram
            initials={initialsFrom(customer?.first_name, customer?.last_name)}
            size={40}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{fullName}</p>
            <p className="truncate text-xs text-[#797676]">{customer?.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StarRating value={testimonial.rating} size={12} />
              {event && (
                <span className="text-xs text-[#797676]">{event}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {busy && <Loader2 size={14} className="animate-spin text-[#A0A0A0]" />}
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          <span className={`text-xs font-medium ${status.text}`}>
            {status.label}
          </span>
          {testimonial.featured && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-1 text-[11px] text-[#D4AF37]">
              <Star size={10} className="fill-[#D4AF37]" />
              On homepage
            </span>
          )}
        </div>
      </header>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/80">
        {testimonial.message}
      </p>

      <p className="mt-3 text-xs text-[#797676]">
        Submitted {formatReviewDate(testimonial.created_at)}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {testimonial.status !== "approved" && (
          <>
            {/* Primary action, because approving without featuring leaves the
                homepage empty and the admin wondering why. */}
            <button
              type="button"
              disabled={busy}
              onClick={() => onModerate(testimonial, "approved", true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#c4a032] disabled:opacity-50"
            >
              <Star size={13} />
              Approve &amp; show on site
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onModerate(testimonial, "approved", false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F1F1F] bg-white/5 px-3 py-2 text-xs text-white transition hover:border-emerald-400/50 disabled:opacity-50"
            >
              <Check size={13} />
              Approve only
            </button>
          </>
        )}

        {isApproved && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggleFeature(testimonial)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition disabled:opacity-50 ${
              testimonial.featured
                ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                : "border-[#1F1F1F] bg-white/5 text-white hover:border-[#D4AF37]"
            }`}
          >
            <Star
              size={13}
              className={testimonial.featured ? "fill-[#D4AF37]" : ""}
            />
            {testimonial.featured ? "Remove from homepage" : "Show on homepage"}
          </button>
        )}

        {testimonial.status !== "rejected" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onModerate(testimonial, "rejected", false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F1F1F] bg-white/5 px-3 py-2 text-xs text-red-300 transition hover:border-red-400/50 disabled:opacity-50"
          >
            <X size={13} />
            Reject
          </button>
        )}

        {/* Ordering lives on featured rows only — it has no meaning anywhere
            else, and the arrows are keyboard-reachable for free. */}
        {testimonial.featured && onMove && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={busy || !canMoveUp}
              onClick={() => onMove(testimonial, -1)}
              aria-label={`Move ${fullName}'s review up`}
              className="rounded-lg border border-[#1F1F1F] bg-white/5 p-2 text-white transition hover:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp size={13} />
            </button>
            <button
              type="button"
              disabled={busy || !canMoveDown}
              onClick={() => onMove(testimonial, 1)}
              aria-label={`Move ${fullName}'s review down`}
              className="rounded-lg border border-[#1F1F1F] bg-white/5 p-2 text-white transition hover:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowDown size={13} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
