"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import IMAGES from "../constants/image.js";

const CAROUSEL_SLIDES = [
  { src: IMAGES.diningTable, caption: "Your Perfect Night" },
  { src: IMAGES.food_2, caption: "Raw Perfection" },
  { src: IMAGES.food_3, caption: "Raw Perfection" },
  { src: IMAGES.food_6, caption: "Raw Perfection" },
  { src: IMAGES.food_5, caption: "Raw Perfection" },
  { src: IMAGES.food_7, caption: "The Finishing Touch" },
];

// Where each visible slide sits, from far left to far right. The outer two
// only appear from md up, where there is room for them.
const POSITIONS = [
  { offset: -2, x: "-74%", scale: 0.62, dim: "opacity-30", only: "hidden md:block" },
  { offset: -1, x: "-46%", scale: 0.8, dim: "opacity-55", only: "" },
  { offset: 0, x: "0%", scale: 1, dim: "opacity-100", only: "" },
  { offset: 1, x: "46%", scale: 0.8, dim: "opacity-55", only: "" },
  { offset: 2, x: "74%", scale: 0.62, dim: "opacity-30", only: "hidden md:block" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

function Carousel() {
  const [active, setActive] = React.useState(0);
  const total = CAROUSEL_SLIDES.length;

  const prev = () => setActive((i) => (i - 1 + total) % total);
  const next = () => setActive((i) => (i + 1) % total);
  const getSlide = (offset) => (active + offset + total) % total;

  const current = CAROUSEL_SLIDES[active];

  return (
    <section
      id="our-work"
      aria-labelledby="collection-title"
      aria-roledescription="carousel"
      className="overflow-hidden bg-mgh-bg py-24 md:py-32"
    >
      <div className="mx-auto mb-12 max-w-[1280px] px-5 md:mb-16 md:px-10">
        <h2
          id="collection-title"
          className="font-serif text-[2rem] font-normal leading-tight text-mgh-text md:text-[2.75rem]"
        >
          A Taste of Our Work
        </h2>
      </div>

      <div className="relative mx-auto flex aspect-[4/3] w-[min(560px,78vw)] items-center justify-center">
        {POSITIONS.map((pos) => {
          const index = getSlide(pos.offset);
          const slide = CAROUSEL_SLIDES[index];
          const isCenter = pos.offset === 0;

          return (
            <div
              key={index}
              // The side slides are a mouse shortcut; the buttons below are
              // the accessible way through.
              aria-hidden={!isCenter || undefined}
              onClick={isCenter ? undefined : pos.offset < 0 ? prev : next}
              className={cn(
                "absolute inset-0 overflow-hidden rounded-card transition-[transform,opacity] duration-700 ease-mgh",
                pos.dim,
                pos.only,
                isCenter ? "z-20" : "z-10 cursor-pointer",
                Math.abs(pos.offset) === 2 && "z-0",
              )}
              style={{ transform: `translateX(${pos.x}) scale(${pos.scale})` }}
            >
              <Image
                src={slide.src}
                alt={isCenter ? slide.caption : ""}
                fill
                sizes="(min-width: 768px) 560px, 78vw"
                className="object-cover"
              />
              {isCenter && (
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-mgh-bg/85 to-transparent p-6 pt-16 md:p-8 md:pt-20">
                  <p className="font-serif text-2xl text-mgh-text md:text-[1.75rem]">{slide.caption}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p aria-live="polite" className="sr-only">
        Image {active + 1} of {total}: {current.caption}
      </p>

      <div className="mt-12 flex items-center justify-center gap-6 md:mt-16 md:gap-10">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous image"
          className={cn(
            "grid size-11 place-items-center rounded-full border border-mgh-line-strong text-mgh-muted transition-colors hover:border-mgh-gold hover:text-mgh-text",
            focusRing,
          )}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1">
          {CAROUSEL_SLIDES.map((slide, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${total}`}
              aria-current={i === active ? "true" : undefined}
              className={cn("grid h-11 place-items-center px-1.5", focusRing, "rounded-control")}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block h-0.5 rounded-full transition-[width,background-color] duration-500 ease-mgh",
                  i === active ? "w-8 bg-mgh-gold" : "w-3 bg-mgh-line-strong",
                )}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Next image"
          className={cn(
            "grid size-11 place-items-center rounded-full border border-mgh-line-strong text-mgh-muted transition-colors hover:border-mgh-gold hover:text-mgh-text",
            focusRing,
          )}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default Carousel;
