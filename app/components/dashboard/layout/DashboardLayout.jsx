"use client";

import CustomerTopBar from "./CustomerTopBar";
import AdminRail from "./AdminRail";
import AdminTopBar from "./AdminTopBar";
import MobileTabBar from "./MobileTabBar";

const skipLink =
  "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-control focus:bg-mgh-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-mgh-gold-ink";

/**
 * The page frame for both dashboards. Pages render inside <main>, which owns
 * the width, gutters and bottom clearance for the phone tab bar.
 */
export default function DashboardLayout({ children, role = "customer" }) {
  if (role === "admin") {
    return (
      <div className="flex min-h-dvh bg-mgh-bg text-mgh-text">
        <a href="#main" className={skipLink}>
          Skip to content
        </a>
        <AdminRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBar />
          <main id="main" className="mx-auto w-full max-w-admin flex-1 px-4 pb-28 pt-6 md:px-8 md:pt-8 lg:pb-12">
            {children}
          </main>
        </div>
        <MobileTabBar role="admin" />
      </div>
    );
  }

  return (
    <div className="mgh-warm flex min-h-dvh flex-col bg-mgh-bg text-mgh-text">
      <a href="#main" className={skipLink}>
        Skip to content
      </a>
      <CustomerTopBar />
      <main id="main" className="mx-auto w-full max-w-customer flex-1 px-4 pb-28 pt-8 sm:px-6 md:px-10 md:pt-12 lg:pb-16">
        {children}
      </main>
      <MobileTabBar role="customer" />
    </div>
  );
}
