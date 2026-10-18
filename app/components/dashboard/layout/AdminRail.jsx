"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "../ui";
import BrandMark from "./BrandMark";
import { NAV } from "./navConfig";
import { useActiveItem, useLogout } from "./useNav";

/** Admin shell: a persistent, grouped left rail from lg up. */
export default function AdminRail() {
  const active = useActiveItem("admin");
  const logout = useLogout();

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-mgh-line bg-mgh-bg lg:flex">
      <div className="flex h-14 items-center border-b border-mgh-line px-4">
        <BrandMark href={NAV.admin.home} caption="Admin" />
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.admin.groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-mgh-dim">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active?.href === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-3 rounded-control px-3 text-[13.5px] transition-colors duration-[var(--mgh-dur-fast)]",
                        isActive
                          ? "bg-mgh-surface-2 text-mgh-text"
                          : "text-mgh-muted hover:bg-mgh-surface hover:text-mgh-text",
                        focusRing,
                      )}
                    >
                      <Icon size={16} aria-hidden="true" className={isActive ? "text-mgh-gold" : "text-mgh-dim"} />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-mgh-line p-3">
        <button
          type="button"
          onClick={logout}
          className={cn(
            "flex h-9 w-full items-center gap-3 rounded-control px-3 text-[13.5px] text-mgh-muted transition-colors hover:bg-mgh-surface hover:text-mgh-text",
            focusRing,
          )}
        >
          <LogOut size={16} aria-hidden="true" className="text-mgh-dim" />
          Log out
        </button>
      </div>
    </aside>
  );
}
