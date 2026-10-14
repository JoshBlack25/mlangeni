"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// A short settle before hover takes over, so the page doesn't lurch the
// moment the cursor happens to be resting over one half on load.
const HOVER_ACTIVATION_DELAY = 400;

const SIDES = {
  left: {
    title: "Mlangeni Events",
    body: "Creating the world's most memorable events with precision, style and imagination.",
    cta: { label: "Start Planning", href: "#contact" },
    image: "/images/events-thumbnail.png",
    position: "object-[50%_30%]",
  },
  right: {
    title: "Hospitality Collection",
    body: "Delivering unique dining experiences and venue management at world famous locations.",
    cta: { label: "View Menus", href: "/dashboard/customer/menu" },
    image: "/images/gallery_images/gallery-hero.png",
    position: "object-center",
  },
};

export default function Hero() {
  const [active, setActive] = useState(null);
  const [canInteract, setCanInteract] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscapeTablet, setIsLandscapeTablet] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setCanInteract(true), HOVER_ACTIVATION_DELAY);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 768px)");

    // Landscape tablet: width 768px–1180px AND landscape orientation
    const mqLandscapeTablet = window.matchMedia(
      "(min-width: 768px) and (max-width: 1180px) and (orientation: landscape)",
    );

    const update = () => {
      setIsMobile(mqMobile.matches);
      setIsLandscapeTablet(mqLandscapeTablet.matches);
    };
    update();

    mqMobile.addEventListener("change", update);
    mqLandscapeTablet.addEventListener("change", update);
    return () => {
      mqMobile.removeEventListener("change", update);
      mqLandscapeTablet.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && (isMobile || isLandscapeTablet)) {
          setActive(null);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [isMobile, isLandscapeTablet]);

  // Use tap behavior on mobile OR landscape tablet
  const isTapDevice = isMobile || isLandscapeTablet;

  const handlers = (side) => ({
    onPointerEnter: (e) => {
      if (canInteract && e.pointerType === "mouse" && !isLandscapeTablet) setActive(side);
    },
    onPointerLeave: (e) => {
      if (canInteract && e.pointerType === "mouse" && !isLandscapeTablet) setActive(null);
    },
    onClick: (e) => {
      if (!canInteract || e.target.closest("a")) return;
      setActive((prev) => (isTapDevice ? (prev === side ? null : side) : side));
    },
    // Keyboard users open a half by tabbing into it.
    onFocus: () => setActive(side),
  });

  // The crest steps aside for whichever half is open.
  let crestShift = "translate-x-0 translate-y-0";
  if (active === "left") crestShift = "translate-y-[24vh] md:translate-y-0 md:translate-x-[17.5vw]";
  else if (active === "right") crestShift = "-translate-y-[17vh] md:translate-y-0 md:-translate-x-[17.5vw]";

  return (
    <section
      ref={heroRef}
      aria-labelledby="hero-title"
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-mgh-bg md:flex-row"
    >
      <h1 id="hero-title" className="sr-only">
        Mlangeni Grand Hospitality: Mlangeni Events and the Hospitality Collection
      </h1>

      {["left", "right"].map((side) => (
        <HeroHalf
          key={side}
          side={side}
          content={SIDES[side]}
          active={active}
          isLandscapeTablet={isLandscapeTablet}
          {...handlers(side)}
        />
      ))}

      {/* CENTRE CREST */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className={cn("transition-transform duration-700 ease-mgh", crestShift)}
        >
          <Image
            src="/logos/logo2.png"
            alt=""
            width={1303}
            height={777}
            preload
            sizes="(min-width: 768px) 300px, 200px"
            className={cn(
              "h-auto drop-shadow-[0_2px_24px_rgb(10_10_10/0.6)]",
              isLandscapeTablet ? "w-36" : "w-44 md:w-64 lg:w-72",
            )}
          />
        </motion.div>
      </div>
    </section>
  );
}

function HeroHalf({ side, content, active, isLandscapeTablet, ...handlers }) {
  const isOpen = active === side;
  const isOther = active && active !== side;

  return (
    <div
      {...handlers}
      className={cn(
        "relative min-h-0 cursor-pointer overflow-hidden transition-[flex-grow] duration-700 ease-mgh",
        isOpen
          ? side === "left"
            ? "flex-[2.6] md:flex-[1.35]"
            : "flex-[1.6] md:flex-[1.35]"
          : isOther
            ? side === "left"
              ? "flex-[0.8] md:flex-[0.65]"
              : "flex-[0.9] md:flex-[0.65]"
            : "flex-1",
      )}
    >
      <Image
        src={content.image}
        alt=""
        fill
        preload
        sizes="(min-width: 768px) 68vw, 100vw"
        className={cn(
          "object-cover transition-transform duration-[1400ms] ease-mgh",
          content.position,
          isOpen ? "scale-[1.03]" : "scale-100",
        )}
      />

      {/* Candlelight, not a spotlight: the photograph dims as it falls away
          from the words, and the closed half rests in shadow. */}
      <div aria-hidden="true" className="absolute inset-0 bg-mgh-bg/30" />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-linear-to-t from-mgh-bg via-mgh-bg/45 to-transparent",
          // Stacked on phones, the top half reads from its top edge so the
          // crest in the middle never sits on its words.
          side === "left" && "max-md:bg-linear-to-b",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-mgh-bg transition-opacity duration-700 ease-mgh",
          isOther ? "opacity-55" : "opacity-0",
        )}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col px-6 pb-10 sm:px-10 md:px-12 md:pb-16 lg:px-16 lg:pb-20",
          side === "left" && "max-md:bottom-auto max-md:top-0 max-md:pb-0 max-md:pt-24",
          side === "right" && "md:items-end md:text-right",
        )}
      >
        <h2
          className={cn(
            "font-serif font-normal leading-[1.05] tracking-[-0.01em] text-mgh-text",
            isLandscapeTablet ? "text-3xl" : "text-[2.25rem] sm:text-5xl lg:text-6xl",
          )}
        >
          {content.title}
        </h2>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-500 ease-mgh",
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <p
              className={cn(
                "mt-4 max-w-[34ch] text-pretty text-[15px] leading-relaxed text-mgh-text/80 md:text-base",
                side === "right" && "md:ml-auto",
              )}
            >
              {content.body}
            </p>
            <Link
              href={content.cta.href}
              className={cn(
                "group/cta mt-5 inline-flex items-center gap-3 rounded-control py-2 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-mgh-gold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-4 focus-visible:ring-offset-mgh-bg",
              )}
            >
              {content.cta.label}
              <span
                aria-hidden="true"
                className="h-px w-8 bg-mgh-gold transition-[width] duration-500 ease-mgh group-hover/cta:w-14"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
