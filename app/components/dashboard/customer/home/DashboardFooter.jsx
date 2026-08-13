"use client";

import { motion } from "framer-motion";
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa";
import Link from "next/link";

const gold = "text-[#D4AF37]";
const goldGlow =
  "[text-shadow:0_0_6px_rgba(212,175,55,0.7),0_0_16px_rgba(212,175,55,0.4)]";

const quickLinks = [
  { label: "My Dashboard", href: "/dashboard/customer" },
  { label: "My Bookings", href: "/dashboard/customer/bookings" },
  { label: "Invoices", href: "/dashboard/customer/invoices" },
  { label: "Consultations", href: "/dashboard/customer/consultations" },
];

const legalLinks = [
  "Privacy Policy",
  "Terms & Conditions",
  "POPIA Compliance",
  "PAIA Manual",
];

export default function DashboardFooter() {
  return (
    <footer className="bg-[#0a0a0a] px-6 py-12 font-[Playfair_Display] text-white md:px-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-3">
        {/* LOGO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src="/logos/logoPNG.png"
            alt="Logo"
            className="mx-auto h-20 object-contain brightness-110 md:mx-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* QUICK LINKS + LEGAL */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3 text-sm text-white/60">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block cursor-pointer transition-all duration-300 hover:translate-x-1 hover:text-[#D4AF37]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="space-y-3 text-sm text-white/60">
            {legalLinks.map((item) => (
              <p
                key={item}
                className="cursor-pointer transition-all duration-300 hover:translate-x-1 hover:text-[#D4AF37]"
              >
                {item}
              </p>
            ))}
          </div>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="mb-4 text-lg font-light tracking-wide">Need help?</h3>

          <div className="space-y-2 text-sm">
            <p className="text-white/70">hello@mlangeni.co.za</p>
            <p className="text-white/50">Cape Town, South Africa</p>
          </div>

          {/* SOCIALS */}
          <div className="mt-5 flex gap-5">
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
                  size={16}
                  className={`transition-all duration-300 ${goldGlow} group-hover:scale-110 group-hover:text-white`}
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between border-t border-white/10 pt-5 text-xs text-white/40 md:flex-row">
        <p>Mlangeni Grand Hospitality · Cape Town, South Africa</p>
        <p className="mt-2 md:mt-0">Site by CPUT</p>
      </div>
    </footer>
  );
}
