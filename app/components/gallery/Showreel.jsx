"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import IMAGES from "../constants/image.js";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

function Showreel() {
  const [playing, setPlaying] = React.useState(false);
  const backRef = React.useRef(null);

  // Hand focus to the reel's own controls once it starts.
  React.useEffect(() => {
    if (playing) backRef.current?.focus();
  }, [playing]);

  return (
    <section
      id="showreel"
      aria-labelledby="showreel-title"
      className="relative mx-auto aspect-[4/5] w-full max-w-[1440px] overflow-hidden bg-mgh-bg sm:aspect-video md:px-10"
    >
      <div className="relative h-full w-full overflow-hidden md:rounded-card">
        {!playing ? (
          <>
            <Image
              src={IMAGES.candlelitTable}
              alt=""
              fill
              sizes="(min-width: 1440px) 1360px, 100vw"
              className="object-cover object-[60%_55%]"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-mgh-bg/45" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <h2
                id="showreel-title"
                className="font-serif text-[2.5rem] font-normal leading-tight text-mgh-text sm:text-6xl"
              >
                A Night in Motion
              </h2>
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className={cn("group mt-8 flex items-center gap-4 rounded-full py-1 pl-1 pr-3", focusRing)}
              >
                <span className="grid size-16 place-items-center rounded-full border border-mgh-gold text-mgh-gold transition-colors duration-300 group-hover:bg-mgh-gold group-hover:text-mgh-gold-ink">
                  <Play size={20} aria-hidden="true" className="translate-x-px fill-current" />
                </span>
                <span className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-mgh-text">
                  Watch the Reel
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="showreel-title" className="sr-only">
              A Night in Motion
            </h2>
            <video
              src="/videos/showreel.mp4"
              className="h-full w-full bg-mgh-bg object-cover"
              autoPlay
              controls
              playsInline
            />
            <button
              ref={backRef}
              type="button"
              onClick={() => setPlaying(false)}
              className={cn(
                "absolute right-4 top-4 flex h-10 items-center gap-2 rounded-control border border-mgh-text/30 bg-mgh-bg/60 px-4 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-mgh-text backdrop-blur-sm transition-colors hover:border-mgh-gold",
                focusRing,
              )}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default Showreel;
