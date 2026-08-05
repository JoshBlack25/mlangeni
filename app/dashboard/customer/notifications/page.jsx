"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  Trash2,
  CalendarDays,
  CreditCard,
  ClipboardCheck,
  Info,
  X,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";

const filters = ["All", "Unread"];

const notificationIcons = {
  booking: ClipboardCheck,
  payment: CreditCard,
  event: CalendarDays,
  information: Info,
};

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

function formatFullDate(dateString) {
  return new Date(dateString).toLocaleString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedNotification, setSelectedNotification] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /*
   * ============================================================
   * LOAD NOTIFICATIONS + REALTIME
   * ============================================================
   */

  useEffect(() => {
    let channel = null;
    let mounted = true;

    async function loadNotifications() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (mounted) {
            setNotifications([]);
          }

          return;
        }

        /*
         * ============================================================
         * 1. GET EXISTING NOTIFICATIONS
         * ============================================================
         */

        const { data, error: notificationError } = await supabase
          .from("notifications")
          .select(
            `
            notification_id,
            user_id,
            title,
            message,
            is_read,
            created_at,
            updated_at
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (notificationError) {
          throw notificationError;
        }

        if (mounted) {
          setNotifications(data || []);
        }

        /*
         * ============================================================
         * 2. CREATE REALTIME CHANNEL
         * ============================================================
         *
         * IMPORTANT:
         *
         * .on() MUST be called BEFORE .subscribe()
         */

        const channelName = `customer-notifications-${user.id}-${Date.now()}`;

        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("🔔 New notification received:", payload.new);

              if (!mounted) {
                return;
              }

              setNotifications((current) => {
                const alreadyExists = current.some(
                  (notification) =>
                    notification.notification_id ===
                    payload.new.notification_id,
                );

                if (alreadyExists) {
                  return current;
                }

                return [payload.new, ...current];
              });
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("🔔 Notification updated:", payload.new);

              if (!mounted) {
                return;
              }

              setNotifications((current) =>
                current.map((notification) =>
                  notification.notification_id === payload.new.notification_id
                    ? payload.new
                    : notification,
                ),
              );

              /*
               * If the notification is currently open in the modal,
               * update the modal as well.
               */
              setSelectedNotification((current) => {
                if (current?.notification_id === payload.new.notification_id) {
                  return payload.new;
                }

                return current;
              });
            },
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("🔔 Notification deleted:", payload.old);

              if (!mounted) {
                return;
              }

              setNotifications((current) =>
                current.filter(
                  (notification) =>
                    notification.notification_id !==
                    payload.old.notification_id,
                ),
              );

              setSelectedNotification((current) => {
                if (current?.notification_id === payload.old.notification_id) {
                  return null;
                }

                return current;
              });
            },
          );

        /*
         * ============================================================
         * 3. SUBSCRIBE ONLY AFTER ALL CALLBACKS ARE REGISTERED
         * ============================================================
         */

        channel.subscribe((status) => {
          console.log(`📡 Notifications realtime status: ${status}`);

          if (status === "SUBSCRIBED") {
            console.log("✅ Customer notifications realtime connected");
          }

          if (status === "CHANNEL_ERROR") {
            console.error("❌ Customer notifications realtime channel error");
          }

          if (status === "TIMED_OUT") {
            console.error(
              "❌ Customer notifications realtime connection timed out",
            );
          }
        });
      } catch (err) {
        console.error("Notifications error:", err);

        if (mounted) {
          setError("We couldn't load your notifications. Please try again.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    /*
     * ============================================================
     * CLEANUP
     * ============================================================
     */

    return () => {
      mounted = false;

      if (channel) {
        console.log("🧹 Removing customer notifications realtime channel");

        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, []);

  /*
   * ============================================================
   * COUNTS / FILTERING
   * ============================================================
   */

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "Unread") {
      return notifications.filter((notification) => !notification.is_read);
    }

    return notifications;
  }, [notifications, activeFilter]);

  /*
   * ============================================================
   * MARK AS READ
   * ============================================================
   */

  async function markAsRead(notificationId) {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("notification_id", notificationId);

    if (error) {
      console.error("Unable to mark notification as read:", error);
      return;
    }

    /*
     * Optimistic/local update.
     */
    setNotifications((current) =>
      current.map((notification) =>
        notification.notification_id === notificationId
          ? {
              ...notification,
              is_read: true,
            }
          : notification,
      ),
    );

    setSelectedNotification((current) => {
      if (current?.notification_id === notificationId) {
        return {
          ...current,
          is_read: true,
        };
      }

      return current;
    });
  }

  /*
   * ============================================================
   * OPEN NOTIFICATION
   * ============================================================
   *
   * Opening an unread notification automatically marks it
   * as read.
   */

  async function openNotification(notification) {
    setSelectedNotification(notification);

    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }
  }

  /*
   * ============================================================
   * MARK ALL AS READ
   * ============================================================
   */

  async function markAllAsRead() {
    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.notification_id);

    if (unreadIds.length === 0) {
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .in("notification_id", unreadIds);

    if (error) {
      console.error("Unable to mark all notifications as read:", error);
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      })),
    );

    setSelectedNotification((current) => {
      if (!current) {
        return null;
      }

      return {
        ...current,
        is_read: true,
      };
    });
  }

  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  async function deleteNotification(notificationId) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("notification_id", notificationId);

    if (error) {
      console.error("Unable to delete notification:", error);
      return;
    }

    setNotifications((current) =>
      current.filter(
        (notification) => notification.notification_id !== notificationId,
      ),
    );

    setSelectedNotification(null);
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-white md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1200px]">
        {/* HEADER */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
              <Bell size={17} />
              <span>Updates</span>
            </div>

            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Notifications
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#A0A0A0] md:text-base">
              Stay up to date with your bookings, payments, events and important
              updates from Mlangeni Grand Hospitality.
            </p>
          </div>

          {/* UNREAD COUNT */}

          <div className="flex items-center gap-3">
            <div className="flex h-11 items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 text-sm text-[#D4AF37]">
              <Bell size={15} />

              <span>
                {unreadCount}{" "}
                {unreadCount === 1
                  ? "unread notification"
                  : "unread notifications"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* FILTERS */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 flex flex-col gap-5 border-b border-[#252525] pb-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-6">
            {filters.map((filter) => {
              const active = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`relative pb-3 text-sm font-medium transition-colors duration-300 ${
                    active
                      ? "text-[#D4AF37]"
                      : "text-[#777777] hover:text-white"
                  }`}
                >
                  {filter}

                  {filter === "Unread" && unreadCount > 0 && (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#D4AF37]/10 px-1.5 py-0.5 text-[10px] text-[#D4AF37]">
                      {unreadCount}
                    </span>
                  )}

                  {active && (
                    <motion.span
                      layoutId="notification-filter"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4AF37]"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm text-[#858585] transition-colors hover:text-[#D4AF37]"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </motion.div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="py-20 text-center">
            <p className="text-sm text-[#777777]">
              Loading your notifications...
            </p>
          </div>
        )}

        {/* NOTIFICATIONS */}

        {!loading && (
          <div className="mt-6">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => {
                const Icon = notificationIcons[notification.type] || Bell;

                return (
                  <motion.article
                    key={notification.notification_id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.04,
                    }}
                    onClick={() => openNotification(notification)}
                    className={`group relative mb-3 cursor-pointer border transition-all duration-300 ${
                      notification.is_read
                        ? "border-[#202020] bg-[#101010] hover:border-[#333333]"
                        : "border-[#D4AF37]/20 bg-[#D4AF37]/[0.035] hover:border-[#D4AF37]/40"
                    }`}
                  >
                    {/* UNREAD INDICATOR */}

                    {!notification.is_read && (
                      <span className="absolute bottom-0 left-0 top-0 w-[2px] bg-[#D4AF37]" />
                    )}

                    <div className="flex gap-4 p-5 md:p-6">
                      {/* ICON */}

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          notification.is_read
                            ? "bg-white/5 text-[#777777]"
                            : "bg-[#D4AF37]/10 text-[#D4AF37]"
                        }`}
                      >
                        <Icon size={19} strokeWidth={1.7} />
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h2
                                className={`text-sm font-semibold md:text-base ${
                                  notification.is_read
                                    ? "text-[#D0D0D0]"
                                    : "text-white"
                                }`}
                              >
                                {notification.title}
                              </h2>

                              {!notification.is_read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                              )}
                            </div>

                            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#5F5F5F]">
                              <Clock3 size={12} />

                              {formatNotificationTime(notification.created_at)}
                            </div>
                          </div>

                          <ExternalLink
                            size={15}
                            className="shrink-0 text-[#444444] transition-colors group-hover:text-[#D4AF37]"
                          />
                        </div>

                        <p className="mt-4 line-clamp-2 max-w-3xl text-sm leading-6 text-[#858585]">
                          {notification.message}
                        </p>

                        <div className="mt-5 flex items-center gap-2 text-xs text-[#D4AF37]">
                          <span>View notification</span>
                          <ExternalLink size={12} />
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* EMPTY STATE */}

        {!loading && filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 border border-[#202020] bg-[#101010] px-6 py-20 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37]">
              <Bell size={23} strokeWidth={1.5} />
            </div>

            <h2 className="mt-5 font-serif text-2xl text-white">
              {activeFilter === "Unread"
                ? "You're all caught up"
                : "No notifications yet"}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#666666]">
              {activeFilter === "Unread"
                ? "You have no unread notifications at the moment."
                : "Important updates about your bookings and events will appear here."}
            </p>
          </motion.div>
        )}
      </div>

      {/* ========================================================
          NOTIFICATION MODAL
          ======================================================== */}

      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 25,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 25,
                scale: 0.98,
              }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0B0A09] shadow-2xl"
            >
              {/* GOLD ACCENT */}

              <div className="absolute left-0 right-0 top-0 h-[2px] bg-[#D4AF37]" />

              {/* HEADER */}

              <div className="flex items-start justify-between border-b border-[#1F1F1F] px-6 py-6 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Bell size={21} />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                      Notification
                    </p>

                    <h2 className="mt-1 font-serif text-2xl text-white">
                      {selectedNotification.title}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  aria-label="Close notification"
                  className="rounded-lg p-2 text-[#666666] transition hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* BODY */}

              <div className="px-6 py-7 md:px-8 md:py-8">
                <div className="flex items-center gap-2 text-xs text-[#666666]">
                  <Clock3 size={13} />

                  <span>{formatFullDate(selectedNotification.created_at)}</span>
                </div>

                <div className="mt-7">
                  <p className="text-base leading-8 text-[#B0B0B0]">
                    {selectedNotification.message}
                  </p>
                </div>

                {/* READ STATUS */}

                <div className="mt-8 flex items-center gap-2 border-t border-[#1F1F1F] pt-6 text-xs">
                  <Check size={14} className="text-[#D4AF37]" />

                  <span className="text-[#666666]">
                    {selectedNotification.is_read ? "Read" : "Unread"}
                  </span>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex items-center justify-between border-t border-[#1F1F1F] px-6 py-5 md:px-8">
                <button
                  type="button"
                  onClick={() =>
                    deleteNotification(selectedNotification.notification_id)
                  }
                  className="flex items-center gap-2 text-sm text-[#666666] transition hover:text-red-400"
                >
                  <Trash2 size={15} />
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="rounded-lg border border-[#2A2A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
