"use client";

import { useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const IMAGES = Array.from({ length: 12 }, (_, i) => `/awards/Award-${i + 1}.png`);

/**
 * The awards, drifting past slowly. A CSS animation (no per-frame React
 * work), paused on hover or with the button, and still under reduced motion,
 * where the strip simply scrolls by hand.
 */
export default function AwardsCarousel() {
  const [paused, setPaused] = useState(false);

  return (
    <section aria-label="Awards" className="relative border-y border-mgh-line bg-mgh-bg">
      <div className="mgh-marquee-viewport overflow-hidden py-6">
        <div className="mgh-marquee flex w-max" data-paused={paused || undefined}>
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 || undefined}
              // Trailing padding equal to the gap keeps the two copies
              // identical in width, so the loop at -50% has no seam.
              className="flex shrink-0 items-center gap-6 pr-6 md:gap-10 md:pr-10"
            >
              {IMAGES.map((src, i) => (
                <li key={src} className="relative h-16 w-24 shrink-0 md:h-20 md:w-32">
                  <Image
                    src={src}
                    alt={copy === 0 ? `Award ${i + 1}` : ""}
                    fill
                    sizes="128px"
                    className="object-contain"
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "Play awards" : "Pause awards"}
        className={cn(
          "mgh-marquee-toggle absolute bottom-2 right-3 grid size-9 place-items-center rounded-full border border-mgh-line-strong bg-mgh-bg/80 text-mgh-muted backdrop-blur-sm transition-colors hover:text-mgh-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg",
        )}
      >
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
      </button>
    </section>
  );
}
