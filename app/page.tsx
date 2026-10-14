import Hero from "./sections/Hero";
import Calendar from "./sections/Calendar";
import Gallery from "./sections/Gallery";
import Testimonial from "./sections/Testimonial";
import About from "./sections/About";
import Footer from "./components/Footer";
import EnquiryForm from "./sections/EnquiryForm";
import NavBar from "./components/NavBar";
import ScrollReset from "./components/ScrollReset";
import SiteMotion from "./components/SiteMotion";
import { getPublicTestimonials } from "@/services/publicTestimonials";
import { SITE, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// LocalBusiness + WebSite structured data. Only facts the page itself states.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#business`,
      name: SITE.name,
      description: SITE.description,
      url: SITE_URL,
      email: SITE.email,
      logo: `${SITE_URL}${SITE.logo}`,
      image: `${SITE_URL}/opengraph-image`,
      address: {
        "@type": "PostalAddress",
        addressLocality: SITE.locality,
        addressRegion: SITE.region,
        addressCountry: SITE.country,
      },
      areaServed: [
        { "@type": "City", name: "Cape Town" },
        { "@type": "City", name: "Johannesburg" },
        { "@type": "Country", name: "South Africa" },
      ],
      knowsAbout: ["Event catering", "Weddings", "Corporate functions", "Private dining", "Venue management"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE.name,
      inLanguage: "en-ZA",
      publisher: { "@id": `${SITE_URL}/#business` },
    },
  ],
};

// The testimonial quotes are marketing copy, so they are fetched here rather
// than in the browser: that way they are in the served HTML for crawlers and
// there is no loading flash above the fold. The read is anonymous — no cookies,
// no session — so the page stays statically prerendered and simply revalidates
// on this timer.
//
// This is only the fallback. Approving or reordering a review pings
// /api/revalidate-testimonials, which republishes this page straight away — the
// timer is what catches up if that ping is missed.
//
// It has to be a bare literal. Next reads it by static analysis, so neither an
// imported constant nor an expression like `5 * 60` is accepted. Keep it in
// step with TESTIMONIALS_REVALIDATE_SECONDS in services/publicTestimonials.ts.
export const revalidate = 60;

export default async function Home() {
  const testimonials = await getPublicTestimonials(8);

  return (
    <SiteMotion>
      <script
        type="application/ld+json"
        // Escape "<" so a value can never close the script element.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <ScrollReset />

      <div id="nav">
        <NavBar />
      </div>

      <main>
        <div id="hero">
          <Hero />
        </div>

        <div id="calendar">
          <Calendar />
        </div>

        <div id="gallery">
          <Gallery />
        </div>

        <div id="about">
          <About />
        </div>

        <div id="contact">
          <EnquiryForm />
        </div>

        <div id="testimonial">
          <Testimonial testimonials={testimonials} />
        </div>
      </main>

      <div id="footer">
        <Footer />
      </div>
    </SiteMotion>
  );
}
