"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useNotifications } from "@/app/dashboard/customer/notifications/hooks/useNotifications";

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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { latestNotifications, unreadCount, loading, markAsRead } =
    useNotifications();

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

  function handleRowClick(item) {
    if (!item.is_read) {
      markAsRead(item.notification_id);
    }
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* BELL */}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative transition duration-300 hover:scale-110"
      >
        <Bell size={21} className="text-[#D4AF37]" />

        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -15,
            }}
            transition={{
              duration: 0.25,
            }}
            className="absolute right-0 z-50 mt-5 w-[380px] overflow-hidden rounded-xl border border-[#1F1F1F] bg-[#0B0A09] shadow-2xl"
          >
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#1F1F1F] px-6 py-4">
              <div>
                <h3 className="font-semibold text-white">Notifications</h3>

                {unreadCount > 0 && (
                  <p className="mt-1 text-xs text-[#777777]">
                    {unreadCount} unread
                  </p>
                )}
              </div>

              <Bell size={17} className="text-[#D4AF37]" />
            </div>

            {/* LOADING */}

            {loading && (
              <div className="px-6 py-10 text-center">
                <p className="text-sm text-[#777777]">
                  Loading notifications...
                </p>
              </div>
            )}

            {/* EMPTY */}

            {!loading && latestNotifications.length === 0 && (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#D4AF37]/5 text-[#D4AF37]">
                  <Check size={18} />
                </div>

                <p className="mt-4 text-sm text-[#777777]">
                  You're all caught up.
                </p>
              </div>
            )}

            {/* NOTIFICATIONS */}

            {!loading &&
              latestNotifications.map((item) => {
                const rowClassName = `group border-b border-[#1F1F1F] px-6 py-4 transition ${
                  item.is_read
                    ? "hover:bg-[#141414]"
                    : "bg-[#D4AF37]/[0.025] hover:bg-[#141414]"
                }`;

                const content = (
                  <div className="flex gap-3">
                    {/* UNREAD DOT */}

                    <div className="pt-1.5">
                      {!item.is_read ? (
                        <span className="block h-2 w-2 rounded-full bg-[#D4AF37]" />
                      ) : (
                        <span className="block h-2 w-2 rounded-full bg-[#333333]" />
                      )}
                    </div>

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-white">{item.title}</h4>

                      <p className="mt-1 line-clamp-2 text-sm text-[#A0A0A0]">
                        {item.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-xs text-[#797676]">
                          {formatNotificationTime(item.created_at)}
                        </p>

                        {!item.is_read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              markAsRead(item.notification_id);
                            }}
                            className="flex items-center gap-1 text-[11px] text-[#D4AF37] transition hover:text-white"
                          >
                            <Check size={12} />
                            Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );

                if (item.link_url) {
                  return (
                    <Link
                      key={item.notification_id}
                      href={item.link_url}
                      onClick={() => handleRowClick(item)}
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

            {/* FOOTER */}

            <Link
              href="/dashboard/customer/notifications"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 py-4 text-sm font-medium text-[#D4AF37] transition hover:bg-[#141414]"
            >
              View All Notifications
              <ExternalLink size={14} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
