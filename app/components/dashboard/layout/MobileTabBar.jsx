"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, focusRing } from "../ui";
import { NAV, allItems } from "./navConfig";
import { useActiveItem, useLogout } from "./useNav";

/** Phones and tablets: four destinations plus a "More" sheet with everything. */
export default function MobileTabBar({ role }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const active = useActiveItem(role);
  const logout = useLogout();
  const items = allItems(role);
  const tabs = NAV[role].tabs.map((href) => items.find((i) => i.href === href));
  const moreActive = active && !NAV[role].tabs.includes(active.href);

  const tabClass = (isActive) =>
    cn(
      "relative flex flex-col items-center justify-center gap-1 rounded-control py-2 text-[11px] font-medium",
      "transition-[color,transform] duration-[var(--mgh-dur-fast)] ease-mgh active:scale-[0.96]",
      isActive ? "text-mgh-text" : "text-mgh-dim hover:text-mgh-muted",
      focusRing,
    );

  return (
    <>
      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-mgh-line bg-mgh-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 px-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const isActive = active?.href === item.href;
            return (
              <li key={item.href} className="flex">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(tabClass(isActive), "flex-1")}
                >
                  {isActive && <TabMark />}
                  <Icon size={20} aria-hidden="true" className={isActive ? "text-mgh-gold" : undefined} />
                  {item.title === "Dashboard" ? "Home" : item.title}
                </Link>
              </li>
            );
          })}
          <li className="flex">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className={cn(tabClass(moreActive), "flex-1")}
            >
              {moreActive && <TabMark />}
              <MoreHorizontal size={20} aria-hidden="true" className={moreActive ? "text-mgh-gold" : undefined} />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="Menu">
        <nav aria-label="All pages" className="px-3 pb-2 pt-2">
          {NAV[role].groups.map((group) => (
            <div key={group.label ?? "home"} className="mb-4">
              {group.label && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-mgh-dim">
                  {group.label}
                </p>
              )}
              <ul>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active?.href === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex h-12 items-center gap-3 rounded-control px-3 text-[15px]",
                          isActive ? "bg-mgh-surface-2 text-mgh-text" : "text-mgh-muted",
                          focusRing,
                        )}
                      >
                        <Icon size={18} aria-hidden="true" className={isActive ? "text-mgh-gold" : "text-mgh-dim"} />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              logout();
            }}
            className={cn(
              "flex h-12 w-full items-center gap-3 rounded-control border-t border-mgh-line px-3 text-[15px] text-mgh-muted",
              focusRing,
            )}
          >
            <LogOut size={18} aria-hidden="true" className="text-mgh-dim" />
            Log out
          </button>
        </nav>
      </Sheet>
    </>
  );
}

/** The engraved-date hairline, marking the current tab from above. */
function TabMark() {
  return <span aria-hidden="true" className="absolute inset-x-5 -top-px h-0.5 rounded-full bg-mgh-gold" />;
}
