import SupportContent from "@/app/components/dashboard/customer/support/SupportContent";

export const metadata = {
  title: "Support",
  description: "Get help with a booking, order or invoice.",
  robots: { index: false, follow: false },
};

export default function SupportPage() {
  return (
    <section>
      <SupportContent />
    </section>
  );
}
