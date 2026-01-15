import type React from "react";
import { MessageCircle } from "lucide-react";

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
      <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full p-6 sm:p-8 mb-4 sm:mb-6">
        <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
        Your Messages
      </h2>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-sm sm:max-w-md leading-relaxed px-4">
        <span className="hidden lg:inline">Select a conversation from the left to start chatting, or start a new conversation.</span>
        <span className="lg:hidden">Tap a conversation to start chatting, or start a new one.</span>
      </p>
    </div>
  );
};