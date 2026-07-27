"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Receipt, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { supabase1 } from "@/services/supabaseClient";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

function statusLabel(status) {
  if (status === "sent") return "Due";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusStyles(status) {
  if (status === "overdue") {
    return "border-red-400/40 bg-red-400/10 text-red-400";
  }
  if (status === "sent") {
    return "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]";
  }
  return "border-white/20 bg-white/10 text-[#A0A0A0]"; // paid, cancelled
}

function getInvoiceTitle(inv) {
  return (
    inv.consultation?.order?.event_type?.event_name ??
    inv.consultation?.note?.slice(0, 40) ??
    "Invoice"
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchInvoices() {
      const { data, error } = await supabase1
        .from("invoices")
        .select(
          `
          invoices_id,
          total_amount,
          status,
          due_date,
          consultation:consultation_id (
            note,
            order:order_id ( event_type ( event_name ) )
          )
        `,
        )
        .neq("status", "draft")
        .order("due_date", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setInvoices(data ?? []);
      }
    }

    fetchInvoices();
  }, []);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center backdrop-blur-md">
        <p className="text-sm text-red-400">Couldn&apos;t load your invoices</p>
        <p className="mt-1 text-xs text-[#797676]">{error}</p>
      </div>
    );
  }

  if (invoices === null) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p className="text-sm text-[#797676]">Loading invoices…</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md">
        <Receipt className="mb-4 text-[#D4AF37]" size={26} />
        <h3 className="text-base font-semibold text-white">No invoices yet</h3>
        <p className="mt-2 max-w-[16rem] text-sm text-[#A0A0A0]">
          Invoices for your bookings will show up here once they&apos;re issued.
        </p>
      </div>
    );
  }

  const unpaid = invoices.filter(
    (inv) => inv.status === "sent" || inv.status === "overdue",
  );
  const totalDue = unpaid.reduce(
    (sum, inv) => sum + Number(inv.total_amount),
    0,
  );
  const recentUnpaid = unpaid.slice(0, 2);
  const allSettled = unpaid.length === 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
          Invoices
        </p>

        {!allSettled && (
          <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#D4AF37]">
            {unpaid.length} due
          </span>
        )}
      </div>

      {/* HEADLINE */}
      <div className="px-6 pt-3">
        {allSettled ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-[#D4AF37]" />
            <p className="text-lg font-semibold text-white">
              You&apos;re all caught up
            </p>
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-white">
              {currency.format(totalDue)}
            </p>
            <p className="mt-1 text-sm text-[#A0A0A0]">
              outstanding · {unpaid.length} invoice
              {unpaid.length === 1 ? "" : "s"}
            </p>
          </>
        )}
      </div>

      {/* RECENT UNPAID LIST */}
      {!allSettled && (
        <div className="mt-4 flex-1">
          {recentUnpaid.map((inv) => (
            <div
              key={inv.invoices_id}
              className="flex items-center justify-between gap-3 border-t border-white/5 px-6 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {getInvoiceTitle(inv)}
                </p>
                <p className="text-xs text-[#797676]">
                  INV-{inv.invoices_id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-white">
                  {currency.format(Number(inv.total_amount))}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyles(
                    inv.status,
                  )}`}
                >
                  {statusLabel(inv.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER CTA */}
      {allSettled ? (
        <Link
          href="/dashboard/customer/invoices"
          className="mt-auto flex items-center justify-between border-t border-white/10 px-6 py-3 text-sm font-medium text-[#D4AF37] transition-all duration-300 hover:gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-inset"
        >
          View all invoices
          <ArrowUpRight size={16} />
        </Link>
      ) : (
        <Link
          href="/dashboard/customer/invoices"
          className="mt-auto flex items-center justify-center gap-2 rounded-b-2xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e0bd4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
        >
          Pay Now
        </Link>
      )}
    </div>
  );
}
