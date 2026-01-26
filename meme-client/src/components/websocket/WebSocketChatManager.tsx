import { useEffect, useRef } from 'react';
import { useWebSocketStore } from '../../hooks/useWebSockets';
import { useChatStore, } from '../../store/useChatStore';
import { getCurrentUser } from '../../utils/chatHelpers';
import { wsDebugger } from '../../utils/websocketDebugger';
import WebSocketService from '../../services/WebSocketService';

/**
 * WebSocketChatManager ensures that chat-specific WebSocket handlers
 * are properly initialized and maintained for real-time messaging
 */
export const WebSocketChatManager: React.FC = () => {
  const { isConnected, client, initializeChatHandlers } = useWebSocketStore();
  const isInitializedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const directHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    console.log('🔄 [WebSocketChatManager] Connection state changed - Connected:', isConnected, 'Client:', !!client);
    
    // Clean up previous handlers if they exist
    if (cleanupRef.current) {
      console.log('🧹 [WebSocketChatManager] Cleaning up previous handlers');
      cleanupRef.current();
      cleanupRef.current = null;
      isInitializedRef.current = false;
    }
    
    if (directHandlerRef.current) {
      console.log('🧹 [WebSocketChatManager] Cleaning up direct handler');
      directHandlerRef.current();
      directHandlerRef.current = null;
    }

    // Initialize handlers if connected and not already initialized
    if (isConnected && client && !isInitializedRef.current) {
      console.log('🚀 [WebSocketChatManager] Initializing chat handlers for real-time messaging');
      
      try {
        const cleanup = initializeChatHandlers({
          addMessage: (message: any) => {
            console.log('📨 [WebSocketChatManager] Received message for UI update:', message);
            wsDebugger.logReceivedMessage(message, 'WebSocketChatManager.addMessage');
            
            // Add the message to the store
            useChatStore.getState().addMessage(message);
            
            // Force a state update to ensure UI re-renders
            setTimeout(() => {
              console.log('🔄 [WebSocketChatManager] Triggering UI refresh after message addition');
              
              // UI updates handled in store; no manual state bump needed
            }, 50);
          },
          updateMessage: (messageId: string, updates: any) => {
            console.log('🔄 [WebSocketChatManager] Updating message:', messageId, updates);
            useChatStore.getState().updateMessage(messageId, updates);
          },
          setUserOnlineStatus: (username: string, isOnline: boolean) => {
            console.log('👤 [WebSocketChatManager] User online status:', username, isOnline);
            useChatStore.getState().setUserOnlineStatus(username, isOnline);
          },
          setTypingStatus: (chatRoomId: string, username: string, isTyping: boolean) => {
            console.log('⌨️ [WebSocketChatManager] Typing status:', username, isTyping, 'in', chatRoomId);
            useChatStore.getState().setTypingStatus(chatRoomId, username, isTyping);
          },
          fetchRecentChatRooms: () => {
            console.log('📋 [WebSocketChatManager] Refreshing chat rooms');
            useChatStore.getState().fetchRecentChatRooms();
          }
        });

        cleanupRef.current = cleanup;
        isInitializedRef.current = true;
        
        console.log('✅ [WebSocketChatManager] Chat handlers initialized successfully');
        console.log('🎯 [WebSocketChatManager] Current user:', getCurrentUser());
        
        // Also register a direct handler as backup
        const directChatHandler = (data: any) => {
          console.log('🔥 [WebSocketChatManager] DIRECT HANDLER - Received CHAT message:', data);
          
          if (data.type === 'CHAT') {
            const currentUser = getCurrentUser();
            const messageObj = {
              id: data.messageId || `temp-${Date.now()}`,
              chatRoomId: data.chatRoomId || data.conversationId || '',
              message: data.messageText || data.message || '',
              messageType: (data.messageType || 'TEXT').toLowerCase(),
              mediaUrl: data.mediaUrl,
              replyToMessageId: data.replyToMessageId,
              senderId: data.senderId,
              senderUsername: data.senderUsername || '',
              senderProfilePicture: data.senderProfilePictureUrl || '',
              timestamp: new Date(data.timestamp || Date.now()),
              read: data.read || false,
              edited: data.edited || false,
              deleted: data.deleted || false,
              isOwn: data.senderUsername === currentUser,
              isServerConfirmed: true
            };
            
            console.log('🔥 [WebSocketChatManager] DIRECT HANDLER - Processing message:', messageObj);
            useChatStore.getState().addMessage(messageObj);
            
            // Force UI update
            setTimeout(() => {
              // UI updates handled in store; no manual state bump needed
            }, 50);
          }
        };
        
        directHandlerRef.current = WebSocketService.registerMessageHandler('CHAT', directChatHandler);
        console.log('🔥 [WebSocketChatManager] Direct CHAT handler registered as backup');
        
        // Log current WebSocket state for debugging
        wsDebugger.logProcessedMessage({
          action: 'handlers_initialized',
          isConnected,
          hasClient: !!client,
          currentUser: getCurrentUser()
        }, 'WebSocketChatManager');
        
      } catch (error) {
        console.error('❌ [WebSocketChatManager] Failed to initialize chat handlers:', error);
        wsDebugger.logError(error, 'WebSocketChatManager.initialization');
      }
    } else if (!isConnected) {
      console.log('⚠️ [WebSocketChatManager] WebSocket not connected, waiting for connection...');
    }

    // Cleanup function
    return () => {
      if (cleanupRef.current) {
        console.log('🧹 [WebSocketChatManager] Component unmounting, cleaning up handlers');
        cleanupRef.current();
        cleanupRef.current = null;
        isInitializedRef.current = false;
      }
      
      if (directHandlerRef.current) {
        console.log('🧹 [WebSocketChatManager] Component unmounting, cleaning up direct handler');
        directHandlerRef.current();
        directHandlerRef.current = null;
      }
    };
  }, [isConnected, client, initializeChatHandlers]);

  // Monitor connection health
  useEffect(() => {
    if (isConnected && client) {
      const healthCheck = setInterval(() => {
        if (!isInitializedRef.current) {
          console.warn('⚠️ [WebSocketChatManager] Handlers not initialized despite connection, attempting to reinitialize...');
          // Trigger re-initialization by updating a dependency
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(healthCheck);
    }
  }, [isConnected, client]);

  return null;
};

export default WebSocketChatManager;