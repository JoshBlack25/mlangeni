"use client";

import Header from "./Header";
import Navbar from "./Navbar";
import AdminNavbar from "./AdminNavbar";

const roleConfig = {
  customer: {
    title: "Customer Dashboard",
    navbar: Navbar,
    basePath: "/dashboard/customer",
  },
  admin: {
    title: "Admin Dashboard",
    navbar: AdminNavbar,
    basePath: "/dashboard/admin",
  },
};

export default function DashboardLayout({ children, role = "customer" }) {
  const { title, navbar, basePath } = roleConfig[role];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Header title={title} navbar={navbar} basePath={basePath} />

      <main>{children}</main>
    </div>
  );
}
