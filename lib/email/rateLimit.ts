/**
 * Naive in-memory rate limiter.
 *
 * Per serverless instance and reset on every cold start, so this is a speed
 * bump against accidental double-submits and casual abuse — not a control.
 * If abuse becomes real, move the counter into Postgres or Upstash.
 */

type Entry = { count: number; timestamp: number };

const buckets = new Map<string, Map<string, Entry>>();

export function isRateLimited(
  scope: string,
  key: string,
  { limit = 3, windowMs = 60_000 } = {},
): boolean {
  if (!buckets.has(scope)) buckets.set(scope, new Map());
  const bucket = buckets.get(scope)!;

  const now = Date.now();
  const entry = bucket.get(key);

  if (!entry || now - entry.timestamp > windowMs) {
    bucket.set(key, { count: 1, timestamp: now });
    return false;
  }

  if (entry.count >= limit) return true;

  entry.count += 1;
  return false;
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
