"use client";

import DashboardLayout from "@/app/components/dashboard/layout/DashboardLayout";
import DashboardLoader from "@/app/components/dashboard/shared/DashboardLoader";
import { useRoleGuard } from "@/app/components/dashboard/shared/useRoleGuard";

export default function CustomerLayout({ children }) {
  const checking = useRoleGuard("customer");

  if (checking) return <DashboardLoader />;

  return <DashboardLayout role="customer">{children}</DashboardLayout>;
}
