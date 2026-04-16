"use client";

import { useState } from "react";

export default function Hero() {
  const [active, setActive] = useState(null); // "left" | "right" | null

  const handleToggle = (side) => {
    setActive((prev) => (prev === side ? null : side));
  };

  const baseTransition =
    "transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)]";

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
          ${active === "left" ? "flex-[2.6]" : active === "right" ? "flex-[0.8]" : "flex-1"}
          
          ${active === "right" ? "brightness-90 md:blur-[1px]" : ""}
        `}
      >
        <img
          src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2070&auto=format&fit=crop"
          className={`w-full h-full object-cover brightness-[0.4] ${baseTransition}`}
          alt="MLANGENI Events Background"
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-md">
            <h1 className="text-4xl md:text-5xl font-light font-[Playfair_Display] mb-4">
              MLANGENI Events
            </h1>

            <div
              className={`transition-all duration-500 ${
                active === "left"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <p className="text-sm opacity-80 mb-6">
                Creating the world’s most memorable events with precision, style
                and imagination.
              </p>

              <button
                // Stop propagation so clicking the button doesn't trigger the background tap/close
                onClick={(e) => e.stopPropagation()}
                className="border border-white px-6 py-2 text-xs tracking-[0.2em] hover:bg-white hover:text-black transition"
              >
                START PLANNING
              </button>
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

${active === "left" ? "brightness-95 md:blur-[0.5px]" : ""}
        `}
      >
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop"
          className={`w-full h-full object-cover brightness-[0.4] ${baseTransition}`}
          alt="Hospitality Collection Background"
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-md">
            <h1 className="text-4xl md:text-5xl font-light font-[Playfair_Display] mb-4">
              Hospitality Collection
            </h1>

            <div
              className={`transition-all duration-500 ${
                active === "right"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <p className="text-sm opacity-80 mb-6">
                Premium catering and curated dining experiences crafted for
                every occasion.
              </p>

              <button
                onClick={(e) => e.stopPropagation()}
                className="border border-white px-6 py-2 text-xs tracking-[0.2em] hover:bg-white hover:text-black transition"
              >
                VIEW MENUS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER LOGO */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
        <img
          src="/logo2.png"
          className={`w-24 md:w-40 opacity-90 ${baseTransition} ${logoTransform}`}
          alt="Center Logo"
        />
      </div>
    </div>
  );
}
