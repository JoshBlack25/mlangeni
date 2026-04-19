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
      "Top-notch quality and incredible attention to detail. Working with them has been a pleasure.",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
];

const gold = "#D4AF37";
const goldGlow = "0 0 10px rgba(212,175,55,0.4)";

const avatarVariants = {
  enter: (direction) => ({
    y: direction > 0 ? -40 : 340,
    x: 0,
    opacity: 0,
    scale: 0.5,
  }),
  top: {
    y: 40,
    x: 60,
    opacity: 0.4,
    scale: 0.8,
    zIndex: 1,
  },
  middle: {
    y: 150,
    x: 140,
    opacity: 1,
    scale: 1,
    zIndex: 10,
  },
  bottom: {
    y: 260,
    x: 60,
    opacity: 0.4,
    scale: 0.8,
    zIndex: 1,
  },
  exit: (direction) => ({
    y: direction > 0 ? 340 : -40,
    x: 0,
    opacity: 0,
    scale: 0.5,
    zIndex: 0,
  }),
};

export default function Testimonial() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const isAutoPlaying = useRef(true);

  const next = () => {
    setDirection(1);
    setIndex((prev) => prev + 1);
  };

  const prev = () => {
    setDirection(-1);
    setIndex((prev) => prev - 1);
  };

  const getSafeIndex = (i) => {
    const len = testimonials.length;
    return ((i % len) + len) % len;
  };

  const currentIndex = getSafeIndex(index);
  const activeItem = testimonials[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      if (isAutoPlaying.current) next();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden px-4 py-12 font-[Playfair_Display]">
      {/* LUXURY BACKGROUND ACCENT */}
      <div className="absolute top-0 left-0 w-[80vw] md:w-[35vw] h-[40vh] md:h-[100vh] bg-[#141414] border-r border-white/5 rounded-br-[200px] md:rounded-br-[400px] z-0" />

      {/* DESKTOP VIEW */}
      <div
        className="hidden md:flex relative z-10 w-full max-w-[1000px] bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onMouseEnter={() => (isAutoPlaying.current = false)}
        onMouseLeave={() => (isAutoPlaying.current = true)}
      >
        {/* LEFT SIDE: ARC & AVATARS */}
        <div className="w-[420px] relative py-12 shrink-0 flex flex-col justify-center bg-[#111111]">
          <div className="pl-[70px] mb-8">
            <div className="w-8 h-[1px] bg-[#D4AF37] mb-3" />
            <h2 className="font-light text-2xl text-white tracking-widest uppercase">
              Guest Stories
            </h2>
          </div>

          <div className="relative w-full h-[300px]">
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
              viewBox="0 0 420 300"
            >
              <path
                d="M 60 40 Q 220 150 60 260"
                stroke="#D4AF37"
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
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-0 left-0 cursor-pointer"
                    onClick={() =>
                      offset === -1 ? prev() : offset === 1 ? next() : null
                    }
                  >
                    <div className="absolute -translate-x-1/2 -translate-y-1/2">
                      <Avatar src={item.avatar} active={slot === "middle"} />
                    </div>
                    <div className="absolute left-[36px] -translate-y-1/2 w-[220px]">
                      <Info t={item} active={slot === "middle"} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT SIDE: QUOTE */}
        <div className="flex-1 pl-12 pr-16 py-12 flex items-center bg-[#0a0a0a] relative z-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <span className="absolute -top-10 -left-10 text-8xl text-[#D4AF37] opacity-10 font-serif">
                “
              </span>
              <p className="text-white/80 text-[18px] md:text-[20px] font-light italic leading-relaxed relative z-10">
                <span className="text-4xl font-normal text-[#D4AF37] mr-1">
                  {activeItem.quote.charAt(0)}
                </span>
                {activeItem.quote.slice(1)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden relative z-10 w-full max-w-[400px] bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-xl px-6 py-10 flex flex-col items-center text-center">
        <div className="mb-8">
          <div className="w-8 h-[1px] bg-[#D4AF37] mb-2 mx-auto" />
          <h2 className="font-light text-lg text-white uppercase tracking-widest">
            Guest Stories
          </h2>
        </div>

        <div className="relative w-full overflow-hidden h-[260px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center absolute w-full"
            >
              <Avatar src={activeItem.avatar} active={true} />
              <div className="mt-4 mb-5">
                <Info t={activeItem} active={true} center />
              </div>
              <p className="text-white/70 font-light italic text-[15px] leading-relaxed">
                "{activeItem.quote}"
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-3 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-[2px] transition-all duration-500 ${
                i === currentIndex ? "w-8 bg-[#D4AF37]" : "w-3 bg-white/20"
              }`}
            />
          ))}
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
          ? "w-16 h-16 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)] scale-110"
          : "w-12 h-12 border-white/10 opacity-30 grayscale scale-90"
      }`}
    >
      <img src={src} className="w-full h-full object-cover" alt="Avatar" />
    </div>
  );
}

function Info({ t, active, center }) {
  return (
    <div
      className={`flex flex-col ${center ? "items-center" : "items-start"} transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"}`}
    >
      <p className="text-white font-medium text-[15px] tracking-wide">
        {t.name}
      </p>
      <div className="flex items-center gap-1 mt-1">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className="text-[#D4AF37] text-[10px]"
            style={{ textShadow: goldGlow }}
          >
            ★
          </span>
        ))}
        <span className="text-white/40 text-[10px] ml-2 uppercase tracking-tighter">
          {t.date}
        </span>
      </div>
    </div>
  );
}
