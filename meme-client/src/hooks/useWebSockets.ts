import { create } from "zustand";
import WebSocketService, { 
  WebSocketMessageType, 
  WebSocketMessage, 
  MessageHandler 
} from "../services/WebSocketService";

interface WebSocketStore {
  isConnected: boolean;
  client: WebSocket | null; 
  connect: () => void;
  disconnect: () => void;
  restoreConnection: () => void;
  sendMessage: (message: WebSocketMessage) => boolean;
  registerMessageHandler: (type: WebSocketMessageType, handler: MessageHandler) => () => void;
  registerApplicationActive: () => () => void;
  sendFollowRequest: (targetUserId: string, targetUsername: string, isFollowing: boolean) => boolean;
  sendJoinPostRequest: (postId: string) => boolean;
  sendLeavePostRequest: (postId: string) => boolean;
  sendLikeRequest: (memeId: string) => Promise<boolean>;
  sendSaveRequest: (memeId: string) => Promise<boolean>;
  sendCommentRequest: (memeId: string, text: string, profilePictureUrl: string) => boolean;
}

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
  
  registerMessageHandler: (type: WebSocketMessageType, handler: MessageHandler) => {
    return WebSocketService.registerMessageHandler(type, handler);
  },
  
  registerApplicationActive: () => {
    return WebSocketService.registerApplicationActive();
  },
  
  sendFollowRequest: (targetUserId: string, targetUsername: string, isFollowing: boolean) => {
    return WebSocketService.sendFollowRequest(targetUserId, targetUsername, isFollowing);
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
  
  sendCommentRequest: (memeId: string, text: string, profilePictureUrl: string) => {
    return WebSocketService.sendCommentRequest(memeId, text, profilePictureUrl);
  }
}));

WebSocketService.registerConnectionStateListener((state) => {
  useWebSocketStore.setState({ 
    isConnected: state === 'CONNECTED',
    client: WebSocketService.getClient()
  });
});

export default useWebSocketStore;
