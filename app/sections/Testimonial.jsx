"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Share2, Check } from "lucide-react";
import Link from "next/link";
import StarRating from "@/app/components/dashboard/shared/StarRating";
import Monogram from "@/app/components/dashboard/shared/Monogram";
import { cn } from "@/lib/utils";
import {
  fetchPublicTestimonials,
  formatReviewDate,
} from "@/services/testimonialsService";

const EASE = [0.22, 1, 0.36, 1];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg";

/** "Wedding · March 2026", with either half dropping out cleanly. */
function eventLabel(item) {
  return [item.event_name, formatReviewDate(item.created_at)]
    .filter(Boolean)
    .join(" · ");
}

const DESKTOP_TRUNCATE = 180;
const MOBILE_TRUNCATE = 100;


/**
 * @param {object} props
 * @param {import("@/services/publicTestimonials").PublicTestimonial[] | null} [props.testimonials]
 *   Server-fetched reviews from app/page.tsx. `null` means the server read was
 *   unavailable, which is the only case where the client fetches for itself.
 */
export default function Testimonial({ testimonials: initial = null }) {
  // `initial` comes from app/page.tsx so the quotes are in the served HTML.
  // null means the server read was unavailable (usually: db/005 not run yet),
  // and only then does the client retry.
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(initial === null);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [shared, setShared] = useState(false);
  // Announce quote changes only once the visitor is steering; announcing
  // every autoplay tick would talk over the rest of the page.
  const [announce, setAnnounce] = useState(false);
  const isAutoPlaying = useRef(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (initial !== null) return;

    let cancelled = false;

    async function load() {
      const { testimonials } = await fetchPublicTestimonials(8, true);
      if (cancelled) return;
      setItems(testimonials);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  const list = items ?? [];
  const hasItems = list.length > 0;

  const next = () => {
    setDirection(1);
    setIndex((prev) => prev + 1);
    setExpanded(false);
    setAnnounce(true);
  };
  const prev = () => {
    setDirection(-1);
    setIndex((prev) => prev - 1);
    setExpanded(false);
    setAnnounce(true);
  };
  const goTo = (target) => {
    setDirection(target >= getSafeIndex(index) ? 1 : -1);
    setIndex(target);
    setExpanded(false);
    setAnnounce(true);
    isAutoPlaying.current = false;
  };

  const getSafeIndex = (i) => {
    const len = list.length;
    // Guard the modulo: with an empty list this used to produce NaN, and the
    // very next line would read .quote off undefined.
    if (len === 0) return 0;
    return ((i % len) + len) % len;
  };

  useEffect(() => {
    // Autoplay is a nuisance rather than a flourish when there is one review,
    // and actively hostile to anyone who has asked for less motion.
    if (!hasItems || list.length < 2 || prefersReducedMotion) return;

    const timer = setInterval(() => {
      if (isAutoPlaying.current) {
        setDirection(1);
        setIndex((prev) => prev + 1);
        setExpanded(false);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [hasItems, list.length, prefersReducedMotion]);

  // Handle mobile swipe drag
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      next();
    } else if (info.offset.x > swipeThreshold) {
      prev();
    }
  };

  async function handleShare(item) {
    const url =
      typeof window !== "undefined" ? window.location.origin + "/#testimonials" : "";
    const text = `“${item.message}” ${item.display_name}`;

    // The capability check has to live in the handler. Branching on `navigator`
    // during render produces different markup on the server and the client,
    // which React 19 reports as a hydration error.
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Mlangeni Grand Hospitality", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // A cancelled share sheet rejects; that is not an error worth showing.
    }
  }

  const currentIndex = getSafeIndex(index);
  const activeItem = hasItems ? list[currentIndex] : null;

  // Truncation logic
  const needsMobileTruncation =
    activeItem && activeItem.message.length > MOBILE_TRUNCATE;
  const needsDesktopTruncation =
    activeItem && activeItem.message.length > DESKTOP_TRUNCATE;

  const mobileDisplayedQuote = !activeItem
    ? ""
    : expanded || !needsMobileTruncation
      ? activeItem.message
      : activeItem.message.slice(0, MOBILE_TRUNCATE).trimEnd() + "…";

  const desktopDisplayedQuote = !activeItem
    ? ""
    : expanded || !needsDesktopTruncation
      ? activeItem.message
      : activeItem.message.slice(0, DESKTOP_TRUNCATE).trimEnd() + "…";

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="bg-mgh-bg px-5 py-24 md:px-10 md:py-36"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <h2
            id="testimonials-title"
            className="font-serif text-[3rem] font-normal leading-none tracking-[-0.015em] text-mgh-text sm:text-[4rem]"
          >
            Testimonials
          </h2>

          {/* Who has written to us: each face opens their words. */}
          {list.length > 1 && (
            <ul aria-label="Reviewers" className="mt-10 flex flex-wrap gap-2">
              {list.map((item, i) => {
                const current = i === currentIndex;
                return (
                  <li key={item.testimonial_id ?? i}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Read ${item.display_name}'s review`}
                      aria-current={current ? "true" : undefined}
                      className={cn(
                        "rounded-full p-0.5 transition-[opacity,box-shadow] duration-300",
                        current ? "opacity-100 ring-1 ring-mgh-gold" : "opacity-45 hover:opacity-80",
                        focusRing,
                      )}
                    >
                      <Monogram initials={item.initials} size={40} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* NO REVIEWS YET. The section keeps rendering with nothing to show,
            because the navbar links to #testimonials. Deliberately no
            placeholder quotes: invented testimonials on a trust page are
            worse than none. */}
        {!hasItems && (
          <div className="lg:col-span-8 lg:pt-4">
            {loading ? (
              <div role="status" className="flex flex-col gap-4">
                <span className="sr-only">Loading testimonials…</span>
                <span aria-hidden="true" className="mgh-shimmer block h-6 w-11/12 rounded-control" />
                <span aria-hidden="true" className="mgh-shimmer block h-6 w-4/5 rounded-control" />
                <span aria-hidden="true" className="mgh-shimmer block h-6 w-2/3 rounded-control" />
              </div>
            ) : (
              <>
                <span aria-hidden="true" className="mb-8 block h-px w-12 bg-mgh-gold" />
                <p className="font-serif text-[1.75rem] italic leading-snug text-mgh-text md:text-[2.25rem]">
                  We&rsquo;re building this page one event at a time.
                </p>
                <p className="mt-5 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-mgh-muted">
                  Reviews here come from guests we&rsquo;ve actually catered
                  for, so there&rsquo;s nothing to show until we&rsquo;ve cooked
                  for you.
                </p>
                <Link
                  href="/dashboard/customer/reviews"
                  className={cn(
                    "mt-10 inline-flex h-12 items-center rounded-control border border-mgh-line-strong px-7 text-[0.75rem] font-medium uppercase tracking-[0.22em] text-mgh-text transition-colors hover:border-mgh-gold",
                    focusRing,
                  )}
                >
                  Been a guest? Leave a review
                </Link>
              </>
            )}
          </div>
        )}

        {hasItems && (
          <figure
            className="lg:col-span-8 lg:pt-4"
            aria-roledescription="carousel"
            aria-label="Guest reviews"
            onMouseEnter={() => (isAutoPlaying.current = false)}
            onMouseLeave={() => (isAutoPlaying.current = true)}
            onFocusCapture={() => (isAutoPlaying.current = false)}
            onBlurCapture={() => (isAutoPlaying.current = true)}
            onTouchStart={() => (isAutoPlaying.current = false)}
          >
            <span aria-hidden="true" className="mb-8 block h-px w-12 bg-mgh-gold" />

            <div aria-live={announce ? "polite" : "off"} className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  drag={list.length > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.4}
                  onDragEnd={handleDragEnd}
                  className="touch-pan-y"
                >
                  <blockquote>
                    <p className="text-pretty font-serif text-[1.5rem] italic leading-[1.45] text-mgh-text md:text-[2rem] md:leading-[1.4]">
                      <span className="md:hidden">&ldquo;{mobileDisplayedQuote}&rdquo;</span>
                      <span className="hidden md:inline">&ldquo;{desktopDisplayedQuote}&rdquo;</span>
                    </p>
                  </blockquote>

                  {(needsMobileTruncation || needsDesktopTruncation) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((value) => !value);
                      }}
                      aria-expanded={expanded}
                      className={cn(
                        "mt-4 rounded-sm text-[0.72rem] font-medium uppercase tracking-[0.22em] text-mgh-gold transition-colors hover:text-mgh-text",
                        !needsDesktopTruncation && "md:hidden",
                        focusRing,
                      )}
                    >
                      {expanded ? "Show less" : "Read more"}
                    </button>
                  )}

                  <figcaption className="mt-10 flex items-center gap-4">
                    <Monogram initials={activeItem.initials} size={48} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-mgh-text">{activeItem.display_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <StarRating value={activeItem.rating} size={12} />
                        {eventLabel(activeItem) && (
                          <span className="text-sm text-mgh-muted">{eventLabel(activeItem)}</span>
                        )}
                      </div>
                    </div>
                  </figcaption>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-12 flex items-center gap-3 border-t border-mgh-line pt-6">
              {list.length > 1 && (
                <>
                  <CarouselButton onClick={prev} label="Previous testimonial">
                    <ChevronLeft size={18} aria-hidden="true" />
                  </CarouselButton>
                  <CarouselButton onClick={next} label="Next testimonial">
                    <ChevronRight size={18} aria-hidden="true" />
                  </CarouselButton>
                  <span className="ml-2 text-sm tabular-nums text-mgh-muted">
                    {currentIndex + 1} of {list.length}
                  </span>
                </>
              )}

              <button
                type="button"
                onClick={() => handleShare(activeItem)}
                aria-label="Share this review"
                className={cn(
                  "ml-auto inline-flex h-10 items-center gap-2 rounded-control border border-mgh-line-strong px-3.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-mgh-muted transition-colors hover:border-mgh-gold hover:text-mgh-text",
                  focusRing,
                )}
              >
                {shared ? <Check size={14} aria-hidden="true" /> : <Share2 size={14} aria-hidden="true" />}
                <span aria-live="polite">{shared ? "Copied" : "Share"}</span>
              </button>
            </div>
          </figure>
        )}
      </div>
    </section>
  );
}

function CarouselButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "grid size-11 place-items-center rounded-full border border-mgh-line-strong text-mgh-muted transition-colors hover:border-mgh-gold hover:text-mgh-text",
        focusRing,
      )}
    >
      {children}
    </button>
  );
}
