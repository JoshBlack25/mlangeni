import { Suspense } from "react";
import EnquiriesContent from "@/app/components/dashboard/admin/enquiry/EnquiriesContent";

export default function AdminEnquiriesPage() {
  return (
    <Suspense fallback={null}>
      <EnquiriesContent />
    </Suspense>
  );
}
