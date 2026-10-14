"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, CheckCheck, Send, Trash2 } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useNotifications } from "@/app/components/dashboard/shared/notifications/hooks/useNotifications";
import SendNotificationModal from "@/app/components/dashboard/shared/notifications/SendNotificationModal";
import NotificationRow from "@/app/components/dashboard/shared/notifications/NotificationRow";
import {
  Button,
  Dialog,
  EmptyState,
  PageHeader,
  Panel,
  SkeletonRows,
  Tabs,
} from "@/app/components/dashboard/ui";

const filters = ["All", "Unread"];

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

export default function AdminNotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "Unread") {
      return notifications.filter((notification) => !notification.is_read);
    }

    return notifications;
  }, [notifications, activeFilter]);

  async function openNotification(notification) {
    const updatedNotification = {
      ...notification,
      is_read: true,
    };

    setSelectedNotification(updatedNotification);

    if (!notification.is_read) {
      await markAsRead(notification.notification_id);
    }
  }

  const tabItems = filters.map((filter) => ({
    value: filter,
    label: filter,
    count: filter === "Unread" && unreadCount > 0 ? unreadCount : undefined,
  }));

  return (
    <div>
      <PageHeader
        density="dense"
        title="Notifications"
        lead="Stay on top of enquiries, orders, consultations and messages from customers across the business."
        actions={
          <>
            <p className="text-sm text-mgh-muted">
              <span className="tabular-nums">{unreadCount}</span>{" "}
              {unreadCount === 1
                ? "unread notification"
                : "unread notifications"}
            </p>
            <Button
              variant="primary"
              onClick={() => setShowSendModal(true)}
              className="w-full sm:w-auto"
            >
              <Send size={16} aria-hidden="true" />
              Send Notification
            </Button>
          </>
        }
      />

      <Panel density="dense">
        {/* FILTERS */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:border-b sm:border-mgh-line">
          <Tabs
            items={tabItems}
            value={activeFilter}
            onChange={setActiveFilter}
            label="Filter notifications"
            className="sm:border-b-0"
          />

          {unreadCount > 0 && (
            <Button
              variant="quiet"
              size="sm"
              onClick={markAllAsRead}
              className="self-start sm:mb-2 sm:self-auto"
            >
              <CheckCheck size={16} aria-hidden="true" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-control border border-mgh-danger/30 bg-mgh-danger/5 px-4 py-3 text-sm text-mgh-danger"
          >
            {error}
          </p>
        )}

        {/* LOADING */}
        {loading && (
          <SkeletonRows rows={4} label="Loading notifications..." className="mt-2" />
        )}

        {/* NOTIFICATIONS */}
        {!loading && filteredNotifications.length > 0 && (
          <ul className="divide-y divide-mgh-line-soft">
            <AnimatePresence initial={false}>
              {filteredNotifications.map((notification) => (
                <NotificationRow
                  key={notification.notification_id}
                  notification={notification}
                  onOpen={() => openNotification(notification)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredNotifications.length === 0 && (
          <EmptyState
            title={
              activeFilter === "Unread"
                ? "You're all caught up"
                : "No notifications yet"
            }
          >
            {activeFilter === "Unread"
              ? "You have no unread notifications at the moment."
              : "Updates from customers and the system will appear here."}
          </EmptyState>
        )}
      </Panel>

      {/* ========================================================
          NOTIFICATION MODAL
          ======================================================== */}

      {selectedNotification && (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) setSelectedNotification(null);
          }}
          size="lg"
          title={selectedNotification.title}
          description={formatFullDate(selectedNotification.created_at)}
        >
          <p className="whitespace-pre-line text-body leading-relaxed text-mgh-muted">
            {selectedNotification.message}
          </p>

          <p className="mt-6 flex items-center gap-2 text-caption text-mgh-dim">
            <Check size={14} aria-hidden="true" />
            {selectedNotification.is_read ? "Read" : "Unread"}
          </p>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-mgh-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="danger"
              onClick={async () => {
                await deleteNotification(
                  selectedNotification.notification_id,
                );
                setSelectedNotification(null);
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete
            </Button>

            <Button
              variant="secondary"
              onClick={() => setSelectedNotification(null)}
            >
              Close
            </Button>
          </div>
        </Dialog>
      )}

      {/* ========================================================
          SEND NOTIFICATION MODAL
          ======================================================== */}

      {showSendModal && (
        <SendNotificationModal
          mode="admin"
          currentUserId={currentUserId}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </div>
  );
}
