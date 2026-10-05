"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Share2, Check } from "lucide-react";
import Link from "next/link";
import StarRating from "@/app/components/dashboard/shared/StarRating";
import Monogram from "@/app/components/dashboard/shared/Monogram";
import {
  fetchPublicTestimonials,
  formatReviewDate,
} from "@/services/testimonialsService";

const gold = "#D4AF37";

const avatarVariants = {
  enter: (direction) => ({
    y: direction > 0 ? -50 : 400,
    x: 20,
    opacity: 0,
    scale: 0.5,
  }),
  top: { y: 50, x: 70, opacity: 0.4, scale: 0.8, zIndex: 1 },
  middle: { y: 180, x: 165, opacity: 1, scale: 1, zIndex: 10 },
  bottom: { y: 310, x: 70, opacity: 0.4, scale: 0.8, zIndex: 1 },
  exit: (direction) => ({
    y: direction > 0 ? 400 : -50,
    x: 20,
    opacity: 0,
    scale: 0.5,
    zIndex: 0,
  }),
};

// Swiping variants for the mobile card
const swipeVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

function getQuoteFontSize(quote) {
  const len = quote.length;
  if (len < 80) return "text-[26px] leading-relaxed";
  if (len < 140) return "text-[22px] leading-relaxed";
  if (len < 200) return "text-[18px] leading-[1.8]";
  return "text-[15px] leading-[1.85]";
}

function getFirstCharSize(quote) {
  const len = quote.length;
  if (len < 80) return "text-[52px] align-[-18px]";
  if (len < 140) return "text-[44px] align-[-14px]";
  if (len < 200) return "text-[36px] align-[-11px]";
  return "text-[30px] align-[-9px]";
}

const DESKTOP_TRUNCATE = 180;
const MOBILE_TRUNCATE = 100;

