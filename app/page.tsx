import Hero from "./sections/Hero";
import Calendar from "./sections/Calendar";
import Gallery from "./sections/Gallery";
import Ratings from "./sections/Ratings";
import About from "./sections/About";
import Contact from "./sections/Contact";
import NavBar from "./components/NavBar";

export default function Home() {
  return (
    <>
      <NavBar />
      <Hero />
      <Calendar />
      <Gallery />
      <Ratings />
      <About />
      <Contact />
    </>
  );
}
