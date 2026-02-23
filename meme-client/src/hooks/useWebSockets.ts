import { create } from "zustand";
import { useEffect, useRef } from "react";
import WebSocketService, {
  WebSocketMessageType,
  WebSocketMessage,
  MessageHandler,
} from "../services/WebSocketService";
import { getCurrentUser } from "../utils/chatHelpers";
import { wsDebugger } from "../utils/websocketDebugger";
import { useChatStore } from "../store/useChatStore";

// Base WebSocket Store Interface
interface WebSocketStore {
  isConnected: boolean;
  client: WebSocket | null;
  connect: () => void;
  disconnect: () => void;
  restoreConnection: () => void;
  sendMessage: (message: WebSocketMessage) => boolean;
  registerMessageHandler: (
    type: WebSocketMessageType,
    handler: MessageHandler
  ) => () => void;
  registerApplicationActive: () => () => void;

  // General WebSocket actions
  sendFollowRequest: (
    targetUserId: string,
    targetUsername: string,
    isFollowing: boolean
  ) => boolean;
  sendJoinPostRequest: (postId: string) => boolean;
  sendLeavePostRequest: (postId: string) => boolean;
  sendLikeRequest: (memeId: string) => Promise<boolean>;
  sendSaveRequest: (memeId: string) => Promise<boolean>;
  sendCommentRequest: (
    memeId: string,
    text: string,
    profilePictureUrl: string
  ) => boolean;

  // Chat-specific actions
  sendChatMessage: (
    chatRoomId: string,
    message: string,
    toUsername: string,
    messageType?: string,
    mediaUrl?: string,
    replyToMessageId?: string
  ) => boolean;
  sendTypingStatus: (chatRoomId: string, isTyping: boolean) => boolean;
  sendMessageEdit: (messageId: string, newMessage: string) => boolean;
  sendMessageDelete: (messageId: string) => boolean;
  sendMarkAsReadRequest: (chatRoomId: string) => boolean;

  // Integrated handler initialization
  initializeChatHandlers: (options: {
    addMessage: (message: any) => void;
    updateMessage: (messageId: string, updates: any) => void;
    setUserOnlineStatus: (username: string, isOnline: boolean) => void;
    setTypingStatus: (
      chatRoomId: string,
      username: string,
      isTyping: boolean
    ) => void;
    fetchRecentChatRooms: () => void;
  }) => () => void;

  initializeMessagingHandlers: (options: {
    addMessage: (message: any) => void;
  }) => () => void;
}

