"use client";

import { Fragment } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { focusRing } from "../ui";
import { EASE, DUR } from "../shared/motion";
import NotificationBell from "../header/NotificationBell";
import ProfileMenu from "../header/ProfileMenu";
import BrandMark from "./BrandMark";
import { NAV } from "./navConfig";
import { useActiveItem } from "./useNav";

/**
 * Customer shell: an open top bar. Navigation sits in three quiet clusters
 * from lg up; phones get the page name here and the tab bar below.
 */
export default function CustomerTopBar() {
  const active = useActiveItem("customer");
  const groups = NAV.customer.groups.filter((g) => !g.desktopHidden);

  return (
    <header className="sticky top-0 z-40 border-b border-mgh-line bg-mgh-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-customer items-center gap-6 px-4 sm:px-6 md:px-10 lg:h-[72px]">
        <BrandMark href={NAV.customer.home} className="shrink-0" />

        <nav aria-label="Dashboard" className="hidden h-full flex-1 items-stretch justify-center lg:flex">
          {groups.map((group, gi) => (
            <Fragment key={group.label ?? "home"}>
              {gi > 0 && <span aria-hidden="true" className="mx-3 my-auto h-4 w-px bg-mgh-line-strong" />}
              <ul className="flex items-stretch" aria-label={group.label ?? undefined}>
                {group.items.map((item) => {
                  const isActive = active?.href === item.href;
                  return (
                    <li key={item.href} className="relative flex">
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "my-auto rounded-control px-3 py-2 text-sm transition-colors duration-[var(--mgh-dur-fast)]",
                          isActive ? "text-mgh-text" : "text-mgh-muted hover:text-mgh-text",
                          focusRing,
                        )}
                      >
                        {item.title}
                      </Link>
                      {isActive && (
                        <motion.span
                          layoutId="customer-nav-active"
                          transition={{ duration: DUR.base, ease: EASE }}
                          className="absolute inset-x-3 -bottom-px h-0.5 bg-mgh-gold"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </Fragment>
          ))}
        </nav>

        <p className="min-w-0 flex-1 truncate text-sm text-mgh-muted lg:hidden">{active?.title}</p>

        <div className="flex shrink-0 items-center gap-1.5">
          <NotificationBell basePath="/dashboard/customer" markActive />
          <ProfileMenu markActive />
        </div>
      </div>
    </header>
  );
}
