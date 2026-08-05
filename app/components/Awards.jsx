"use client";

import { useEffect, useRef, useState } from "react";

const IMAGES = Array.from(
  { length: 12 },
  (_, i) => `/awards/Award-${i + 1}.png`,
);

const PIXELS_PER_SECOND = 25;

// default MUST match server + client first render
const DEFAULT_SIZES = {
  card: 150,
  height: 100,
  gap: 18,
};

export default function AwardsCarousel() {
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sizes, setSizes] = useState(DEFAULT_SIZES);

  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  const looped = [...IMAGES, ...IMAGES];

  // ✅ only run AFTER mount (fix hydration issue)
  useEffect(() => {
    const updateSizes = () => {
      const w = window.innerWidth;

      if (w < 480) {
        setSizes({ card: 110, height: 75, gap: 12 });
      } else if (w < 768) {
        setSizes({ card: 130, height: 85, gap: 14 });
      } else {
        setSizes(DEFAULT_SIZES);
      }
    };

    updateSizes(); // set correct size after mount
    window.addEventListener("resize", updateSizes);

    return () => window.removeEventListener("resize", updateSizes);
  }, []);

  const itemWidth = sizes.card + sizes.gap;
  const maxScroll = IMAGES.length * itemWidth;

  const animate = (time) => {
    if (paused) {
      lastTimeRef.current = time;
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    if (!lastTimeRef.current) lastTimeRef.current = time;

    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;

    setOffset((prev) => {
      let next = prev + (PIXELS_PER_SECOND * delta) / 1000;

      if (next >= maxScroll) next -= maxScroll;

      return next;
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [paused, sizes]);

  return (
    <div
      style={{
        width: "100%",
        overflow: "hidden",
        background: "#0a0a0a",
        borderTop: "1px solid #D4AF37",
        borderBottom: "1px solid #D4AF37",
        padding: "14px 0",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        style={{
          display: "flex",
          gap: sizes.gap,
          transform: `translateX(-${offset}px)`,
          willChange: "transform",
          width: "max-content",
          paddingLeft: 14,
        }}
      >
        {looped.map((src, i) => (
          <div
            key={i}
            style={{
              width: sizes.card,
              height: sizes.height,
              flexShrink: 0,
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={src}
              alt={`Award ${i + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
