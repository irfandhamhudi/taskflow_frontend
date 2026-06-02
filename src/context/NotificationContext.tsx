import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { toast } from "sonner";
import api from "../utils/api";

import type { Notification } from "../types/notification";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markNotificationsAsRead: (ids: string[]) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteNotifications: (ids: string[]) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  updatePreferences: (payload: any) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { socket } = useSocket(); // GUNAKAN HOOK INI
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const res = await api.get("/notifications?limit=20");
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.meta.unread_count);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
        setNotifications([]);
        setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Socket listener
  useEffect(() => {
    if (!socket) {
        console.log("NotificationContext: Socket not available yet");
        return;
    }
    if (!isAuthenticated) {
        console.log("NotificationContext: Not authenticated");
        return;
    }

    console.log("NotificationContext: Setting up new_notification listener", { socketId: socket.id });

    const handleNewNotification = (notification: Notification) => {
        console.log("NotificationContext: Received new_notification", notification);
        // Optimistic update
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Show toast ONLY if sender is NOT current user (prevent double toast)
        const senderId = typeof notification.sender === 'object' ? notification.sender._id : notification.sender;
        if (user?._id && String(user._id) !== String(senderId)) {
           toast.info(notification.message, {
              description: "New notification",
           });
        }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      console.log("NotificationContext: Cleaning up listener");
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, isAuthenticated, user]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await api.put(`/notifications/${id}/read`, {});
    } catch (error) {
      console.error("Error marking as read:", error);
      // Revert if error (optional, skipping for simplicity)
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await api.put("/notifications/mark-all-read", {});
    } catch (error) {
        console.error("Error marking all as read:", error);
    }
  };

  const markNotificationsAsRead = async (ids: string[]) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n._id) ? { ...n, isRead: true } : n))
      );
      // Recalc unread
      // Ideally we count how many in 'ids' were unread
      const justReadCount = notifications.filter(n => ids.includes(n._id) && !n.isRead).length;
      setUnreadCount((prev) => Math.max(0, prev - justReadCount));

      await api.post("/notifications/read-many", { ids });
    } catch (error) {
      console.error("Error marking multiple as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const deleteNotifications = async (ids: string[]) => {
    try {
      setNotifications((prev) => prev.filter((n) => !ids.includes(n._id)));
      // Recalc unread
      const removedUnread = notifications.filter(n => ids.includes(n._id) && !n.isRead).length;
      setUnreadCount((prev) => Math.max(0, prev - removedUnread));

      await api.post("/notifications/delete-many", { ids });
    } catch (error) {
      console.error("Error deleting notifications:", error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);

      await api.delete("/notifications/delete-all");
    } catch (error) {
       console.error("Error deleting all notifications:", error);
    }
  };

  const updatePreferences = async (payload: any) => {
    try {
      await api.put("/profile", payload);
      toast.success("Preferences updated successfully");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
      throw error;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        markNotificationsAsRead,
        deleteNotification,
        deleteNotifications,
        deleteAllNotifications,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
