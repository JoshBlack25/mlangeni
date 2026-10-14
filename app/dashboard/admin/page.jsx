import AdminDashboardContent from "@/app/components/dashboard/admin/home/AdminDashboardContent";

export const metadata = {
  title: "Admin overview",
  description: "Today's enquiries, consultations, orders and upcoming events.",
  robots: { index: false, follow: false },
};

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}
