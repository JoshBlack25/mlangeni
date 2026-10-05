import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type GmailConfig = {
  from: string;
  adminTo: string[];
  replyTo?: string;
  /** False when GMAIL_USER / GMAIL_APP_PASSWORD are missing. */
  enabled: boolean;
};

export type GmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export type GmailResult = { ok: true } | { ok: false; error: string };

function parseRecipients(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getGmailConfig(): GmailConfig {
  const user = process.env.GMAIL_USER?.trim() ?? "";
  const pass = process.env.GMAIL_APP_PASSWORD ?? "";
  const admin = parseRecipients(process.env.MGH_ADMIN_EMAIL);

  return {
    // Gmail rewrites the sender to the authenticated account anyway,
    // so the address here must be GMAIL_USER.
    from: `Mlangeni Grand Hospitality <${user}>`,
    adminTo: admin.length > 0 ? admin : user ? [user] : [],
    replyTo: process.env.MGH_REPLY_TO?.trim() || undefined,
    enabled: Boolean(user && pass),
  };
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      // Fail in seconds, not minutes, if the connection stalls.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      auth: {
        user: process.env.GMAIL_USER!.trim(),
        // App passwords are shown with spaces; Gmail accepts them without.
        pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s+/g, ""),
      },
    });
  }
  return transporter;
}

/** Never throws; failures are logged and returned so one bad send can't sink the other. */
export async function deliverGmail(
  message: GmailMessage,
): Promise<GmailResult> {
  const config = getGmailConfig();
  const started = Date.now();
  try {
    await getTransporter().sendMail({
      from: config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      replyTo: message.replyTo,
    });
    console.log(`[gmail] sent in ${Date.now() - started}ms`);
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(
      `[gmail] send failed after ${Date.now() - started}ms:`,
      error,
    );
    return { ok: false, error };
  }
}
