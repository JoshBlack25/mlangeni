import Hero from "../components/gallery/Hero.jsx";
import Carousel from "../components/gallery/Carousel.jsx";
import Showreel from "../components/gallery/Showreel.jsx";
import CallToAction from "../components/gallery/CallToAction.jsx";

// PostHero ("The Philosophy") is held back until it has real copy; it is
// still placeholder text. Put it back between Hero and Carousel when ready.
const Gallery = () => {
  return (
    <>
      <Hero />
      <Carousel />
      <Showreel />
      <CallToAction />
    </>
  );
};

export default Gallery;
