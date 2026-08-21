import { NotificationProvider } from "@/app/components/dashboard/shared/notifications/context/NotificationContext";

export default function Layout({ children }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
