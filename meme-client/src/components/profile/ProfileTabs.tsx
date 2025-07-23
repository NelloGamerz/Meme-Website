import type React from "react";
import { Upload, Heart, Bookmark } from "lucide-react";
import { cn } from "../../hooks/utils";

type TabType = "uploaded" | "liked" | "saved";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProfileTabsProps {
  activeTab: TabType;
  isOwnProfile: boolean;
  onTabChange: (tab: TabType) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  isOwnProfile,
  onTabChange,
}) => {
  const tabs: Tab[] = [
    { id: "uploaded", label: "Uploaded", icon: Upload },
    ...(isOwnProfile
      ? [
          { id: "liked" as TabType, label: "Liked", icon: Heart },
          { id: "saved" as TabType, label: "Saved", icon: Bookmark },
        ]
      : []),
  ];

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto">
        <nav className="flex overflow-x-auto overflow-y-hidden scrollbar-hide" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap",
                  isActive
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-blue-600 hover:border-gray-300"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
