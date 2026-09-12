import { supabase } from "@/services/supabaseClient";

/**
 * Client wrapper for POST /api/quote-email.
 *
 * Never throws. A booking is already saved by the time this runs, so an email
 * problem must not surface as a failed booking — the caller gets a result
 * object and decides whether to mention it.
 */

export type QuoteEmailPayload = {
  orderId: string | number;
  customer: { name: string; email: string; phone?: string };
  event: {
    date: string;
    startTime: string;
    endTime: string;
    typeName?: string;
    location: string;
    guests: number;
    notes?: string;
  };
  items: { name: string; course: string; unitPrice: number; quantity: number }[];
  totals: { perGuest: number; subtotal: number; total: number };
};

/**
 * "redirected" means sandbox mode sent it to the developer inbox instead of
 * the customer — delivered somewhere, but not to the person who booked.
 */
export type DeliveryStatus = "sent" | "redirected" | "failed" | "skipped";

export type QuoteEmailResult = {
  ok: boolean;
  admin?: DeliveryStatus;
  customer?: DeliveryStatus;
  /** True while Resend has no verified domain for this project. */
  sandbox?: boolean;
  reason?: string;
};

export async function sendQuoteEmail(
  payload: QuoteEmailPayload,
  { timeoutMs = 8000 }: { timeoutMs?: number } = {},
): Promise<QuoteEmailResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return { ok: false, reason: "Not signed in" };

    const response = await fetch("/api/quote-email", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        reason: json?.error || `Request failed (${response.status})`,
      };
    }

    return {
      ok: true,
      admin: json?.admin,
      customer: json?.customer,
      sandbox: json?.sandbox,
    };
  } catch (error: unknown) {
    const reason =
      error instanceof DOMException && error.name === "AbortError"
        ? "Timed out"
        : error instanceof Error
          ? error.message
          : "Unknown error";
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}
