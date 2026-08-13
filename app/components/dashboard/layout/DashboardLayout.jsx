"use client";

import Header from "./Header";
import Navbar from "./Navbar";
import AdminNavbar from "./AdminNavbar";

const roleConfig = {
  customer: { title: "Customer Dashboard", navbar: Navbar },
  admin: { title: "Admin Dashboard", navbar: AdminNavbar },
};

export default function DashboardLayout({ children, role = "customer" }) {
  const { title, navbar } = roleConfig[role];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Header title={title} navbar={navbar} />

      <main>{children}</main>
    </div>
  );
}
