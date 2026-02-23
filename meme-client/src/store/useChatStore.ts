import { create } from "zustand";
import api from "../hooks/api";
import { handleChatError, getCurrentUser } from "../utils/chatHelpers";
import { getChatMessagesFromCache, saveChatMessagesToCache } from "../utils/indexedDBCache";
import type {
  ChatRoom,
  Message,
  ApiChatRoom,
} from "../types/mems";

interface ChatState {
  recentChatRooms: ChatRoom[];
  activeChatRoomId: string | null;
  messages: Record<string, Message[]>; // chatRoomId -> messages
  // Pagination state per room
  messagePagination: Record<string, {
    hasMore: boolean;
    isLoadingMore: boolean;
    nextPage: number; // next older page to request (page 0 is latest)
    pageSize: number;
  }>;
  isLoading: boolean;
  isLoadingMessages: boolean; // initial/latest load
  isLoadingRecentChatRooms: boolean;
  error: string | null;
  onlineUsers: Set<string>;
  typingUsers: Record<string, string[]>; // chatRoomId -> usernames typing
  lastMessageUpdate?: number; // Timestamp to force UI updates
  // Ephemeral local rooms (not shown in recent list). Used when starting a chat before server room exists.
  ephemeralChatRooms?: Record<string, ChatRoom>;
  // UI: on mobile, whether the chat panel is open (used to hide bottom nav)
  isMobileChatOpen?: boolean;
}

type FetchMessagesOptions = {
  page?: number; // backend expects page, size
  size?: number; // page size
  // If true, will prepend to existing (older pagination). Otherwise replaces.
  loadOlder?: boolean;
};

