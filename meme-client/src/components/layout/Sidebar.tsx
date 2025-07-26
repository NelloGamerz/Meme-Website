import type React from "react";
import { useCallback } from "react";
import { Home, Search, Upload, Settings, LogOut, Bell } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useUserStore } from "../../store/useUserStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useNavigationData } from "../../hooks/useNavigationData";

interface SidebarProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNavigate,
  currentPath,
}) => {
  const { logout } = useAuth();
  const { user, unreadCount, profilePictureUrl } = useNavigationData();
  const loggedInUserName = useUserStore.use.loggedInUserName();
  const markAllAsRead = useNotificationStore.use.markAllAsRead();

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
        } catch (error) {
        }
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
      <div className="h-full w-60 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">
        <div className="flex items-center p-6">
          <h1 className="text-2xl font-bold text-blue-400 dark:text-blue-400">
            Meme Vault
          </h1>
        </div>

        <nav className="flex-1 py-6">
          <div className="space-y-1 px-3">
            {[
              { icon: Home, label: "Home", path: "/" },
              { icon: Search, label: "Search", path: "/explore" },
              { icon: Upload, label: "Upload Meme", path: "/upload-meme" },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center h-12 px-3 rounded-lg text-left font-normal border-0 
                  transition-all duration-200 ease-in-out transform 
                  hover:scale-[1.02] active:scale-[0.98] 
                  sidebar-item ${isActive(item.path) ? "active" : ""}
                  ${
                    isActive(item.path)
                      ? "text-black dark:text-white font-medium bg-blue-50 dark:bg-blue-900/30"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                  }
                  hover:shadow-sm active:shadow-inner
                `}
              >
                <item.icon
                  className={`w-6 h-6 mr-3 transition-all duration-200 sidebar-icon
                  ${
                    isActive(item.path)
                      ? "stroke-[2] text-blue-600 dark:text-blue-400"
                      : "stroke-[1.5]"
                  }
                  hover:rotate-3
                `}
                />
                <span className="transition-all duration-200">
                  {item.label}
                </span>
              </button>
            ))}


            <button
              onClick={handleNotificationClick}
              className={`w-full flex items-center h-12 px-3 rounded-lg text-left font-normal border-0 
    transition-all duration-200 ease-in-out transform 
    hover:scale-[1.02] active:scale-[0.98] 
    sidebar-item ${isActive("/notifications") ? "active" : ""}
    ${
      isActive("/notifications")
        ? "text-black dark:text-white font-medium bg-blue-50 dark:bg-blue-900/30"
        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
    }
    hover:shadow-sm active:shadow-inner
  `}
            >
              <Bell
                className={`w-6 h-6 mr-3 transition-all duration-200 sidebar-icon
    ${
      isActive("/notifications")
        ? "stroke-[2] text-blue-600 dark:text-blue-400"
        : "stroke-[1.5]"
    }
    hover:rotate-3
  `}
              />
              <span className="transition-all duration-200">Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center
      transition-all duration-200 hover:bg-red-600 active:bg-red-700"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <button
  onClick={() => handleNavigation("/settings")}
  className={`w-full flex items-center h-12 px-3 rounded-lg text-left font-normal border-0 
    transition-all duration-200 ease-in-out transform 
    hover:scale-[1.02] active:scale-[0.98] 
    sidebar-item ${isActive("/settings") ? "active" : ""}
    ${
      isActive("/settings")
        ? "text-black dark:text-white font-medium bg-blue-50 dark:bg-blue-900/30"
        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
    }
    hover:shadow-sm active:shadow-inner
  `}
>
  <Settings
    className={`w-6 h-6 mr-3 transition-all duration-200 sidebar-icon
    ${
      isActive("/settings")
        ? "stroke-[2] text-blue-600 dark:text-blue-400"
        : "stroke-[1.5]"
    }
    hover:rotate-3
  `}
  />
  <span className="transition-all duration-200">Settings</span>
</button>
          </div>
        </nav>
        <div className="border-t border-gray-100 dark:border-gray-700 p-4">
          <button
            onClick={() =>
              handleNavigation(
                `/profile/${loggedInUserName || user.username || ""}`
              )
            }
            className="flex items-center space-x-3 mb-4 w-full text-left 
              transition-all duration-200 ease-in-out transform 
              hover:scale-[1.02] active:scale-[0.98] 
              hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg
              hover:shadow-sm active:shadow-inner"
          >
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={loggedInUserName || user.username || "User"}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                  {(loggedInUserName || user.username || "U")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-black dark:text-white text-sm truncate">
                {loggedInUserName || user.username}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                {user.email}
              </p>
            </div>
          </button>

          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center h-10 px-3 rounded-lg 
                text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                transition-all duration-200 ease-in-out transform 
                hover:scale-[1.02] active:scale-[0.98]
                hover:shadow-sm active:shadow-inner
                sidebar-item"
            >
              <LogOut className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:rotate-12" />
              <span className="text-sm transition-all duration-200">
                Log out
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
