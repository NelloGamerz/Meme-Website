import React, { useEffect } from 'react';
import { User, Heart, MessageCircle, ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWebSocketStore } from '../../hooks/useWebSockets';
import { cn } from '../../hooks/utils';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useUserStore } from '../../store/useUserStore';
import { Notification } from '../../types/mems';
import { getCurrentAuthUser } from '../../utils/authHelpers';

const getCurrentUser = () => {
  const authUser = getCurrentAuthUser();
  return authUser ? { 
    username: authUser.username || '' 
  } : { userId: '', username: '' };
};

export const NotificationsList: React.FC = () => {
  const navigate = useNavigate();
  const notifications = useNotificationStore.use.notifications();
  const isLoading = useNotificationStore.use.isLoading();
  const error = useNotificationStore.use.error();
  const getNotifications = useNotificationStore.use.getNotifications();
  const addNotification = useNotificationStore.use.addNotification();
  const markAsRead = useNotificationStore.use.markAsRead();
  const markAllAsRead = useNotificationStore.use.markAllAsRead();
  const userName = useUserStore.use.userName();

  useEffect(() => {
    const user = getCurrentUser();
    if (user.username) {
      getNotifications(user.username);
    }
  }, [getNotifications]);
  
  useEffect(() => {
    const markUnreadNotificationsAsRead = async () => {
      if (userName) {
        try {
          const unreadNotifications = notifications.filter(n => !n.read);
          
          if (unreadNotifications.length > 0) {
            await markAllAsRead();
            
            try {
              const notificationEvent = new CustomEvent('notifications-read', { 
                detail: { count: unreadNotifications.length } 
              });
              window.dispatchEvent(notificationEvent);
            } catch (error) {
            }
          }
        } catch (error) {
        }
      }
    };

    markUnreadNotificationsAsRead();
  }, [notifications, userName, markAllAsRead]);

  useEffect(() => {
    interface WebSocketNotificationData {
      type: string;
      id?: string;
      message?: string;
      userId?: string;
      senderId?: string;
      username?: string;
      senderUsername?: string;
      profilePictureUrl?: string;
      senderProfilePictureUrl?: string;
      memeId?: string;
      receiverUsername?: string;
      targetUsername?: string;
      recipientUsername?: string;
      recipientId?: string;
    }

    const getNotificationMessage = (data: WebSocketNotificationData): string => {
      switch (data.type) {
        case 'FOLLOW':
          return `${data.senderUsername || data.username} started following you`;
        case 'LIKE':
          return `${data.senderUsername || data.username} liked your meme`;
        case 'COMMENT':
          return `${data.senderUsername || data.username} commented on your meme`;
        default:
          return data.message || 'New notification';
      }
    };
    
    const handleNotification = (data: WebSocketNotificationData) => {
      const user = getCurrentUser();
      const isForCurrentUser = 
        (data.receiverUsername === user.username) || 
        (data.targetUsername === user.username) ||
        (data.recipientUsername === user.username);

      if (isForCurrentUser && user.username) {        
        const newNotification: Partial<Notification> = {
          id: data.id || crypto.randomUUID(),
          type: data.type,
          message: data.message || getNotificationMessage(data),
          senderUsername: data.username || data.senderUsername,
          profilePictureUrl: data.profilePictureUrl || data.senderProfilePictureUrl,
          createdAt: new Date(),
          read: false,
          isRead: false,
          memeId: data.memeId
        };
        
        addNotification(newNotification);
      }
    };

    const user = getCurrentUser();
    
    if (user.username) {
      const unregisterHandlers = [
        useWebSocketStore.getState().registerMessageHandler('FOLLOW', handleNotification),
        useWebSocketStore.getState().registerMessageHandler('LIKE', handleNotification),
        useWebSocketStore.getState().registerMessageHandler('COMMENT', handleNotification),
        useWebSocketStore.getState().registerMessageHandler('NOTIFICATION', handleNotification)
      ];
      
      return () => {
        unregisterHandlers.forEach(unregister => unregister());
      };
    }
  }, [addNotification]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read using the store's markAsRead function
      if (!notification.read && !notification.isRead) {
        await markAsRead(notification.id);
      }
      
      switch (notification.type) {
        case 'FOLLOW':
          break;
        case 'LIKE':
        case 'COMMENT':
          if (notification.memeId) {
            navigate(`/meme/${notification.memeId}`);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (weeks > 0) return `${weeks}w`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-3 h-3 text-red-500" />;
      case 'COMMENT':
        return <MessageCircle className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 mr-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        </div>

        <div className="divide-y divide-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">When you get notifications, they'll show up here</p>
            </div>
          ) : (
            [...notifications]
              .sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
                const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
                return dateB.getTime() - dateA.getTime();
              })
              .map(notification => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 hover:bg-gray-50 transition-all duration-200",
                  !notification.read && "bg-blue-50/40"
                )}
              >
                <div className="flex items-start space-x-4">
                  <div 
                    className="relative flex-shrink-0"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        // Mark as read using the store's markAsRead function
                        if (!notification.read && !notification.isRead) {
                          await markAsRead(notification.id);
                        }
                        navigate(`/profile/${notification.senderUsername}`);
                      } catch (error) {
                        console.error('Failed to mark notification as read:', error);
                        navigate(`/profile/${notification.senderUsername}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {notification.profilePictureUrl ? (
                      <img
                        src={notification.profilePictureUrl}
                        alt={notification.senderUsername}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-offset-2 ring-gray-100 hover:ring-blue-300 transition-all"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center hover:from-blue-600 hover:to-indigo-600 transition-all">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {getNotificationIcon(notification.type) && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm ring-2 ring-white">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => handleNotificationClick(notification)}
                    style={{ cursor: 'pointer' }}
                  >
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">
                        {notification.senderUsername}
                      </span>
                      {' '}
                      <span className="text-gray-600">{notification.message}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide font-medium">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationPanel: React.FC = () => {
  const navigate = useNavigate();
  const userName = useUserStore.use.userName();
  const notifications = useNotificationStore.use.notifications();
  const markAllAsRead = useNotificationStore.use.markAllAsRead();

  const handleClick = async () => {
    if (userName) {
      try {
        const unreadNotifications = notifications.filter(n => !n.read);
        
        if (unreadNotifications.length > 0) {
          await markAllAsRead();
          
          try {
            const notificationEvent = new CustomEvent('notifications-read', { 
              detail: { count: unreadNotifications.length } 
            });
            window.dispatchEvent(notificationEvent);
          } catch (error) {
          }
        }
        
        navigate(`/notifications`);
      } catch (error) {
        navigate(`/notifications`);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default NotificationsList;