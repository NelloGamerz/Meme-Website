import type React from "react";
import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useUserStore } from "../store/useUserStore";
import { useChatWebSocket } from "../hooks/useChatWebSocket";
import {
  ConversationsList,
  ChatHeader,
  MessageInput,
  EmptyState
} from "../components/messaging";
import { MessagesList } from "../components/messaging/MessagesList";
import type { MessagesListHandle } from "../components/messaging/MessagesList";

export const MessagingPage: React.FC = () => {
  const recentChatRooms = useChatStore((s) => s.recentChatRooms);
  const ephemeralChatRooms = useChatStore((s) => s.ephemeralChatRooms || {});
  const activeChatRoomId = useChatStore((s) => s.activeChatRoomId);
  const messages = useChatStore((s) => s.messages);
  const isLoadingRecentChatRooms = useChatStore((s) => s.isLoadingRecentChatRooms);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const typingUsers = useChatStore((s) => s.typingUsers);
  // const error = useChatStore((s) => s.error);
  const fetchRecentChatRooms = useChatStore((s) => s.fetchRecentChatRooms);
  const setActiveChatRoom = useChatStore((s) => s.setActiveChatRoom);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markChatRoomAsRead = useChatStore((s) => s.markChatRoomAsRead);

  const currentUser = useUserStore.use.userName();
  const { emitTyping, emitStopTyping } = useChatWebSocket();

  const [showMobileChat, setShowMobileChat] = useState(false);
  const setMobileChatOpen = useChatStore((s) => s.setMobileChatOpen);

  useEffect(() => {
    fetchRecentChatRooms();
  }, [fetchRecentChatRooms]);

  // Ensure that when user navigates here with an already-selected chat (e.g., from Profile -> Message),
  // the chat panel is shown on small screens instead of the conversations list.
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 1023px)").matches; // Tailwind lg breakpoint is 1024px
    if (activeChatRoomId && isMobile) {
      setShowMobileChat(true);
      setMobileChatOpen(true);
    }
  }, [activeChatRoomId, setMobileChatOpen]);

  const handleChatRoomClick = (chatRoomId: string) => {
    setActiveChatRoom(chatRoomId);
    markChatRoomAsRead(chatRoomId);
    setShowMobileChat(true);
    setMobileChatOpen(true);
  };

  const messagesListRef = useRef<MessagesListHandle | null>(null);

  const handleSendMessage = async (message: string) => {
    if (!activeChatRoomId || !activeChatRoom) return;
    const toUsername = activeChatRoom.name || "";

    try {
      await sendMessage(activeChatRoomId, message, toUsername);
      // After sending, scroll to the latest messages
      messagesListRef.current?.scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleBackToChatRooms = () => {
    setShowMobileChat(false);
    setMobileChatOpen(false);
  };

  // Look up active chat room in recent list; if not found (e.g., local ephemeral), fall back to ephemeral map
  const activeChatRoom =
    recentChatRooms.find((room: { chatRoomId: string }) => room.chatRoomId === activeChatRoomId) ||
    (activeChatRoomId ? ephemeralChatRooms[activeChatRoomId] : undefined);

  // ✅ Only take messages of active chat room
  const activeChatRoomMessages = activeChatRoomId
    ? messages[activeChatRoomId] || []
    : [];

  return (
    <div className="flex h-[100vh] lg:h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Chat Rooms Panel */}
      <div
        className={`${
          showMobileChat ? "hidden" : "flex"
        } lg:flex w-full lg:w-auto lg:min-w-0 lg:flex-shrink-0`}
      >
        <ConversationsList
          conversations={recentChatRooms}
          activeConversationId={activeChatRoomId}
          isLoadingConversations={isLoadingRecentChatRooms}
          currentUser={currentUser}
          onConversationClick={handleChatRoomClick}
        />
      </div>

      {/* Chat Panel */}
      <div
        className={`${
          showMobileChat ? "flex" : "hidden"
        } lg:flex flex-col flex-1 min-w-0`}
      >
        {activeChatRoom ? (
          <>
            <ChatHeader
              conversation={activeChatRoom}
              currentUser={currentUser}
              showBackButton={true}
              onBackClick={handleBackToChatRooms}
            />

            <MessagesList
              ref={messagesListRef}
              messages={activeChatRoomMessages} // ✅ Fix
              chatRoomId={activeChatRoomId!}
              currentUser={currentUser}
              isLoadingMessages={isLoadingMessages}
              typingUsers={typingUsers}
            />

            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={!activeChatRoomId}
              conversationId={activeChatRoomId || undefined}
              onTyping={emitTyping}
              onStopTyping={emitStopTyping}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
