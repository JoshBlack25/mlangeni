/**
 * The two emails sent when a customer submits a menu-builder quote:
 * an itemised notification to the kitchen, and a confirmation to the customer.
 */

import { BRAND, type EmailConfig } from "./config";
import {
  button,
  courseTable,
  detailTable,
  emailShell,
  noticeBox,
  orderedSteps,
  sectionTitle,
  totalsBlock,
  type ItemRow,
} from "./layout";
import {
  PALETTE,
  firstName,
  formatDateLong,
  formatDateShort,
  formatTimeRange,
  formatZAR,
  sanitize,
} from "./theme";

export type QuoteItem = {
  name: string;
  course: string;
  unitPrice: number;
  quantity: number;
};

export type QuotePayload = {
  orderId: string | number;
  customer: { name: string; email: string; phone?: string };
  event: {
    date: string; // yyyy-MM-dd
    startTime: string;
    endTime: string;
    typeName?: string;
    location: string;
    guests: number;
    notes?: string;
  };
  items: QuoteItem[];
  totals: { perGuest: number; subtotal: number; total: number };
};

const PRICING_CAVEAT =
  "This estimate covers food and beverage only. Staffing, transport, equipment hire and special arrangements are quoted separately once we've confirmed the details with you.";

/** Group items by course, preserving the order they arrive in. */
function groupByCourse(items: QuoteItem[]): { label: string; rows: ItemRow[] }[] {
  const order: string[] = [];
  const byCourse = new Map<string, ItemRow[]>();

  for (const item of items) {
    const course = item.course || "Menu";
    if (!byCourse.has(course)) {
      byCourse.set(course, []);
      order.push(course);
    }
    byCourse.get(course)!.push({
      name: item.name,
      quantity: item.quantity,
      unitPrice: formatZAR(item.unitPrice),
      lineTotal: formatZAR(item.unitPrice * item.quantity),
    });
  }

  return order.map((label) => ({ label, rows: byCourse.get(label)! }));
}

function menuHtml(payload: QuotePayload): string {
  const courses = groupByCourse(payload.items);
  if (courses.length === 0) {
    return `<p style="margin:0;font-size:13px;color:${PALETTE.textDim};">No menu items were selected.</p>`;
  }

  return (
    courses.map((c) => courseTable(c.label, c.rows)).join("") +
    totalsBlock([
      { label: "Per guest", value: formatZAR(payload.totals.perGuest) },
      { label: `Guests`, value: `× ${payload.event.guests}` },
      { label: "Estimated total", value: formatZAR(payload.totals.total), strong: true },
    ])
  );
}

function eventRows(payload: QuotePayload, includeReference: boolean) {
  const rows = [
    { label: "Event Date", value: formatDateLong(payload.event.date) },
    {
      label: "Time",
      value: formatTimeRange(payload.event.startTime, payload.event.endTime),
    },
    { label: "Occasion", value: payload.event.typeName || "Custom event" },
    { label: "Venue", value: payload.event.location },
    { label: "Guests", value: String(payload.event.guests) },
  ];
  if (includeReference) {
    rows.unshift({ label: "Reference", value: `#${payload.orderId}` });
  }
  return rows;
}

/* ── Admin notification ─────────────────────────────────────────────────── */

export function adminQuoteSubject(payload: QuotePayload): string {
  return `New menu quote · ${payload.customer.name} · ${formatDateShort(
    payload.event.date,
  )} · ${payload.event.guests} guests`;
}

export function renderAdminQuoteEmail(
  payload: QuotePayload,
  config: EmailConfig,
): string {
  const body = [
    sectionTitle("Booking"),
    detailTable(eventRows(payload, true)),

    `<div style="height:34px;line-height:34px;font-size:0;">&nbsp;</div>`,
    sectionTitle("Itemised menu"),
    menuHtml(payload),

    payload.event.notes
      ? `<div style="height:28px;line-height:28px;font-size:0;">&nbsp;</div>` +
        sectionTitle("Special requests") +
        noticeBox("From the customer", sanitize(payload.event.notes))
      : "",

    `<div style="height:34px;line-height:34px;font-size:0;">&nbsp;</div>`,
    sectionTitle("Contact"),
    detailTable([
      { label: "Name", value: payload.customer.name },
      { label: "Email", value: payload.customer.email },
      { label: "Phone", value: payload.customer.phone || "Not provided" },
    ]),
  ].join("");

  const cta = [
    config.siteUrl
      ? button(`${config.siteUrl}/dashboard/admin/orders`, "Open in dashboard")
      : "",
    button(`mailto:${payload.customer.email}`, "Reply to customer", "ghost"),
  ].join("");

  return emailShell({
    preheader: `${payload.customer.name} · ${payload.event.guests} guests · ${formatDateShort(payload.event.date)} · ${formatZAR(payload.totals.total)}`,
    eyebrow: "New Menu Quote Request",
    title: payload.customer.name,
    intro: `A custom menu was submitted through the Interactive Menu Builder for ${formatDateLong(payload.event.date)}.`,
    bodyHtml: body,
    ctaHtml: cta,
    footerNote: "Replying to this email goes straight to the customer.",
  });
}

