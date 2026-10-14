// Metadata only: page.jsx is a client component and cannot export it.
export const metadata = {
  title: "Sign in",
  description: "Sign in to manage your Mlangeni Grand Hospitality bookings, orders, invoices and reviews.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }) {
  return children;
}
