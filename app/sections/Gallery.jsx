import Hero from "../../components/gallery/Hero.jsx";
import PostHero from "../../components/gallery/PostHero.jsx";
import Carousel from "../../components/gallery/Carousel.jsx";
import Showreel from "../../components/gallery/Showreel.jsx";
import CallToAction from "../../components/gallery/CallToAction.jsx";

const Gallery = () => {
  return (
    <main>
      <Hero/>
      <PostHero />
      <Carousel />
      <Showreel />
      <CallToAction />
    </main>
  );
};

export default Gallery;