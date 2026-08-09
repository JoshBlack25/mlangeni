"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/services/supabaseClient";

import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  CreditCard,
  ShoppingCart,
  UtensilsCrossed,
  Send,
  User,
  LogOut,
} from "lucide-react";

const links = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/customer",
  },
  {
    title: "Orders",
    icon: ClipboardList,
    href: "/dashboard/customer/orders",
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/dashboard/customer/notifications",
  },
  {
    title: "Payments",
    icon: CreditCard,
    href: "/dashboard/customer/payments",
  },
  {
    title: "Booking",
    icon: ShoppingCart,
    href: "/dashboard/customer/booking",
  },
  {
    title: "Menu",
    icon: UtensilsCrossed,
    href: "/dashboard/customer/menu",
  },
  {
    title: "Enquire",
    icon: Send,
    href: "/dashboard/customer/enquiry",
  },
  {
    title: "Profile",
    icon: User,
    href: "/dashboard/customer/profile",
  },
];

export default function Navbar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    onClose();

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}

          <motion.div
            onClick={onClose}
            className="fixed inset-0 top-20 z-30 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Navbar */}

          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 right-0 top-20 z-40 border-b border-[#1F1F1F] bg-[#0A0A0A]"
          >
            <div className="mx-auto flex max-w-[1700px] items-center justify-between px-10 py-5">
              {/* LEFT: LINKS */}

              <div className="flex flex-wrap items-center gap-10">
                {links.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={onClose}
                      className={
                        active
                          ? "flex items-center gap-2 border-b-2 border-[#D4AF37] pb-2 text-sm font-medium tracking-wide text-[#D4AF37] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]"
                          : "flex items-center gap-2 border-b-2 border-transparent pb-2 text-sm font-medium tracking-wide text-[#A0A0A0] transition-all duration-300 hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]"
                      }
                    >
                      <Icon size={17} />
                      {item.title}
                    </Link>
                  );
                })}
              </div>

              {/* RIGHT: LOGOUT */}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 border-b-2 border-transparent pb-2 text-sm font-semibold tracking-wide text-red-400 transition-all duration-300 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
