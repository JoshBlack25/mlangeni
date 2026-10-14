import { getPayFastConfig } from "@/lib/payfast/config";
import { verifyItn, type PayFastEntry } from "@/lib/payfast/signature";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PayFast ITN (Instant Transaction Notification) webhook.
 *
 * THIS is what makes an invoice paid — never the browser landing on the
 * return_url, which anyone can type into the address bar. PayFast calls this
 * server-to-server after a payment, and we only believe it after four checks:
 *
 *   1. the MD5 signature matches (proves it was built with our merchant/passphrase)
 *   2. merchant_id is ours
 *   3. PayFast itself confirms the payload is genuine (the /query/validate call)
 *   4. amount_gross equals the invoice total in OUR database
 *
 * Then, idempotently (PayFast retries): record the payment, and on COMPLETE set
 * the invoice to `paid`. The order is deliberately left alone — the admin still
 * presses Approve on /dashboard/admin/invoices to confirm the booking.
 *
 * Returns 200 once handled. A non-200 makes PayFast retry, so transient
 * failures (database, validate call) return 500 and permanent rejections 400.
 *
 * Not done: PayFast also documents checking the caller's IP against its
 * published hostnames. The validate call in step 3 is an equivalent proof of
 * origin, and an IP allow-list breaks behind tunnels/proxies that rewrite it.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PaymentStatus = "pending" | "succeeded" | "failed";

const STATUS_MAP: Record<string, PaymentStatus> = {
  COMPLETE: "succeeded",
  PENDING: "pending",
  FAILED: "failed",
  CANCELLED: "failed",
};

const ok = () => new Response(null, { status: 200 });

function reject(reason: string, status = 400) {
  console.warn(`[payfast/notify] rejected: ${reason}`);
  return new Response(reason, { status });
}

export async function POST(req: Request) {
  const config = getPayFastConfig();
  const admin = createAdminClient();

  if (!config || !admin) {
    console.error(
      "[payfast/notify] missing PAYFAST_MERCHANT_ID/KEY or SUPABASE_SERVICE_ROLE_KEY.",
    );
    return new Response("Not configured", { status: 500 });
  }

  // Parse the raw body, not req.formData(): signature order is the order the
  // fields arrived in, and the validate call needs the exact string back.
  const entries = [...new URLSearchParams(await req.text()).entries()] as PayFastEntry[];
  const data = Object.fromEntries(entries) as Record<string, string>;

  const { valid, paramString } = verifyItn(entries, config.passphrase);
  if (!valid) return reject("bad signature");
  if (data.merchant_id !== config.merchantId) return reject("wrong merchant");

  const invoiceId = data.m_payment_id ?? "";
  const providerPaymentId = data.pf_payment_id ?? "";
  const status = STATUS_MAP[data.payment_status ?? ""];
  if (!UUID_RE.test(invoiceId)) return reject("bad m_payment_id");
  if (!providerPaymentId) return reject("missing pf_payment_id");
  if (!status) return reject(`unknown payment_status "${data.payment_status}"`);

  let confirmation = "";
  try {
    const response = await fetch(config.validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: paramString,
    });
    confirmation = (await response.text()).trim();
  } catch (err) {
    console.error("[payfast/notify] validate call failed:", err);
    return new Response("Validation unavailable", { status: 500 });
  }
  if (confirmation !== "VALID") return reject(`PayFast said "${confirmation}"`);

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .select("invoices_id, total_amount, status")
    .eq("invoices_id", invoiceId)
    .maybeSingle();

  if (invoiceError) {
    console.error("[payfast/notify] invoice lookup failed:", invoiceError.message);
    return new Response("Database error", { status: 500 });
  }
  if (!invoice) return reject("unknown invoice");

  const paid = Number(data.amount_gross);
  if (!Number.isFinite(paid) || Math.abs(paid - Number(invoice.total_amount)) > 0.01) {
    return reject(
      `amount mismatch: paid ${data.amount_gross}, invoice ${invoice.total_amount}`,
    );
  }

  const { error: paymentError } = await admin.from("payments").upsert(
    {
      invoice_id: invoice.invoices_id,
      amount: paid,
      provider: "payfast",
      provider_payment_id: providerPaymentId,
      status,
      date: new Date().toISOString(),
      provider_payload: data,
    },
    { onConflict: "provider_payment_id" },
  );
  if (paymentError) {
    console.error("[payfast/notify] could not record payment:", paymentError.message);
    return new Response("Database error", { status: 500 });
  }

  if (status === "succeeded") {
    if (invoice.status === "sent" || invoice.status === "overdue") {
      const { error: updateError } = await admin
        .from("invoices")
        .update({ status: "paid" })
        .eq("invoices_id", invoice.invoices_id)
        .in("status", ["sent", "overdue"]);

      if (updateError) {
        console.error("[payfast/notify] could not mark invoice paid:", updateError.message);
        return new Response("Database error", { status: 500 });
      }
    } else if (invoice.status !== "paid") {
      // Money arrived for an invoice that was draft/cancelled. Keep the payment
      // row so the admin can see it and refund; don't resurrect the invoice.
      console.warn(
        `[payfast/notify] payment ${providerPaymentId} received for ${invoice.status} invoice ${invoice.invoices_id}`,
      );
    }
  }

  console.info(
    `[payfast/notify] ${data.payment_status} ${data.amount_gross} for invoice ${invoice.invoices_id}`,
  );
  return ok();
}