// Create the Zustand store
export const useWebSocketStore = create<WebSocketStore>(() => ({
  isConnected: WebSocketService.isConnected(),
  client: WebSocketService.getClient(),

  connect: () => {
    WebSocketService.connect();
  },

  disconnect: () => {
    WebSocketService.disconnect();
  },

  restoreConnection: () => {
    WebSocketService.restoreConnection();
  },

  sendMessage: (message: WebSocketMessage) => {
    return WebSocketService.sendMessage(message);
  },

  registerMessageHandler: (
    type: WebSocketMessageType,
    handler: MessageHandler
  ) => {
    return WebSocketService.registerMessageHandler(type, handler);
  },

  registerApplicationActive: () => {
    return WebSocketService.registerApplicationActive();
  },

  // General WebSocket actions
  sendFollowRequest: (
    targetUserId: string,
    targetUsername: string,
    isFollowing: boolean
  ) => {
    return WebSocketService.sendFollowRequest(
      targetUserId,
      targetUsername,
      isFollowing
    );
  },

  sendJoinPostRequest: (postId: string) => {
    return WebSocketService.sendJoinPostRequest(postId);
  },

  sendLeavePostRequest: (postId: string) => {
    return WebSocketService.sendLeavePostRequest(postId);
  },

  sendLikeRequest: (memeId: string) => {
    return WebSocketService.sendLikeRequest(memeId);
  },

  sendSaveRequest: (memeId: string) => {
    return WebSocketService.sendSaveRequest(memeId);
  },

  sendCommentRequest: (
    memeId: string,
    text: string,
    profilePictureUrl: string
  ) => {
    return WebSocketService.sendCommentRequest(memeId, text, profilePictureUrl);
  },

  // Chat-specific actions
  sendChatMessage: (
    chatRoomId,
    message,
    toUsername,
    messageType = "text",
    mediaUrl,
    replyToMessageId
  ) => {
    if (!message.trim()) return false;

    try {
      const currentUser = getCurrentUser();

      // Get user profile picture if available
      let profilePicture = "";
      try {
        const authStateStr = localStorage.getItem("auth");
        if (authStateStr) {
          const authState = JSON.parse(authStateStr);
          profilePicture = authState.user?.profilePicture || "";
        }
      } catch (e) {
        console.warn("Failed to get profile picture from localStorage", e);
      }

      const websocketMessage = {
        type: "CHAT" as const,
        chatRoomId,
        message: message.trim(),
        messageType,
        toUsername,
        senderId: currentUser,
        senderUsername: currentUser,
        senderProfilePictureUrl: profilePicture,
        timestamp: new Date().toISOString(),
        ...(mediaUrl && { mediaUrl }),
        ...(replyToMessageId && { replyToMessageId }),
      };

      console.log(
        "🚀 [useWebSockets] Sending WebSocket chat message:",
        websocketMessage
      );
      wsDebugger.logSentMessage(
        websocketMessage,
        "useWebSockets.sendChatMessage"
      );

      // Send the message via WebSocket
      const result = WebSocketService.sendMessage(websocketMessage);

      if (result) {
        console.log(
          "✅ [useWebSockets] Message sent successfully via WebSocket"
        );
      } else {
        console.error(
          "❌ [useWebSockets] Failed to send message via WebSocket"
        );
        wsDebugger.logError(
          "Failed to send message via WebSocket",
          "useWebSockets.sendChatMessage"
        );
      }

      return result;
    } catch (error) {
      console.error("Failed to send chat message:", error);
      return false;
    }
  },

  sendTypingStatus: (chatRoomId, isTyping) => {
    return WebSocketService.sendMessage({
      type: "TYPING_INDICATOR",
      chatRoomId,
      isTyping,
    });
  },

  sendMessageEdit: (messageId, newMessage) => {
    return WebSocketService.sendMessage({
      type: "EDIT_MESSAGE",
      messageId,
      newMessage,
    });
  },

  sendMessageDelete: (messageId) => {
    return WebSocketService.sendMessage({
      type: "DELETE_MESSAGE",
      messageId,
    });
  },

  sendMarkAsReadRequest: (chatRoomId) => {
    return WebSocketService.sendMarkAsReadRequest(chatRoomId);
  },

  // Integrated handler initialization for chat functionality
  initializeChatHandlers: (options) => {
    const {
      addMessage,
      updateMessage,
      setUserOnlineStatus,
      setTypingStatus,
      fetchRecentChatRooms,
    } = options;

    // Track processed message IDs to prevent duplicates
    const processedMessageIds = new Set<string>();

    const handleNewMessage = (data: any) => {
      try {
        const currentUser = getCurrentUser();

        const messageObj = {
          id: data.messageId || data.id || `temp-${Date.now()}`,
          chatRoomId: data.chatRoomId || data.conversationId || "",
          message: data.messageText || data.message,
          messageType: (data.messageType || "TEXT").toLowerCase(),
          mediaUrl: data.mediaUrl,
          replyToMessageId: data.replyToMessageId,
          senderId: data.senderId,
          senderUsername: data.senderUsername || data.fromUsername || "",
          senderProfilePicture: data.senderProfilePictureUrl || "",
          timestamp: new Date(data.timestamp || Date.now()),
          read: data.read || false,
          edited: data.edited || false,
          deleted: data.deleted || false,
          isOwn: (data.senderUsername || data.fromUsername) === currentUser,
          isServerConfirmed: true,
        };

        console.log("📨 Adding message to store:", messageObj);

        // ✅ Always fetch the latest store reference
        useChatStore.getState().addMessage(messageObj);

        // Only mark as read if the chat room is currently open/visible
        try {
          const chatState = useChatStore.getState();
          const activeId = chatState.activeChatRoomId;

          const isVisible = typeof document !== "undefined"
            ? document.visibilityState === "visible"
            : true;
          const isDesktop = typeof window !== "undefined"
            ? window.matchMedia("(min-width: 1024px)").matches
            : true;
          const isChatPanelOpen = isDesktop ? true : !!chatState.isMobileChatOpen;

          if (
            !messageObj.isOwn &&
            isVisible &&
            isChatPanelOpen &&
            activeId &&
            activeId === messageObj.chatRoomId
          ) {
            chatState.markChatRoomAsRead(messageObj.chatRoomId);
          }
        } catch {}

        // No refetch here; recent chats are updated via UPDATE_RECENT_CHAT handler
      } catch (err) {
        console.error("❌ Error in handleNewMessage:", err, data);
      }
    };

    // Handle message delivery status
    const handleMessageStatus = (data: any) => {
      if (data.messageId) {
        updateMessage(data.messageId, { read: data.read });
      }
    };

    // Handle user online status
    const handleUserOnline = (data: any) => {
      if (data.username) {
        setUserOnlineStatus(data.username, true);
      }
    };

    const handleUserOffline = (data: any) => {
      if (data.username) {
        setUserOnlineStatus(data.username, false);
      }
    };

    // Handle message editing
    const handleMessageEdit = (data: any) => {
      if (data.messageId && data.newMessage) {
        updateMessage(data.messageId, {
          message: data.newMessage,
          // Add edited flag if backend provides it
          ...(data.edited && { edited: true }),
        });
      }
    };

    // Handle message deletion
    const handleMessageDelete = (data: any) => {
      if (data.messageId) {
        updateMessage(data.messageId, {
          message: "[Message deleted]",
          deleted: true,
        });
      }
    };

    // Handle typing indicators (backend sends TYPING_INDICATOR)
    const handleTyping = (data: any) => {
      console.log("📨 [useWebSockets] Received TYPING_INDICATOR:", data);

      if (data.chatRoomId && (data.username || data.userId)) {
        const username = data.username || data.userId;
        const isTyping = data.isTyping === true;

        useChatStore
          .getState()
          .setTypingStatus(data.chatRoomId, username, isTyping);

        if (isTyping) {
          setTimeout(() => {
            useChatStore
              .getState()
              .setTypingStatus(data.chatRoomId, username, false);
          }, 3000);
        }
      }
    };

    // Register message handlers using the WebSocket system (matching backend)
    console.log("📝 [useWebSockets] Registering WebSocket message handlers...");

    // Handle recent chat list updates pushed by backend
    const handleUpdateRecentChat = (data: any) => {
      try {
        const chatRoomId = data.chatRoomId;
        if (!chatRoomId) return;

        useChatStore.setState((state) => {
          const updatedAt = new Date();
          const updatedList = [...state.recentChatRooms];
          const displayName = data.displayName || data.username || data.name || "";

          // 1) If there's an ephemeral local room for the same user, migrate it
          const ephemeralMap = state.ephemeralChatRooms || {};
          const localKey = Object.keys(ephemeralMap).find(
            (k) => k.startsWith("local-") && (!!displayName && ephemeralMap[k]?.name === displayName)
          );

          if (localKey) {
            const localRoom = ephemeralMap[localKey]!;

            // Build the merged room with the real chatRoomId
            const mergedRoom = {
              ...localRoom,
              chatRoomId,
              name: displayName || localRoom.name,
              profilePictureUrl: data.displayPicture ?? localRoom.profilePictureUrl,
              lastMessage: data.message ?? localRoom.lastMessage,
              updatedAt,
              unreadCount: localRoom.unreadCount ?? 0,
            };

            // Add merged real room to top of recent list
            updatedList.unshift(mergedRoom);

            // Rekey messages from localId -> realId and fix activeChatRoomId
            const newMessages = { ...state.messages } as Record<string, any[]>;
            if (state.messages[localKey]) {
              const existingReal = state.messages[chatRoomId] || [];
              const localMsgs = state.messages[localKey] || [];
              newMessages[chatRoomId] = [...existingReal, ...localMsgs];
              delete newMessages[localKey];
            }

            const newActiveId =
              state.activeChatRoomId === localKey ? chatRoomId : state.activeChatRoomId;

            // Remove the ephemeral entry
            const newEphemeral = { ...ephemeralMap } as Record<string, any>;
            delete newEphemeral[localKey];

            return {
              recentChatRooms: updatedList,
              messages: newMessages,
              activeChatRoomId: newActiveId,
              ephemeralChatRooms: newEphemeral,
            } as any;
          }

          // 2) Otherwise, update existing real room or insert a new one
          const idx = updatedList.findIndex((r) => r.chatRoomId === chatRoomId);

          if (idx !== -1) {
            const prev = updatedList[idx];
            const updatedRoom = {
              ...prev,
              name: data.displayName ?? prev.name,
              profilePictureUrl: data.displayPicture ?? prev.profilePictureUrl,
              lastMessage: data.message ?? prev.lastMessage,
              updatedAt,
            };
            // Move updated room to top
            updatedList.splice(idx, 1);
            updatedList.unshift(updatedRoom);
          } else {
            // Insert new chat room entry at top
            updatedList.unshift({
              chatRoomId,
              name: displayName || "",
              profilePictureUrl: data.displayPicture || "",
              lastMessage: data.message || "",
              unreadCount: 0,
              updatedAt,
            });
          }

          return { recentChatRooms: updatedList } as any;
        });
      } catch (e) {
        console.error("❌ Error in handleUpdateRecentChat:", e, data);
      }
    };

    const unsubscribeNewMessage = WebSocketService.registerMessageHandler(
      "CHAT",
      handleNewMessage
    );
    const unsubscribeMessageEdit = WebSocketService.registerMessageHandler(
      "EDIT_MESSAGE",
      handleMessageEdit
    );
    const unsubscribeMessageDelete = WebSocketService.registerMessageHandler(
      "DELETE_MESSAGE",
      handleMessageDelete
    );
    const unsubscribeTyping = WebSocketService.registerMessageHandler(
      "TYPING_INDICATOR",
      handleTyping
    );
    const unsubscribeMessageStatus = WebSocketService.registerMessageHandler(
      "MESSAGE_READ",
      handleMessageStatus
    );
    const unsubscribeUserOnline = WebSocketService.registerMessageHandler(
      "USER_ONLINE",
      handleUserOnline
    );
    const unsubscribeUserOffline = WebSocketService.registerMessageHandler(
      "USER_OFFLINE",
      handleUserOffline
    );
    const unsubscribeUpdateRecentChat = WebSocketService.registerMessageHandler(
      "UPDATE_RECENT_CHAT",
      handleUpdateRecentChat
    );

    // Handle MARK_AS_READ responses
    const handleMarkAsRead = (data: any) => {
      try {
        const { success, chatRoomId } = data || {};
        if (!chatRoomId) return;

        if (success) {
          useChatStore.setState((state) => ({
            recentChatRooms: state.recentChatRooms.map((room) =>
              room.chatRoomId === chatRoomId ? { ...room, unreadCount: 0 } : room
            ),
            messages: {
              ...state.messages,
              [chatRoomId]: (state.messages[chatRoomId] || []).map((m) => ({
                ...m,
                read: true,
              })),
            },
          }));
        } else {
          console.warn("MARK_AS_READ failed for chatRoomId", chatRoomId);
        }
      } catch (e) {
        console.error("❌ Error in handleMarkAsRead:", e, data);
      }
    };

    const unsubscribeMarkAsRead = WebSocketService.registerMessageHandler(
      "MARK_AS_READ",
      handleMarkAsRead
    );

    console.log(
      "✅ [useWebSockets] All WebSocket message handlers registered successfully"
    );
    console.log(
      "🎯 [useWebSockets] Handlers registered for types: CHAT, EDIT_MESSAGE, DELETE_MESSAGE, TYPING, MESSAGE_READ, USER_ONLINE, USER_OFFLINE, UPDATE_RECENT_CHAT, MARK_AS_READ"
    );

    // Return cleanup function
    return () => {
      unsubscribeNewMessage();
      unsubscribeMessageEdit();
      unsubscribeMessageDelete();
      unsubscribeTyping();
      unsubscribeMessageStatus();
      unsubscribeUserOnline();
      unsubscribeUserOffline();
      unsubscribeUpdateRecentChat();
      unsubscribeMarkAsRead();
    };
  },

  // Integrated handler initialization for messaging functionality
  initializeMessagingHandlers: (options) => {
    const { addMessage } = options;

    const handleChatMessage = (data: any) => {
      console.log("📨 [useWebSockets] Received messaging CHAT message:", data);

      const message = {
        id: data.id || `msg-${Date.now()}`,
        chatRoomId: data.chatRoomId || data.conversationId,
        senderId: data.senderId,
        senderUsername: data.senderUsername,
        senderProfilePicture: data.senderProfilePicture || "",
        message: data.message || data.content,
        timestamp: new Date(data.timestamp || new Date()),
        read: data.read || false,
        messageType: data.messageType || "text",
        mediaUrl: data.mediaUrl,
      };

      console.log("✅ [useWebSockets] Processing messaging message:", message);
      // Add the message to the store
      addMessage(message);
    };

    // Register the CHAT message handler
    const unsubscribe = WebSocketService.registerMessageHandler(
      "CHAT",
      handleChatMessage
    );
    return unsubscribe;
  },
}));

