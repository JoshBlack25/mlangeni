import NavBar from "@/app/components/NavBar";
import Footer from "@/app/components/Footer";

// Privacy Policy, Terms, POPIA and PAIA share the site's nav and footer. The
// nav is `solid` because there is no hero behind it on these pages.
export default function LegalLayout({ children }) {
  return (
    <>
      <NavBar solid />
      {children}
      <Footer />
    </>
  );
}
