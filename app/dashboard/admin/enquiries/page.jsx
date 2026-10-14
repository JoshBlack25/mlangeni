import { Suspense } from "react";
import EnquiriesContent from "@/app/components/dashboard/admin/enquiry/EnquiriesContent";

export const metadata = {
  title: "Enquiries",
  description: "Enquiries from the website and from clients.",
  robots: { index: false, follow: false },
};

export default function AdminEnquiriesPage() {
  return (
    <Suspense fallback={null}>
      <EnquiriesContent />
    </Suspense>
  );
}
