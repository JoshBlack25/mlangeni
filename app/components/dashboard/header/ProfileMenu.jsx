"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { User, CircleHelp, LogOut } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";
import { cn } from "@/lib/utils";
import { focusRing } from "../ui";
import { EASE, DUR } from "../shared/motion";
import Monogram from "../shared/Monogram";
import { ActiveMark } from "./NotificationBell";

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** `markActive` underlines the trigger on account pages (customer top bar). */
export default function ProfileMenu({ markActive = false }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [displayName, setDisplayName] = useState("Customer");
  const [role, setRole] = useState(null); // "admin" | "customer" | null

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data: { user } = {}, error } = await supabase.auth.getUser();
        if (error || !user) return;

        const metadata = user.user_metadata ?? {};
        const first = metadata.first_name ?? user.user_metadata?.firstName ?? "";
        const last = metadata.last_name ?? user.user_metadata?.lastName ?? "";
        const name = `${first} ${last}`.trim() || user.email?.split("@")[0] || "User";

        const { data: isAdmin } = await supabase.rpc("is_admin");

        if (mounted) {
          setDisplayName(name);
          setRole(isAdmin ? "admin" : "customer");
        }
      } catch {
        // The menu still works with the fallback name.
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
    if (!open) return;

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    // Menus open with focus on their first item.
    const frame = requestAnimationFrame(() => {
      menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleMenuKeyDown(event) {
    const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])];
    const index = items.indexOf(document.activeElement);
    const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: items.length - 1 };
    if (!(event.key in moves) || !items.length) return;
    event.preventDefault();
    items[(moves[event.key] + items.length) % items.length].focus();
  }

  const profileHref = role === "admin" ? "/dashboard/admin/profile" : "/dashboard/customer/profile";
  const onAccountPage =
    markActive && (pathname.startsWith(profileHref) || pathname.startsWith("/dashboard/customer/support"));

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Account menu for ${displayName}${onAccountPage ? ", current page" : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "relative grid size-10 place-items-center rounded-control transition-colors hover:bg-mgh-surface-2",
          open && "bg-mgh-surface-2",
          focusRing,
        )}
      >
        <Monogram initials={initialsOf(displayName)} size={30} />
        {onAccountPage && <ActiveMark />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label="Account"
            onKeyDown={handleMenuKeyDown}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: DUR.fast, ease: EASE }}
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-card border border-mgh-line-strong bg-mgh-surface py-1.5 shadow-modal"
          >
            <div className="border-b border-mgh-line px-4 pb-3 pt-2">
              <p className="truncate font-medium text-mgh-text">{displayName}</p>
              <p className="text-caption text-mgh-dim">
                {role === "admin" ? "Admin Account" : "Customer Account"}
              </p>
            </div>

            <div className="py-1.5">
              <MenuItem
                icon={<User size={16} aria-hidden="true" />}
                text="My Profile"
                href={profileHref}
                current={pathname.startsWith(profileHref)}
                onNavigate={() => setOpen(false)}
              />

              {role === "customer" && (
                <MenuItem
                  icon={<CircleHelp size={16} aria-hidden="true" />}
                  text="Support"
                  href="/dashboard/customer/support"
                  current={pathname.startsWith("/dashboard/customer/support")}
                  onNavigate={() => setOpen(false)}
                />
              )}
            </div>

            <div className="border-t border-mgh-line pt-1.5">
              <MenuItem
                icon={<LogOut size={16} aria-hidden="true" />}
                text="Logout"
                onSelect={handleLogout}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, text, href, current = false, onNavigate, onSelect }) {
  const className = cn(
    "mx-1.5 flex h-10 items-center gap-3 rounded-control px-2.5 text-sm transition-colors hover:bg-mgh-surface-2 hover:text-mgh-text",
    current ? "text-mgh-text" : "text-mgh-muted",
    focusRing,
    "focus-visible:ring-offset-0",
  );

  if (href) {
    return (
      <Link
        role="menuitem"
        href={href}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={className}
      >
        <span className={current ? "text-mgh-gold" : "text-mgh-dim"}>{icon}</span>
        <span>{text}</span>
      </Link>
    );
  }

  return (
    <button role="menuitem" type="button" onClick={onSelect} className={cn(className, "w-[calc(100%-0.75rem)] text-left")}>
      <span className="text-mgh-dim">{icon}</span>
      <span>{text}</span>
    </button>
  );
}
