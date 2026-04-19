"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    name: "Diana Johnston",
    rating: 4.9,
    date: "29 Aug, 2017",
    quote:
      "Been working with appscrip for a number of years now with a variety of different apps. They have my recommendation. They are a great team.",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    name: "Lauren Contreras",
    rating: 4.9,
    date: "29 Aug, 2017",
    quote:
      "Absolutely fantastic service. The team is professional, responsive, and delivered exactly what we needed on time.",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    name: "Edward Alexander",
    rating: 4.9,
    date: "29 Aug, 2017",
    quote:
      "Top-notch quality and incredible attention to detail. Working with them has been a pleasure from start to finish — every milestone was met with precision.",
    avatar: "https://i.pravatar.cc/150?img=12",
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

// Dynamically pick font size based on quote length
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

// Truncate quote to ~120 chars for mobile collapsed view
const MOBILE_TRUNCATE = 120;

function LogoMark({ size = "md" }) {
  const sizes = {
    sm: { icon: 16, text: "text-[9px]", gap: "gap-[5px]" },
    md: { icon: 22, text: "text-[11px]", gap: "gap-[7px]" },
  };
  const s = sizes[size];
  return (
    <div className={`flex items-center ${s.gap} text-[#D4AF37]`}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="rgba(212,175,55,0.15)"
        />
      </svg>
      <span
        className={`font-['Playfair_Display'] font-semibold tracking-[0.18em] uppercase ${s.text} text-[#D4AF37] opacity-85`}
      >
        LUXE
      </span>
    </div>
  );
}

export default function Testimonial() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isAutoPlaying = useRef(true);

  const next = () => {
    setDirection(1);
    setIndex((prev) => prev + 1);
    setExpanded(false); // reset read more on slide change
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
  const needsTruncation = activeItem.quote.length > MOBILE_TRUNCATE;
  const displayedQuote =
    expanded || !needsTruncation
      ? activeItem.quote
      : activeItem.quote.slice(0, MOBILE_TRUNCATE).trimEnd() + "…";

  useEffect(() => {
    const timer = setInterval(() => {
      if (isAutoPlaying.current) next();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden px-4 py-12 font-[Playfair_Display]">
      {/* Faint background watermark */}
      <div className="w-full md:w-[60vw] h-[50vh] md:h-[70vh] rounded-4xl overflow-hidden absolute top-0 md:top-1/2 md:-translate-y-1/2 left-0 pointer-events-none">
        <img
          src="/logos/logoPNG.png"
          alt=""
          className="w-full h-full object-contain grayscale opacity-40"
        />
      </div>

      {/* ══════════ DESKTOP CARD ══════════ */}
      <div
        className="hidden md:flex relative z-10 w-full max-w-[1200px] bg-[#0f0f0f]/80 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onMouseEnter={() => (isAutoPlaying.current = false)}
        onMouseLeave={() => (isAutoPlaying.current = true)}
      >
        {/* Logo — top-right of card */}
        <div className="absolute top-6 right-8 z-30">
          <LogoMark size="md" />
        </div>

        {/* LEFT: Avatars */}
        <div className="w-[500px] relative py-16 shrink-0 flex flex-col justify-center bg-black/20">
          <div className="pl-[88px] mb-10">
            <div className="w-9 h-[1px] bg-[#D4AF37] mb-4" />
            <h2 className="font-light text-3xl text-white tracking-widest uppercase">
              Unlocked Reviews
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

        {/* RIGHT: Quote — font size adapts to length */}
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
              <p
                className={`text-white/80 font-light italic leading-relaxed relative z-10 transition-all duration-300 ${getQuoteFontSize(activeItem.quote)}`}
              >
                <span
                  className={`font-normal text-[#D4AF37] mr-1 not-italic leading-none inline-block ${getFirstCharSize(activeItem.quote)}`}
                >
                  {activeItem.quote.charAt(0)}
                </span>
                {activeItem.quote.slice(1)}
              </p>

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

      {/* ══════════ MOBILE CARD (fixed height, tweet style) ══════════ */}
      <div
        className="md:hidden relative z-10 w-full max-w-[420px] bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)] font-['DM_Sans']"
        onMouseEnter={() => (isAutoPlaying.current = false)}
        onMouseLeave={() => (isAutoPlaying.current = true)}
      >
        {/* Logo bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <LogoMark size="sm" />
          <span className="text-[11px] text-white/25 tracking-wide">
            {activeItem.date}
          </span>
        </div>

        {/* Fixed-height content area */}
        <div className="px-5 pt-5 pb-0">
          {/* User row */}
          <div className="flex items-center gap-3 mb-4">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex + "-avatar"}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.35 }}
                src={activeItem.avatar}
                alt={activeItem.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37] shadow-[0_0_14px_rgba(212,175,55,0.35)] flex-shrink-0"
              />
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex + "-name"}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.35 }}
                className="flex-1 min-w-0"
              >
                <p className="text-white text-[15px] font-medium truncate">
                  {activeItem.name}
                </p>
                <p className="text-white/30 text-[12px] mt-0.5">
                  @{activeItem.name.replace(" ", "").toLowerCase()}
                </p>
              </motion.div>
            </AnimatePresence>
            <div className="w-[18px] h-[18px] rounded-full bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 5L4 7L8 3"
                  stroke="#0a0a0a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Stars */}
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-[#D4AF37] text-[13px]">
                ★
              </span>
            ))}
          </div>

          {/* Quote — fixed height container, no layout shift */}
          <div className="min-h-[100px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex + "-" + expanded}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-white/85 font-['Playfair_Display'] italic text-[15px] leading-[1.8]">
                  <span className="text-[26px] text-[#D4AF37] not-italic leading-none align-[-6px] mr-1">
                    {activeItem.quote.charAt(0)}
                  </span>
                  {displayedQuote.slice(1)}
                </p>

                {/* Read more / less toggle */}
                {needsTruncation && (
                  <button
                    onClick={() => setExpanded((e) => !e)}
                    className="mt-2 text-[12px] text-[#D4AF37] opacity-70 hover:opacity-100 tracking-wider uppercase font-medium transition-opacity"
                  >
                    {expanded ? "Show less ↑" : "Read more ↓"}
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Engagement bar */}
        <div className="flex items-center gap-5 border-t border-white/[0.06] px-5 py-3 mt-4">
          <button
            onClick={() => setLiked((l) => !l)}
            className={`flex items-center gap-1.5 text-[13px] transition-colors ${
              liked ? "text-[#D4AF37]" : "text-white/30 hover:text-[#D4AF37]"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={liked ? "#D4AF37" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {liked ? "128" : "127"}
          </button>

          <button className="flex items-center gap-1.5 text-[13px] text-white/30 hover:text-[#D4AF37] transition-colors">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            24
          </button>

          <button className="flex items-center gap-1.5 text-[13px] text-white/30 hover:text-[#D4AF37] transition-colors">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.25)] flex items-center justify-center text-[#D4AF37] text-sm hover:bg-[rgba(212,175,55,0.2)] transition-colors"
            >
              ←
            </button>
            <button
              onClick={next}
              className="w-8 h-8 rounded-full bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.25)] flex items-center justify-center text-[#D4AF37] text-sm hover:bg-[rgba(212,175,55,0.2)] transition-colors"
            >
              →
            </button>
          </div>
        </div>

        {/* Source footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-white/[0.04]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] opacity-50" />
          <span className="text-[11px] text-white/20 tracking-wide">
            Verified review · LUXE Platform
          </span>
        </div>
      </div>
    </div>
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
