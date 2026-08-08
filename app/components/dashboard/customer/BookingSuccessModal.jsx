"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardList, LayoutDashboard, X } from "lucide-react";

export default function BookingSuccessModal({
  isOpen,
  title,
  message,
  orderLabel = "Your order has been placed successfully.",
  dashboardHref = "/dashboard/customer",
  ordersHref = "/dashboard/customer/orders",
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#0F0F0F] shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#A0A0A0] transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
        >
          <X size={18} />
        </button>

        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
              <CheckCircle2 size={28} />
            </div>

            <div className="min-w-0 pr-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                Booking complete
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#A0A0A0]">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 text-sm text-[#E8D08E]">
            {orderLabel}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={dashboardHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-[#D4AF37]/30 hover:bg-white/10"
            >
              <LayoutDashboard size={16} className="text-[#D4AF37]" />
              Back to dashboard
            </Link>

            <Link
              href={ordersHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e3bf52]"
            >
              <ClipboardList size={16} />
              View orders
            </Link>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#797676] transition hover:text-[#A0A0A0]"
            >
              Keep browsing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}