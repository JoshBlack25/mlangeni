"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Send,
  CalendarClock,
  ClipboardList,
  Receipt,
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react";

const actions = [
  {
    id: "enquiries",
    href: "/dashboard/admin/enquiries",
    title: "Review Enquiries",
    subtitle: "Respond to new enquiries awaiting a reply.",
    icon: <Send size={22} />,
  },
  {
    id: "consultations",
    href: "/dashboard/admin/consultations",
    title: "Consultations",
    subtitle: "See what's scheduled and confirm meetings.",
    icon: <CalendarClock size={22} />,
  },
  {
    id: "orders",
    href: "/dashboard/admin/orders",
    title: "Manage Orders",
    subtitle: "Track active bookings across all clients.",
    icon: <ClipboardList size={22} />,
  },
  {
    id: "invoices",
    href: "/dashboard/admin/invoices",
    title: "Invoices",
    subtitle: "Review outstanding and recent payments.",
    icon: <Receipt size={22} />,
  },
  {
    id: "menu-editor",
    href: "/dashboard/admin/tools/menu-editor",
    title: "Edit Menu",
    subtitle: "Add or remove dishes and drinks from the live menu.",
    icon: <UtensilsCrossed size={22} />,
  },
];

export default function AdminActionCardsRow() {
  const [lockedId, setLockedId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setLockedId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openId = lockedId ?? hoverId;

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 sm:flex-row"
      onMouseLeave={() => setHoverId(null)}
    >
      {actions.map((action) => {
        const isOpen = action.id === openId;

        return (
          <div
            key={action.id}
            onMouseEnter={() => setHoverId(action.id)}
            className={`
              group relative overflow-hidden rounded-2xl border border-white/10
              bg-white/5 backdrop-blur-md transition-all duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              hover:border-[#D4AF37]
              ${
                isOpen
                  ? "w-full p-5 sm:w-80"
                  : "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]"
              }
            `}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                >
                  <Link
                    href={action.href}
                    className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                    onClick={() => setLockedId(action.id)}
                  >
                    <div className="mb-5 inline-flex rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37] transition-all duration-300 group-hover:bg-[#D4AF37] group-hover:text-black">
                      {action.icon}
                    </div>

                    <h3 className="text-lg font-semibold text-white">
                      {action.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#A0A0A0]">
                      {action.subtitle}
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#D4AF37] transition-all duration-300 group-hover:gap-3">
                      Get Started
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                </motion.div>
              ) : (
                <motion.button
                  key="icon"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() =>
                    setLockedId(lockedId === action.id ? null : action.id)
                  }
                  aria-expanded={isOpen}
                  aria-label={action.title}
                  className="flex h-full w-full items-center justify-center text-[#D4AF37] transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                >
                  {action.icon}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
