"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa";

const gold = "text-[#D4AF37]";
const goldGlow =
  "[text-shadow:0_0_6px_rgba(212,175,55,0.7),0_0_16px_rgba(212,175,55,0.4)]";

export default function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-[#0a0a0a] text-white px-6 md:px-12 py-20 font-[Playfair_Display]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* LOGO */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src="/logo.png"
            alt="Logo"
            className="h-35 md:h-40 object-contain brightness-110 mx-auto md:mx-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* LINKS */}
        <div className="space-y-3 text-sm text-white/60">
          {[
            "Events South Africa",
            "Events Cape Town",
            "Events Johannesburg",
            "Careers",
            "Get in Touch",
            "Sustainability",
            "Our Collection",
          ].map((item) => (
            <p
              key={item}
              className="cursor-pointer transition-all duration-300 hover:text-white hover:translate-x-1"
            >
              {item}
            </p>
          ))}
        </div>

        {/* LEGAL */}
        <div className="space-y-3 text-sm text-white/60">
          {[
            "Privacy Policy",
            "Terms & Conditions",
            "POPIA Compliance",
            "PAIA Manual",
          ].map((item) => (
            <p
              key={item}
              className="cursor-pointer transition-all duration-300 hover:text-white hover:translate-x-1"
            >
              {item}
            </p>
          ))}
        </div>

        {/* NEWSLETTER */}
        <div>
          <h3 className="text-xl font-light mb-6 tracking-wide">
            Sign up to our newsletter
          </h3>

          <div className="flex border border-white/10 overflow-hidden group">
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-4 py-3 bg-transparent text-white placeholder-white/40 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              className={`px-6 ${gold} ${goldGlow} transition-all duration-300 group-hover:bg-[#D4AF37] group-hover:text-black`}
            >
              →
            </button>
          </div>

          <div className="flex items-start gap-3 mt-5 text-sm text-white/50">
            <input type="checkbox" className="mt-1 accent-[#D4AF37]" />
            <p>
              I agree to receive marketing communication in line with POPIA
              regulations.
            </p>
          </div>

          <p className="text-xs text-white/30 mt-4">
            Your data is handled securely and in accordance with South African
            privacy laws.
          </p>

          <div className="mt-8 space-y-2 text-sm">
            <p className="text-white/70">hello@mlangeni.co.za</p>
            <p className="text-white/50">Cape Town, South Africa</p>
          </div>

          {/* SOCIALS */}
          <div className="flex gap-6 mt-6">
            {[
              { icon: FaInstagram, href: "#" },
              { icon: FaLinkedin, href: "#" },
              { icon: FaFacebook, href: "#" },
            ].map(({ icon: Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group ${gold}`}
              >
                <Icon
                  size={18}
                  className={`transition-all duration-300 ${goldGlow} group-hover:text-white group-hover:scale-110`}
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-white/10 mt-20 pt-6 flex flex-col md:flex-row justify-between text-sm text-white/40">
        <p>Mlangeni Grand Hospitality · Cape Town, South Africa</p>
        <p className="mt-2 md:mt-0">Site by CPUT</p>
      </div>
    </footer>
  );
}
