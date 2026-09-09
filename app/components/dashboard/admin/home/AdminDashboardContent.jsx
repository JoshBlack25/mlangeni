"use client";

import AdminHero from "./Hero/AdminHero";
import AdminStats from "./Stats/AdminStats";
import ActiveConsultations from "./ActiveConsultations/ActiveConsultations";
import ConsultationRequests from "./NewOrders/NewOrders";
import RecentEnquiries from "./RecentEnquiries/RecentEnquiries";
import UpcomingConfirmedEvents from "./UpcomingConfirmedEvents/UpcomingConfirmedEvents";

export default function AdminDashboardContent() {
  return (
    <div className="flex flex-col gap-8">
      <AdminHero />

      <AdminStats />

      {/* Bento grid: Active Meetings | Consultation Requests + Recent Enquiries | Upcoming Confirmed Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:auto-rows-[minmax(240px,auto)]">
        <div className="lg:col-span-2 lg:row-span-2">
          <ActiveConsultations />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1 lg:row-span-2">
          <div className="flex-1">
            <ConsultationRequests />
          </div>
          <div className="flex-1">
            <RecentEnquiries />
          </div>
        </div>

        <div className="lg:col-span-1 lg:row-span-2">
          <UpcomingConfirmedEvents />
        </div>
      </div>
    </div>
  );
}
