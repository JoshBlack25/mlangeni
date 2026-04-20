"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    name: "Diana Johnston",
    rating: 4.9,
    date: "29 Aug, 2017",
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam. Praesent elementum facilisis leo vel fringilla est ullamcorper eget nulla facilisi etiam dignissim.",
    avatar:
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
  {
    name: "Lauren Contreras",
    rating: 4.9,
    date: "29 Aug, 2017",
    quote:
      "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.",
    avatar:
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
  {
    name: "Edward Alexander",
    rating: 4.9,
    date: "29 Aug, 2017",
    quote:
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.",
    avatar:
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
  {
    name: "Diana Johnston",
    rating: 4.9,
    date: "29 Aug, 2017",
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam. Praesent elementum facilisis leo vel fringilla est ullamcorper eget nulla facilisi etiam dignissim.",
    avatar:
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
  {
    name: "Lauren Contreras",
    rating: 4.9,
    date: "29 Aug, 2017",
    quote:
      "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.",
    avatar:
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
  {
    name: "Edward Alexander",
    rating: 4.9,
    date: "29 Aug, 2017",
    quote:
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.",
    avatar:
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
  },
];

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

export default function Testimonial() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isAutoPlaying = useRef(true);

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
    const len = testimonials.length;
    return ((i % len) + len) % len;
  };

  const currentIndex = getSafeIndex(index);
  const activeItem = testimonials[currentIndex];

  // Truncation logic
  const needsMobileTruncation = activeItem.quote.length > MOBILE_TRUNCATE;
  const needsDesktopTruncation = activeItem.quote.length > DESKTOP_TRUNCATE;

  const mobileDisplayedQuote =
    expanded || !needsMobileTruncation
      ? activeItem.quote
      : activeItem.quote.slice(0, MOBILE_TRUNCATE).trimEnd() + "…";

  const desktopDisplayedQuote =
    expanded || !needsDesktopTruncation
      ? activeItem.quote
      : activeItem.quote.slice(0, DESKTOP_TRUNCATE).trimEnd() + "…";

  useEffect(() => {
    const timer = setInterval(() => {
      if (isAutoPlaying.current) next();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Handle mobile swipe drag
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      next();
    } else if (info.offset.x > swipeThreshold) {
      prev();
    }
  };

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

      {/* ══════════ DESKTOP CARD ══════════ */}
      <div
        className="hidden md:flex relative z-10 w-full max-w-5xl bg-[#0f0f0f]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onMouseEnter={() => (isAutoPlaying.current = false)}
        onMouseLeave={() => (isAutoPlaying.current = true)}
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
              {[-1, 0, 1].map((offset) => {
                const globalIndex = index + offset;
                const item = testimonials[getSafeIndex(globalIndex)];
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
                    className="absolute top-0 left-0 cursor-pointer"
                    onClick={() =>
                      offset === -1 ? prev() : offset === 1 ? next() : null
                    }
                  >
                    <div className="absolute -translate-x-1/2 -translate-y-1/2">
                      <Avatar src={item.avatar} active={slot === "middle"} />
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
        <div className="flex-1 pl-14 pr-20 py-16 flex items-center bg-[#0a0a0a] relative z-20">
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
                "
              </span>
              <motion.div layout>
                <p
                  className={`text-white/80 font-light italic leading-relaxed relative z-10 transition-all duration-300 ${getQuoteFontSize(
                    activeItem.quote,
                  )}`}
                >
                  <span
                    className={`font-normal text-[#D4AF37] mr-1 not-italic leading-none inline-block ${getFirstCharSize(
                      activeItem.quote,
                    )}`}
                  >
                    {activeItem.quote.charAt(0)}
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
                  {activeItem.name}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════ MOBILE CARD (Instagram Style) ══════════ */}
      <div
        className="md:hidden relative z-10 w-full max-w-[420px] bg-black border border-white/10 rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)] font-['DM_Sans'] text-white"
        onMouseEnter={() => (isAutoPlaying.current = false)}
        onMouseLeave={() => (isAutoPlaying.current = true)}
      >
        {/* IG-style Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={activeItem.avatar}
              alt={activeItem.name}
              className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]"
            />
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold tracking-wide leading-tight">
                {activeItem.name.replace(" ", "").toLowerCase()}
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

        {/* Main Swipeable Area - Long Height */}
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
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 cursor-grab active:cursor-grabbing"
            >
              {/* Quote Design inside the swipe area */}
              <div className="text-[#D4AF37] mb-4 flex gap-1 text-sm">
                ★★★★★
              </div>
              <motion.div layout className="relative w-full">
                <span className="absolute -top-6 -left-2 text-[60px] text-[#D4AF37] opacity-10 font-serif leading-none">
                  "
                </span>
                <p className="font-['Playfair_Display'] text-center italic text-lg leading-relaxed text-white/90 relative z-10">
                  {mobileDisplayedQuote}
                </p>
                {/* Mobile Read More Toggle inside the swipe area */}
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
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-4 bg-[#D4AF37]" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* IG-style Engagement Bar & Caption */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              {/* Like Button */}
              <button
                onClick={() => setLiked((l) => !l)}
                className="transition-transform active:scale-90"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={liked ? "#D4AF37" : "none"}
                  stroke={liked ? "#D4AF37" : "currentColor"}
                  strokeWidth="1.8"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              {/* Comment Icon */}
              <button className="text-white hover:text-[#D4AF37] transition-colors">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              {/* Share Icon */}
              <button className="text-white hover:text-[#D4AF37] transition-colors">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
            {/* Bookmark Icon */}
            <button className="text-white hover:text-[#D4AF37] transition-colors">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>

          <p className="text-[13px] font-semibold mb-1">
            {liked ? "128 likes" : "127 likes"}
          </p>

          <p className="text-[13px] text-white/80">
            <span className="font-semibold text-white mr-2">
              {activeItem.name.replace(" ", "").toLowerCase()}
            </span>
            Leaving a glowing 5-star review! ✨ See full quote above.
          </p>
        </div>
      </div>
    </section>
  );
}

function Avatar({ src, active }) {
  return (
    <div
      className={`rounded-full overflow-hidden transition-all duration-700 bg-[#0a0a0a] border ${
        active
          ? "w-20 h-20 border-[#D4AF37] shadow-[0_0_28px_rgba(212,175,55,0.45)] scale-110"
          : "w-14 h-14 border-white/10 opacity-20 grayscale scale-90"
      }`}
    >
      <img src={src} className="w-full h-full object-cover" alt="Avatar" />
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
        {t.name}
      </p>
      <div className="flex items-center gap-1 mt-1.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-[#D4AF37] text-[11px]">
            ★
          </span>
        ))}
      </div>
    </div>
  );
}
