/**
 * Rejects browser requests sent from another website.
 *
 * Browsers always attach `Origin` to a cross-site POST, so a mismatch means
 * some other page is trying to drive this endpoint (CSRF, or using our mail
 * sender as a relay). Requests with no Origin — curl, server-to-server — are
 * not browsers acting for a visitor and fall through to the rate limiter.
 */
export function isCrossSiteRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
