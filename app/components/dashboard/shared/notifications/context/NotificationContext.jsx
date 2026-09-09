"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "@/services/supabaseClient";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const channelRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    async function initializeNotifications() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (userError && userError.name !== "AuthSessionMissingError") {
            console.error("Unexpected auth error:", userError);
          }
          if (mountedRef.current) {
            setNotifications([]);
          }

          return;
        }

        const { data, error } = await supabase
          .from("notifications")
          .select(
            `
            notification_id,
            user_id,
            sender_id,
            title,
            message,
            category,
            is_read,
            link_url,
            created_at,
            updated_at
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        if (mountedRef.current) {
          setNotifications(data || []);
        }

        supabase
          .getChannels()
          .filter((channel) =>
            channel.topic.startsWith("realtime:customer-notifications-"),
          )
          .forEach((channel) => {
            supabase.removeChannel(channel);
          });

        const channelName = `customer-notifications-${user.id}`;

        const channel = supabase.channel(channelName);

        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mountedRef.current) return;

            setNotifications((current) => {
              const exists = current.some(
                (notification) =>
                  notification.notification_id === payload.new.notification_id,
              );

              if (exists) {
                return current;
              }

              return [payload.new, ...current];
            });
          },
        );

        channel.on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mountedRef.current) return;

            setNotifications((current) =>
              current.map((notification) =>
                notification.notification_id === payload.new.notification_id
                  ? payload.new
                  : notification,
              ),
            );
          },
        );

        channel.on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mountedRef.current) return;

            setNotifications((current) =>
              current.filter(
                (notification) =>
                  notification.notification_id !== payload.old.notification_id,
              ),
            );
          },
        );

        channel.subscribe((status) => {
          console.log("Notification channel:", status);
        });

        channelRef.current = channel;
      } catch (err) {
        console.error("Notification Provider:", err);

        if (mountedRef.current) {
          setError(err.message);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    initializeNotifications();

    return () => {
      mountedRef.current = false;

      if (channelRef.current) {
        channelRef.current.unsubscribe();

        supabase.removeChannel(channelRef.current);

        channelRef.current = null;
      }
    };
  }, []);

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
  }

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
  }

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
  }

  // Add near the other action functions (markAsRead, deleteNotification, etc.)

  async function sendNotification({
    recipientId,
    category = "general",
    title,
    message,
    linkUrl = null,
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const { error } = await supabase.from("notifications").insert({
      user_id: recipientId,
      sender_id: user.id,
      category,
      title,
      message,
      link_url: linkUrl,
    });

    return { error };
  }

  async function notifyAllAdmins({
    category = "general",
    title,
    message,
    linkUrl = null,
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const { data: admins, error: adminError } =
      await supabase.rpc("get_admin_user_ids");

    if (adminError) {
      console.error("get_admin_user_ids failed:", adminError);
      return { error: adminError.message };
    }

    if (!admins || admins.length === 0) {
      return { error: "No admins found" };
    }

    const rows = admins.map((a) => ({
      user_id: a.user_id,
      sender_id: user.id,
      category,
      title,
      message,
      link_url: linkUrl,
    }));

    const { error } = await supabase.from("notifications").insert(rows);

    if (error) {
      console.error("Insert into notifications failed:", error);
    }

    return { error };
  }

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.is_read).length;
  }, [notifications]);

  const latestNotifications = useMemo(() => {
    return notifications.slice(0, 5);
  }, [notifications]);

  const value = {
    notifications,
    latestNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification, // NEW
    notifyAllAdmins, // NEW
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider.",
    );
  }

  return context;
}
