import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  PAYMENT_FAILURE_CANCELLATION_REASON,
  isInvoicePastDue,
} from "@/app/utils/invoiceDueDates";
import { PAYFAST_MIN_AMOUNT, getPayFastConfig } from "@/lib/payfast/config";
import { signCheckout, type PayFastEntry } from "@/lib/payfast/signature";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/services/supabaseConfig";

/**
 * Customer → PayFast hand-off.
 *
 * The browser asks for a checkout for one invoice; we answer with the signed
 * field list it must POST to PayFast. Everything that matters is decided here,
 * not in the browser:
 *
 *   - WHO is paying comes from the Supabase access token, verified by Supabase.
 *   - WHAT they owe is `invoices.total_amount`, read through the caller's own
 *     RLS-scoped client — so a customer can only ever start checkout for their
 *     own invoice, and cannot name their own price.
 *
 * The browser's session lives in localStorage (see services/supabaseClient.ts),
 * not cookies, so the token arrives as an `Authorization: Bearer` header.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clip = (value: string, max: number) => value.slice(0, max);

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  const config = getPayFastConfig();
  if (!config) {
    console.error("[payfast/checkout] PAYFAST_MERCHANT_ID/KEY are not set.");
    return fail("Online payment is not configured yet.", 503);
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return fail("Please sign in to pay an invoice.", 401);

  const body = await req.json().catch(() => null);
  const invoiceId = typeof body?.invoiceId === "string" ? body.invoiceId : "";
  if (!UUID_RE.test(invoiceId)) return fail("Invalid invoice.", 400);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) return fail("Your session has expired. Please sign in again.", 401);

  const { data: customerRow } = await supabase
    .from("customer")
    .select("customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!customerRow) return fail("No customer profile found for this account.", 403);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select(
      `
      invoices_id,
      total_amount,
      status,
      due_date,
      consultation:consultation_id!inner (
        customer_id,
        customer:customer_id ( first_name, last_name, email ),
        order:order_id ( order_id, event_type ( event_name ) )
      )
    `,
    )
    .eq("invoices_id", invoiceId)
    .eq("consultation.customer_id", customerRow.customer_id)
    .maybeSingle();

  if (invoiceError) {
    console.error("[payfast/checkout] invoice lookup failed:", invoiceError.message);
    return fail("Unable to load this invoice right now.", 500);
  }
  if (!invoice) return fail("Invoice not found.", 404);

  if (invoice.status === "paid") return fail("This invoice has already been paid.", 409);
  if (invoice.status !== "sent") return fail("This invoice is not open for payment.", 409);
  if (isInvoicePastDue(invoice)) {
    return fail(PAYMENT_FAILURE_CANCELLATION_REASON, 409);
  }

  const total = Number(invoice.total_amount);
  if (!Number.isFinite(total) || total < PAYFAST_MIN_AMOUNT) {
    return fail(
      `PayFast needs an amount of at least R${PAYFAST_MIN_AMOUNT.toFixed(2)}.`,
      422,
    );
  }

  // The select above has no generated types, so state the shape we asked for.
  const consultation = invoice.consultation as unknown as {
    customer?: { first_name?: string; last_name?: string; email?: string };
    order?: { order_id?: string; event_type?: { event_name?: string } };
  } | null;
  const customer = consultation?.customer ?? {};
  const order = consultation?.order ?? {};
  const eventName = order.event_type?.event_name ?? "Event";
  const reference = `INV-${invoice.invoices_id.slice(0, 8).toUpperCase()}`;
  const orderNumber = order.order_id
    ? `ORD-${String(order.order_id).slice(0, 8).toUpperCase()}`
    : "";

  // Return/cancel go back to wherever the customer is browsing from, so their
  // localStorage session is still there on return. The ITN URL is separate:
  // PayFast calls it server-to-server, so it must be publicly reachable.
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const paymentsPage = `${origin}/dashboard/customer/payments`;
  const email = typeof customer.email === "string" ? customer.email.trim() : "";

  // Order is part of the signature — the browser must post them as listed.
  const unsigned: PayFastEntry[] = [
    ["merchant_id", config.merchantId],
    ["merchant_key", config.merchantKey],
    ["return_url", `${paymentsPage}?payfast=success&invoice=${invoice.invoices_id}`],
    ["cancel_url", `${paymentsPage}?payfast=cancelled&invoice=${invoice.invoices_id}`],
    ["notify_url", config.notifyUrl || `${origin}/api/payfast/notify`],
    ["name_first", clip(String(customer.first_name ?? ""), 100)],
    ["name_last", clip(String(customer.last_name ?? ""), 100)],
    ["email_address", EMAIL_RE.test(email) ? clip(email, 100) : ""],
    ["m_payment_id", invoice.invoices_id],
    ["amount", total.toFixed(2)],
    ["item_name", clip(`Invoice ${reference} - ${eventName}`, 100)],
    ["item_description", clip([eventName, orderNumber].filter(Boolean).join(" - "), 255)],
  ];

  const { entries, signature } = signCheckout(unsigned, config.passphrase);

  return NextResponse.json({
    action: config.processUrl,
    fields: [...entries, ["signature", signature]],
  });
}
