"use client";

import { useState, useRef, useEffect } from "react"; // Added useRef and useEffect
import { motion, AnimatePresence } from "framer-motion";

export default function Hero() {
  const [active, setActive] = useState(null);
  const [loaded, setLoaded] = useState(false); // "left" | "right" | null

  // Create references for the video elements
  const leftVideoRef = useRef(null);
  const rightVideoRef = useRef(null);

  const handleToggle = (side) => {
    setActive((prev) => (prev === side ? null : side));
  };

  const baseTransition = "transition-all duration-750 ease-in";

  // Calculate the exact shift needed for the logo based on the flex ratios
  let logoTransform = "translate-x-0 translate-y-0";
  if (active === "left") {
    logoTransform =
      "translate-y-[24.5vh] md:translate-y-0 md:translate-x-[17.5vw]";
  } else if (active === "right") {
    logoTransform =
      "-translate-y-[17.5vh] md:translate-y-0 md:-translate-x-[17.5vw]";
  }

  // Handle video playback logic
  // Handle playback logic based on the "active" state
  useEffect(() => {
    const left = leftVideoRef.current;
    const right = rightVideoRef.current;

    if (active === "left") {
      right?.pause();
      right.currentTime = 0;

      left?.play().catch(() => {});
    } else if (active === "right") {
      left.playbackRate = 0.75;
      left?.pause();
      left.currentTime = 0;

      right?.play().catch(() => {});
    } else {
      right.playbackRate = 0.75;
      left?.pause();
      right?.pause();

      if (left) left.currentTime = 0;
      if (right) right.currentTime = 0;
    }
  }, [active]);

  return (
    <section
      id="hero"
      className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden bg-black"
    >
      {/* LEFT SECTION */}
      <div
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") {
            setActive("left");
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") {
            setActive(null);
          }
        }}
        onClick={() => setActive("left")} // optional: you can remove this entirely
        className={`relative overflow-hidden min-h-0 cursor-pointer ${baseTransition} 
        ${active === "left" ? "md:flex-[1.35] flex-[2.6]" : active === "right" ? "md:flex-[0.65] flex-[0.8]" : "md:flex-1 flex-1"}
        ${active === "right" ? "brightness-90 md:blur-[1px]" : ""}`}
      >
        <div className="relative w-full h-full">
          {/* POSTER */}
          <AnimatePresence>
            {active !== "left" && (
              <motion.img
                key="poster-left"
                src="/images/events-thumbnail.png"
                className="absolute inset-0 w-full h-full object-cover brightness-60"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>

          {/* VIDEO */}
          <motion.video
            ref={leftVideoRef}
            src="/videos/Events-video.mp4"
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover brightness-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: active === "left" ? 1 : 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center md:text-left px-4 md:px-0 flex flex-col gap-4">
            <h1
              className={`text-3xl sm:text-3xl md:text-4xl font-light font-[Playfair_Display] tracking-wide text-white transition-all duration-500 ease-in-out drop-shadow-[0_0_18px_rgba(255,255,255,0.9)] ${active === "left" ? "mt-4" : "mt-20 md:mt-50"}`}
            >
              Mlangeni Events
            </h1>
            <div
              className={`transition-all duration-500 ease-out ${active === "left" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              <p className="text-xs sm:text-sm md:text-base leading-relaxed text-white/80 mb-0 max-w-md mx-auto md:mx-0 drop-shadow-[0_0_18px_rgba(255,255,255,0.9)]">
                Creating the world's most memorable events with precision, style
                and imagination.
              </p>
              <motion.button
                onClick={(e) => e.stopPropagation()}
                className="relative inline-flex items-center justify-center px-0 py-3 text-xs tracking-[0.25em] uppercase text-[#D4AF37] transition-all duration-400 overflow-hidden cursor-pointer"
                initial="rest"
                animate="rest"
                whileHover="hover"
              >
                <span className="relative z-10">Start Planning</span>
                <motion.span
                  className="absolute left-0 bottom-1 h-[1px] bg-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]"
                  variants={{
                    rest: { width: "0%" },
                    hover: { width: "75%" },
                  }}
                  transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") {
            setActive("right");
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") {
            setActive(null);
          }
        }}
        onClick={() => setActive("right")}
        className={`relative overflow-hidden min-h-0 cursor-pointer ${baseTransition}
        ${active === "right" ? "md:flex-[1.35] flex-[1.6]" : active === "left" ? "md:flex-[0.65] flex-[0.9]" : "md:flex-1 flex-1"}
        ${active === "left" ? "brightness-60 md:blur-[1px]" : ""}`}
      >
        <div className="relative w-full h-full">
          {/* POSTER */}
          <AnimatePresence>
            {active !== "right" && (
              <motion.img
                key="poster-right"
                src="/images/hospitality-thumbnail.png"
                className="absolute inset-0 w-full h-full object-cover brightness-60"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>

          {/* VIDEO */}
          <motion.video
            ref={rightVideoRef}
            src="/videos/hospitality-video.mp4"
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover brightness-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: active === "right" ? 1 : 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center md:text-left px-4 md:px-0 flex flex-col gap-6">
            <h1
              className={`text-3xl sm:text-3xl md:text-4xl font-light font-[Playfair_Display] tracking-wide text-white transition-all duration-500 ease-in-out drop-shadow-[0_0_18px_rgba(255,255,255,0.9)] ${active === "right" ? "mt-4" : "mt-20 md:mt-50"}`}
            >
              Hospitality Collection
            </h1>
            <div
              className={`transition-all duration-500 ease-out ${active === "right" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              <p className="text-xs sm:text-sm md:text-base leading-relaxed text-white/80 mb-0 max-w-md mx-auto md:mx-0">
                Delivering unique dining experiences and venue management at
                world famous locations.
              </p>
              <motion.button
                onClick={(e) => e.stopPropagation()}
                className="relative inline-flex items-center justify-center px-0 py-3 text-xs tracking-[0.25em] uppercase text-[#D4AF37] transition-all duration-400 overflow-hidden cursor-pointer"
                initial="rest"
                animate="rest"
                whileHover="hover"
              >
                <span className="relative z-10">View Menus</span>
                <motion.span
                  className="absolute left-0 bottom-1 h-[1px] bg-amber-200"
                  variants={{ rest: { width: "0%" }, hover: { width: "75%" } }}
                  transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER LOGO */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
        <motion.img
          src="/logo2.png"
          alt="Center Logo"
          className={`w-24 md:w-40 opacity-90 ${baseTransition} ${logoTransform}`}
          initial={{ opacity: 1, scale: 2, y: 20 }}
          animate={{ opacity: 1, scale: 2.2, y: 0 }}
          transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
        />
      </div>
    </section>
  );
}
