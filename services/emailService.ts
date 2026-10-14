import { EnquiryData } from "@/utils/whatsappRedirect";

export async function sendEnquiryEmail(data: EnquiryData): Promise<void> {
  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to send email (${response.status})`);
  }
}
