// Metadata only: page.jsx is a client component and cannot export it.
export const metadata = {
  title: "Invoices",
  description: "Draft, sent, overdue and paid invoices.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return children;
}
