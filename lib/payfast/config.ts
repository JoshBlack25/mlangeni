/**
 * PayFast configuration.
 *
 * The merchant account IS the admin's account: whatever merchant id/key is set
 * here is where a customer's money lands. Today those are PayFast *sandbox*
 * credentials, so no real money moves; swap them for live ones and set
 * PAYFAST_SANDBOX=false to go live.
 *
 * ── Env ─────────────────────────────────────────────────────────────────
 *   PAYFAST_MERCHANT_ID   required
 *   PAYFAST_MERCHANT_KEY  required
 *   PAYFAST_PASSPHRASE    optional. Must match the passphrase set in the
 *                         PayFast dashboard (Settings → Security) — if the
 *                         account has one and this is empty, every signature
 *                         is rejected, and vice versa.
 *   PAYFAST_SANDBOX       "false" for live; anything else (or unset) = sandbox.
 *                         Defaults to sandbox so a missing variable can never
 *                         send traffic to the live gateway.
 *   PAYFAST_NOTIFY_URL    optional full URL for the ITN webhook. PayFast calls
 *                         this server-to-server, so it must be publicly
 *                         reachable — `localhost` is not. Locally, point it at
 *                         a tunnel (ngrok / cloudflared). Defaults to
 *                         `<origin>/api/payfast/notify`.
 */

export type PayFastConfig = {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  sandbox: boolean;
  /** Where the customer's browser is POSTed to pay. */
  processUrl: string;
  /** Server-to-server endpoint that confirms an ITN really came from PayFast. */
  validateUrl: string;
  /** Explicit ITN URL override; empty means derive it from the request origin. */
  notifyUrl: string;
};

const SANDBOX_HOST = "https://sandbox.payfast.co.za";
const LIVE_HOST = "https://www.payfast.co.za";

/** PayFast rejects anything below R5.00. */
export const PAYFAST_MIN_AMOUNT = 5;

/** Returns null when the merchant credentials are not configured. */
export function getPayFastConfig(): PayFastConfig | null {
  const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim();
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY?.trim();

  if (!merchantId || !merchantKey) return null;

  const sandbox = process.env.PAYFAST_SANDBOX?.trim().toLowerCase() !== "false";
  const host = sandbox ? SANDBOX_HOST : LIVE_HOST;

  return {
    merchantId,
    merchantKey,
    passphrase: process.env.PAYFAST_PASSPHRASE?.trim() ?? "",
    sandbox,
    processUrl: `${host}/eng/process`,
    validateUrl: `${host}/eng/query/validate`,
    notifyUrl: process.env.PAYFAST_NOTIFY_URL?.trim() ?? "",
  };
}
