/**
 * Consultation Chat email notification (David Sepkitt).
 *
 * Sent every time an admin or a customer sends a chat message, so the other
 * side knows a message is waiting. Uses the same black and gold palette as the
 * other Mlangeni emails, with the business logo at the top, who the message is
 * from, and the message itself.
 *
 * Table-based with inline styles so it renders the same in Gmail, Outlook and
 * Apple Mail.
 */

import { FONT_STACK, PALETTE, sanitize } from "./theme";
import { BRAND } from "./config";

const WIDTH = 600;

export type ChatMessageEmailOptions = {
  /** Full name of the person who sent the message. */
  senderName: string;
  /** True when the sender is an admin, so the email reads "from the Mlangeni team". */
  senderIsAdmin: boolean;
  /** The chat message, exactly as it was sent. */
  body: string;
  /** When the message was sent (ISO string or Date). */
  sentAt?: string | Date;
  /** Absolute link to the conversation in the dashboard. */
  conversationUrl: string;
  /** Absolute URL of the business logo. */
  logoUrl: string;
};

function formatSentAt(value?: string | Date): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });
}

/** Keeps line breaks from the chat while escaping everything else. */
function messageHtml(body: string): string {
  return sanitize(body).replace(/\r?\n/g, "<br />");
}

export function chatMessageEmail(opts: ChatMessageEmailOptions): {
  subject: string;
  html: string;
} {
  const { senderName, senderIsAdmin, body, sentAt, conversationUrl, logoUrl } =
    opts;
  const fromLabel = senderIsAdmin
    ? `${senderName} (Mlangeni team)`
    : `${senderName} (customer)`;
  const sentLabel = formatSentAt(sentAt);
  const subject = senderIsAdmin
    ? `New message from ${senderName} at Mlangeni`
    : `New message from ${senderName}`;
  const preheader = `${senderName}: ${body.slice(0, 90)}`;
  const goldBar = `<tr><td style="height:2px;line-height:2px;font-size:0;background-color:${PALETTE.gold};" bgcolor="${PALETTE.gold}">&nbsp;</td></tr>`;
  const label = (text: string) =>
    `<p style="margin:0 0 6px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${PALETTE.gold};font-weight:bold;">${sanitize(text)}</p>`;

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark" />
<title>${sanitize(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PALETTE.bg};font-family:${FONT_STACK};" bgcolor="${PALETTE.bg}">
<div style="display:none;font-size:1px;color:${PALETTE.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${sanitize(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PALETTE.bg};" bgcolor="${PALETTE.bg}">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${WIDTH}" style="width:100%;max-width:${WIDTH}px;background-color:${PALETTE.surface};border:1px solid ${PALETTE.line};" bgcolor="${PALETTE.surface}">
  ${goldBar}
  <tr>
    <td align="center" style="padding:32px 44px 8px;">
      <img src="${sanitize(logoUrl)}" width="150" alt="${sanitize(BRAND.name)}" style="display:block;width:150px;max-width:150px;height:auto;border:0;outline:none;text-decoration:none;" />
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:16px 44px 28px;border-bottom:1px solid ${PALETTE.line};">
      <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:${PALETTE.gold};font-weight:bold;">New Chat Message</p>
      <h1 style="margin:0;font-size:24px;line-height:1.25;color:${PALETTE.text};font-weight:normal;">You have received a new message</h1>
      <p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:${PALETTE.textDim};">${sanitize(senderName)} sent you a message in your Mlangeni Consultation Chat.</p>
    </td>
  </tr>
  <tr>
    <td style="padding:30px 44px 8px;">
      ${label("From")}
      <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:${PALETTE.text};">${sanitize(fromLabel)}</p>
      ${sentLabel ? `${label("Sent")}<p style="margin:0 0 22px;font-size:14px;line-height:1.5;color:${PALETTE.textMuted};">${sanitize(sentLabel)}</p>` : ""}
      ${label("Message")}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:18px 20px;border:1px solid ${PALETTE.line};border-left:3px solid ${PALETTE.gold};background-color:${PALETTE.bg};font-size:14px;line-height:1.7;color:${PALETTE.textMuted};" bgcolor="${PALETTE.bg}">${messageHtml(body)}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:28px 44px 36px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" bgcolor="${PALETTE.gold}" style="background-color:${PALETTE.gold};border:1px solid ${PALETTE.gold};">
          <a href="${sanitize(conversationUrl)}" style="display:inline-block;padding:14px 30px;font-family:${FONT_STACK};font-size:10px;font-weight:bold;letter-spacing:0.25em;text-transform:uppercase;text-decoration:none;color:${PALETTE.goldInk};">Reply in your dashboard</a>
        </td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:22px 44px;border-top:1px solid ${PALETTE.line};background-color:${PALETTE.bg};" bgcolor="${PALETTE.bg}">
      <p style="margin:0 0 10px;font-size:11px;line-height:1.6;color:${PALETTE.textFaint};">Please reply from your dashboard so the whole conversation stays together.</p>
      <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${PALETTE.textGhost};">${sanitize(BRAND.name)} &nbsp;·&nbsp; ${sanitize(BRAND.location)}</p>
    </td>
  </tr>
  ${goldBar}
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}
