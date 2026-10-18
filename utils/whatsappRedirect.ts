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

export function redirectToWhatsApp(data: EnquiryData): void {
  // No number configured (NEXT_PUBLIC_BUSINESS_PHONE): the enquiry has already
  // been saved and emailed, so skip the hand-off rather than open a dead chat.
  if (!BUSINESS_PHONE) return;

  const formattedDate = new Date(data.eventDate).toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const message = `
🎉 *New Event Enquiry*

👤 *Name:* ${data.name}
📧 *Email:* ${data.email}
📞 *Phone:* ${data.phone}
📅 *Event Date:* ${formattedDate}
🕐 *Session:* ${data.session}
👥 *Number of Guests:* ${data.guests}
💬 *Message:* ${data.message || "No message provided"}
  `.trim();

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${BUSINESS_PHONE}?text=${encodedMessage}`;

  window.open(whatsappURL, "_blank");
}