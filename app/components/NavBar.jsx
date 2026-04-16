"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const NAV_LINKS = ["Our Story", "Services", "Gallery", "Menus", "Contact"];

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* NAVBAR */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 h-20  backdrop-blur-xl bg-black/60 border-b border-white/10 shadow-[0_1px_0px_rgba(232,192,133,0.05)]"
      >
        <div className="w-full max-w-7xl mx-auto h-full px-8 md:px-12 lg:px-16 flex items-center justify-between">
          {/* LEFT: Logo */}
          <div className="flex items-center gap-3 px-6">
            <div className="w-8 h-8 flex items-center justify-center border border-[#e8c085]/40 rounded-full">
              <span className="text-[#e8c085] text-xs font-semibold tracking-widest">
                MGH
              </span>
            </div>

            <div className="leading-tight">
              <p className="text-[#e8c085] text-sm tracking-widest font-serif">
                MLANGENI
              </p>
              <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase">
                Grand Hospitality
              </p>
            </div>
          </div>
          {/* CENTER LINKS */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <span
                key={link}
                className="relative text-white/70 text-xs tracking-widest uppercase cursor-pointer group hover:text-white transition"
              >
                {link}
                <span className="absolute left-0 -bottom-2 w-0 h-[1px] bg-gradient-to-r from-[#e8c085] to-transparent transition-all duration-300 group-hover:w-full" />
              </span>
            ))}
          </div>
          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center justify-center min-w-[190px] h-11 px-6 bg-gradient-to-r from-[#e8c085] to-[#ae8b55] text-black text-xs tracking-[0.2em] uppercase font-semibold rounded-sm">
              Reserve Your Date
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/10 transition"
            >
              <span className="text-white text-2xl leading-none">☰</span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.4 }}
            className="fixed top-0 right-0 h-screen w-3/4 bg-black/95 backdrop-blur-2xl z-50 p-8 flex flex-col"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="text-white mb-10 self-end text-2xl"
            >
              ✕
            </button>

            <div className="flex flex-col gap-6">
              {NAV_LINKS.map((link) => (
                <span
                  key={link}
                  className="text-white/80 text-sm tracking-widest uppercase"
                >
                  {link}
                </span>
              ))}
            </div>

            <button className="mt-10 h-11 bg-gradient-to-r from-[#e8c085] to-[#ae8b55] text-black text-xs tracking-widest uppercase px-6 rounded-sm font-semibold">
              Reserve Your Date
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
