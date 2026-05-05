import Hero from "../../components/gallery/Hero.jsx";
import Grid from "../../components/gallery/Grid.jsx";
import PostGrid from "../../components/gallery/PostGrid.jsx";
import Quote from "../../components/gallery/Quote.jsx";
import Carousel from "../../components/gallery/Carousel.jsx";
import Showreel from "../../components/gallery/Showreel.jsx";
import CallToAction from "../../components/gallery/CallToAction.jsx";

const Gallery = () => {
  return (
    <main>
      <Hero/>
      {/* <Grid /> */}
      <PostGrid />
      <Carousel />
      {/* <Quote /> */}
      <Showreel />
      <CallToAction />
    </main>
  );
};

export default Gallery;