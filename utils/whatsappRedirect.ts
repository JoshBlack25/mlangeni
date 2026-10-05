import { SESSION_OPTIONS } from "@/app/components/constants/sessions";

// Digits only, international format (e.g. 27821234567).
// Set NEXT_PUBLIC_WHATSAPP_NUMBER in .env.local and in Vercel.
// While it is empty, the WhatsApp redirect is skipped.
// NEXT_PUBLIC_ values are baked in at build time, so redeploy after changing it.
const WHATSAPP_BUSINESS_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""
).replace(/\D/g, "");

export interface EnquiryData {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  session: string;
  guests: number;
  message: string;
}

export function redirectToWhatsApp(data: EnquiryData): void {
  if (!WHATSAPP_BUSINESS_NUMBER) return;

  const formattedDate = new Date(data.eventDate).toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sessionLabel =
    SESSION_OPTIONS.find((s) => s.value === data.session)?.label ??
    data.session;

  const message = `
🎉 *New Event Enquiry*

👤 *Name:* ${data.name}
📧 *Email:* ${data.email}
📞 *Phone:* ${data.phone}
📅 *Event Date:* ${formattedDate}
🕐 *Session:* ${sessionLabel}
👥 *Number of Guests:* ${data.guests}
💬 *Message:* ${data.message || "No message provided"}
  `.trim();

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodedMessage}`;

  window.open(whatsappURL, "_blank");
}
