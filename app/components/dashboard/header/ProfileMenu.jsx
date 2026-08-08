"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { UserCircle, User, Settings, CircleHelp, LogOut } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const [displayName, setDisplayName] = useState("Customer");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data: { user } = {}, error } = await supabase.auth.getUser();
        if (error) return;
        if (!user) return;

        const metadata = user.user_metadata ?? {};
        const first = metadata.first_name ?? user.user_metadata?.firstName ?? "";
        const last = metadata.last_name ?? user.user_metadata?.lastName ?? "";
        const name = `${first} ${last}`.trim() || user.email?.split("@")[0] || "Customer";

        if (mounted) setDisplayName(name);
      } catch (e) {
        // ignore
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    setOpen(false);

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/");
    }
  }

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
              <h3 className="font-semibold text-white">{displayName}</h3>

              <p className="text-sm text-[#A0A0A0]">Customer Account</p>
            </div>

            <MenuItem
              icon={<User size={18} />}
              text="My Profile"
              href="/dashboard/customer/profile"
              onNavigate={() => setOpen(false)}
            />

            <MenuItem icon={<Settings size={18} />} text="Settings" />

            <MenuItem
              icon={<CircleHelp size={18} />}
              text="Support"
              href="/dashboard/customer/support"
              onNavigate={() => setOpen(false)}
            />

            <div className="border-t border-[#1F1F1F]">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-5 py-4 text-left text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
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
