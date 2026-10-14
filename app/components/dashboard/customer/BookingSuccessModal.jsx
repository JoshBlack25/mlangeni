"use client";

import { CheckCircle2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogDescription,
} from "@/app/components/dashboard/ui";

export default function BookingSuccessModal({
  isOpen,
  title,
  message,
  orderLabel = "Your order has been placed successfully.",
  /** Secondary line for caveats — e.g. a confirmation email that didn't send. */
  note,
  dashboardHref = "/dashboard/customer",
  ordersHref = "/dashboard/customer/orders",
  onClose,
}) {
  return (
    <Dialog
      open={Boolean(isOpen)}
      onOpenChange={(o) => {
        if (!o) onClose?.();
      }}
      size="md"
      showClose={Boolean(onClose)}
    >
      <div className="min-w-0 pr-10">
        <p className="flex items-center gap-2 text-label font-semibold uppercase text-mgh-dim">
          <CheckCircle2 size={16} aria-hidden="true" className="text-mgh-ok" />
          Booking complete
        </p>
        <DialogTitle asChild>
          <h2 className="mt-3 font-serif text-title font-medium text-mgh-text">
            {title}
          </h2>
        </DialogTitle>
        <DialogDescription asChild>
          <p className="mt-2 text-sm leading-relaxed text-mgh-muted">
            {message}
          </p>
        </DialogDescription>
      </div>

      <p className="mt-6 border-y border-mgh-line-soft py-4 text-sm text-mgh-text">
        {orderLabel}
      </p>

      {note && (
        <p className="mt-3 text-caption leading-relaxed text-mgh-muted">
          {note}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onClose && (
          <Button variant="quiet" onClick={onClose}>
            Keep browsing
          </Button>
        )}
        <Button variant="secondary" href={dashboardHref}>
          Back to dashboard
        </Button>
        <Button variant="primary" href={ordersHref}>
          View orders
        </Button>
      </div>
    </Dialog>
  );
}