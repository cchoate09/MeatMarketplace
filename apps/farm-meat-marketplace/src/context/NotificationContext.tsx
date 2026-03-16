import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { listNotifications, markNotificationRead as persistNotificationRead } from "../services/profileService";
import { NotificationItem } from "../types";
import { useAuthContext } from "./AuthContext";

export interface NotificationContextValue {
  notifications: NotificationItem[];
  /** Count of unread notifications for the current user. Used for tab badges. */
  unreadCount: number;
  markNotificationRead: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Reload notifications whenever the current user changes (login / logout).
  useEffect(() => {
    void refreshNotifications();
  }, [currentUser?.id]);

  async function refreshNotifications() {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const loaded = await listNotifications(currentUser.id);
    setNotifications(loaded);
  }

  async function markNotificationRead(notificationId: string) {
    await persistNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((entry) => (entry.id === notificationId ? { ...entry, read: true } : entry))
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      markNotificationRead
    }),
    [notifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }

  return context;
}
