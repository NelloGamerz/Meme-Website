import { useState, useEffect } from "react"
import { useUserStore } from "../store/useUserStore"
import { useNotificationStore } from "../store/useNotificationStore"
import { useWebSocketStore } from "../hooks/useWebSockets"
import { useAuthStore } from "../store/useAuthStore"
import { Notification } from "../types/mems"
import { WebSocketMessage } from "../services/WebSocketService"

interface NotificationData {
  type: string;
  senderUsername?: string;
  username?: string;
  followerUsername?: string;
  message?: string;
  memeId?: string;
  id?: string;
  senderId?: string;
  userId?: string;
  profilePictureUrl?: string;
  senderProfilePictureUrl?: string;
  recipientId?: string;
  recipientUsername?: string;
  receiverUsername?: string;
  targetUsername?: string;
}

// Global state to prevent duplicate API calls
let globalState = {
  user: { userId: "", username: "", email: "", profilePicture: "" },
  notificationsFetched: false,
  webSocketHandlersRegistered: false,
  unregisterHandlers: [] as (() => void)[],
  subscribers: new Set<() => void>(),
  unreadCount: 0,
  initialCountSet: false
};

const notifySubscribers = () => {
  globalState.subscribers.forEach(callback => callback());
};

const initializeUser = () => {
  try {
    const authUser = useAuthStore.getState().getCurrentUser();
    globalState.user = {
      userId: authUser?.userId || "",
      username: authUser?.username || "",
      email: authUser?.email || "",
      profilePicture: authUser?.profilePicture || ""
    };
  } catch (error) {
    // Handle error silently
  }
};

const setupWebSocketHandlers = () => {
  if (globalState.webSocketHandlersRegistered || !globalState.user.userId) return;

  const getNotificationMessage = (data: NotificationData): string => {
    switch (data.type) {
      case 'FOLLOW':
        return `${data.senderUsername || data.username || data.followerUsername} started following you`
      case 'LIKE':
        return `${data.senderUsername || data.username} liked your meme`
      case 'COMMENT':
        return `${data.senderUsername || data.username} commented on your meme`
      default:
        return data.message || 'New notification'
    }
  }

  const handleNotification = (data: WebSocketMessage) => {
    const notificationData = data as unknown as NotificationData;
    const loggedInUserName = useUserStore.getState().loggedInUserName;
    const authUser = useAuthStore.getState().getCurrentUser();
    const currentUsername = loggedInUserName || authUser?.username || "";

    if ((notificationData.recipientId === globalState.user.userId || 
         notificationData.recipientUsername === currentUsername || 
         notificationData.receiverUsername === currentUsername || 
         notificationData.targetUsername === currentUsername)) {
              
      globalState.unreadCount += 1;
      
      const newNotification: Partial<Notification> = {
        id: notificationData.id || crypto.randomUUID(),
        type: notificationData.type,
        message: notificationData.message || getNotificationMessage(notificationData),
        userId: notificationData.userId || notificationData.senderId,
        senderUsername: notificationData.username || notificationData.senderUsername,
        profilePictureUrl: notificationData.profilePictureUrl || notificationData.senderProfilePictureUrl,
        createdAt: new Date(),
        read: false,
        isRead: false,
        memeId: notificationData.memeId
      }
      
      useNotificationStore.getState().addNotification(newNotification);
      
      const notificationEvent = new CustomEvent('new-notification', {
        detail: { notification: newNotification }
      });
      window.dispatchEvent(notificationEvent);
      
      notifySubscribers();
    }
  };

  globalState.unregisterHandlers = [
    useWebSocketStore.getState().registerMessageHandler('FOLLOW', handleNotification),
    useWebSocketStore.getState().registerMessageHandler('LIKE', handleNotification),
    useWebSocketStore.getState().registerMessageHandler('COMMENT', handleNotification),
    useWebSocketStore.getState().registerMessageHandler('NOTIFICATION', handleNotification)
  ];

  globalState.webSocketHandlersRegistered = true;
};

export const useNavigationData = () => {
  const [, forceUpdate] = useState({});
  
  const profilePictureUrl = useUserStore.use.loggedInUserProfilePictureUrl();
  const notifications = useNotificationStore.use.notifications();
  const getNotifications = useNotificationStore.use.getNotifications();
  const loggedInUserName = useUserStore.use.loggedInUserName();

  // Subscribe to global state changes
  useEffect(() => {
    const callback = () => forceUpdate({});
    globalState.subscribers.add(callback);
    return () => {
      globalState.subscribers.delete(callback);
    };
  }, []);

  // Initialize user data
  useEffect(() => {
    const currentLoggedInUserName = loggedInUserName || "";
    if (currentLoggedInUserName !== globalState.user.username) {
      initializeUser();
      globalState.notificationsFetched = false;
      notifySubscribers();
    }
  }, [loggedInUserName]);

  // Setup WebSocket handlers
  useEffect(() => {
    if (globalState.user.userId) {
      setupWebSocketHandlers();
    }
  }, [globalState.user.userId]);

  // Fetch notifications
  useEffect(() => {
    const currentUsername = loggedInUserName || globalState.user.username;
    if (currentUsername && !globalState.notificationsFetched) {
      getNotifications(currentUsername);
      globalState.notificationsFetched = true;
    }
  }, [getNotifications, globalState.user.username, loggedInUserName]);

  // Update unread count
  useEffect(() => {
    if (notifications.length > 0 && !globalState.initialCountSet) {
      const count = notifications.filter(notification => !notification.isRead && !notification.read).length;
      globalState.unreadCount = count;
      globalState.initialCountSet = true;
      notifySubscribers();
    } else if (globalState.initialCountSet) {
      const count = notifications.filter(notification => !notification.isRead && !notification.read).length;
      globalState.unreadCount = count;
      notifySubscribers();
    }
  }, [notifications]);

  // Handle notification events
  useEffect(() => {
    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent<{ notification: Notification }>;
      
      if (customEvent.detail && customEvent.detail.notification) {
        const authUser = useAuthStore.getState().getCurrentUser();
        
        if (authUser?.userId) {
          globalState.unreadCount += 1;
          notifySubscribers();
        }
      }
    };
    
    const handleNotificationsRead = () => {
      globalState.unreadCount = 0;
      notifySubscribers();
    };
    
    window.addEventListener('new-notification', handleNewNotification);
    window.addEventListener('notifications-read', handleNotificationsRead);
    
    return () => {
      window.removeEventListener('new-notification', handleNewNotification);
      window.removeEventListener('notifications-read', handleNotificationsRead);
    };
  }, []);

  return {
    user: globalState.user,
    unreadCount: globalState.unreadCount,
    profilePictureUrl
  };
};