import type React from "react";
import { useState } from "react";
import { 
  MessageCircle, 
  Search, 
  Plus,
  MoreHorizontal,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConversationsListProps {
  conversations: any[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;
  currentUser: string;
  onConversationClick: (conversationId: string) => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  activeConversationId,
  isLoadingConversations,
  currentUser,
  onConversationClick
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = searchQuery
    ? conversations.filter(conv => 
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const getConversationTitle = (conv: any) => {
    if (!conv) return "";
    // For ChatRoom, name contains the target username
    return conv.name || "Unknown";
  };

  const getConversationAvatar = (conv: any) => {
    if (!conv) return "";
    // For ChatRoom, profilePictureUrl is the target user's avatar
    return conv.profilePictureUrl || "";
  };

  const getOnlineStatus = (conv: any) => {
    // For ChatRoom objects, online status is not available in the current structure
    // This could be enhanced later by checking online users from chat store
    return false;
  };

  const formatMessageTime = (timestamp: Date | string | undefined | null) => {
    if (!timestamp) {
      return '';
    }
    
    try {
      // Convert to Date object if it's a string or ensure it's valid
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn('Invalid timestamp:', timestamp, error);
      return 'Just now';
    }
  };

  return (
    <div className="flex flex-col w-full lg:w-80 xl:w-96 lg:border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors touch-manipulation">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors touch-manipulation">
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            </button> */}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoadingConversations ? (
          <div className="p-2 sm:p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 mb-2 animate-pulse mx-1 sm:mx-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
            <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No conversations yet</h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4">Start a conversation with someone!</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredConversations.map((conv) => {
              // For ChatRoom, use the chatRoomId instead of id
              const isActive = conv.chatRoomId === activeConversationId;
              
              return (
                <div
                  key={conv.chatRoomId}
                  onClick={() => onConversationClick(conv.chatRoomId)}
                  className={`flex items-center space-x-3 p-3 sm:p-3 mx-1 sm:mx-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 touch-manipulation ${
                    isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={getConversationAvatar(conv) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"}
                      alt={getConversationTitle(conv)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face";
                      }}
                    />
                    {conv.isGroup ? (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                        <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                    ) : getOnlineStatus(conv) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate pr-2">
                        {getConversationTitle(conv)}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {conv.updatedAt && formatMessageTime(conv.updatedAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate pr-2">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[18px] sm:min-w-[20px] text-center flex-shrink-0">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};