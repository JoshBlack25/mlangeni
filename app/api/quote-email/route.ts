import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

import { getEmailConfig } from "@/lib/email/config";
import { deliverEmail } from "@/lib/email/send";
import { clientIp, isRateLimited } from "@/lib/email/rateLimit";
import { validateQuotePayload } from "@/lib/email/validateQuote";
import {
  adminQuoteSubject,
  customerQuoteSubject,
  renderAdminQuoteEmail,
  renderAdminQuoteText,
  renderCustomerQuoteEmail,
  renderCustomerQuoteText,
} from "@/lib/email/quoteTemplates";

/**
 * Sends the two menu-builder quote emails.
 *
 * Auth note: `services/supabaseClient.ts` is a plain browser client that keeps
 * its session in localStorage, and there's no root middleware refreshing an
 * auth cookie — so the caller must pass its access token in the Authorization
 * header. We then verify the order actually belongs to that user (RLS does the
 * work), which is what stops this route being an open spam relay.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://hzifwowfenglxigvpalb.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export async function POST(req: Request) {
  try {
    if (isRateLimited("quote-email", clientIp(req), { limit: 5, windowMs: 60_000 })) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait before trying again." },
        { status: 429 },
      );
    }

    const config = getEmailConfig();
    if (!config.enabled) {
      console.warn("[quote-email] RESEND_API_KEY is not set; skipping send.");
      return NextResponse.json(
        { ok: false, error: "Email is not configured on this environment." },
        { status: 503 },
      );
    }

    // ── Who is calling ───────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization") ?? "";
    if (!/^Bearer\s+\S+/i.test(authHeader)) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // ── Payload ──────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    const result = validateQuotePayload(body);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid request", fields: result.errors },
        { status: 400 },
      );
    }
    const payload = result.payload;

    // ── Does this order belong to the caller? RLS answers that for us. ────
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("order_id")
      .eq("order_id", payload.orderId)
      .maybeSingle();

    if (orderErr) {
      console.error("[quote-email] order lookup failed:", orderErr.message);
      return NextResponse.json(
        { ok: false, error: "Could not verify the order" },
        { status: 500 },
      );
    }
    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found for this account" },
        { status: 403 },
      );
    }

    // ── Send. Neither failure is fatal to the caller. ─────────────────────
    const resend = new Resend(process.env.RESEND_API_KEY);

    const [admin, customer] = await Promise.all([
      deliverEmail(
        resend,
        {
          to: config.adminTo,
          subject: adminQuoteSubject(payload),
          html: renderAdminQuoteEmail(payload, config),
          text: renderAdminQuoteText(payload),
          replyTo: payload.customer.email,
        },
        config,
        "admin quote",
      ),
      deliverEmail(
        resend,
        {
          to: payload.customer.email,
          subject: customerQuoteSubject(payload),
          html: renderCustomerQuoteEmail(payload, config),
          text: renderCustomerQuoteText(payload),
          replyTo: config.replyTo,
          // Without a verified domain this would 403; send it to the sandbox
          // inbox instead, labelled, so the template is still reviewable.
          redirectInSandbox: true,
        },
        config,
        "customer quote",
      ),
    ]);

    return NextResponse.json({ ok: true, admin, customer, sandbox: config.sandbox });
  } catch (error) {
    console.error("[quote-email] unexpected failure:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to send email" },
      { status: 500 },
    );
  }
}
