import EnquiryContent from "@/app/components/dashboard/customer/enquiry/EnquiryContent";

export const metadata = {
  title: "Make an enquiry",
  description: "Ask about a date, session and number of guests.",
  robots: { index: false, follow: false },
};

export default function EnquiryPage() {
  return (
    <section>
      <EnquiryContent />
    </section>
  );
}
