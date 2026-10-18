import ReviewsContent from "@/app/components/dashboard/customer/reviews/ReviewsContent";

export const metadata = {
  title: "Reviews",
  description: "Review a past event.",
  robots: { index: false, follow: false },
};

export default function ReviewsPage() {
  return (
    <section>
      <ReviewsContent />
    </section>
  );
}
