import { EnquiryData } from "@/utils/whatsappRedirect";

export async function sendEnquiryEmail(data: EnquiryData): Promise<void> {
  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to send email");
  }
}