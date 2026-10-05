/**
 * One place that actually hands mail to Resend.
 *
 * Its job beyond calling the API is sandbox mode: with no verified domain,
 * Resend rejects any recipient that isn't the account owner, so a customer
 * confirmation would 403 every single time. Rather than fire that and log an
 * error, we redirect it to the one deliverable inbox with a banner naming the
 * intended recipient — so the template can still be read and reviewed.
 */

import type { Resend } from "resend";
import type { EmailConfig } from "./config";
import { PALETTE, sanitize } from "./theme";

export type DeliveryStatus = "sent" | "redirected" | "failed" | "skipped";

export type Envelope = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Customer-facing mail gets redirected in sandbox; admin mail does not. */
  redirectInSandbox?: boolean;
};

function sandboxBanner(intendedFor: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PALETTE.gold};" bgcolor="${PALETTE.gold}">
<tr><td align="center" style="padding:12px 20px;font-family:Georgia,serif;font-size:12px;line-height:1.5;color:${PALETTE.goldInk};">
  <strong>Sandbox copy.</strong> In production this would have gone to
  <strong>${sanitize(intendedFor)}</strong>. Verify a domain in Resend and set
  MGH_FROM_EMAIL to send for real.
</td></tr>
</table>`;
}

/** Resend surfaces the sandbox restriction as a 403 on the recipient. */
function isSandboxRestriction(error: unknown): boolean {
  const e = error as { statusCode?: number; name?: string; message?: string };
  return (
    e?.statusCode === 403 ||
    /only send testing emails to your own email address|not allowed to send/i.test(
      String(e?.message ?? ""),
    )
  );
}

export async function deliverEmail(
  resend: Resend,
  envelope: Envelope,
  config: EmailConfig,
  label: string,
): Promise<DeliveryStatus> {
  let { subject, html } = envelope;
  let to = Array.isArray(envelope.to) ? envelope.to : [envelope.to];
  let redirected = false;

  const inbox = config.sandboxInbox.toLowerCase();
  const needsRedirect =
    config.sandbox &&
    envelope.redirectInSandbox &&
    to.some((addr) => addr.toLowerCase() !== inbox);

  if (needsRedirect) {
    const intended = to.join(", ");
    html = html.replace(/(<body[^>]*>)/i, `$1${sandboxBanner(intended)}`);
    subject = `[Sandbox → ${intended}] ${subject}`;
    to = [config.sandboxInbox];
    redirected = true;
  }

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to,
      subject,
      html,
      ...(envelope.text ? { text: envelope.text } : {}),
      ...(envelope.replyTo ? { replyTo: envelope.replyTo } : {}),
    });

    if (error) {
      console.error(`[email] ${label} rejected:`, error);
      if (config.sandbox && isSandboxRestriction(error)) {
        console.error(
          `[email] Resend is in sandbox mode and only delivers to the address ` +
            `that owns the API key. MGH_ADMIN_EMAIL is currently ` +
            `"${config.sandboxInbox}" — set it to your Resend account address, ` +
            `or verify a domain and set MGH_FROM_EMAIL.`,
        );
      }
      return "failed";
    }

    return redirected ? "redirected" : "sent";
  } catch (err) {
    console.error(`[email] ${label} threw:`, err);
    return "failed";
  }
}
