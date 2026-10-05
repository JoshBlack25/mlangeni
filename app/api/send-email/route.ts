import { NextResponse } from "next/server";

import { getGmailConfig, deliverGmail } from "@/lib/email/gmail";
import { clientIp, isRateLimited } from "@/lib/email/rateLimit";
import {
  button,
  detailTable,
  emailShell,
  noticeBox,
  sectionTitle,
} from "@/lib/email/layout";
import { firstName, sanitize } from "@/lib/email/theme";
import {
  SESSION_OPTIONS,
  normalizeSession,
} from "@/app/components/constants/sessions";

/**
 * Public enquiry form → admin notification + enquirer confirmation.
 *
 * Sends through Gmail SMTP (nodemailer). The request contract is unchanged
 * (app/sections/EnquiryForm.jsx and services/emailService.ts depend on it).
 * One failed send no longer 500s the whole request; only a failed admin copy
 * does, because the enquiry is lost without it.
 */

// nodemailer needs Node APIs (net/tls), so this route must not run on Edge.
export const runtime = "nodejs";

const VALID_SESSIONS = SESSION_OPTIONS.map((s) => s.value);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    if (
      isRateLimited("enquiry", clientIp(req), { limit: 3, windowMs: 60_000 })
    ) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 },
      );
    }

    const config = getGmailConfig();
    if (!config.enabled) {
      console.warn(
        "[send-email] GMAIL_USER / GMAIL_APP_PASSWORD are not set; skipping send.",
      );
      return NextResponse.json(
        { success: false, error: "Email is not configured." },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { name, email, phone, eventDate, session, guests, message } = body;

    if (!name || !email || !phone || !eventDate || !session || !guests) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }
    if (typeof guests !== "number" || guests < 1) {
      return NextResponse.json(
        { error: "Invalid number of guests" },
        { status: 400 },
      );
    }

    // normalizeSession also accepts the legacy "Morning" / "Evening/Night" values
    const sessionValue = normalizeSession(session);
    if (!VALID_SESSIONS.includes(sessionValue)) {
      return NextResponse.json(
        { error: "Invalid session selected" },
        { status: 400 },
      );
    }
    const sessionLabel =
      SESSION_OPTIONS.find((s) => s.value === sessionValue)?.label ??
      sessionValue;

    const rows = [
      { label: "Event Date", value: String(eventDate) },
      { label: "Session", value: sessionLabel },
      { label: "Number of Guests", value: String(guests) },
      {
        label: "Message",
        value: message ? String(message) : "No message provided",
      },
    ];

    const adminHtml = emailShell({
      preheader: `${name} · ${guests} guests · ${eventDate}`,
      eyebrow: "New Enquiry Received",
      title: String(name),
      bodyHtml: [
        sectionTitle("Enquiry"),
        detailTable([
          { label: "Full Name", value: String(name) },
          { label: "Email Address", value: String(email) },
          { label: "Phone Number", value: String(phone) },
          ...rows,
        ]),
      ].join(""),
      ctaHtml: button(`mailto:${email}`, "Reply to enquirer"),
      footerNote: "Reply directly to this email to respond to the enquirer.",
    });

    const customerHtml = emailShell({
      preheader: "We'll be in touch within 24 hours.",
      eyebrow: "Enquiry Confirmed",
      title: `Thank you, ${firstName(String(name))}.`,
      intro:
        "We have received your enquiry and will be in touch within 24 hours.",
      bodyHtml: [
        sectionTitle("Your booking details"),
        detailTable(rows),
        `<div style="height:24px;line-height:24px;font-size:0;">&nbsp;</div>`,
        noticeBox(
          "Priority response",
          `Your enquiry will be responded to within <strong style="color:#D4AF37;">24 hours</strong> by your assigned concierge.`,
        ),
      ].join(""),
    });

    // deliverGmail never throws; each result is { ok: true } or { ok: false, error }.
    const [admin, enquirer] = await Promise.all([
      deliverGmail({
        to: config.adminTo,
        subject: `New Enquiry — ${sanitize(name)}`,
        html: adminHtml,
        replyTo: String(email),
      }),
      deliverGmail({
        to: String(email),
        subject: `We have received your enquiry, ${firstName(String(name))}`,
        html: customerHtml,
        replyTo: config.replyTo,
      }),
    ]);

    // The admin copy is the one that matters — the enquiry is lost without it.
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 },
      );
    }

    if (!enquirer.ok) {
      console.warn(
        "[send-email] admin copy sent, but the customer confirmation failed:",
        enquirer.error,
      );
    }

    return NextResponse.json({
      success: true,
      admin: "sent",
      enquirer: enquirer.ok ? "sent" : "failed",
    });
  } catch (error) {
    console.error("[send-email] unexpected failure:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 },
    );
  }
}
