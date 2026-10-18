import DashboardContent from "@/app/components/dashboard/customer/home/DashboardContent";

export const metadata = {
  title: "My dashboard",
  description: "Your upcoming events, orders, invoices and enquiries.",
  robots: { index: false, follow: false },
};

export default function CustomerDashboard() {
  return <DashboardContent />;
}