interface ChatActions {
  setActiveChatRoom: (chatRoomId: string | null) => void;
  fetchRecentChatRooms: () => Promise<void>;
  fetchMessages: (chatRoomId: string, opts?: FetchMessagesOptions) => Promise<{ fetched: number; hasMore: boolean } | void>;
  loadOlderMessages: (chatRoomId: string, limit?: number) => Promise<{ fetched: number; hasMore: boolean } | void>;
  sendMessage: (
    chatRoomId: string,
    message: string,
    toUsername: string,
    messageType?: "text" | "image" | "meme" | "video" | "audio" | "file",
    mediaUrl?: string,
    replyToMessageId?: string
  ) => Promise<void>;
  editMessage: (messageId: string, newMessage: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markChatRoomAsRead: (chatRoomId: string) => Promise<void>;
  setUserOnlineStatus: (username: string, isOnline: boolean) => void;
  setTypingStatus: (
    chatRoomId: string,
    username: string,
    isTyping: boolean
  ) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  createChatRoom: (name: string, profilePictureUrl: string) => Promise<string>;
  deleteChatRoom: (chatRoomId: string) => Promise<void>;
  searchChatRooms: (query: string) => ChatRoom[];
  findOrCreateDirectMessage: (
    targetUsername: string,
    targetProfilePicture: string
  ) => Promise<string>;
  // UI helpers
  setMobileChatOpen: (open: boolean) => void;
  reset: () => void;
}

type ChatStore = ChatState & ChatActions;

const initialState: ChatState = {
  recentChatRooms: [],
  activeChatRoomId: null,
  messages: {},
  messagePagination: {},
  isLoading: false,
  isLoadingMessages: false,
  isLoadingRecentChatRooms: false,
  error: null,
  onlineUsers: new Set(),
  typingUsers: {},
  ephemeralChatRooms: {},
  isMobileChatOpen: false,
};

// Helper function to convert API data to internal format
const convertApiChatRoomToInternal = (apiChatRoom: ApiChatRoom): ChatRoom => ({
  chatRoomId: apiChatRoom.chatRoomId,
  name: apiChatRoom.username,
  profilePictureUrl: apiChatRoom.profilePictureUrl,
  lastMessage: apiChatRoom.lastMessage,
  unreadCount: apiChatRoom.unreadCount,
  updatedAt: apiChatRoom.lastUpdated
    ? new Date(apiChatRoom.lastUpdated)
    : new Date(),
});

const convertApiMessageToInternal = (apiMessage: any): Message => {
  const currentUser = getCurrentUser();

  // Normalize various backend shapes into our internal Message
  const id = apiMessage.id ?? apiMessage.messageId;
  const chatRoomId =
    apiMessage.chatRoomId ??
    apiMessage.conversationId ??
    apiMessage.chatroomId ??
    "";
  const rawType =
    apiMessage.messageType ??
    apiMessage.type ??
    apiMessage.message_type ??
    "text";
  const messageType =
    typeof rawType === "string"
      ? ((rawType as string).toLowerCase() as Message["messageType"])
      : "text";
  const messageText = apiMessage.message ?? apiMessage.messageText ?? "";
  const mediaUrl =
    apiMessage.mediaUrl && apiMessage.mediaUrl !== "null"
      ? apiMessage.mediaUrl
      : undefined;
  const senderId = apiMessage.senderId ?? apiMessage.fromUserId ?? "";
  const senderUsername =
    apiMessage.senderUsername ?? apiMessage.fromUsername ?? "";
  let senderProfilePicture =
    apiMessage.senderProfilePicture ?? apiMessage.senderProfilePictureUrl ?? "";

  // Ensure we have profile picture if it's available
  if (!senderProfilePicture && apiMessage.senderId) {
    try {
      const userDataStr = localStorage.getItem(`user_${apiMessage.senderId}`);
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData.profilePicture) {
          senderProfilePicture = userData.profilePicture;
        }
      }
    } catch (e) {
      console.warn("Failed to get profile picture from localStorage", e);
    }
  }

  const tsRaw = apiMessage.timestamp ?? apiMessage.createdAt ?? apiMessage.time;
  let timestamp = tsRaw ? new Date(tsRaw) : new Date();
  if (typeof tsRaw === "string" && isNaN(timestamp.getTime())) {
    // Handle non-ISO strings like "IST" by mapping to an explicit offset
    const tzFixed = tsRaw.replace(/\bIST\b/, "GMT+0530");
    const parsed = new Date(tzFixed);
    if (!isNaN(parsed.getTime())) timestamp = parsed;
  }

  const read = apiMessage.read ?? apiMessage.isRead ?? false;
  const edited = apiMessage.edited ?? apiMessage.isEdited ?? false;
  const deleted = apiMessage.deleted ?? apiMessage.isDeleted ?? false;
  const isOwn =
    apiMessage.own ?? apiMessage.isOwn ?? senderUsername === currentUser;

  return {
    id,
    chatRoomId,
    message: messageText,
    messageType,
    mediaUrl,
    replyToMessageId:
      apiMessage.replyToMessageId ?? apiMessage.replyTo ?? undefined,
    senderId,
    senderUsername,
    senderProfilePicture,
    timestamp,
    read,
    edited,
    deleted,
    isOwn,
    isServerConfirmed: true, // Mark all API messages as server-confirmed
  };
};

