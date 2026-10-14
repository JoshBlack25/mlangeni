import { NotificationProvider } from "@/app/components/dashboard/shared/notifications/context/NotificationContext";
import DashboardMotion from "@/app/components/dashboard/shared/DashboardMotion";

// Signed-in pages are private: keep every dashboard route out of search results.
export const metadata = {
  // An object, not a string: a plain string here would drop the brand suffix
  // the root layout's template adds to every page title below this one.
  title: { default: "Dashboard", template: "%s | Mlangeni Grand Hospitality" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return (
    <NotificationProvider>
      <DashboardMotion>{children}</DashboardMotion>
    </NotificationProvider>
  );
}
