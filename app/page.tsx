import Hero from "./sections/Hero";
import Calendar from "./sections/Calendar";
import Gallery from "./sections/Gallery";
import Testimonial from "./sections/Testimonial";
import About from "./sections/About";
import Contact from "./sections/Contact";
import Footer from "./components/Footer";
import EnquiryForm from "./sections/EnquiryForm";
import NavBar from "./components/NavBar";

export default function Home() {
  return (
    <>
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
        <Testimonial />
      </section>

      <section id="footer">
        <Footer />
      </section>
    </>
  );
}