const useChatStoreBase = create<ChatStore>((set, get) => ({
  ...initialState,

  setActiveChatRoom: (chatRoomId) => {
    set({ activeChatRoomId: chatRoomId });
    if (chatRoomId && !get().messages[chatRoomId]) {
      get().fetchMessages(chatRoomId, { page: 0, size: 20 });
    }
  },

  fetchRecentChatRooms: async () => {
    set({ isLoadingRecentChatRooms: true, error: null });
    try {
      const response = await api.get<ApiChatRoom[]>("/chat/recent");
      const serverChatRooms = response.data.map(convertApiChatRoomToInternal);

      // Preserve local chat rooms (those with IDs starting with 'local-')
      const { recentChatRooms: currentChatRooms } = get();
      const localChatRooms = currentChatRooms.filter((room) =>
        room.chatRoomId.startsWith("local-")
      );

      // Merge server chat rooms with local chat rooms (local rooms first)
      const mergedChatRooms = [...localChatRooms, ...serverChatRooms];

      set({
        recentChatRooms: mergedChatRooms,
        isLoadingRecentChatRooms: false,
      });
    } catch (error: any) {
      const errorMessage = handleChatError(
        error,
        "Failed to fetch recent chat rooms"
      );
      set({
        error: errorMessage,
        isLoadingRecentChatRooms: false,
      });
    }
  },

  fetchMessages: async (chatRoomId, opts) => {
    const { page = 0, size = 20, loadOlder } = opts || {};

    // Initial/latest load (replace) vs older (prepend)
    if (!loadOlder) set({ isLoadingMessages: true, error: null });

    try {
      const params: Record<string, number> = { page, size };

      // For page 0: try IndexedDB cache first to show immediate messages
      let incoming: Message[] | null = null;
      if (!loadOlder && page === 0) {
        try {
          const cached = await getChatMessagesFromCache(chatRoomId, page, size);
          if (cached && cached.length) {
            incoming = cached.map((m) => ({ ...m, chatRoomId: m.chatRoomId || chatRoomId }));
            // sort to be safe
            incoming.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            // Update state immediately from cache
            set((state) => ({
              messages: { ...state.messages, [chatRoomId]: incoming as Message[] },
              messagePagination: {
                ...state.messagePagination,
                [chatRoomId]: {
                  ...(state.messagePagination[chatRoomId] || { hasMore: true, isLoadingMore: false, nextPage: 1, pageSize: size }),
                  hasMore: (incoming as Message[]).length >= size,
                  isLoadingMore: false,
                  nextPage: 1,
                  pageSize: size,
                },
              },
              isLoadingMessages: false,
            }));
          }
        } catch {}
      }

      // Always fetch fresh data from server to keep cache updated
      const response = await api.get<any[]>(`/chat/messages/${chatRoomId}`, { params });
      const serverIncoming = response.data
        .map(convertApiMessageToInternal)
        .map((m) => ({ ...m, chatRoomId: m.chatRoomId || chatRoomId }));

      // Sort ascending by timestamp to keep UI stable
      serverIncoming.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // If this is page 0 (latest), update cache with freshest data
      if (!loadOlder && page === 0) {
        // Fire and forget cache save
        saveChatMessagesToCache(chatRoomId, page, size, serverIncoming).catch(() => {});
      }

      set((state) => {
        const current = state.messages[chatRoomId] || [];

        let merged: Message[];
        if (loadOlder) {
          // Prepend older (page 1, 2, ...) to the front
          const existingIds = new Set(current.map((m) => m.id));
          const toPrepend = serverIncoming.filter((m) => !existingIds.has(m.id));
          merged = [...toPrepend, ...current];
        } else {
          // Replace initial load (page 0) with freshest from server
          merged = serverIncoming;
        }

        // Has more older pages if current response size equals requested size
        const hasMore = serverIncoming.length >= size;
        const currentPageState = state.messagePagination[chatRoomId] || {
          hasMore: true,
          isLoadingMore: false,
          nextPage: 1, // after initial page 0, next older is page 1
          pageSize: size,
        };

        const nextPage = loadOlder ? (currentPageState.nextPage + 1) : 1;

        return {
          messages: { ...state.messages, [chatRoomId]: merged },
          messagePagination: {
            ...state.messagePagination,
            [chatRoomId]: {
              hasMore,
              isLoadingMore: false,
              nextPage,
              pageSize: size,
            },
          },
          isLoadingMessages: false,
        };
      });

      return { fetched: serverIncoming.length, hasMore: serverIncoming.length >= size };
    } catch (error: any) {
      const errorMessage = handleChatError(error, "Failed to fetch messages");
      set((state) => ({
        error: errorMessage,
        isLoadingMessages: false,
        messagePagination: {
          ...state.messagePagination,
          [chatRoomId]: {
            ...(state.messagePagination[chatRoomId] || { hasMore: true, isLoadingMore: false, nextPage: 1, pageSize: 20 }),
            isLoadingMore: false,
          },
        },
      }));
    }
  },

  // Helper to load older messages using page-based API
  loadOlderMessages: async (chatRoomId, limit = 20) => {
    const { messagePagination, fetchMessages } = get();
    const pageState = messagePagination[chatRoomId] || { nextPage: 1, pageSize: limit, hasMore: true, isLoadingMore: false };

    if (!pageState.hasMore || pageState.isLoadingMore) return { fetched: 0, hasMore: pageState.hasMore };

    // Prevent parallel loads
    set((state) => ({
      messagePagination: {
        ...state.messagePagination,
        [chatRoomId]: {
          ...(state.messagePagination[chatRoomId] || { hasMore: true, isLoadingMore: false, nextPage: 1, pageSize: limit }),
          isLoadingMore: true,
        },
      },
    }));

    return fetchMessages(chatRoomId, { page: pageState.nextPage, size: pageState.pageSize, loadOlder: true });
  },

  sendMessage: async (
    chatRoomId,
    message,
    toUsername,
    messageType = "text",
    mediaUrl,
    replyToMessageId
  ) => {
    if (!message.trim()) return;

    try {
      // Import WebSocket dynamically to avoid circular dependencies
      const { useWebSocketStore } = await import("../hooks/useWebSockets");
      const wsStore = useWebSocketStore.getState();

      // Create a temporary message ID
      const tempMessageId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Create a local message object for optimistic UI update
      // const currentUser = getCurrentUser();
      // let profilePicture = "";
      // try {
      //   const authStateStr = localStorage.getItem("auth");
      //   if (authStateStr) {
      //     const authState = JSON.parse(authStateStr);
      //     profilePicture = authState.user?.profilePicture || "";
      //   }
      // } catch (e) {
      //   console.warn("Failed to get profile picture from localStorage", e);
      // }

      // Create the local message object
      // const localMessage: Message = {
      //   id: tempMessageId,
      //   chatRoomId,
      //   message: message.trim(),
      //   messageType,
      //   mediaUrl,
      //   replyToMessageId,
      //   senderId: currentUser || "",
      //   senderUsername: currentUser || "",
      //   senderProfilePicture: profilePicture,
      //   timestamp: new Date(),
      //   read: false,
      //   edited: false,
      //   deleted: false,
      //   isOwn: true,
      //   isServerConfirmed: false, // Mark as not confirmed by server yet
      // };

      // Add the message to the local state for immediate feedback (sender's UI)
      // get().addMessage(localMessage);

      // Use the consolidated sendChatMessage function
      const success = wsStore.sendChatMessage(
        chatRoomId,
        message,
        toUsername,
        messageType,
        mediaUrl,
        replyToMessageId
      );

      console.log("📤 [useChatStore] WebSocket send result:", success);
      console.log(
        "🔄 [useChatStore] Message sent via WebSocket - backend will broadcast to all participants including sender and receiver"
      );

      if (!success) {
        // Remove the optimistic message if WebSocket send failed
        set((state) => ({
          messages: {
            ...state.messages,
            [chatRoomId]:
              state.messages[chatRoomId]?.filter(
                (m) => m.id !== tempMessageId
              ) || [],
          },
        }));
        throw new Error("Failed to send message via WebSocket");
      }
    } catch (error: any) {
      const errorMessage = handleChatError(error, "Failed to send message");
      set({ error: errorMessage });
    }
  },

  editMessage: async (messageId, newMessage) => {
    try {
      await api.put(`/chat/messages/${messageId}`, { message: newMessage });

      // Also send via WebSocket for real-time updates
      import("../hooks/useWebSockets").then(({ useWebSocketStore }) => {
        const wsStore = useWebSocketStore.getState();
        wsStore.sendMessageEdit(messageId, newMessage);
      });

      // Update local store
      set((state) => ({
        messages: Object.fromEntries(
          Object.entries(state.messages).map(([roomId, msgs]) => [
            roomId,
            msgs.map((msg) =>
              msg.id === messageId
                ? { ...msg, message: newMessage, edited: true }
                : msg
            ),
          ])
        ),
      }));
    } catch (error: any) {
      const errorMessage = handleChatError(error, "Failed to edit message");
      set({ error: errorMessage });
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await api.delete(`/chat/messages/${messageId}`);

      // Also send via WebSocket for real-time updates
      import("../hooks/useWebSockets").then(({ useWebSocketStore }) => {
        const wsStore = useWebSocketStore.getState();
        wsStore.sendMessageDelete(messageId);
      });

      // Update local store
      set((state) => ({
        messages: Object.fromEntries(
          Object.entries(state.messages).map(([roomId, msgs]) => [
            roomId,
            msgs.map((msg) =>
              msg.id === messageId
                ? { ...msg, message: "[Message deleted]", deleted: true }
                : msg
            ),
          ])
        ),
      }));
    } catch (error: any) {
      const errorMessage = handleChatError(error, "Failed to delete message");
      set({ error: errorMessage });
    }
  },

  markChatRoomAsRead: async (chatRoomId) => {
    try {
      // Send MARK_AS_READ over WebSocket; backend will respond with {success, chatRoomId, updatedCount}
      const { useWebSocketStore } = await import("../hooks/useWebSockets");
      const wsStore = useWebSocketStore.getState();
      wsStore.sendMarkAsReadRequest(chatRoomId);
    } catch (error: any) {
      const errorMessage = handleChatError(
        error,
        "Failed to mark chat room as read"
      );
      set({ error: errorMessage });
    }
  },

  setUserOnlineStatus: (username, isOnline) => {
    set((state) => ({
      onlineUsers: isOnline
        ? new Set([...state.onlineUsers, username])
        : new Set([...state.onlineUsers].filter((user) => user !== username)),
    }));
  },

  setTypingStatus: (chatRoomId, username, isTyping) => {
    set((state) => {
      const currentTyping = state.typingUsers[chatRoomId] || [];
      const newTyping = isTyping
        ? [...currentTyping.filter((user) => user !== username), username]
        : currentTyping.filter((user) => user !== username);

      return {
        typingUsers: {
          ...state.typingUsers,
          [chatRoomId]: newTyping,
        },
      };
    });
  },

  // UI: track if mobile chat panel is open to hide/show bottom nav
  setMobileChatOpen: (open) => {
    set({ isMobileChatOpen: open });
  },

  addMessage: (message) => {
    if (!message.chatRoomId) {
      return console.error("Missing chatRoomId", message);
    }

    set((state) => {
      const chatId = message.chatRoomId;
      const existingMessages = state.messages[chatId] || [];

      // Prevent duplicates by messageId
      const exists = existingMessages.some((m) => m.id === message.id);
      if (exists) return state;

      // Only add messages confirmed by the server
      if (!message.isServerConfirmed) {
        console.warn(
          "Ignoring unconfirmed message. Only server-confirmed messages are added.",
          message
        );
        return state;
      }

      const updatedMessages = {
        ...state.messages,
        [chatId]: [
          ...existingMessages,
          {
            ...message,
            own: message.senderUsername === getCurrentUser(),
          },
        ],
      };

      // Update recentChatRooms list
      const chatRoomIndex = state.recentChatRooms.findIndex(
        (r) => r.chatRoomId === chatId
      );
      let updatedRecentChatRooms = [...state.recentChatRooms];

      if (chatRoomIndex !== -1) {
        const isFromOther = message.senderUsername !== getCurrentUser();
        const isNotActive = state.activeChatRoomId !== chatId;

        const updatedRoom = {
          ...updatedRecentChatRooms[chatRoomIndex],
          lastMessage: message.message,
          updatedAt: message.timestamp,
          unreadCount:
            isFromOther && isNotActive
              ? (updatedRecentChatRooms[chatRoomIndex].unreadCount || 0) + 1
              : updatedRecentChatRooms[chatRoomIndex].unreadCount || 0,
        };

        // Move to top
        updatedRecentChatRooms.splice(chatRoomIndex, 1);
        updatedRecentChatRooms.unshift(updatedRoom);
      }

      return {
        ...state,
        messages: updatedMessages,
        recentChatRooms: updatedRecentChatRooms,
        lastMessageUpdate: Date.now(), // force re-render everywhere
      };
    });
  },

  updateMessage: (messageId, updates) => {
    set((state) => ({
      messages: Object.fromEntries(
        Object.entries(state.messages).map(([roomId, msgs]) => [
          roomId,
          msgs.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        ])
      ),
    }));
  },

  createChatRoom: async (name, profilePictureUrl) => {
    try {
      const response = await api.post<ApiChatRoom>("/chat/rooms", {
        name,
        profilePictureUrl,
      });

      const newChatRoom = convertApiChatRoomToInternal(response.data);

      set((state) => ({
        recentChatRooms: [newChatRoom, ...state.recentChatRooms],
      }));

      return newChatRoom.chatRoomId;
    } catch (error: any) {
      const errorMessage = handleChatError(error, "Failed to create chat room");
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteChatRoom: async (chatRoomId) => {
    try {
      await api.delete(`/chat/rooms/${chatRoomId}`);

      set((state) => ({
        recentChatRooms: state.recentChatRooms.filter(
          (room) => room.chatRoomId !== chatRoomId
        ),
        messages: Object.fromEntries(
          Object.entries(state.messages).filter(
            ([roomId]) => roomId !== chatRoomId
          )
        ),
        activeChatRoomId:
          state.activeChatRoomId === chatRoomId ? null : state.activeChatRoomId,
      }));
    } catch (error: any) {
      const errorMessage = handleChatError(error, "Failed to delete chat room");
      set({ error: errorMessage });
    }
  },

  searchChatRooms: (query) => {
    const { recentChatRooms } = get();
    if (!query.trim()) return recentChatRooms;

    const lowercaseQuery = query.toLowerCase();
    return recentChatRooms.filter(
      (room) =>
        room.name.toLowerCase().includes(lowercaseQuery) ||
        room.lastMessage?.toLowerCase().includes(lowercaseQuery)
    );
  },

  findOrCreateDirectMessage: async (targetUsername, targetProfilePicture) => {
    try {
      // First, check if a direct message chat room already exists with this user
      const { recentChatRooms } = get();
      const existingRoom = recentChatRooms.find(
        (room) =>
          room.name === targetUsername || room.name.includes(targetUsername)
      );

      if (existingRoom) {
        return existingRoom.chatRoomId;
      }

      // Check with backend if chat room exists for this user
      try {
        const response = await api.get("/chat/rooms", {
          params: { username: targetUsername }, // Send username directly as string in request body
        });

        // If backend returns a chatRoomId, use that existing room
        if (response.data) {
          const chatRoomId = response.data; // Backend returns chatRoomId directly as string
          const chatRoom: ChatRoom = {
            chatRoomId: chatRoomId,
            name: targetUsername,
            profilePictureUrl: targetProfilePicture,
            lastMessage: "",
            unreadCount: 0,
            updatedAt: new Date(),
          };

          // Add to recent chat rooms if not already there
          set((state) => ({
            recentChatRooms: [chatRoom, ...state.recentChatRooms],
          }));

          return chatRoomId;
        }
      } catch (apiError: any) {
        // Handle different error types
        if (apiError.response?.status === 401) {
          console.warn(
            "Authentication required for chat functionality. Creating local chat room."
          );
          // Don't log as error since this is expected behavior for unauthenticated users
        } else if (apiError.response?.status === 404) {
          // Room not found - this is expected, continue to create local room
          console.log(
            "No existing chat room found with user, creating local room"
          );
        } else {
          // Other errors (network, server errors, etc.)
          console.warn(
            "Error checking for existing chat room:",
            apiError.message
          );
        }
      }

      // If no existing room found, create a local empty chat area
      const localChatRoomId = `local-${targetUsername}-${Date.now()}`;
      const emptyChatRoom: ChatRoom = {
        chatRoomId: localChatRoomId,
        name: targetUsername,
        profilePictureUrl: targetProfilePicture,
        lastMessage: "",
        unreadCount: 0,
        updatedAt: new Date(),
      };

      // Initialize empty messages and store room only in ephemeral map (do NOT add to recentChatRooms)
      set((state) => ({
        ephemeralChatRooms: {
          ...(state.ephemeralChatRooms || {}),
          [localChatRoomId]: emptyChatRoom,
        },
        messages: {
          ...state.messages,
          [localChatRoomId]: [],
        },
      }));

      return localChatRoomId;
    } catch (error: any) {
      console.error("Failed to find or create direct message:", error);

      // On error, still create local chat area
      const localChatRoomId = `local-${targetUsername}-${Date.now()}`;
      const emptyChatRoom: ChatRoom = {
        chatRoomId: localChatRoomId,
        name: targetUsername,
        profilePictureUrl: targetProfilePicture,
        lastMessage: "",
        unreadCount: 0,
        updatedAt: new Date(),
      };

      set((state) => ({
        ephemeralChatRooms: {
          ...(state.ephemeralChatRooms || {}),
          [localChatRoomId]: emptyChatRoom,
        },
        messages: {
          ...state.messages,
          [localChatRoomId]: [],
        },
      }));

      return localChatRoomId;
    }
  },

  reset: () => {
    set(initialState);
  },
}));

// WebSocket handlers are now managed by the consolidated useWebSockets hook
// No need to set up handlers here as they're initialized in the useChatWebSocket hook

// Export raw store without selector wrapper for chat store
const useChatStore = useChatStoreBase;

export { useChatStore };
export default useChatStore;
