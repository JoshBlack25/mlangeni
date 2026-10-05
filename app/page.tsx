import Hero from "./sections/Hero";
import Calendar from "./sections/Calendar";
import Gallery from "./sections/Gallery";
import Testimonial from "./sections/Testimonial";
import About from "./sections/About";
import Contact from "./sections/Contact";
import Footer from "./components/Footer";
import EnquiryForm from "./sections/EnquiryForm";
import NavBar from "./components/NavBar";
import ScrollReset from "./components/ScrollReset";
import { getPublicTestimonials } from "@/services/publicTestimonials";

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
    <>
      <ScrollReset />

      <section id="nav">
        <NavBar />
      </section>

      <section id="hero">
        <Hero />
      </section>

      <section id="calendar">
        <Calendar />
      </section>

      <section id="gallery">
        <Gallery />
      </section>

      <section id="about">
        <About />
      </section>

      <section id="contact">
        <EnquiryForm />
      </section>

      <section id="testimonial">
        <Testimonial testimonials={testimonials} />
      </section>

      <section id="footer">
        <Footer />
      </section>
    </>
  );
}
