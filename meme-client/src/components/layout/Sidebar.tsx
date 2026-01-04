import type React from "react";
import { useCallback } from "react";
import {
  Home,
  Search,
  Upload,
  Settings,
  LogOut,
  Bell,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useUserStore } from "../../store/useUserStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useChatStore } from "../../store/useChatStore";
import { useNavigationData } from "../../hooks/useNavigationData";

interface SidebarProps {
  onNavigate: (path: string) => void;
  currentPath: string;
  isMessagingMode?: boolean;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNavigate,
  currentPath,
  isMessagingMode = false,
}) => {
  const { logout } = useAuth();
  const { user, unreadCount, profilePictureUrl } = useNavigationData();
  const loggedInUserName = useUserStore.use.loggedInUserName();
  const markAllAsRead = useNotificationStore.use.markAllAsRead();
  const recentChatRooms = useChatStore((s) => s.recentChatRooms);

  // Count chat rooms with unread messages
  const unreadRoomsCount = recentChatRooms.filter(
    (room: { unreadCount: number }) => room.unreadCount > 0
  ).length;

  const handleLogout = async () => {
    await logout();
    onNavigate("/auth");
  };

  const handleNavigation = useCallback(
    (path: string) => {
      onNavigate(path);
    },
    [onNavigate]
  );

  const handleNotificationClick = useCallback(async () => {
    try {
      if (unreadCount > 0) {
        await markAllAsRead();

        try {
          const notificationEvent = new CustomEvent("notifications-read", {
            detail: { count: unreadCount },
          });
          window.dispatchEvent(notificationEvent);
        } catch (error) {}
      }
      onNavigate(`/notifications`);
    } catch (error) {
      onNavigate(`/notifications`);
    }
  }, [markAllAsRead, unreadCount, onNavigate]);

  const isActive = useCallback(
    (path: string) => currentPath === path,
    [currentPath]
  );

  return (
    <div className="hidden lg:block fixed top-0 left-0 bottom-0 z-50">
      <div
        className={`h-full bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out ${
          isMessagingMode ? "w-16" : "w-60"
        }`}
      >
        <div
          className={`flex items-center transition-all duration-300 ${
            isMessagingMode ? "p-3 justify-center" : "p-6"
          }`}
        >
          {isMessagingMode ? (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-600">
              Mekoole
            </h1>
          )}
        </div>

        <nav className="flex-1 py-6">
          <div className={`space-y-1 ${isMessagingMode ? "px-1" : "px-3"}`}>
            {(
              [
                { icon: Home, label: "Home", path: "/" },
                { icon: Search, label: "Search", path: "/explore" },
                {
                  icon: MessageCircle,
                  label: "Messages",
                  path: "/messages",
                  badge: unreadRoomsCount,
                },
                { icon: Upload, label: "Upload Meme", path: "/upload-meme" },
              ] as NavItem[]
            ).map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center rounded-lg text-left font-normal border-0 
                  transition-all duration-300 ease-in-out transform 
                  hover:scale-[1.02] active:scale-[0.98] 
                  sidebar-item ${isActive(item.path) ? "active" : ""}
                  ${
                    isActive(item.path)
                      ? "text-black dark:text-white font-medium bg-blue-50 dark:bg-blue-900/30"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                  }
                  hover:shadow-sm active:shadow-inner
                  ${isMessagingMode ? "h-12 px-2 justify-center" : "h-12 px-3"}
                `}
                title={isMessagingMode ? item.label : undefined}
              >
                <div className="relative">
                  <item.icon
                    className={`w-6 h-6 transition-all duration-300 sidebar-icon
                    ${
                      isActive(item.path)
                        ? "stroke-[2] text-blue-600 dark:text-blue-400"
                        : "stroke-[1.5]"
                    }
                    hover:rotate-3 ${isMessagingMode ? "" : "mr-3"}
                  `}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold transition-all duration-300 ${
                        isMessagingMode ? "px-1" : ""
                      }`}
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                {!isMessagingMode && (
                  <span className="transition-all duration-300 opacity-100">
                    {item.label}
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={handleNotificationClick}
              className={`w-full flex items-center rounded-lg text-left font-normal border-0 
    transition-all duration-300 ease-in-out transform 
    hover:scale-[1.02] active:scale-[0.98] 
    sidebar-item ${isActive("/notifications") ? "active" : ""}
    ${
      isActive("/notifications")
        ? "text-black dark:text-white font-medium bg-blue-50 dark:bg-blue-900/30"
        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
    }
    hover:shadow-sm active:shadow-inner
    ${isMessagingMode ? "h-12 px-2 justify-center" : "h-12 px-3"}
  `}
              title={isMessagingMode ? "Notifications" : undefined}
            >
              <div className="relative">
                <Bell
                  className={`w-6 h-6 transition-all duration-300 sidebar-icon
    ${
      isActive("/notifications")
        ? "stroke-[2] text-blue-600 dark:text-blue-400"
        : "stroke-[1.5]"
    }
    hover:rotate-3 ${isMessagingMode ? "" : "mr-3"}
  `}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold transition-all duration-300">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {!isMessagingMode && (
                <span className="transition-all duration-300">
                  Notifications
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavigation("/settings")}
              className={`w-full flex items-center rounded-lg text-left font-normal border-0 
    transition-all duration-300 ease-in-out transform 
    hover:scale-[1.02] active:scale-[0.98] 
    sidebar-item ${isActive("/settings") ? "active" : ""}
    ${
      isActive("/settings")
        ? "text-black dark:text-white font-medium bg-blue-50 dark:bg-blue-900/30"
        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
    }
    hover:shadow-sm active:shadow-inner
    ${isMessagingMode ? "h-12 px-2 justify-center" : "h-12 px-3"}
  `}
              title={isMessagingMode ? "Settings" : undefined}
            >
              <Settings
                className={`w-6 h-6 transition-all duration-300 sidebar-icon
    ${
      isActive("/settings")
        ? "stroke-[2] text-blue-600 dark:text-blue-400"
        : "stroke-[1.5]"
    }
    hover:rotate-3 ${isMessagingMode ? "" : "mr-3"}
  `}
              />
              {!isMessagingMode && (
                <span className="transition-all duration-300">Settings</span>
              )}
            </button>
          </div>
        </nav>
        <div
          className={`border-t border-gray-100 dark:border-gray-700 transition-all duration-300 ${
            isMessagingMode ? "p-2" : "p-4"
          }`}
        >
          <button
            onClick={() =>
              handleNavigation(
                `/profile/${loggedInUserName || user.username || ""}`
              )
            }
            className={`flex items-center w-full text-left 
              transition-all duration-300 ease-in-out transform 
              hover:scale-[1.02] active:scale-[0.98] 
              hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg
              hover:shadow-sm active:shadow-inner
              ${
                isMessagingMode
                  ? "justify-center p-2 mb-2"
                  : "space-x-3 mb-4 p-2"
              }
            `}
            title={
              isMessagingMode ? loggedInUserName || user.username : undefined
            }
          >
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={loggedInUserName || user.username || "User"}
                className={`rounded-full object-cover border border-gray-200 dark:border-gray-600 transition-all duration-300 ${
                  isMessagingMode ? "w-8 h-8" : "w-10 h-10"
                }`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            ) : (
              <div
                className={`rounded-full bg-white dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600 transition-all duration-300 ${
                  isMessagingMode ? "w-8 h-8" : "w-10 h-10"
                }`}
              >
                <span
                  className={`text-gray-600 dark:text-gray-300 font-medium transition-all duration-300 ${
                    isMessagingMode ? "text-xs" : "text-sm"
                  }`}
                >
                  {(loggedInUserName || user.username || "U")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </span>
              </div>
            )}
            {!isMessagingMode && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black dark:text-white text-sm truncate">
                  {loggedInUserName || user.username}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  {user.email}
                </p>
              </div>
            )}
          </button>

          <div className={`space-y-2 ${isMessagingMode ? "hidden" : ""}`}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center h-10 px-3 rounded-lg 
                text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                transition-all duration-300 ease-in-out transform 
                hover:scale-[1.02] active:scale-[0.98]
                hover:shadow-sm active:shadow-inner
                sidebar-item"
            >
              <LogOut className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:rotate-12" />
              <span className="text-sm transition-all duration-300">
                Log out
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
