import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import api from "../hooks/api";
import type { Notification } from "../types/mems";

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  getNotifications: (username: string) => void;
  addNotification: (notification: Partial<Notification>) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: (username: string) => Promise<void>;
}

export type NotificationStore = NotificationState & NotificationActions;

const useRawNotificationStore = create<NotificationStore>()(
  immer((set) => ({
    notifications: [],
    isLoading: false,
    error: null,

    getNotifications: async (username: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const response = await api.get(`/notifications`);
        
        const processedNotifications = response.data.map((notification: Notification) => ({
          ...notification,
          createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date()
        }));
        
        set((state) => {
          state.notifications = processedNotifications;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = `Failed to fetch notifications`;
          state.isLoading = false;
        });
      }
    },

    addNotification: (notification: Partial<Notification>) => {
      set((state) => {
        const newNotification: Notification = {
          id: notification.id || `temp-${Date.now()}`,
          type: notification.type || 'SYSTEM',
          message: notification.message || '',
          createdAt: notification.createdAt || new Date(),
          isRead: notification.isRead || false,
          userId: notification.userId || '',
          targetId: notification.targetId || '',
          sourceUserId: notification.sourceUserId || '',
          sourceUsername: notification.sourceUsername || '',
          sourceProfilePictureUrl: notification.sourceProfilePictureUrl || '',
          senderUsername: notification.senderUsername || notification.sourceUsername || '',
          profilePictureUrl: notification.profilePictureUrl || notification.sourceProfilePictureUrl || '',
          read: notification.read || notification.isRead || false,
        };
        
        state.notifications = [newNotification, ...state.notifications];
      });
    },

    markAsRead: async (notificationId: string) => {
      try {
        // Mark all notifications as read when clicking on any individual notification
        set((state) => {
          state.notifications = state.notifications.map((notification: Notification) => ({
            ...notification,
            isRead: true,
            read: true
          }));
        });

        await api.post(`/notifications/readAll`);
      } catch (error) {
        set((state) => {
          state.notifications = state.notifications.map((notification: Notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: false, read: false }
              : notification
          );
          state.error = `Failed to mark notification as read`;
        });
      }
    },

    markAllAsRead: async () => {
      try {
        set((state) => {
          state.notifications = state.notifications.map((notification: Notification) => ({
            ...notification,
            isRead: true,
            read: true
          }));
        });

        await api.post(`/notifications/readAll`);
      } catch (error) {
        set((state) => {
          state.error = `Failed to mark all notifications as read`;
        });
      }
    },

    clearAllNotifications: async (username: string) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        await api.delete(`/notifications/${username}`);
        
        set((state) => {
          state.notifications = [];
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = `Failed to clear notifications`;
          state.isLoading = false;
        });
      }
    },
  }))
);

export const useNotificationStore = createSelectors<NotificationState, NotificationActions>(useRawNotificationStore);