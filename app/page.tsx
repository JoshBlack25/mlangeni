import Hero from "./sections/Hero";
import Calendar from "./sections/Calendar";
import Gallery from "./sections/Gallery";
import Testimonial from "./sections/Testimonial";
import About from "./sections/About";
import Contact from "./sections/Contact";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import EnquiryForm from "./sections/EnquiryForm";


export default function Home() {
  return (
    <>
      <NavBar />
      <Hero />
      <Calendar />
      <Gallery />
      <About />
      {/* <Contact /> */}
      <EnquiryForm />
      <Testimonial />
      <Footer />
    </>
  );
}
