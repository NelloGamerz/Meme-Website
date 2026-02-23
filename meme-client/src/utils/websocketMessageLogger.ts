import WebSocketService from '../services/WebSocketService';

let isLoggerInitialized = false;

export const initializeWebSocketLogger = () => {
  if (isLoggerInitialized) {
    console.log('🔍 [WebSocketLogger] Already initialized');
    return;
  }

  console.log('🔍 [WebSocketLogger] Initializing global WebSocket message logger');

  // Register handlers for all message types to log everything
  const messageTypes = [
    'PING', 'PONG', 'FOLLOW', 'COMMENT', 'LIKE', 'SAVE', 'NOTIFICATION',
    'JOIN_POST', 'LEAVE_POST', 'CHAT', 'EDIT_MESSAGE', 'DELETE_MESSAGE',
    'TYPING_INDICATOR', 'MESSAGE_READ', 'USER_ONLINE', 'USER_OFFLINE', 'UPDATE_RECENT_CHAT'
  ];

  const globalHandler = (data: any) => {
    const timestamp = new Date().toLocaleTimeString();
    
    if (data.type === 'CHAT') {
      console.log(`🔍 [WebSocketLogger] ${timestamp} - CHAT MESSAGE RECEIVED:`, {
        type: data.type,
        messageId: data.messageId,
        chatRoomId: data.chatRoomId,
        senderUsername: data.senderUsername,
        messageText: data.messageText,
        timestamp: data.timestamp,
        fullData: data
      });
    } else if (data.type !== 'PING' && data.type !== 'PONG') {
      console.log(`🔍 [WebSocketLogger] ${timestamp} - ${data.type} MESSAGE:`, data);
    }
  };

  // Register the global handler for all message types
  messageTypes.forEach(type => {
    WebSocketService.registerMessageHandler(type as any, globalHandler);
  });

  isLoggerInitialized = true;
  console.log('✅ [WebSocketLogger] Global WebSocket message logger initialized');
};

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Delay initialization to ensure WebSocketService is ready
  setTimeout(() => {
    initializeWebSocketLogger();
  }, 1000);
}