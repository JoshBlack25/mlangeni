"use client";

import Hero from "./Hero/Hero";
import Stats from "./Stats/Stats";
import UpcomingEvents from "./UpcomingEvents/UpcomingEvents";
import Invoices from "./Invoices/Invoices";
import Enquiries from "./Enquiries/Enquiries";
import Testimonials from "./Testimonials/Testimonials";
import RecentOrders from "./RecentOrders/RecentOrders";
import DashboardFooter from "./DashboardFooter";

export default function DashboardContent() {
  return (
    <div className="flex flex-col gap-8">
      <Hero />

      <Stats />

      {/* BENTO GRID — 4 columns x 2 rows.
          Events: 2x2 | Invoices+Consultations stacked: 1x2 | Testimonials: 1x2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:auto-rows-[minmax(240px,auto)]">
        <div className="lg:col-span-2 lg:row-span-2">
          <UpcomingEvents />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1 lg:row-span-2">
          <div className="flex-1">
            <Invoices />
          </div>
          <div className="flex-1">
            <Enquiries />
          </div>
        </div>

        <div className="lg:col-span-1 lg:row-span-2">
          <Testimonials />
        </div>
      </div>

      {/* RECENT ORDERS — full width, now that Notifications lives in the header */}
      <RecentOrders />

      <DashboardFooter />
    </div>
  );
}
