"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {Check, X } from "lucide-react";
import type { Message } from "../../types/mems";

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean; // controls avatar visibility
  showHeader?: boolean; // controls username + header timestamp visibility
  showFooterTime?: boolean; // controls small time inside bubble
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isMiddleInGroup?: boolean;
  onProfileClick?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwnMessage,
  showAvatar = true,
  showHeader = true,
  showFooterTime = true,
  isFirstInGroup = true,
  isLastInGroup = true,
  isMiddleInGroup = false,
  onProfileClick,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.message);
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // const { editMessage, deleteMessage } = useChatWebSocket();
  // const currentUser = getCurrentUser();

  // Click outside handler for closing menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenu]);

  // Only show options for own messages that aren't deleted
  // const canModifyMessage = isOwnMessage && !message.deleted;

  // const handleEdit = () => {
  //   setIsEditing(true);
  //   setShowMenu(false);
  //   setTimeout(() => {
  //     editInputRef.current?.focus();
  //   }, 100);
  // };

  const handleSaveEdit = async () => {
    if (editedContent.trim() && editedContent !== message.message) {
      try {
        // await editMessage(message.id, editedContent.trim());
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to edit message:", error);
      }
    } else {
      setIsEditing(false);
      setEditedContent(message.message);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.message);
  };

  // const handleDelete = async () => {
  //   if (window.confirm("Are you sure you want to delete this message?")) {
  //     try {
  //       // await deleteMessage(message.id);
  //       setShowMenu(false);
  //     } catch (error) {
  //       console.error("Failed to delete message:", error);
  //     }
  //   }
  // };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - timestamp.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <div
      className={`flex items-start gap-3 group relative ${
        isOwnMessage ? "flex-row-reverse" : ""
      } ${isFirstInGroup ? "pt-2 sm:pt-3" : "pt-0.5"} ${
        isLastInGroup ? "pb-2 sm:pb-3" : "pb-0.5"
      } px-2 sm:px-3`}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          <img
            src={
              message.senderProfilePicture ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"
            }
            alt={message.senderUsername}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-md cursor-pointer hover:ring-blue-500 transition-all duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face";
            }}
            onClick={onProfileClick}
          />
        </div>
      )}

      {!showAvatar && <div className="w-9 sm:w-10 flex-shrink-0" />}

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isOwnMessage ? "text-right" : ""}`}>
        {/* Sender Name and Timestamp (header) */}
        {showHeader && (
          <div
            className={`flex items-center gap-2 mb-1 ${
              isOwnMessage ? "flex-row-reverse" : ""
            }`}
          >
            <span
              className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              onClick={onProfileClick}
            >
              {message.senderUsername}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(message.timestamp)}
            </span>
            {message.edited && (
              <span className="text-[10px] sm:text-xs text-gray-400 italic">
                (edited)
              </span>
            )}
          </div>
        )}

        {/* Message Body */}
        <div
          className={`relative group ${isOwnMessage ? "flex justify-end" : ""}`}
        >
          {isEditing ? (
            /* Edit Mode */
            <div
              className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
                isOwnMessage ? "w-full" : ""
              }`}
            >
              <div className="flex items-center space-x-2">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                  title="Save changes"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                  title="Cancel edit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            // <div
            //   className={`relative max-w-[85%] sm:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 shadow-sm ${
            //     isOwnMessage
            //       ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
            //       : "bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"
            //   } ${message.deleted ? "opacity-60 italic" : ""} ${
            //     isOwnMessage
            //       ? `${isFirstInGroup ? "rounded-2xl rounded-tr-md" : ""} ${isMiddleInGroup ? "rounded-l-2xl rounded-r-md" : ""} ${isLastInGroup ? "rounded-2xl rounded-br-md" : ""} ${!isFirstInGroup && !isMiddleInGroup && !isLastInGroup ? "rounded-2xl rounded-tr-md" : ""}`
            //       : `${isFirstInGroup ? "rounded-2xl rounded-tl-md" : ""} ${isMiddleInGroup ? "rounded-r-2xl rounded-l-md" : ""} ${isLastInGroup ? "rounded-2xl rounded-bl-md" : ""} ${!isFirstInGroup && !isMiddleInGroup && !isLastInGroup ? "rounded-2xl rounded-tl-md" : ""}`
            //   }`}
            // >
            //   <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.message}</p>

            <div
              className={`relative inline-block px-4 py-2 shadow-sm break-words whitespace-pre-wrap
    ${
      isOwnMessage
        ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white ml-auto max-w-[70%]"
        : "bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white mr-auto max-w-[60%]"
    }
    ${message.deleted ? "opacity-60 italic" : ""}
    ${
      isOwnMessage
        ? `${isFirstInGroup ? "rounded-2xl rounded-tr-md" : ""} ${
            isMiddleInGroup ? "rounded-l-2xl rounded-r-md" : ""
          } ${isLastInGroup ? "rounded-2xl rounded-br-md" : ""}`
        : `${isFirstInGroup ? "rounded-2xl rounded-tl-md" : ""} ${
            isMiddleInGroup ? "rounded-r-2xl rounded-l-md" : ""
          } ${isLastInGroup ? "rounded-2xl rounded-bl-md" : ""}`
    }`}
            >
              <p className="text-sm leading-relaxed">{message.message}</p>

              {/* Footer: time + status */}
              {showFooterTime && (
                <div
                  className={`mt-1 flex items-center ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  } gap-2 opacity-80`}
                >
                  {/* <span className="text-[10px] sm:text-xs">{formatTimestamp(message.timestamp)}</span> */}
                </div>
              )}
            </div>
          )}

          {/* Message Options Menu */}
          {/* {canModifyMessage && !isEditing && (
            <div
              className={`absolute ${
                isOwnMessage ? "-top-2 -left-2" : "-top-2 -right-2"
              } opacity-0 group-hover:opacity-100 transition-opacity`}
            >
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <MoreHorizontal className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                </button>

                {showMenu && (
                  <div
                    className={`absolute ${
                      isOwnMessage ? "left-0" : "right-0"
                    } mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]`}
                  >
                    <button
                      onClick={handleEdit}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )} */}
        </div>

        {/* Media Content */}
        {message.mediaUrl && message.messageType === "image" && (
          <div className="mt-2">
            <img
              src={message.mediaUrl || "/placeholder.svg"}
              alt="Message attachment"
              className="max-w-xs rounded-lg shadow-sm"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
};
