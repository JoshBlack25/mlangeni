import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const CLIENT_EMAIL = "youremail@gmail.com";

// ── Sanitizer ──
const sanitize = (str: string) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

// ── Rate Limiter ──
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 3;        // max requests
const RATE_WINDOW = 60000;   // per 60 seconds

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.timestamp > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count++;
  return false;
}

// ── Email Styles ──
const base = `
  background-color: #0a0a0a;
  font-family: Georgia, 'Times New Roman', serif;
  margin: 0;
  padding: 0;
`;

const goldBar = `
  height: 2px;
  background: linear-gradient(to right, transparent, #D4AF37, transparent);
  border: none;
  margin: 0;
`;

const container = `
  max-width: 580px;
  margin: 0 auto;
  background-color: #0f0f0f;
  border: 1px solid #1e1e1e;
`;

const header = `
  padding: 40px 48px 32px;
  border-bottom: 1px solid #1e1e1e;
`;

const body = `
  padding: 36px 48px;
`;

const footer = `
  padding: 20px 48px;
  border-top: 1px solid #1e1e1e;
  background-color: #0a0a0a;
`;

const label = `
  font-size: 9px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #D4AF37;
  font-weight: bold;
  display: block;
  margin-bottom: 4px;
`;

const value = `
  font-size: 13px;
  color: #cccccc;
  display: block;
  padding-bottom: 20px;
  border-bottom: 1px solid #1e1e1e;
  margin-bottom: 20px;
`;

const lastValue = `
  font-size: 13px;
  color: #cccccc;
  display: block;
`;

export async function POST(req: Request) {
  try {

    // ── Rate limiting ──
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, phone, eventDate, session, guests, message } = body;

    // ── Validation ──
    if (!name || !email || !phone || !eventDate || !session || !guests) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (typeof guests !== "number" || guests < 1) {
      return NextResponse.json(
        { error: "Invalid number of guests" },
        { status: 400 }
      );
    }

    const validSessions = ["Morning", "Afternoon", "Evening/Night"];
    if (!validSessions.includes(session)) {
      return NextResponse.json(
        { error: "Invalid session selected" },
        { status: 400 }
      );
    }

    // ── Sanitized values ──
    const sName       = sanitize(name);
    const sEmail      = sanitize(email);
    const sPhone      = sanitize(phone);
    const sEventDate  = sanitize(eventDate);
    const sSession    = sanitize(session);
    const sGuests     = sanitize(String(guests));
    const sMessage    = message ? sanitize(message) : "No message provided";
    const sFirstName  = sanitize(name.split(" ")[0]);

    // ── Email 1: Notify the client ──
    await resend.emails.send({
      from: "MGH Enquiries <onboarding@resend.dev>",
      to: CLIENT_EMAIL,
      replyTo: email,
      subject: `New Enquiry — ${sName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="${base}">
            <div style="${container}">

              <hr style="${goldBar}" />

              <div style="${header}">
                <p style="font-size:9px; letter-spacing:0.25em; text-transform:uppercase; color:#D4AF37; margin:0 0 8px;">
                  New Enquiry Received
                </p>
                <h1 style="font-size:22px; color:#ffffff; margin:0; font-weight:normal;">
                  ${sName}
                </h1>
              </div>

              <div style="${body}">
                <span style="${label}">Full Name</span>
                <span style="${value}">${sName}</span>

                <span style="${label}">Email Address</span>
                <span style="${value}">${sEmail}</span>

                <span style="${label}">Phone Number</span>
                <span style="${value}">${sPhone}</span>

                <span style="${label}">Event Date</span>
                <span style="${value}">${sEventDate}</span>

                <span style="${label}">Session</span>
                <span style="${value}">${sSession}</span>

                <span style="${label}">Number of Guests</span>
                <span style="${value}">${sGuests}</span>

                <span style="${label}">Message</span>
                <span style="${lastValue}">${sMessage}</span>
              </div>

              <div style="padding: 0 48px 36px;">
                <p style="font-size:11px; color:#555; margin:0 0 16px; letter-spacing:0.05em;">
                  Reply directly to this email to respond to the enquirer.
                </p>
                <a href="mailto:${sEmail}"
                  style="display:inline-block; background:#D4AF37; color:#0a0a0a; font-size:9px;
                  font-weight:bold; letter-spacing:0.25em; text-transform:uppercase;
                  text-decoration:none; padding:14px 32px;">
                  Reply to Enquirer
                </a>
              </div>

              <div style="${footer}">
                <p style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:#333; margin:0;">
                  Mlangeni Grand Hospitality &nbsp;·&nbsp; Cape Town, South Africa
                </p>
              </div>

              <hr style="${goldBar}" />

            </div>
          </body>
        </html>
      `,
    });

    // ── Email 2: Confirm to the user ──
    await resend.emails.send({
      from: "MGH Enquiries <onboarding@resend.dev>",
      to: email,
      subject: `We have received your enquiry, ${sFirstName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="${base}">
            <div style="${container}">

              <hr style="${goldBar}" />

              <div style="${header}">
                <p style="font-size:9px; letter-spacing:0.25em; text-transform:uppercase; color:#D4AF37; margin:0 0 8px;">
                  Enquiry Confirmed
                </p>
                <h1 style="font-size:22px; color:#ffffff; margin:0 0 12px; font-weight:normal;">
                  Thank you, ${sFirstName}.
                </h1>
                <p style="font-size:13px; color:#666; margin:0; line-height:1.7;">
                  We have received your enquiry and will be in touch within 24 hours.
                </p>
              </div>

              <div style="${body}">
                <p style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:#D4AF37; margin:0 0 24px; font-weight:bold;">
                  Your Booking Details
                </p>

                <span style="${label}">Event Date</span>
                <span style="${value}">${sEventDate}</span>

                <span style="${label}">Session</span>
                <span style="${value}">${sSession}</span>

                <span style="${label}">Number of Guests</span>
                <span style="${value}">${sGuests}</span>

                <span style="${label}">Message</span>
                <span style="${lastValue}">${sMessage}</span>
              </div>

              <div style="margin: 0 48px 36px; padding: 20px 24px; border: 1px solid #1e1e1e; background-color:#0a0a0a;">
                <p style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:#555; margin:0 0 6px;">
                  Priority Response
                </p>
                <p style="font-size:13px; color:#aaa; margin:0;">
                  Your enquiry will be responded to within
                  <strong style="color:#D4AF37;">24 hours</strong>
                  by your assigned concierge.
                </p>
              </div>

              <div style="${footer}">
                <p style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:#333; margin:0 0 4px;">
                  Mlangeni Grand Hospitality &nbsp;·&nbsp; Cape Town, South Africa
                </p>
                <p style="font-size:9px; color:#2a2a2a; margin:0;">hello@mlangeni.co.za</p>
              </div>

              <hr style="${goldBar}" />

            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}