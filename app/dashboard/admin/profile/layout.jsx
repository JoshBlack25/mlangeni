// Metadata only: page.jsx is a client component and cannot export it.
export const metadata = {
  title: "Admin profile",
  description: "Your staff account details.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return children;
}
