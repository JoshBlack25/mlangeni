"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EmptyState, Sheet, SkeletonRows, focusRing } from "../ui";
import { EASE, DUR } from "../shared/motion";
import { useMediaQuery } from "../shared/useMediaQuery";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/app/components/dashboard/shared/notifications/hooks/useNotifications";

// A root-relative path ("/dashboard/..."), not protocol-relative ("//evil.com")
// and not a scheme ("javascript:", "https:").
function isSafeInternalPath(url) {
  return typeof url === "string" && /^\/(?![/\\])/.test(url);
}

function formatNotificationTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const difference = Math.floor((now - date) / 1000);

  if (difference < 60) {
    return "Just now";
  }

  if (difference < 3600) {
    const minutes = Math.floor(difference / 60);
    return `${minutes}m ago`;
  }

  if (difference < 86400) {
    const hours = Math.floor(difference / 3600);
    return `${hours}h ago`;
  }

  if (difference < 604800) {
    const days = Math.floor(difference / 86400);
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotificationBell({ basePath = "/dashboard/customer", markActive = false }) {
  const [open, setOpen] = useState(false);
  const { latestNotifications, unreadCount, loading, markAsRead } =
    useNotifications();
  // Phones get a bottom sheet; a 400px dropdown would run off the screen.
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const dropdownRef = useRef(null);
  // The notifications page has no top-bar link on desktop; the bell carries
  // its active state instead.
  const pathname = usePathname() ?? "";
  const onPage = markActive && pathname.startsWith(`${basePath}/notifications`);

  useEffect(() => {
    if (!open || !isDesktop) return;

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
  }, [open, isDesktop]);

  function handleRowClick(item) {
    if (!item.is_read) {
      markAsRead(item.notification_id);
    }
    setOpen(false);
  }

  const list = (
    <NotificationList
      heading={isDesktop}
      items={latestNotifications}
      loading={loading}
      unreadCount={unreadCount}
      basePath={basePath}
      onRowClick={handleRowClick}
      onMarkRead={markAsRead}
      onViewAll={() => setOpen(false)}
    />
  );

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={[
          "Notifications",
          unreadCount > 0 && `${unreadCount} unread`,
          onPage && "current page",
        ]
          .filter(Boolean)
          .join(", ")}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "relative grid size-10 place-items-center rounded-control text-mgh-muted transition-colors hover:bg-mgh-surface-2 hover:text-mgh-text",
          (open || onPage) && "text-mgh-text",
          open && "bg-mgh-surface-2",
          focusRing,
        )}
      >
        <Bell size={19} aria-hidden="true" />
        {onPage && <ActiveMark />}

        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-mgh-gold px-1 text-[10px] font-semibold tabular-nums leading-none text-mgh-gold-ink"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isDesktop ? (
        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog"
              aria-label="Notifications"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: DUR.fast, ease: EASE }}
              className="absolute right-0 z-50 mt-2 w-[400px] overflow-hidden rounded-card border border-mgh-line-strong bg-mgh-surface shadow-modal"
            >
              {list}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <Sheet open={open} onOpenChange={setOpen} title="Notifications">
          {list}
        </Sheet>
      )}
    </div>
  );
}

function NotificationList({ items, loading, unreadCount, basePath, onRowClick, onMarkRead, onViewAll, heading = true }) {
  return (
    <>
      <div className="flex items-baseline justify-between border-b border-mgh-line px-5 py-4">
        {heading ? <p className="font-serif text-lg text-mgh-text">Notifications</p> : <span />}
        {unreadCount > 0 && (
          <p className="text-caption text-mgh-dim">{unreadCount} unread</p>
        )}
      </div>

      <div className="max-h-[60dvh] overflow-y-auto sm:max-h-[420px]">
        {loading && <SkeletonRows rows={3} label="Loading notifications…" className="px-5" />}

        {!loading && items.length === 0 && (
          <EmptyState className="px-5 py-8" title="You're all caught up." />
        )}

        {!loading &&
          items.map((item) => {
            const rowClassName = cn(
              "block border-b border-mgh-line-soft px-5 py-4 transition-colors hover:bg-mgh-surface-2",
              focusRing,
              "focus-visible:ring-inset focus-visible:ring-offset-0",
            );

            const content = (
              <div className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    item.is_read ? "bg-transparent" : "bg-mgh-gold",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", item.is_read ? "text-mgh-muted" : "font-medium text-mgh-text")}>
                    {!item.is_read && <span className="sr-only">Unread: </span>}
                    {item.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-mgh-dim">{item.message}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-caption text-mgh-dim">
                      {formatNotificationTime(item.created_at)}
                    </p>
                    {!item.is_read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onMarkRead(item.notification_id);
                        }}
                        className={cn(
                          "flex items-center gap-1 rounded-sm text-caption text-mgh-muted transition-colors hover:text-mgh-text",
                          focusRing,
                        )}
                      >
                        <Check size={12} aria-hidden="true" />
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );

            // link_url is user-supplied (customers can notify admins), so only
            // same-site paths become links — never javascript:, never off-site.
            if (isSafeInternalPath(item.link_url)) {
              return (
                <Link
                  key={item.notification_id}
                  href={item.link_url}
                  onClick={() => onRowClick(item)}
                  className={rowClassName}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={item.notification_id} className={rowClassName}>
                {content}
              </div>
            );
          })}
      </div>

      <Link
        href={`${basePath}/notifications`}
        onClick={onViewAll}
        className={cn(
          "flex w-full items-center justify-center gap-2 py-3.5 text-sm font-medium text-mgh-muted transition-colors hover:bg-mgh-surface-2 hover:text-mgh-text",
          focusRing,
          "focus-visible:ring-inset focus-visible:ring-offset-0",
        )}
      >
        View all notifications
        <ExternalLink size={14} aria-hidden="true" />
      </Link>
    </>
  );
}

/** The top bar's gold underline, for shell buttons that stand in for a nav link. */
export function ActiveMark() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-2 -bottom-[17px] hidden h-0.5 bg-mgh-gold lg:block"
    />
  );
}
