"use client";

import Hero from "./Hero/Hero";
import Stats from "./Stats/Stats";
import UpcomingEvents from "./UpcomingEvents/UpcomingEvents";
import Invoices from "./Invoices/Invoices";
import Enquiries from "./Enquiries/Enquiries";
import Testimonials from "./Testimonials/Testimonials";
import RecentOrders from "./RecentOrders/RecentOrders";
import DashboardFooter from "./DashboardFooter";

/**
 * Customer home, in reading order: a greeting, the next event and what is
 * owed, the bookings at a glance, what is in motion, then other guests' words.
 */
export default function DashboardContent() {
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <Hero />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <UpcomingEvents />
        <Invoices />
      </div>

      <Stats />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RecentOrders />
        <Enquiries />
      </div>

      <Testimonials />

      <DashboardFooter />
    </div>
  );
}
