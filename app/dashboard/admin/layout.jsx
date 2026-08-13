"use client";

import DashboardLayout from "@/app/components/dashboard/layout/DashboardLayout";
import DashboardLoader from "@/app/components/dashboard/shared/DashboardLoader";
import { useRoleGuard } from "@/app/components/dashboard/shared/useRoleGuard";

export default function AdminLayout({ children }) {
  const checking = useRoleGuard("admin");

  if (checking) return <DashboardLoader />;

  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}
