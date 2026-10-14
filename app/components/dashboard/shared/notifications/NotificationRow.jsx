"use client";

import { motion } from "framer-motion";
import { focusRing } from "@/app/components/dashboard/ui";
import { EASE } from "@/app/components/dashboard/shared/motion";
import { cn } from "@/lib/utils";

export function formatNotificationTime(dateString) {
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

/*
 * One calm list row, shared by the customer and admin notifications
 * pages. Self-contained (props only). Render inside a <ul> wrapped in
 * <AnimatePresence> so removals fade out.
 */
export default function NotificationRow({ notification, onOpen }) {
  const unread = !notification.is_read;

  return (
    <motion.li
      layout
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:gap-4"
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "group flex min-w-0 flex-1 items-start gap-3 rounded-control py-1 text-left",
          focusRing,
        )}
      >
        <span className="mt-2 flex w-1.5 shrink-0 justify-center" aria-hidden="true">
          {unread && <span className="size-1.5 rounded-full bg-mgh-gold" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span
              className={cn(
                "text-[15px] group-hover:underline group-hover:decoration-mgh-line-strong group-hover:underline-offset-4",
                unread ? "font-medium text-mgh-text" : "text-mgh-muted",
              )}
            >
              {unread && <span className="sr-only">Unread: </span>}
              {notification.title}
            </span>
            <span className="text-caption text-mgh-dim">
              {formatNotificationTime(notification.created_at)}
            </span>
          </span>

          <span
            className={cn(
              "mt-1 line-clamp-2 block max-w-3xl text-sm leading-relaxed",
              unread ? "text-mgh-muted" : "text-mgh-dim",
            )}
          >
            {notification.message}
          </span>
        </span>
      </button>
    </motion.li>
  );
}
