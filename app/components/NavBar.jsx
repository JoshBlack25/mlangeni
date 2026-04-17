"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const NAV_COLUMNS = [
  {
    title: "Rhubarb Events",
    cta: "Discover",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=700&q=80",
    links: [
      "Wedding",
      "Corporate",
      "Private Party",
      "Office Catering",
      "Charity",
      "Christmas",
      "Venues",
      "Catering",
      "Menus",
      "Real Events",
    ],
  },
  {
    title: "Hospitality Collection",
    cta: "Discover",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80",
    links: [
      "Restaurants, Bars & Cafés",
      "Managed Locations",
      "Workplaces",
      "Exclusive Event Venues",
      "Partnerships",
    ],
  },
  {
    title: "Why Rhubarb?",
    cta: "About Us",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=700&q=80",
    links: ["People", "Sustainability", "Creative Studio", "Latest News"],
  },
  {
    title: "Get in Touch",
    cta: "Contact",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700&q=80",
    links: ["Plan an Event", "Business Enquiries", "Careers"],
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

const colVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

// Refined Gold and Dark Theme Constants
const gold = "text-[#D4AF37]";
const goldBorder = "border-[#D4AF37]";
const goldBg = "bg-[#D4AF37]";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [inHero, setInHero] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInHero(entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* NAVBAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 py-6 transition-all duration-500
          ${inHero && !open ? "bg-transparent" : "bg-[#0a0a0a] border-b border-white/10 shadow-2xl"}`}
      >
        {/* LOGO */}
        <motion.img
          src="/logo2.png"
          alt="Logo"
          initial={false}
          animate={{
            opacity: inHero && !open ? 0 : 1,
            y: inHero && !open ? -20 : 0,
            pointerEvents: inHero && !open ? "none" : "auto",
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="h-12 md:h-14 object-contain brightness-110"
        />

        <div className="flex items-center gap-8">
          {/* CTA */}
          <button
            className={`text-[0.7rem] tracking-[0.3em] uppercase font-medium ${gold} border-b ${goldBorder} pb-1 hover:text-white hover:border-white transition-all duration-300`}
          >
            Get in Touch
          </button>

          {/* HAMBURGER / X */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex flex-col justify-center items-center w-8 h-8 group"
            aria-label="Toggle menu"
          >
            {open ? (
              <span className={`text-[1.8rem] leading-none ${gold} font-light`}>
                ✕
              </span>
            ) : (
              <div className="space-y-1.5">
                <span
                  className={`block w-6 h-[1px] ${goldBg} transition-all group-hover:w-8`}
                />
                <span
                  className={`block w-8 h-[1px] ${goldBg} transition-all`}
                />
                <span
                  className={`block w-5 h-[1px] ${goldBg} transition-all group-hover:w-8`}
                />
              </div>
            )}
          </button>
        </div>
      </header>

      {/* OVERLAY */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40 bg-[#0a0a0a] text-white overflow-y-auto"
            style={{ paddingTop: 110 }} // Increased slightly to give breathing room from the header
          >
            <div className="max-w-[1600px] mx-auto px-8 md:px-12 pb-16">
              {/* MOBILE ACCORDION */}
              <div className="md:hidden py-4">
                {NAV_COLUMNS.map((col, i) => {
                  const isOpen = activeIndex === i;
                  return (
                    <div key={col.title} className="border-b border-white/10">
                      <button
                        onClick={() => setActiveIndex(isOpen ? null : i)}
                        className="w-full flex items-center justify-between py-5 text-left"
                      >
                        <span
                          className={`text-[0.85rem] tracking-[0.25em] uppercase ${isOpen ? gold : "text-white/70"}`}
                        >
                          {col.title}
                        </span>
                        <span
                          className={`${gold} text-xl transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                        >
                          +
                        </span>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pb-6 space-y-3"
                          >
                            {col.links.map((link) => (
                              <li
                                key={link}
                                className="text-[0.9rem] text-white/50 hover:text-[#D4AF37] transition"
                              >
                                {link}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP GRID */}
              {/* Changed to include gap-8 and removed all borders */}
              <div className="hidden md:grid md:grid-cols-4 gap-6 lg:gap-10 h-full pt-4">
                {NAV_COLUMNS.map((col, i) => (
                  <motion.div
                    key={col.title}
                    custom={i}
                    variants={colVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col"
                  >
                    {/* IMAGE CONTAINER */}
                    <div className="relative h-[220px] lg:h-[260px] overflow-hidden group mb-6">
                      <img
                        src={col.image}
                        alt={col.title}
                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                      />

                      {/* Dark Gradient Overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/40 to-transparent pointer-events-none" />

                      {/* CONTENT ABSOLUTE POSITIONED INSIDE IMAGE */}
                      <div className="absolute bottom-6 left-6 right-6 z-10">
                        <h3 className="font-serif text-[1.3rem] lg:text-[1.5rem] text-white mb-2 tracking-wide leading-tight drop-shadow-md">
                          {col.title}
                        </h3>
                        <span
                          className={`text-[0.6rem] tracking-[0.3em] uppercase ${gold} border-b ${goldBorder} pb-1 drop-shadow-md`}
                        >
                          {col.cta}
                        </span>
                      </div>
                    </div>

                    {/* LINKS LIST */}
                    {/* Aligned left, spacing matches the screenshot */}
                    <ul className="flex flex-col space-y-4">
                      {col.links.map((link) => (
                        <li
                          key={link}
                          className="text-[0.85rem] lg:text-[0.9rem] text-white/60 cursor-pointer hover:text-[#D4AF37] transition-all duration-300"
                        >
                          {link}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
