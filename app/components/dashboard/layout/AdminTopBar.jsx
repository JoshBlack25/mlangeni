"use client";

import NotificationBell from "../header/NotificationBell";
import ProfileMenu from "../header/ProfileMenu";
import BrandMark from "./BrandMark";
import { NAV } from "./navConfig";
import { useActiveItem } from "./useNav";

/** Slim admin bar: where you are, plus the bell and account menu. */
export default function AdminTopBar() {
  const active = useActiveItem("admin");

  return (
    <header className="sticky top-0 z-30 border-b border-mgh-line bg-mgh-bg/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 md:px-8">
        <BrandMark href={NAV.admin.home} compact className="lg:hidden" />
        <p className="min-w-0 flex-1 truncate text-sm">
          {active?.group && <span className="hidden text-mgh-dim sm:inline">{active.group} / </span>}
          <span className="text-mgh-muted">{active?.title}</span>
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <NotificationBell basePath="/dashboard/admin" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
