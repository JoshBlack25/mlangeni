"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, ArrowUpRight } from "lucide-react";
import Link from "next/link";

// Mock data for now — this can end up sharing a source with the browser
// site's Testimonial.jsx carousel once reviews are wired to Supabase.
const testimonials = [
  {
    name: "Diana Johnston",
    rating: 5,
    quote:
      "Every detail was handled beautifully — our guests are still talking about the food.",
    avatar:
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
  {
    name: "Lauren Contreras",
    rating: 5,
    quote:
      "Professional from the first consultation right through to the final course. Couldn't recommend them more.",
    avatar:
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
  {
    name: "Edward Alexander",
    rating: 4,
    quote:
      "Fantastic presentation and the team was flexible with our last-minute changes.",
    avatar:
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const isAutoPlaying = useRef(true);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isAutoPlaying.current) {
        setIndex((prev) => (prev + 1) % testimonials.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (testimonials.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md">
        <Star className="mb-4 text-[#D4AF37]" size={26} />
        <h3 className="text-base font-semibold text-white">No reviews yet</h3>
        <p className="mt-2 max-w-[16rem] text-sm text-[#A0A0A0]">
          Guest reviews will appear here once they start coming in.
        </p>
      </div>
    );
  }

  const active = testimonials[index];

  return (
    <div
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors duration-300 hover:border-[#D4AF37]"
      onMouseEnter={() => (isAutoPlaying.current = false)}
      onMouseLeave={() => (isAutoPlaying.current = true)}
    >
      {/* HEADER */}
      <div className="px-6 pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#A0A0A0]">
          Testimonials
        </p>
      </div>

      {/* ROTATING REVIEW */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <img
              src={active.avatar}
              alt={active.name}
              className="h-14 w-14 rounded-full border border-[#D4AF37]/40 object-cover"
            />

            <div className="mt-3 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={
                    i < active.rating
                      ? "fill-[#D4AF37] text-[#D4AF37]"
                      : "fill-transparent text-white/20"
                  }
                />
              ))}
            </div>

            <p className="mt-4 text-sm italic leading-relaxed text-white/80">
              &ldquo;{active.quote}&rdquo;
            </p>

            <p className="mt-4 text-sm font-medium text-[#D4AF37]">
              {active.name}
            </p>
            <p className="text-xs text-[#797676]">Verified Customer</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* DOTS */}
      <div className="flex justify-center gap-1.5 pb-5">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show review ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-4 bg-[#D4AF37]" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* FOOTER */}
      <Link
        href="/dashboard/customer/reviews"
        className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-sm font-medium text-[#D4AF37] transition-all duration-300 hover:gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-inset"
      >
        Leave a review
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
