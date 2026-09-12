import { Resend } from "resend";
import { NextResponse } from "next/server";

import { getEmailConfig } from "@/lib/email/config";
import { deliverEmail } from "@/lib/email/send";
import { clientIp, isRateLimited } from "@/lib/email/rateLimit";
import {
  button,
  detailTable,
  emailShell,
  noticeBox,
  sectionTitle,
} from "@/lib/email/layout";
import { firstName, sanitize } from "@/lib/email/theme";

/**
 * Public enquiry form → admin notification + enquirer confirmation.
 *
 * The request contract is unchanged (app/sections/EnquiryForm.jsx and
 * services/emailService.ts depend on it); what changed is that recipients now
 * come from env instead of a hardcoded placeholder, the markup is the shared
 * table-based shell, and one failed send no longer 500s the whole request.
 */

const VALID_SESSIONS = ["Morning", "Afternoon", "Evening/Night"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    if (isRateLimited("enquiry", clientIp(req), { limit: 3, windowMs: 60_000 })) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 },
      );
    }

    const config = getEmailConfig();
    if (!config.enabled) {
      console.warn("[send-email] RESEND_API_KEY is not set; skipping send.");
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
    if (!VALID_SESSIONS.includes(session)) {
      return NextResponse.json(
        { error: "Invalid session selected" },
        { status: 400 },
      );
    }

    const rows = [
      { label: "Event Date", value: String(eventDate) },
      { label: "Session", value: String(session) },
      { label: "Number of Guests", value: String(guests) },
      { label: "Message", value: message ? String(message) : "No message provided" },
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

    const resend = new Resend(process.env.RESEND_API_KEY);

    const [admin, enquirer] = await Promise.all([
      deliverEmail(
        resend,
        {
          to: config.adminTo,
          subject: `New Enquiry — ${sanitize(name)}`,
          html: adminHtml,
          replyTo: String(email),
        },
        config,
        "enquiry admin",
      ),
      deliverEmail(
        resend,
        {
          to: String(email),
          subject: `We have received your enquiry, ${firstName(String(name))}`,
          html: customerHtml,
          redirectInSandbox: true,
        },
        config,
        "enquiry confirmation",
      ),
    ]);

    // The admin copy is the one that matters — the enquiry is lost without it.
    if (admin === "failed") {
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, admin, enquirer });
  } catch (error) {
    console.error("[send-email] unexpected failure:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 },
    );
  }
}
