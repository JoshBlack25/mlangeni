import TestimonialsContent from "@/app/components/dashboard/admin/tools/testimonials/TestimonialsContent";

export const metadata = {
  title: "Testimonial moderation",
  description: "Approve, feature and order client reviews.",
  robots: { index: false, follow: false },
};

export default function AdminTestimonialsPage() {
  return <TestimonialsContent />;
}