// Update store state when connection state changes
WebSocketService.registerConnectionStateListener((state) => {
  useWebSocketStore.setState({
    isConnected: state === "CONNECTED",
    client: WebSocketService.getClient(),
  });
});

export const useChatWebSocket = () => {
  const { isConnected, client, sendTypingStatus, initializeChatHandlers } =
    useWebSocketStore();

  const chatStore = useChatStore; // not a hook call, just reference to the store
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!isConnected || !client) {
      console.log("⚠️ [useChatWebSocket] WebSocket not connected yet");
      return;
    }

    console.log("🔌 [useChatWebSocket] Initializing chat handlers");
    const cleanup = initializeChatHandlers({
      addMessage: chatStore.getState().addMessage,
      updateMessage: chatStore.getState().updateMessage,
      setUserOnlineStatus: chatStore.getState().setUserOnlineStatus,
      setTypingStatus: chatStore.getState().setTypingStatus,
      fetchRecentChatRooms: chatStore.getState().fetchRecentChatRooms,
    });

    return () => {
      console.log("🧹 [useChatWebSocket] Cleaning up chat handlers");
      cleanup();
    };
  }, [isConnected, client, initializeChatHandlers]);

  // Cleanup all typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
    };
  }, []);

  const emitTyping = (chatRoomId: string) => {
    if (!client || !isConnected) return;
    if (typingTimeoutsRef.current[chatRoomId]) {
      clearTimeout(typingTimeoutsRef.current[chatRoomId]);
    }
    sendTypingStatus(chatRoomId, true);
    typingTimeoutsRef.current[chatRoomId] = setTimeout(() => {
      emitStopTyping(chatRoomId);
    }, 3000);
  };

  const emitStopTyping = (chatRoomId: string) => {
    if (!client || !isConnected) return;
    if (typingTimeoutsRef.current[chatRoomId]) {
      clearTimeout(typingTimeoutsRef.current[chatRoomId]);
      delete typingTimeoutsRef.current[chatRoomId];
    }
    sendTypingStatus(chatRoomId, false);
  };

  return {
    emitTyping,
    emitStopTyping,
    isConnected,
  };
};

// React hook for messaging WebSocket functionality
export const useMessagingWebSocket = () => {
  const { initializeMessagingHandlers } = useWebSocketStore();

  useEffect(() => {
    // Import messaging store dynamically to avoid circular dependencies
    import("../store/useChatStore").then((module) => {
      // Add a type for the store to ensure addMessage exists
      type ChatStoreType = {
        getState: () => { addMessage: (message: any) => void };
      };
      const chatStore = module.useChatStore as ChatStoreType;
      // Initialize WebSocket handlers when the component mounts
      const cleanup = initializeMessagingHandlers({
        addMessage: chatStore.getState().addMessage,
      });

      // Return cleanup function to unsubscribe when component unmounts
      return cleanup;
    });
  }, [initializeMessagingHandlers]);
};

// Import React hooks
import { useState } from "react";

export default useWebSocketStore;
