import Image from "next/image";
import IMAGES from "../constants/image";

/** The gallery's opening: its title, then a wide photograph given room. */
function Hero() {
  return (
    <section aria-labelledby="gallery-title" className="bg-mgh-bg pt-24 md:pt-32">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <h2
          id="gallery-title"
          className="font-serif text-[3rem] font-normal leading-none tracking-[-0.015em] text-mgh-text sm:text-[4.5rem] lg:text-[6rem]"
        >
          Our Gallery
        </h2>
      </div>

      <div className="relative mx-auto mt-10 aspect-[4/3] max-w-[1440px] overflow-hidden sm:aspect-[21/9] md:mt-14 md:px-10">
        <div className="relative h-full overflow-hidden md:rounded-card">
          <Image
            src={IMAGES.food_1}
            alt="A grazing table of fruit, canapés and fresh flowers"
            fill
            sizes="(min-width: 1440px) 1360px, 100vw"
            className="object-cover object-[50%_45%]"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-mgh-bg/50 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
