"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const NAV_COLUMNS = [
  {
    title: "Mlangeni Events",
    cta: "START PLANNING",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=700&q=80",
    links: [
      { label: "Wedding", href: "#wedding" },
      { label: "Corporate", href: "#corporate" },
      { label: "Private Party", href: "#private-party" },
      { label: "Office Catering", href: "#office-catering" },
      { label: "Charity", href: "#charity" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "Venues", href: "#venues" },
      { label: "Catering", href: "#catering" },
      { label: "Menus", href: "#menus" },
      { label: "Real Events", href: "#real-events" },
    ],
  },
  {
    title: "Hospitality Collection",
    cta: "VIEW MENUS",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80",
    links: [
      { label: "Restaurants, Bars & Cafés", href: "#restaurants" },
      { label: "Managed Locations", href: "#managed-locations" },
      { label: "Workplaces", href: "#workplaces" },
      { label: "Exclusive Event Venues", href: "#exclusive-venues" },
      { label: "Partnerships", href: "#partnerships" },
    ],
  },
  {
    title: "Why Mlangeni?",
    cta: "About Us",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=700&q=80",
    links: [
      { label: "People", href: "#people" },
      { label: "Sustainability", href: "#sustainability" },
      { label: "Creative Studio", href: "#creative-studio" },
      { label: "Latest News", href: "#latest-news" },
    ],
  },
  {
    title: "Get in Touch",
    cta: "Contact",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700&q=80",
    links: [
      { label: "Plan an Event", href: "#plan-event" },
      { label: "Business Enquiries", href: "#business-enquiries" },
      { label: "Careers", href: "#careers" },
    ],
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
    <nav className="font-[Playfair_Display]">
      {/* NAVBAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-18 md:h-20 flex items-center justify-between px-8 md:px-12 transition-all duration-500 
        ${
          inHero && !open
            ? "bg-transparent border-transparent"
            : "bg-[#0a0a0a] border-white/10 shadow-2xl"
        }`}
      >
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault(); // stop instant jump

            const el = document.getElementById("hero");
            if (el) {
              el.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }

            setOpen(false);
            setActiveIndex(null);
          }}
        >
          <motion.img
            src="/logos/logoPNG.png"
            alt="Logo"
            initial={false}
            animate={{
              opacity: inHero && !open ? 0 : 1,
              y: inHero && !open ? -20 : 0,
              pointerEvents: inHero && !open ? "none" : "auto",
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-24 md:h-32 object-contain brightness-110 pt-2 cursor-pointer"
          />
        </a>

        <div className="flex items-center gap-8">
          {/* GET IN TOUCH */}
          <button
            className={`text-[0.7rem] tracking-[0.3em] uppercase font-medium pb-1 transition-all duration-300 cursor-pointer border-b
    ${inHero && !open ? "text-white border-white" : `${gold} ${goldBorder}`}
    hover:text-[#D4AF37] hover:border-[#D4AF37]`}
          >
            Get in Touch
          </button>

          {/* HAMBURGER / X */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex flex-col justify-center items-center w-8 h-8 group transition-all duration-300"
            aria-label="Toggle menu"
          >
            {open ? (
              <span
                className={`text-[1.8rem] leading-none font-light transition-colors duration-300
        ${
          inHero
            ? "text-[#D4AF37] group-hover:text-[#D4AF37]"
            : `${gold} group-hover:text-[#D4AF37]`
        }`}
              >
                ✕
              </span>
            ) : (
              <div className="space-y-1.5">
                <span
                  className={`block w-6 h-[1px] transition-all duration-300
          ${inHero && !open ? "bg-white" : goldBg}
          group-hover:bg-[#D4AF37] group-hover:w-8`}
                />
                <span
                  className={`block w-8 h-[1px] transition-all duration-300
          ${inHero && !open ? "bg-white" : goldBg}
          group-hover:bg-[#D4AF37]`}
                />
                <span
                  className={`block w-5 h-[1px] transition-all duration-300
          ${inHero && !open ? "bg-white" : goldBg}
          group-hover:bg-[#D4AF37] group-hover:w-8`}
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
            style={{ paddingTop: 110 }}
          >
            <div className="max-w-400 mx-auto px-8 md:px-12 pb-16">
              {/* MOBILE */}
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
                          className={`text-[0.85rem] tracking-[0.25em] uppercase ${
                            isOpen ? gold : "text-white/70"
                          }`}
                        >
                          {col.title}
                        </span>
                        <span
                          className={`${gold} text-xl transition-transform duration-300 ${
                            isOpen ? "rotate-45" : ""
                          }`}
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
                              <li key={link.label}>
                                <a
                                  href={link.href}
                                  onClick={() => {
                                    setOpen(false);
                                    setActiveIndex(null);
                                  }}
                                  className="text-[0.9rem] text-white/60 hover:text-[#D4AF37]"
                                >
                                  {link.label}
                                </a>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP */}
              <div className="hidden md:grid md:grid-cols-4 gap-6 lg:gap-10 pt-4">
                {NAV_COLUMNS.map((col, i) => (
                  <motion.div
                    key={col.title}
                    custom={i}
                    variants={colVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col"
                  >
                    <div className="relative h-55 lg:h-65 overflow-hidden group mb-6">
                      <img
                        src={col.image}
                        alt={col.title}
                        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/40 to-transparent" />

                      <div className="absolute bottom-6 left-6 right-6 z-10">
                        <h3 className="text-[1.5rem] text-white mb-2">
                          {col.title}
                        </h3>
                        <span
                          className={`text-[0.6rem] tracking-[0.3em] uppercase ${gold} border-b ${goldBorder} pb-1`}
                        >
                          {col.cta}
                        </span>
                      </div>
                    </div>

                    <ul className="flex flex-col space-y-4">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            onClick={() => {
                              setOpen(false);
                              setActiveIndex(null);
                            }}
                            className="text-[0.9rem] text-white/60 hover:text-[#D4AF37]"
                          >
                            {link.label}
                          </a>
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
    </nav>
  );
}