export function renderAdminQuoteText(payload: QuotePayload): string {
  const lines = [
    `NEW MENU QUOTE REQUEST`,
    ``,
    `Reference:  #${payload.orderId}`,
    `Customer:   ${payload.customer.name} <${payload.customer.email}>`,
    `Phone:      ${payload.customer.phone || "Not provided"}`,
    ``,
    `Date:       ${formatDateLong(payload.event.date)}`,
    `Time:       ${formatTimeRange(payload.event.startTime, payload.event.endTime)}`,
    `Occasion:   ${payload.event.typeName || "Custom event"}`,
    `Venue:      ${payload.event.location}`,
    `Guests:     ${payload.event.guests}`,
    ``,
    `MENU`,
  ];

  for (const course of groupByCourse(payload.items)) {
    lines.push(``, course.label.toUpperCase());
    for (const row of course.rows) {
      lines.push(`  ${row.name} — ${row.unitPrice} x${row.quantity} = ${row.lineTotal}`);
    }
  }

  lines.push(
    ``,
    `Per guest:        ${formatZAR(payload.totals.perGuest)}`,
    `Estimated total:  ${formatZAR(payload.totals.total)}`,
  );

  if (payload.event.notes) {
    lines.push(``, `SPECIAL REQUESTS`, payload.event.notes);
  }

  lines.push(``, PRICING_CAVEAT, ``, `${BRAND.name} · ${BRAND.location}`);
  return lines.join("\n");
}

/* ── Customer confirmation ──────────────────────────────────────────────── */

export function customerQuoteSubject(payload: QuotePayload): string {
  return `We've received your menu request, ${firstName(payload.customer.name)}`;
}

export function renderCustomerQuoteEmail(
  payload: QuotePayload,
  config: EmailConfig,
): string {
  const body = [
    sectionTitle("Your event"),
    detailTable(eventRows(payload, true)),

    `<div style="height:34px;line-height:34px;font-size:0;">&nbsp;</div>`,
    sectionTitle("Your menu"),
    menuHtml(payload),
    `<div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>`,
    noticeBox("About this estimate", sanitize(PRICING_CAVEAT)),

    payload.event.notes
      ? `<div style="height:28px;line-height:28px;font-size:0;">&nbsp;</div>` +
        sectionTitle("Your notes to the kitchen") +
        noticeBox("Noted", sanitize(payload.event.notes))
      : "",

    `<div style="height:34px;line-height:34px;font-size:0;">&nbsp;</div>`,
    sectionTitle("What happens next"),
    orderedSteps([
      "One of our culinary directors reviews your menu and event details.",
      "We come back to you within 24 hours with a firm, itemised quote — including staffing and transport.",
      "Once you're happy, we confirm the date and your booking is locked in.",
    ]),
  ].join("");

  const cta = config.siteUrl
    ? button(`${config.siteUrl}/dashboard/customer/orders`, "View your request")
    : "";

  return emailShell({
    preheader: `Reference #${payload.orderId} — we'll be in touch within 24 hours.`,
    eyebrow: "Quote Request Received",
    title: `Thank you, ${firstName(payload.customer.name)}.`,
    intro:
      "We have your menu and event details. Nothing is charged yet — this is a request, and we'll confirm everything with you first.",
    bodyHtml: body,
    ctaHtml: cta,
    footerNote: `Quote reference #${payload.orderId}. Reply to this email if anything needs changing.`,
  });
}

export function renderCustomerQuoteText(payload: QuotePayload): string {
  const lines = [
    `Thank you, ${firstName(payload.customer.name)}.`,
    ``,
    `We have your menu and event details. Nothing is charged yet — we'll confirm everything with you first.`,
    ``,
    `Reference:  #${payload.orderId}`,
    `Date:       ${formatDateLong(payload.event.date)}`,
    `Time:       ${formatTimeRange(payload.event.startTime, payload.event.endTime)}`,
    `Occasion:   ${payload.event.typeName || "Custom event"}`,
    `Venue:      ${payload.event.location}`,
    `Guests:     ${payload.event.guests}`,
    ``,
    `YOUR MENU`,
  ];

  for (const course of groupByCourse(payload.items)) {
    lines.push(``, course.label.toUpperCase());
    for (const row of course.rows) {
      lines.push(`  ${row.name} — ${row.unitPrice} x${row.quantity} = ${row.lineTotal}`);
    }
  }

  lines.push(
    ``,
    `Per guest:        ${formatZAR(payload.totals.perGuest)}`,
    `Estimated total:  ${formatZAR(payload.totals.total)}`,
    ``,
    PRICING_CAVEAT,
    ``,
    `WHAT HAPPENS NEXT`,
    `1. A culinary director reviews your menu and event details.`,
    `2. We come back within 24 hours with a firm, itemised quote.`,
    `3. Once you're happy, we confirm the date and lock in your booking.`,
    ``,
    `${BRAND.name} · ${BRAND.location} · ${BRAND.email}`,
  );

  return lines.join("\n");
}
