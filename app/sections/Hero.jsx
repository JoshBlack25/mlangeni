"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function Hero() {
  const [active, setActive] = useState(null); // "left" | "right" | null

  const handleToggle = (side) => {
    setActive((prev) => (prev === side ? null : side));
  };

  const baseTransition = "transition-all duration-500 ease-in";

  // Calculate the exact shift needed for the logo based on the flex ratios
  let logoTransform = "translate-x-0 translate-y-0";
  if (active === "left") {
    // Mobile shifts down (26.5vh), Desktop shifts right (17.5vw)
    logoTransform =
      "translate-y-[24.5vh] md:translate-y-0 md:translate-x-[17.5vw]";
  } else if (active === "right") {
    // Mobile shifts up (-26.5vh), Desktop shifts left (-17.5vw)
    logoTransform =
      "-translate-y-[17.5vh] md:translate-y-0 md:-translate-x-[17.5vw]";
  }

  return (
    <div className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden bg-black">
      {/* LEFT */}
      <div
        // Use pointerType "mouse" to ensure these only fire on desktop hovers.
        // This prevents mobile from getting confused when a user taps.
        onPointerEnter={(e) => e.pointerType === "mouse" && setActive("left")}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        onClick={() => handleToggle("left")}
        className={`
          relative overflow-hidden min-h-0 cursor-pointer ${baseTransition}
          
          /* DESKTOP APPLE SPLIT */
          ${active === "left" ? "md:flex-[1.35]" : active === "right" ? "md:flex-[0.65]" : "md:flex-1"}
          
          /* MOBILE FLEX EXPANSION */
          ${active === "left" ? "flex-[2.6] " : active === "right" ? "flex-[0.8]" : "flex-1 "}
          
          ${active === "right" ? "brightness-60 md:blur-[1px]" : ""}
        `}
      >
        <img
          src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2070&auto=format&fit=crop"
          className={`w-full h-full object-cover brightness-[0.4] ${baseTransition}`}
          alt="MLANGENI Events Background"
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center md:text-left px-4 md:px-0 flex flex-col gap-4">
            <h1
              className={`text-3xl sm:text-3xl md:text-4xl font-light font-[Playfair_Display] tracking-wide text-white transition-all duration-500 ease-in-out
    ${active === "left" ? "mt-4" : "mt-20 md:mt-50"}
  `}
            >
              MLANGENI Events
            </h1>

            <div
              className={`transition-all duration-500 ease-out ${
                active === "left"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <p className="text-xs sm:text-sm md:text-base leading-relaxed text-white/80 mb-0 max-w-md mx-auto md:mx-0">
                Premium catering and curated dining experiences crafted for
                every occasion.
              </p>

              <motion.button
                onClick={(e) => e.stopPropagation()}
                className="
        relative inline-flex items-center justify-center
        px-0 py-3 text-xs tracking-[0.25em] uppercase
        text-amber-200 
        transition-all duration-400
        overflow-hidden cursor-pointer
      "
                initial="rest"
                animate="rest"
                whileHover="hover"
              >
                <span className="relative z-10">Start Planning</span>

                {/* underline */}
                <motion.span
                  className="absolute left-0 bottom-1 h-[1px] bg-amber-200"
                  variants={{
                    rest: { width: "0%" },
                    hover: { width: "75%" },
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.77, 0, 0.175, 1],
                  }}
                />

                {/* glow layer */}
                <motion.span
                  className="absolute left-0 bottom-1 h-[1px] bg-amber-300 blur-[2px] opacity-60"
                  variants={{
                    rest: { width: "0%" },
                    hover: { width: "75%" },
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.77, 0, 0.175, 1],
                  }}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div
        onPointerEnter={(e) => e.pointerType === "mouse" && setActive("right")}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        onClick={() => handleToggle("right")}
        className={`
          relative overflow-hidden min-h-0 cursor-pointer ${baseTransition}
          
          /* DESKTOP APPLE SPLIT */
          ${active === "right" ? "md:flex-[1.35]" : active === "left" ? "md:flex-[0.65]" : "md:flex-1"}
          
          /* MOBILE FLEX EXPANSION */
          ${active === "right" ? "flex-[1.6]" : active === "left" ? "flex-[0.9]" : "flex-1"}

${active === "left" ? "brightness-60 md:blur-[1px]" : ""}
        `}
      >
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop"
          className={`w-full h-full object-cover brightness-[0.4] ${baseTransition}`}
          alt="Hospitality Collection Background"
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center md:text-left px-4 md:px-0 flex flex-col gap-6">
            <h1
              className={`text-3xl sm:text-3xl md:text-4xl font-light font-[Playfair_Display] tracking-wide text-white transition-all duration-500 ease-in-out
    ${active === "right" ? "mt-4 md:pl-0" : "mt-20 md:mt-50 md:pl-16"}
  `}
            >
              Hospitality Collection
            </h1>

            <div
              className={`transition-all duration-500 ease-out ${
                active === "right"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <p className="text-xs sm:text-sm md:text-base leading-relaxed text-white/80 mb-0 max-w-md mx-auto md:mx-0">
                Premium catering and curated dining experiences crafted for
                every occasion.
              </p>

              <motion.button
                onClick={(e) => e.stopPropagation()}
                className="
        relative inline-flex items-center justify-center
        px-0 py-3 text-xs tracking-[0.25em] uppercase
        text-amber-200 
        transition-all duration-400
        overflow-hidden cursor-pointer
      "
                initial="rest"
                animate="rest"
                whileHover="hover"
              >
                <span className="relative z-10">View Menus</span>

                {/* underline */}
                <motion.span
                  className="absolute left-0 bottom-1 h-[1px] bg-amber-200"
                  variants={{
                    rest: { width: "0%" },
                    hover: { width: "75%" },
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.77, 0, 0.175, 1],
                  }}
                />

                {/* glow layer */}
                <motion.span
                  className="absolute left-0 bottom-1 h-[1px] bg-amber-300 blur-[2px] opacity-60"
                  variants={{
                    rest: { width: "0%" },
                    hover: { width: "75%" },
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.77, 0, 0.175, 1],
                  }}
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
          initial={{ opacity: 0, scale: 1, y: 20 }}
          animate={{ opacity: 0.9, scale: 2.2, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            duration: 0.8,
            ease: [0.77, 0, 0.175, 1],
          }}
        />
      </div>
    </div>
  );
}
