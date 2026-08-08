import DashboardLayout from "@/app/components/dashboard/layout/DashboardLayout";
import { NotificationProvider } from "./customer/notifications/context/NotificationContext";

export default function Layout({ children }) {
  return (
    <NotificationProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </NotificationProvider>
  );
}
