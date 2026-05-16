const WHATSAPP_BUSINESS_NUMBER = "27XXXXXXXXX"; // replace with your WhatsApp business number, e.g. 27821234567

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
  const whatsappURL = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodedMessage}`;

  window.open(whatsappURL, "_blank");
}