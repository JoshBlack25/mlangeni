"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserCircle, User, Settings, CircleHelp, LogOut } from "lucide-react";
import Link from "next/link";

export default function ProfileMenu() {
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
        className="transition hover:scale-110"
      >
        <UserCircle size={30} className="text-white" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            className="absolute right-0 mt-5 w-72 overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0B0A09]"
          >
            <div className="border-b border-[#1F1F1F] p-5">
              <h3 className="font-semibold text-white">Joshua Adams</h3>

              <p className="text-sm text-[#A0A0A0]">Customer Account</p>
            </div>

            <MenuItem icon={<User size={18} />} text="My Profile" />

            <MenuItem icon={<Settings size={18} />} text="Settings" />

            <MenuItem
              icon={<CircleHelp size={18} />}
              text="Support"
              href="/dashboard/customer/support"
              onNavigate={() => setOpen(false)}
            />

            <div className="border-t border-[#1F1F1F]">
              {/* TODO: wire supabase.auth.signOut() + redirect to /login */}
              <MenuItem icon={<LogOut size={18} />} text="Logout" danger />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, text, danger = false, href, onNavigate }) {
  const className = `flex w-full items-center gap-3 px-5 py-4 text-left transition ${
    danger
      ? "text-red-400 hover:bg-red-500/10"
      : "text-[#F5F5F5] hover:bg-[#141414]"
  }`;

  if (href) {
    return (
      <Link href={href} onClick={onNavigate} className={className}>
        {icon}
        <span>{text}</span>
      </Link>
    );
  }

  return (
    <button className={className}>
      {icon}
      <span>{text}</span>
    </button>
  );
}
