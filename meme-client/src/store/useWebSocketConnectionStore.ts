import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "./createSelectors";
import { useWebSocketStore } from "../hooks/useWebSockets";
import { useMemeContentStore } from "./useMemeContentStore";
import { useNotificationStore } from "./useNotificationStore";
import { getCurrentAuthUser } from "../utils/authHelpers";
import type { Comment, Meme } from "../types/mems";
import type { MemeContentStore } from "./useMemeContentStore";
import type { NotificationStore } from "./useNotificationStore";

interface WebSocketConnectionState {
  isConnected: boolean;
  wsUnsubscribe: (() => void) | null;
}

interface WebSocketConnectionActions {
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  setupMessageHandlers: () => void;
}

type WebSocketConnectionStore = WebSocketConnectionState & WebSocketConnectionActions;

let lastJoinedPostId: string | null = null;

const useRawWebSocketConnectionStore = create<WebSocketConnectionStore>()(
  immer((set, get) => ({
    isConnected: false,
    wsUnsubscribe: null,

    connectWebSocket: () => {
      const wsStore = useWebSocketStore.getState();
      
      // If we don't have a connection, try to establish one
      if (!wsStore.isConnected) {
        wsStore.restoreConnection();
        
        let retryCount = 0;
        const maxRetries = 5;
        const retryInterval = 1000;
        
        const checkConnection = () => {
          const updatedWsStore = useWebSocketStore.getState();
          if (updatedWsStore.isConnected) {
            
            get().setupMessageHandlers();
            
            if (lastJoinedPostId) {
              const memeStore = useMemeContentStore.getState() as MemeContentStore;
              memeStore.joinPostSession(lastJoinedPostId);
            }
            
            set((state) => {
              state.isConnected = true;
            });
          } else {
            retryCount++;
            if (retryCount < maxRetries) {
              setTimeout(checkConnection, retryInterval);
            }
          }
        };
        
        setTimeout(checkConnection, retryInterval);
        
        return;
      }
      
      if (wsStore.isConnected) {
        get().setupMessageHandlers();        
        if (lastJoinedPostId) {
          const memeStore = useMemeContentStore.getState() as MemeContentStore;
          memeStore.joinPostSession(lastJoinedPostId);
        }
        
        set((state) => {
          state.isConnected = true;
        });
      }
    },

    disconnectWebSocket: () => {
      const { wsUnsubscribe } = get();
      
      if (lastJoinedPostId) {
        useWebSocketStore.getState().sendLeavePostRequest(lastJoinedPostId);
      }
      
      if (wsUnsubscribe) {
        wsUnsubscribe();
      }
      
      set((state) => {
        state.wsUnsubscribe = null;
        state.isConnected = false;
      });
      
      lastJoinedPostId = null;
    },

    setupMessageHandlers: () => {
      const { wsUnsubscribe } = get();
      if (wsUnsubscribe) {
        wsUnsubscribe();
      }
      
      const connectionUnsubscribe = useWebSocketStore.subscribe((wsState) => {
        if (wsState.isConnected && lastJoinedPostId) {
          const memeStore = useMemeContentStore.getState() as MemeContentStore;
          memeStore.joinPostSession(lastJoinedPostId);
        }
        
        set((state) => {
          state.isConnected = wsState.isConnected;
        });
      });
      
      const commentHandler = useWebSocketStore.getState().registerMessageHandler('COMMENT', (data) => {
        if (data.memeId) {          
          const commentId = data.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
          const newComment: Comment = {
            id: commentId.toString(),
            memeId: data.memeId as string,
            userId: data.userId as string,
            text: data.text as string,
            username: data.username as string,
            createdAt: data.createdAt as string,
            profilePictureUrl: data.profilePictureUrl as string,
          };
          
          const memeContentStore = useMemeContentStore.getState() as MemeContentStore;
          
          try {
            if (memeContentStore.forceAddComment) {
              memeContentStore.forceAddComment(newComment);
            } else {
              memeContentStore.updateCommentInStore(newComment);
            }
            
            const currentUser = getCurrentAuthUser();
            if (currentUser?.userId && currentUser.userId !== data.userId) {
              import('react-hot-toast').then(toast => {
                toast.default.success(`${data.username} commented: ${data.text}`);
              });
            }
          } catch (error) {
          }
        }
      });
      
      const likeHandler = useWebSocketStore.getState().registerMessageHandler('LIKE', (data) => {
        if (data.memeId) {
          const currentUser = getCurrentAuthUser();
          const isCurrentUserAction = currentUser?.userId && data.userId === currentUser.userId;
          
          const memeStore = useMemeContentStore.getState() as MemeContentStore;
          
          memeStore.updateMemeStats(data.memeId as string, {
            likes: Number(data.likeCount)
          });

          if (isCurrentUserAction && data.action !== undefined && currentUser?.username) {
            const memeState = memeStore;
            const isCurrentlyLiked = memeState.likedMemes.some((m: Meme) => m.id === data.memeId);

            const shouldBeLiked = data.action === 'LIKE';
            
            // If the current state doesn't match what it should be, toggle it
            if (isCurrentlyLiked !== shouldBeLiked) {
              memeStore.toggleLike(data.memeId as string, currentUser.username);
            }
          }
        }
      });
      
      const saveHandler = useWebSocketStore.getState().registerMessageHandler('SAVE', (data) => {
        if (data.memeId) {
          const currentUser = getCurrentAuthUser();
          const isCurrentUserAction = currentUser?.userId && data.userId === currentUser.userId;
          
          const memeStore = useMemeContentStore.getState() as MemeContentStore;

          if (isCurrentUserAction && data.action !== undefined && currentUser?.username) {
            
            const memeState = memeStore;
            const isCurrentlySaved = memeState.savedMemes.some((m: Meme) => m.id === data.memeId);

            const shouldBeSaved = data.action === 'SAVE';
            
            if (isCurrentlySaved !== shouldBeSaved) {
              memeStore.toggleSave(data.memeId as string, currentUser.username);
            } else {
              memeStore.updateMemeStats(data.memeId as string, {
                saves: Number(data.saveCount)
              });
            }
          } else if (!isCurrentUserAction) {
            memeStore.updateMemeStats(data.memeId as string, {
              saves: Number(data.saveCount)
            });
          }
        }
      });
      
      const notificationHandler = useWebSocketStore.getState().registerMessageHandler('NOTIFICATION', (data) => {
        const notificationStore = useNotificationStore.getState() as NotificationStore;
        notificationStore.addNotification({
          id: data.id as string,
          type: data.type as string,
          message: data.message as string,
          createdAt: new Date(data.createdAt as string),
          isRead: false,
          userId: data.userId as string,
          targetId: data.targetId as string,
          sourceUserId: data.sourceUserId as string,
          sourceUsername: data.sourceUsername as string,
          sourceProfilePictureUrl: data.sourceProfilePictureUrl as string,
        });
      });
      
      const followHandler = useWebSocketStore.getState().registerMessageHandler('FOLLOW', (data) => {        
        import('../store/useUserStore').then(({ useUserStore }) => {
          const userStore = useUserStore.getState();
          
          const currentUser = getCurrentAuthUser();
          const isCurrentUserProfile = currentUser?.userId && data.followingUserId === currentUser.userId;
          const isCurrentUserAction = currentUser?.userId && data.followerId === currentUser.userId;
          
          if (isCurrentUserProfile) {
            if (data.isFollowing) {
              userStore.addFollower({
                userId: data.followerId as string,
                username: data.followerUsername as string,
                profilePictureUrl: data.profilePictureUrl as string,
                isFollow: true
              });
            } else {
              userStore.removeFollower(data.followerId as string);
            }
          } else if (isCurrentUserAction) {
          }
        }).catch(error => {
        });
      });
      
      const unsubscribeFunctions = () => {
        connectionUnsubscribe();
        commentHandler();
        likeHandler();
        saveHandler();
        notificationHandler();
        followHandler();
      };
      
      set((state) => {
        state.wsUnsubscribe = unsubscribeFunctions;
      });
    },
  }))
);

export const useWebSocketConnectionStore = createSelectors(useRawWebSocketConnectionStore);