import { NotificationProvider } from "./customer/notifications/context/NotificationContext";

export default function Layout({ children }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
