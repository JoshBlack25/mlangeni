import { BUSINESS_PHONE } from "@/lib/site";

export interface EnquiryData {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  session: string;
  guests: number;
  message: string;
}

/** Fields the admin greeting reads off an `enquiries` row. */
export interface EnquiryRowData {
  name?: string | null;
  phone?: string | null;
  event_date?: string | null;
  session?: string | null;
  guests?: number | null;
}

/**
 * Any stored phone number → the digits-only international form wa.me needs
 * (e.g. "+27 82 123 4567" or "082 123 4567" → "27821234567"). Older rows
 * saved before the international phone input may start with a local 0, which
 * is treated as South African. Returns "" when nothing usable is left.
 */
export function toWhatsAppNumber(phone?: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  return digits;
}

function formatEventDate(value?: string | null): string {
  if (!value) return "your event date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "evening" → "Evening", "all day" → "All Day". Display only. */
function formatSession(value?: string | null): string {
  return (value ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
}

// No emojis: wa.me links corrupt them on WhatsApp Web and desktop ("�").
// WhatsApp's own *bold* markup survives everywhere.
function visitorMessage(data: EnquiryData): string {
  return [
    "*New Event Enquiry*",
    "",
    `*Name:* ${data.name}`,
    `*Email:* ${data.email}`,
    `*Phone:* ${data.phone}`,
    `*Event Date:* ${formatEventDate(data.eventDate)}`,
    `*Session:* ${formatSession(data.session)}`,
    `*Guests:* ${data.guests}`,
    `*Message:* ${data.message || "No message provided"}`,
  ].join("\n");
}

/**
 * Visitor → Mlangeni: opens the business chat with the enquiry prefilled.
 * Returns null when NEXT_PUBLIC_BUSINESS_PHONE is not configured.
 */
export function buildVisitorWhatsAppLink(data: EnquiryData): string | null {
  if (!BUSINESS_PHONE) return null;
  return `https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(visitorMessage(data))}`;
}

/**
 * Admin → visitor: opens that visitor's chat (in whichever WhatsApp account
 * the admin is signed into — the Mlangeni Business account) with a greeting
 * that references their enquiry. Returns null when the row has no phone.
 */
export function buildAdminWhatsAppLink(enquiry: EnquiryRowData): string | null {
  const number = toWhatsAppNumber(enquiry.phone);
  if (!number) return null;

  const firstName = (enquiry.name ?? "").trim().split(/\s+/)[0] || "there";
  const details = [formatSession(enquiry.session), enquiry.guests ? `${enquiry.guests} guests` : ""]
    .filter(Boolean)
    .join(", ");
  const greeting =
    `Hi ${firstName}, this is Mlangeni Grand Hospitality regarding your enquiry for ` +
    `${formatEventDate(enquiry.event_date)}${details ? ` (${details})` : ""}.`;

  return `https://wa.me/${number}?text=${encodeURIComponent(greeting)}`;
}

/**
 * Best-effort auto-open right after submit. Browsers may block it because it
 * runs after an await, so the success modal also shows a "Continue to
 * WhatsApp" button with the same link.
 */
export function redirectToWhatsApp(link: string | null): void {
  if (!link) return;
  window.open(link, "_blank", "noopener,noreferrer");
}
