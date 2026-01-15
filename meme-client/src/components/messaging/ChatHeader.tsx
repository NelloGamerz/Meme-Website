import type React from "react";
import { 
  Phone, 
  Video, 
  Info, 
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatHeaderProps {
  conversation: any;
  currentUser: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUser,
  showBackButton = false,
  onBackClick
}) => {
  const navigate = useNavigate();
  const getConversationTitle = (conv: any) => {
    if (!conv) return "";
    // For ChatRoom, name contains the target username
    return conv.name || "Unknown";
  };

  const getConversationAvatar = (conv: any) => {
    if (!conv) return "";
    // For ChatRoom, profilePictureUrl is the target user's avatar
    return conv.profilePictureUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face";
  };

  const handleProfileClick = () => {
    if (conversation?.name) {
      navigate(`/profile/${conversation.name}`);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
        {showBackButton && (
          <button
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors touch-manipulation flex-shrink-0"
            onClick={onBackClick}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        
        <div className="relative flex-shrink-0">
          <img
            src={getConversationAvatar(conversation) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"}
            alt={getConversationTitle(conversation)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200 touch-manipulation"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face";
            }}
            onClick={handleProfileClick}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 
            className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 truncate touch-manipulation"
            onClick={handleProfileClick}
          >
            {getConversationTitle(conversation)}
          </h2>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
        {/* <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors touch-manipulation">
          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors touch-manipulation">
          <Video className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
        </button> */}
        <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors touch-manipulation">
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};