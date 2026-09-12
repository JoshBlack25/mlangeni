/**
 * Email configuration.
 *
 * Everything is env-driven with dev-safe fallbacks, so the routes run in a
 * fresh checkout without edits.
 *
 * ── Sandbox mode ────────────────────────────────────────────────────────
 * Without a verified domain, Resend only lets you send FROM
 * `onboarding@resend.dev` and only TO the address that owns the Resend
 * account. Anything else comes back 403. So while `MGH_FROM_EMAIL` is unset
 * we treat `MGH_ADMIN_EMAIL` as that one deliverable inbox and redirect
 * customer-facing mail to it, clearly labelled, instead of firing sends that
 * are guaranteed to bounce. Set MGH_FROM_EMAIL once a domain is verified and
 * everything switches to real delivery with no other change.
 */

export type EmailConfig = {
  /** Sender, RFC-5322 formatted: `Name <address>`. */
  from: string;
  /** Who gets booking notifications. */
  adminTo: string[];
  replyTo?: string;
  /** Used to build dashboard deep-links; links are omitted when empty. */
  siteUrl: string;
  /** False when RESEND_API_KEY is missing — callers should skip sending. */
  enabled: boolean;
  /** True while on Resend's sandbox sender (no verified domain). */
  sandbox: boolean;
  /**
   * The only address Resend will actually deliver to in sandbox mode.
   * Customer mail is redirected here so the templates can still be reviewed.
   */
  sandboxInbox: string;
};

const SANDBOX_FROM = "Mlangeni Grand Hospitality <onboarding@resend.dev>";
const FALLBACK_ADMIN = "hello@mlangeni.co.za";

function parseRecipients(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getEmailConfig(): EmailConfig {
  const from = process.env.MGH_FROM_EMAIL?.trim() || SANDBOX_FROM;
  const parsed = parseRecipients(process.env.MGH_ADMIN_EMAIL);
  const adminTo = parsed.length > 0 ? parsed : [FALLBACK_ADMIN];
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  const sandbox = from.includes("resend.dev");

  return {
    from,
    // Sandbox delivers to exactly one address, so extra admin recipients
    // would 403 the whole send. Narrow to the first.
    adminTo: sandbox ? adminTo.slice(0, 1) : adminTo,
    replyTo: process.env.MGH_REPLY_TO?.trim() || undefined,
    siteUrl,
    enabled: Boolean(process.env.RESEND_API_KEY),
    sandbox,
    sandboxInbox: adminTo[0],
  };
}

export const BRAND = {
  name: "Mlangeni Grand Hospitality",
  location: "Cape Town, South Africa",
  email: "hello@mlangeni.co.za",
} as const;
