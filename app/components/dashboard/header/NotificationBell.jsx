"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const notifications = [
  {
    id: 1,
    title: "Booking Approved",
    message: "Your wedding booking has been approved.",
    time: "5 mins ago",
  },
  {
    id: 2,
    title: "Invoice Ready",
    message: "Invoice #INV-021 is now available.",
    time: "2 hours ago",
  },
  {
    id: 3,
    title: "Consultation Reply",
    message: "Chef Michael has responded.",
    time: "Yesterday",
  },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative transition hover:scale-110"
      >
        <Bell size={21} className="text-[#D4AF37]" />

        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
          {notifications.length}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -15,
            }}
            transition={{
              duration: 0.25,
            }}
            className="absolute right-0 mt-5 w-96 overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0B0A09] shadow-2xl"
          >
            <div className="border-b border-[#1F1F1F] px-6 py-4">
              <h3 className="font-semibold text-white">Notifications</h3>
            </div>

            {notifications.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer border-b border-[#1F1F1F] px-6 py-4 transition hover:bg-[#141414]"
              >
                <h4 className="font-medium text-white">{item.title}</h4>

                <p className="mt-1 text-sm text-[#A0A0A0]">{item.message}</p>

                <p className="mt-2 text-xs text-[#797676]">{item.time}</p>
              </div>
            ))}

            <button className="w-full py-4 text-sm font-medium text-[#D4AF37] hover:bg-[#141414]">
              View All Notifications
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
