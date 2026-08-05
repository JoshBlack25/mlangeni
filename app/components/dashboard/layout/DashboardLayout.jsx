"use client";

import Header from "./Header";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Header />

      <main>{children}</main>
    </div>
  );
}
