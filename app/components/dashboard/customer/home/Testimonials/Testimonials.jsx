"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Monogram from "@/app/components/dashboard/shared/Monogram";
import StarRating from "@/app/components/dashboard/shared/StarRating";
import { fetchPublicTestimonials } from "@/services/testimonialsService";
import { EASE } from "@/app/components/dashboard/shared/motion";
import { Panel, Skeleton, focusRing } from "@/app/components/dashboard/ui";
import { cn } from "@/lib/utils";

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

  const reviewLink = (label) => (
    <Link
      href="/dashboard/customer/reviews"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm text-sm text-mgh-muted transition-colors hover:text-mgh-text",
        focusRing,
      )}
    >
      {label}
      <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );

  if (testimonials === null) {
    return (
      <Panel aria-hidden>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-3 h-4 w-1/2" />
      </Panel>
    );
  }

  if (testimonials.length === 0) {
    return (
      <Panel className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-xl font-medium text-mgh-text">No reviews yet</h2>
          <p className="mt-1 text-sm text-mgh-muted">
            Guest reviews will appear here once they start coming in.
          </p>
        </div>
        {reviewLink("Leave the first one")}
      </Panel>
    );
  }

  const active = testimonials[index % testimonials.length];

  return (
    <Panel
      aria-labelledby="testimonials-title"
      onMouseEnter={() => (isAutoPlaying.current = false)}
      onMouseLeave={() => (isAutoPlaying.current = true)}
      onFocus={() => (isAutoPlaying.current = false)}
      onBlur={() => (isAutoPlaying.current = true)}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="testimonials-title" className="text-label font-semibold uppercase text-mgh-dim">
          Testimonials
        </h2>
        {testimonials.length > 1 && (
          <div className="flex items-center gap-1">
            {testimonials.map((t, i) => (
              <button
                key={t.testimonial_id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show review ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={cn("grid size-6 place-items-center rounded-full", focusRing)}
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-4 bg-mgh-gold" : "w-1.5 bg-mgh-line-strong",
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div aria-live="polite" className="mt-5 min-h-28">
        <AnimatePresence mode="wait">
          <motion.figure
            key={active.testimonial_id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8"
          >
            <blockquote className="max-w-2xl flex-1 font-serif text-lg leading-relaxed text-mgh-text md:text-xl">
              &ldquo;{active.message}&rdquo;
            </blockquote>
            <figcaption className="flex shrink-0 items-center gap-3 md:w-56">
              <Monogram initials={active.initials} size={40} />
              <span className="min-w-0">
                <span className="block truncate text-sm text-mgh-text">{active.display_name}</span>
                <span className="block truncate text-caption text-mgh-dim">
                  {active.event_name ?? "Verified Customer"}
                </span>
                <StarRating value={active.rating} size={12} className="mt-1" />
              </span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      <div className="mt-6 border-t border-mgh-line pt-4">{reviewLink("Leave a review")}</div>
    </Panel>
  );
}
