// Metadata only: page.jsx is a client component and cannot export it.
export const metadata = {
  title: "My orders",
  description: "Your orders and their status.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return children;
}
