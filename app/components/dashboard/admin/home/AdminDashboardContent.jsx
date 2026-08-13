"use client";

import AdminHero from "./Hero/AdminHero";
import AdminStats from "./Stats/AdminStats";
import ActiveConsultations from "./ActiveConsultations/ActiveConsultations";
import NewOrders from "./NewOrders/NewOrders";
import RecentEnquiries from "./RecentEnquiries/RecentEnquiries";
import UpcomingConfirmedEvents from "./UpcomingConfirmedEvents/UpcomingConfirmedEvents";

export default function AdminDashboardContent() {
  return (
    <div className="flex flex-col gap-8">
      <AdminHero />

      <AdminStats />

      {/* BENTO GRID — 4 columns x 2 rows.
          Active Consultations: 2x2 | New Orders + Recent Enquiries stacked: 1x2 | Upcoming Confirmed Events: 1x2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:auto-rows-[minmax(240px,auto)]">
        <div className="lg:col-span-2 lg:row-span-2">
          <ActiveConsultations />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1 lg:row-span-2">
          <div className="flex-1">
            <NewOrders />
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
