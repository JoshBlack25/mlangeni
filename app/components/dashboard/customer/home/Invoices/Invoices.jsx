"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { getRuntimeInvoiceStatus } from "@/app/utils/invoiceDueDates";
import {
  Panel,
  Button,
  StatusBadge,
  Skeleton,
  formatCurrency,
  focusRing,
  EmptyState,
  Money,
} from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

function statusLabel(status) {
  if (status === "sent") return "Due";
  if (status === "overdue") return "Cancelled";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusTone(status) {
  if (status === "overdue") return "danger";
  if (status === "sent") return "warn";
  return "quiet"; // paid, cancelled
}

function getInvoiceTitle(inv) {
  return (
    inv.consultation?.order?.event_type?.event_name ??
    inv.consultation?.note?.slice(0, 40) ??
    "Invoice"
  );
}

export default function Invoices() {
  const router = useRouter();
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchInvoices() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: customerRow, error: customerError } = await supabase
          .from("customer")
          .select("customer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        if (!customerRow) {
          if (mounted) {
            setInvoices([]);
          }
          return;
        }

        const { data, error } = await supabase
          .from("invoices")
          .select(
            `
            invoices_id,
            total_amount,
            status,
            due_date,
            consultation:consultation_id!inner (
              customer_id,
              note,
              order:order_id ( event_type ( event_name ) )
            )
          `,
          )
          .eq("consultation.customer_id", customerRow.customer_id)
          .neq("status", "draft")
          .order("due_date", { ascending: true });

        if (error) {
          throw error;
        }

        if (mounted) {
          setInvoices(
            (data ?? []).map((invoice) => ({
              ...invoice,
              status: getRuntimeInvoiceStatus(invoice),
            })),
          );
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load your invoices.");
          setInvoices([]);
        }
      }
    }

    fetchInvoices();

    return () => {
      mounted = false;
    };
  }, [router]);

  const heading = (
    <h2 className="text-label font-semibold uppercase text-mgh-dim">Invoices</h2>
  );

  if (error) {
    return (
      <Panel className="h-full">
        {heading}
        <p role="alert" className="mt-4 text-sm text-mgh-danger">
          Couldn&apos;t load your invoices
        </p>
        <p className="mt-1 text-caption text-mgh-dim">{error}</p>
      </Panel>
    );
  }

  if (invoices === null) {
    return (
      <Panel className="h-full" aria-busy="true">
        {heading}
        <span className="sr-only" role="status">
          Loading invoices…
        </span>
        <Skeleton className="mt-4 h-8 w-36" />
        <Skeleton className="mt-3 h-4 w-28" />
      </Panel>
    );
  }

  if (invoices.length === 0) {
    return (
      <Panel className="h-full">
        {heading}
        <EmptyState align="start" className="pb-0 pt-5" title="No invoices yet">
          Invoices for your bookings will show up here once they&apos;re issued.
        </EmptyState>
      </Panel>
    );
  }

  const unpaid = invoices.filter((inv) => inv.status === "sent");
  const totalDue = unpaid.reduce(
    (sum, inv) => sum + Number(inv.total_amount),
    0,
  );
  const recentUnpaid = unpaid.slice(0, 2);
  const allSettled = unpaid.length === 0;

  return (
    <Panel className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        {heading}
        {!allSettled && (
          <span className="text-caption tabular-nums text-mgh-muted">
            {unpaid.length} due
          </span>
        )}
      </div>

      {allSettled ? (
        <p className="mt-4 font-serif text-xl text-mgh-text">
          You&apos;re all caught up
        </p>
      ) : (
        <div className="mt-4">
          <p className="font-serif text-[2.5rem] font-medium leading-none text-mgh-gold">
            <Money value={totalDue} />
          </p>
          <p className="mt-2 text-sm text-mgh-muted">
            outstanding across {unpaid.length} invoice
            {unpaid.length === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {!allSettled && (
        <ul className="mt-5 divide-y divide-mgh-line-soft border-t border-mgh-line">
          {recentUnpaid.map((inv) => (
            <li key={inv.invoices_id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-mgh-text">{getInvoiceTitle(inv)}</p>
                <p className="text-caption tabular-nums text-mgh-dim">
                  INV-{inv.invoices_id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm tabular-nums lining-nums text-mgh-text">
                  {formatCurrency(Number(inv.total_amount))}
                </p>
                <StatusBadge
                  className="mt-1"
                  status={inv.status}
                  label={statusLabel(inv.status)}
                  tone={statusTone(inv.status)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-5">
        {allSettled ? (
          <Link
            href="/dashboard/customer/payments"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm text-sm text-mgh-muted transition-colors hover:text-mgh-text",
              focusRing,
            )}
          >
            View all invoices
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ) : (
          <Button href="/dashboard/customer/payments" variant="primary" className="w-full">
            Pay Now
          </Button>
        )}
      </div>
    </Panel>
  );
}
