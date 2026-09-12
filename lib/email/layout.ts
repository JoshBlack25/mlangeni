/**
 * Email layout primitives.
 *
 * Everything here is table-based with inline styles and `bgcolor` attributes.
 * That's deliberate: Outlook on Windows renders through the Word engine, which
 * ignores `display:block` on spans and mishandles nested divs — the layout the
 * original enquiry template used. Tables are the only thing every client
 * agrees on.
 */

import { FONT_STACK, PALETTE, sanitize } from "./theme";
import { BRAND } from "./config";

const WIDTH = 600;

export type ShellOptions = {
  /** Hidden preview text — the line shown next to the subject in inboxes. */
  preheader: string;
  eyebrow: string;
  title: string;
  intro?: string;
  bodyHtml: string;
  ctaHtml?: string;
  footerNote?: string;
};

const goldBar = `<tr><td style="height:2px;line-height:2px;font-size:0;background:linear-gradient(to right,#0a0a0a,${PALETTE.gold},#0a0a0a);" bgcolor="${PALETTE.gold}">&nbsp;</td></tr>`;

export function emailShell(opts: ShellOptions): string {
  const {
    preheader,
    eyebrow,
    title,
    intro,
    bodyHtml,
    ctaHtml = "",
    footerNote = "",
  } = opts;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark" />
<title>${sanitize(title)}</title>
<!--[if mso]><style>body,table,td{font-family:Georgia,'Times New Roman',serif !important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${PALETTE.bg};font-family:${FONT_STACK};" bgcolor="${PALETTE.bg}">

<div style="display:none;font-size:1px;color:${PALETTE.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${sanitize(preheader)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PALETTE.bg};" bgcolor="${PALETTE.bg}">
<tr><td align="center" style="padding:32px 12px;">

<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${WIDTH}"><tr><td><![endif]-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${WIDTH}" style="width:100%;max-width:${WIDTH}px;background-color:${PALETTE.surface};border:1px solid ${PALETTE.line};" bgcolor="${PALETTE.surface}">

  ${goldBar}

  <tr>
    <td style="padding:40px 44px 30px;border-bottom:1px solid ${PALETTE.line};">
      <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:${PALETTE.gold};font-weight:bold;">${sanitize(eyebrow)}</p>
      <h1 style="margin:0;font-size:24px;line-height:1.25;color:${PALETTE.text};font-weight:normal;">${sanitize(title)}</h1>
      ${
        intro
          ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:${PALETTE.textDim};">${sanitize(intro)}</p>`
          : ""
      }
    </td>
  </tr>

  <tr><td style="padding:32px 44px;">${bodyHtml}</td></tr>

  ${ctaHtml ? `<tr><td style="padding:0 44px 36px;">${ctaHtml}</td></tr>` : ""}

  <tr>
    <td style="padding:22px 44px;border-top:1px solid ${PALETTE.line};background-color:${PALETTE.bg};" bgcolor="${PALETTE.bg}">
      ${
        footerNote
          ? `<p style="margin:0 0 10px;font-size:11px;line-height:1.6;color:${PALETTE.textFaint};">${sanitize(footerNote)}</p>`
          : ""
      }
      <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${PALETTE.textGhost};">${sanitize(BRAND.name)} &nbsp;·&nbsp; ${sanitize(BRAND.location)}</p>
      <p style="margin:0;font-size:9px;color:${PALETTE.textGhost};">${sanitize(BRAND.email)}</p>
    </td>
  </tr>

  ${goldBar}

</table>
<!--[if mso]></td></tr></table><![endif]-->

</td></tr>
</table>
</body>
</html>`;
}

/** A small-caps section heading inside the body. */
export function sectionTitle(text: string): string {
  return `<p style="margin:0 0 16px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${PALETTE.gold};font-weight:bold;">${sanitize(text)}</p>`;
}

/** Label-over-value rows, stacked with hairline rules. */
export function detailTable(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(({ label, value }, i) => {
      const last = i === rows.length - 1;
      return `<tr>
  <td style="padding:0 0 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${PALETTE.gold};font-weight:bold;">${sanitize(label)}</td>
</tr>
<tr>
  <td style="padding:0 0 ${last ? "0" : "18px"};font-size:14px;line-height:1.5;color:${PALETTE.textMuted};${last ? "" : `border-bottom:1px solid ${PALETTE.line};`}">${sanitize(value)}</td>
</tr>
${last ? "" : `<tr><td style="height:18px;line-height:18px;font-size:0;">&nbsp;</td></tr>`}`;
    })
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${cells}</table>`;
}

export type ItemRow = {
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

/** One priced course: gold header, then Dish / Qty / Unit / Total rows. */
export function courseTable(label: string, rows: ItemRow[]): string {
  const header = `<tr>
  <td colspan="4" style="padding:10px 14px;background-color:${PALETTE.surfaceAlt};border:1px solid ${PALETTE.line};font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${PALETTE.gold};font-weight:bold;" bgcolor="${PALETTE.surfaceAlt}">${sanitize(label)}</td>
</tr>`;

  const body = rows
    .map(
      (r) => `<tr>
  <td style="padding:11px 14px;border-left:1px solid ${PALETTE.line};border-right:1px solid ${PALETTE.line};border-bottom:1px solid ${PALETTE.line};font-size:13px;color:${PALETTE.text};">${sanitize(r.name)}</td>
  <td align="center" style="padding:11px 8px;border-right:1px solid ${PALETTE.line};border-bottom:1px solid ${PALETTE.line};font-size:12px;color:${PALETTE.textDim};white-space:nowrap;">×${sanitize(r.quantity)}</td>
  <td align="right" style="padding:11px 8px;border-right:1px solid ${PALETTE.line};border-bottom:1px solid ${PALETTE.line};font-size:12px;color:${PALETTE.textDim};white-space:nowrap;">${sanitize(r.unitPrice)}</td>
  <td align="right" style="padding:11px 14px;border-right:1px solid ${PALETTE.line};border-bottom:1px solid ${PALETTE.line};font-size:13px;color:${PALETTE.textMuted};white-space:nowrap;">${sanitize(r.lineTotal)}</td>
</tr>`,
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;border-collapse:collapse;">${header}${body}</table>`;
}

export function totalsBlock(
  rows: { label: string; value: string; strong?: boolean }[],
): string {
  const cells = rows
    .map(
      (r) => `<tr>
  <td align="right" style="padding:6px 14px 6px 0;font-size:${r.strong ? "11px" : "10px"};letter-spacing:0.15em;text-transform:uppercase;color:${r.strong ? PALETTE.gold : PALETTE.textFaint};font-weight:${r.strong ? "bold" : "normal"};">${sanitize(r.label)}</td>
  <td align="right" style="padding:6px 0;font-size:${r.strong ? "18px" : "13px"};color:${r.strong ? PALETTE.gold : PALETTE.textMuted};white-space:nowrap;font-weight:${r.strong ? "bold" : "normal"};">${sanitize(r.value)}</td>
</tr>`,
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;border-top:1px solid ${PALETTE.gold};">${cells}</table>`;
}

/** A bordered aside — dietary notes, response-time promises. */
export function noticeBox(label: string, body: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
<tr><td style="padding:18px 22px;border:1px solid ${PALETTE.line};background-color:${PALETTE.bg};" bgcolor="${PALETTE.bg}">
  <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${PALETTE.textFaint};">${sanitize(label)}</p>
  <p style="margin:0;font-size:13px;line-height:1.65;color:${PALETTE.textMuted};">${body}</p>
</td></tr>
</table>`;
}

export function orderedSteps(steps: string[]): string {
  const rows = steps
    .map(
      (step, i) => `<tr>
  <td width="28" valign="top" style="padding:0 12px 14px 0;font-size:13px;color:${PALETTE.gold};font-weight:bold;">${i + 1}.</td>
  <td valign="top" style="padding:0 0 14px;font-size:13px;line-height:1.65;color:${PALETTE.textMuted};">${sanitize(step)}</td>
</tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`;
}

/** Bulletproof-ish button. `variant: "ghost"` for the secondary action. */
export function button(
  href: string,
  label: string,
  variant: "solid" | "ghost" = "solid",
): string {
  const solid = variant === "solid";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;margin:0 10px 10px 0;">
<tr><td align="center" bgcolor="${solid ? PALETTE.gold : PALETTE.bg}" style="background-color:${solid ? PALETTE.gold : PALETTE.bg};border:1px solid ${PALETTE.gold};">
  <a href="${sanitize(href)}" style="display:inline-block;padding:14px 30px;font-family:${FONT_STACK};font-size:9px;font-weight:bold;letter-spacing:0.25em;text-transform:uppercase;text-decoration:none;color:${solid ? PALETTE.goldInk : PALETTE.gold};">${sanitize(label)}</a>
</td></tr>
</table>`;
}