/** "Wedding · March 2026", with either half dropping out cleanly. */
function eventLabel(item) {
  return [item.event_name, formatReviewDate(item.created_at)]
    .filter(Boolean)
    .join(" · ");
}

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
  };
  const prev = () => {
    setDirection(-1);
    setIndex((prev) => prev - 1);
    setExpanded(false);
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
    const text = `"${item.message}" — ${item.display_name}`;

    // The capability check has to live in the handler. Branching on `navigator`
    // during render produces different markup on the server and the client,
    // which React 19 reports as a hydration error.
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Mlangeni Guest House", text, url });
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
      className="min-h-[80vh] flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden px-4 py-10 font-[Playfair_Display] scroll-mt-20 md:scroll-mt-12.5"
    >
      {/* ══════════ DESKTOP BACKGROUND DECORATIONS ══════════ */}
      <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient Top Left Glow */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#D4AF37] opacity-[0.06] blur-[120px]" />

        {/* Ambient Bottom Right Glow */}
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-[#D4AF37] opacity-[0.04] blur-[140px]" />

        {/* Abstract Floating Curves */}
        <svg
          className="absolute top-0 left-0 w-full h-full opacity-30"
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M-100 250 C 300 100, 800 500, 1600 200"
            stroke="#D4AF37"
            strokeWidth="1.5"
            strokeDasharray="8 8"
            opacity="0.4"
          />
          <path
            d="M-100 650 C 400 800, 900 200, 1600 550"
            stroke="#D4AF37"
            strokeWidth="0.5"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* ══════════ NO REVIEWS YET ══════════ */}
      {/* The section keeps rendering even with nothing to show, because the
          navbar links to #testimonials — removing it leaves a dead nav item.
          Deliberately no placeholder quotes: invented testimonials on a trust
          page are worse than none. */}
      {!hasItems && (
        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="mx-auto w-9 h-[1px] bg-[#D4AF37] mb-5" />
          <h2 className="font-light text-2xl md:text-3xl text-white tracking-widest uppercase">
            Testimonials
          </h2>

          {loading ? (
            <div className="mt-10 flex flex-col items-center gap-3" aria-hidden>
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
            </div>
          ) : (
            <>
              <p className="mt-6 text-white/60 font-light italic text-lg leading-relaxed">
                We&rsquo;re building this page one event at a time.
              </p>
              <p className="mt-3 text-sm text-white/40 font-['DM_Sans']">
                Reviews here come from guests we&rsquo;ve actually catered for —
                so there&rsquo;s nothing to show until we&rsquo;ve cooked for you.
              </p>
              <Link
                href="/dashboard/customer/reviews"
                className="mt-8 inline-block border border-[#D4AF37]/40 px-7 py-3 text-[12px] uppercase tracking-[0.2em] text-[#D4AF37] font-['DM_Sans'] font-medium transition-colors hover:bg-[#D4AF37]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              >
                Been a guest? Leave a review
              </Link>
            </>
          )}
        </div>
      )}

      {/* ══════════ DESKTOP CARD ══════════ */}
      {hasItems && (
        <div
          className="hidden md:flex relative z-10 w-full max-w-5xl bg-[#0f0f0f]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          onMouseEnter={() => (isAutoPlaying.current = false)}
          onMouseLeave={() => (isAutoPlaying.current = true)}
          onFocusCapture={() => (isAutoPlaying.current = false)}
          onBlurCapture={() => (isAutoPlaying.current = true)}
        >
          <div className="absolute top-6 right-8 z-30">
            <img
              src="/logos/logoPNG.png"
              alt="Logo"
              className="w-24 h-auto object-contain opacity-70"
            />
          </div>

          {/* LEFT: Avatars */}
          <div className="w-[450px] relative py-16 shrink-0 flex flex-col justify-center bg-black/20">
            <div className="pl-[88px] mb-10">
              <div className="w-9 h-[1px] bg-[#D4AF37] mb-4" />
              <h2 className="font-light text-3xl text-white tracking-widest uppercase">
                Testimonials
              </h2>
            </div>

            <div className="relative w-full h-[380px]">
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                viewBox="0 0 500 380"
              >
                <path
                  d="M 70 50 Q 260 190 70 330"
                  stroke={gold}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  fill="none"
                />
              </svg>

              <AnimatePresence custom={direction}>
                {/* The three-slot arc only works once there are three distinct
                    people to put in it. With one or two featured reviews the
                    wrap-around would show the same face in two slots at once,
                    which reads as a bug. */}
                {(list.length >= 3 ? [-1, 0, 1] : [0]).map((offset) => {
                  const globalIndex = index + offset;
                  const item = list[getSafeIndex(globalIndex)];
                  const slot =
                    offset === -1 ? "top" : offset === 0 ? "middle" : "bottom";

                  return (
                    <motion.div
                      key={globalIndex}
                      custom={direction}
                      variants={avatarVariants}
                      initial="enter"
                      animate={slot}
                      exit="exit"
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute top-0 left-0"
                    >
                      <div className="absolute -translate-x-1/2 -translate-y-1/2">
                        <Avatar item={item} active={slot === "middle"} />
                      </div>
                      <div className="absolute left-[44px] -translate-y-1/2 w-[240px]">
                        <Info t={item} active={slot === "middle"} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Quote */}
          <div className="flex-1 pl-14 pr-20 py-16 flex flex-col justify-center bg-[#0a0a0a] relative z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full"
              >
                <span className="absolute -top-12 -left-10 text-[120px] text-[#D4AF37] opacity-[0.07] font-serif leading-none select-none">
                  &ldquo;
                </span>
                <motion.div layout aria-live="polite">
                  <p
                    className={`text-white/80 font-light italic leading-relaxed relative z-10 transition-all duration-300 ${getQuoteFontSize(
                      activeItem.message,
                    )}`}
                  >
                    <span
                      className={`font-normal text-[#D4AF37] mr-1 not-italic leading-none inline-block ${getFirstCharSize(
                        activeItem.message,
                      )}`}
                    >
                      {activeItem.message.charAt(0)}
                    </span>
                    {desktopDisplayedQuote.slice(1)}
                  </p>

                  {/* Desktop Read More Button */}
                  {needsDesktopTruncation && (
                    <button
                      onClick={() => setExpanded((e) => !e)}
                      className="mt-4 text-[12px] text-[#D4AF37] opacity-80 hover:opacity-100 tracking-wider uppercase font-medium transition-opacity"
                    >
                      {expanded ? "Show less ↑" : "Read more ↓"}
                    </button>
                  )}
                </motion.div>

                <div className="mt-8 flex items-center gap-3">
                  <div className="w-8 h-[1px] bg-[#D4AF37] opacity-50" />
                  <span className="text-[#D4AF37] text-sm tracking-widest uppercase font-['DM_Sans'] font-medium opacity-80">
                    {activeItem.display_name}
                  </span>
                  {eventLabel(activeItem) && (
                    <span className="text-white/30 text-xs font-['DM_Sans'] tracking-wide">
                      {eventLabel(activeItem)}
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Labelled controls. The avatars used to be the only way through
                the carousel, which gave keyboard and screen-reader users no
                route at all. */}
            {list.length > 1 && (
              <div className="mt-10 flex items-center gap-3">
                <CarouselButton onClick={prev} label="Previous testimonial">
                  <ChevronLeft size={16} />
                </CarouselButton>
                <CarouselButton onClick={next} label="Next testimonial">
                  <ChevronRight size={16} />
                </CarouselButton>
                <span className="ml-2 text-[11px] tracking-[0.2em] text-white/30 font-['DM_Sans']">
                  {currentIndex + 1} / {list.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ MOBILE CARD ══════════ */}
      {hasItems && (
        <div
          className="md:hidden relative z-10 w-full max-w-[420px] bg-black border border-white/10 rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)] font-['DM_Sans'] text-white"
          onTouchStart={() => (isAutoPlaying.current = false)}
          onFocusCapture={() => (isAutoPlaying.current = false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Monogram initials={activeItem.initials} size={32} />
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold tracking-wide leading-tight">
                  {activeItem.display_name}
                </span>
                <span className="text-[11px] text-white/50 leading-tight">
                  Verified Customer
                </span>
              </div>
            </div>
            {/* Logo on Card */}
            <div className="pr-1">
              <img
                src="/logos/logoPNG.png"
                alt="Logo"
                className="w-auto h-18 object-contain opacity-90"
              />
            </div>
          </div>

          {/* Main Swipeable Area */}
          <div className="relative w-full h-[450px] bg-[#0f0f0f] overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={swipeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                drag={list.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 cursor-grab active:cursor-grabbing"
              >
                <StarRating value={activeItem.rating} size={14} className="mb-4" />

                <motion.div layout className="relative w-full" aria-live="polite">
                  <span className="absolute -top-6 -left-2 text-[60px] text-[#D4AF37] opacity-10 font-serif leading-none">
                    &ldquo;
                  </span>
                  <p className="font-['Playfair_Display'] text-center italic text-lg leading-relaxed text-white/90 relative z-10">
                    {mobileDisplayedQuote}
                  </p>
                  {needsMobileTruncation && (
                    <div className="flex justify-center mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents dragging when clicking
                          setExpanded((prev) => !prev);
                        }}
                        className="text-[#D4AF37] text-[11px] uppercase tracking-widest font-semibold opacity-80"
                      >
                        {expanded ? "Show less" : "Read more"}
                      </button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Swipe Pagination Dots */}
            {list.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                {list.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? "w-4 bg-[#D4AF37]"
                        : "w-1.5 bg-white/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer. The like / comment / bookmark buttons that used to live
              here did nothing, and the "127 likes" beneath them was invented —
              fabricated engagement sitting directly under a real customer's
              words. Replaced with information a visitor can actually use. */}
          <div className="flex items-center justify-between p-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">
                {activeItem.event_name ?? "Event"}
              </p>
              <p className="text-[11px] text-white/50">
                Reviewed {formatReviewDate(activeItem.created_at)}
              </p>
            </div>

            <button
              onClick={() => handleShare(activeItem)}
              aria-label="Share this review"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] uppercase tracking-wider text-white/70 transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
            >
              {shared ? <Check size={14} /> : <Share2 size={14} />}
              {shared ? "Copied" : "Share"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function CarouselButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
    >
      {children}
    </button>
  );
}

function Avatar({ item, active }) {
  return (
    <div
      className={`rounded-full overflow-hidden transition-all duration-700 ${
        active
          ? "shadow-[0_0_28px_rgba(212,175,55,0.45)] scale-110"
          : "opacity-20 grayscale scale-90"
      }`}
    >
      <Monogram initials={item.initials} size={active ? 80 : 56} />
    </div>
  );
}

function Info({ t, active }) {
  return (
    <div
      className={`flex flex-col items-start transition-all duration-500 ${
        active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
      }`}
    >
      <p className="text-white font-medium text-[16px] tracking-wide">
        {t.display_name}
      </p>
      <StarRating value={t.rating} size={11} className="mt-1.5" />
    </div>
  );
}
