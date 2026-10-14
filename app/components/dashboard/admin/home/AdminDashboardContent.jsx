"use client";

import AdminHero from "./Hero/AdminHero";
import AdminStats from "./Stats/AdminStats";
import ActiveConsultations from "./ActiveConsultations/ActiveConsultations";
import ConsultationRequests from "./NewOrders/NewOrders";
import RecentEnquiries from "./RecentEnquiries/RecentEnquiries";
import UpcomingConfirmedEvents from "./UpcomingConfirmedEvents/UpcomingConfirmedEvents";

/**
 * Admin "Today": the date, what needs action, the month's figures, then the
 * pipeline (requests, meetings, enquiries) beside the events coming up.
 */
export default function AdminDashboardContent() {
  return (
    <div className="flex flex-col gap-6">
      <AdminHero />

      <AdminStats />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ConsultationRequests />
        <ActiveConsultations />
        <UpcomingConfirmedEvents />
      </div>

      <RecentEnquiries />
    </div>
  );
}
