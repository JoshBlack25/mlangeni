"use client"
import React from "react";
import IMAGES from "../constants/image.js";

function Carousel() {
    const CAROUSEL_SLIDES = [
        { src: IMAGES.diningTable, caption: "Your Perfect Night", label: "Curation 01" },
        { src: IMAGES.food_2, caption: "Raw Perfection", label: "Curation 02" },
        { src: IMAGES.food_3, caption: "Raw Perfection", label: "Curation 03" },
        { src: IMAGES.food_8, caption: "Raw Perfection", label: "Curation 04" },
        { src: IMAGES.food_5, caption: "Raw Perfection", label: "Curation 05" },
        { src: IMAGES.food_7, caption: "The Finishing Touch", label: "Curation 06" },
    ];

    const [active, setActive] = React.useState(0);
    const total = CAROUSEL_SLIDES.length;

    const prev = () => setActive((i) => (i - 1 + total) % total);
    const next = () => setActive((i) => (i + 1) % total);
    const getSlide = (offset) => (active + offset + total) % total;


    const positions = [
        //far left
        { z: 0, x: "-72%", scale: 0.55, blur: "blur-md", opacity: "opacity-40", cursor: "cursor-pointer" },
        // left
        { z: 10, x: "-44%", scale: 0.75, blur: "blur-sm", opacity: "opacity-60", cursor: "cursor-pointer" },
        // centre
        { z: 20, x: "0%", scale: 1, blur: "", opacity: "opacity-100", cursor: "cursor-default" },
        // right
        { z: 10, x: "44%", scale: 0.75, blur: "blur-sm", opacity: "opacity-60", cursor: "cursor-pointer" },
        // far right
        { z: 0, x: "72%", scale: 0.55, blur: "blur-md", opacity: "opacity-40", cursor: "cursor-pointer" },

    ];

    const offsets = [-2, -1, 0, 1, 2];

    return (

        <section className="bg-surface-container-lowest py-32 overflow-hidden">
            <div className="text-center mb-20 px-12">
                <span className="font-[Playfair_Display] text-primary tracking-[0.4em] uppercase text-xs mb-4 block">
                    OUR COLLECTION
                </span>
                <h2 className="font-[Playfair_Display] text-5xl text-on-surface">
                    A Taste of Our Work
                </h2>
            </div>

            {/*Carrousel Section*/}
            <div className="relative flex items-center justify-center h-[520px]">
                {offsets.map((offset, i) => {
                    const slide = CAROUSEL_SLIDES[getSlide(offset)];
                    const pos = positions[i];
                    const isCenter = offset === 0;

                    return (
                        <div
                            key={getSlide(offset)}
                            onClick={() => {
                                if (offset === -1 || offset === -2) prev();
                                else if (offset === 1 || offset === 2) next();
                            }}
                            className={`
                    absolute w-[560px] h-[420px] overflow-hidden
                    transition-all duration-500 ease-in-out
                    ${pos.opacity} ${pos.cursor}`}
                            style={{
                                zIndex: pos.z,
                                transform: `translateX(${pos.x}) scale(${pos.scale})`,
                            }}
                        >
                            <img
                                src={slide.src}
                                alt={slide.caption}
                                className={`w-full h-full object-cover transition-all duration-500 ${pos.blur}`}
                            />
                            {isCenter && (
                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-surface/90 to-transparent">
                                    <span className="font-[Playfair_Display] text-primary text-xs tracking-widest uppercase block mb-1">
                                        {slide.label}
                                    </span>
                                    <h3 className="font-[Playfair_Display] text-2xl text-on-surface">
                                        {slide.caption}
                                    </h3>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {/*Controls*/}
            <div className="flex items-center justify-center gap-12 mt-16">
                {/* Prev arrow */}
                <button
                    onClick={prev}
                    aria-label="Previous"
                    className="w-12 h-12 border border-outline flex items-center justify-center
                     hover:border-primary hover:text-primary text-on-surface-variant
                     transition-colors duration-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                </button>

                {/* Dot indicators */}
                <div className="flex gap-3">
                    {CAROUSEL_SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`transition-all duration-300 rounded-full
                ${i === active
                                    ? "w-8 h-2 bg-primary"
                                    : "w-2 h-2 bg-outline hover:bg-primary/50"
                                }`}
                        />
                    ))}
                </div>

                {/* Next arrow */}
                <button
                    onClick={next}
                    aria-label="Next"
                    className="w-12 h-12 border border-outline flex items-center justify-center
                     hover:border-primary hover:text-primary text-on-surface-variant
                     transition-colors duration-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                </button>

            </div>
        </section>
    )
}

export default Carousel;