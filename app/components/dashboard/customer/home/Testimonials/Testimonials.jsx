"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Monogram from "@/app/components/dashboard/shared/Monogram";
import StarRating from "@/app/components/dashboard/shared/StarRating";
import { fetchPublicTestimonials } from "@/services/testimonialsService";

export default function Testimonials() {
  // null = still loading. The component used to have static data and so had no
  // loading state at all.
  const [testimonials, setTestimonials] = useState(null);
  const [index, setIndex] = useState(0);
  const isAutoPlaying = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // featuredOnly: false — this card is social proof for a signed-in
      // customer, so every approved review belongs here, with the ones the
      // admin picked for the homepage first.
      const { testimonials: rows } = await fetchPublicTestimonials(6, false);
      if (cancelled) return;
      setTestimonials(rows);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!testimonials || testimonials.length < 2) return;

    const timer = setInterval(() => {
      if (isAutoPlaying.current) {
        setIndex((prev) => (prev + 1) % testimonials.length);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials]);

  if (testimonials === null) {
    return (
      <div
        className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
        aria-hidden
      >
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-3">
          <div className="h-14 w-14 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md">
        <Star className="mb-4 text-[#D4AF37]" size={26} />
        <h3 className="text-base font-semibold text-white">No reviews yet</h3>
        <p className="mt-2 max-w-[16rem] text-sm text-[#A0A0A0]">
          Guest reviews will appear here once they start coming in.
        </p>
        <Link
          href="/dashboard/customer/reviews"
          className="mt-5 text-sm font-medium text-[#D4AF37] transition-opacity hover:opacity-80"
        >
          Leave the first one
        </Link>
      </div>
    );
  }

  const active = testimonials[index % testimonials.length];

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
            key={active.testimonial_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <Monogram initials={active.initials} size={56} />

            <StarRating value={active.rating} size={13} className="mt-3" />

            <p className="mt-4 text-sm italic leading-relaxed text-white/80">
              &ldquo;{active.message}&rdquo;
            </p>

            <p className="mt-4 text-sm font-medium text-[#D4AF37]">
              {active.display_name}
            </p>
            <p className="text-xs text-[#797676]">
              {active.event_name ?? "Verified Customer"}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* DOTS */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-5">
          {testimonials.map((t, i) => (
            <button
              key={t.testimonial_id}
              onClick={() => setIndex(i)}
              aria-label={`Show review ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-4 bg-[#D4AF37]" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      )}

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
