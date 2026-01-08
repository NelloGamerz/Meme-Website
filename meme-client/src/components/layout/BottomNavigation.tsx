import type React from "react";
import { useCallback } from "react";
import { Home, Search, Upload, User, MessageCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { useNavigationData } from "../../hooks/useNavigationData";
import { useChatStore } from "../../store/useChatStore";

interface BottomNavigationProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onNavigate,
  currentPath,
}) => {
  const { user, profilePictureUrl } = useNavigationData();
  const recentChatRooms = useChatStore((s) => s.recentChatRooms);

  // Count chat rooms with unread messages
  const unreadRoomsCount = recentChatRooms.filter(
    (room: { unreadCount: number }) => room.unreadCount > 0
  ).length;

  const handleNavigation = useCallback(
    (path: string) => {
      onNavigate(path);
    },
    [onNavigate]
  );

  const isActive = useCallback(
    (path: string) => currentPath === path,
    [currentPath]
  );

  const bottomNavItems: MenuItem[] = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/explore" },
    {
      icon: MessageCircle,
      label: "Messages",
      path: "/messages",
      badge: unreadRoomsCount,
    },
    { icon: Upload, label: "Upload", path: "/upload-meme" },
    { icon: User, label: "Profile", path: `/profile/${user.username || ""}` },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 backdrop-blur-md bg-white/95 dark:bg-gray-800/95">
        <div className="flex items-center justify-around py-1 px-2">
          {bottomNavItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center relative border-0 shadow-none 
                transition-all duration-200 ease-in-out transform 
                hover:scale-110 active:scale-95
                hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 rounded-full
                ${
                  isActive(item.path)
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                }
                ${item.path === "/messages" ? "h-12 w-12" : "h-10 w-10"}
              `}
            >
              {item.path.includes("/profile") ? (
                profilePictureUrl ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-blue-200">
                    <img
                      src={profilePictureUrl}
                      alt={user.username || "User"}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border bg-white dark:bg-gray-700 flex items-center justify-center transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                    <span className="text-gray-600 dark:text-gray-300 font-medium text-xs transition-all duration-200">
                      {(user.username || "U")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </span>
                  </div>
                )
              ) : (
                <item.icon
                  className={`w-6 h-6 transition-all duration-200 
                  ${
                    isActive(item.path)
                      ? "stroke-[2] text-blue-600 dark:text-blue-400"
                      : "stroke-[1.5]"
                  }
                `}
                />
              )}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-medium">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
