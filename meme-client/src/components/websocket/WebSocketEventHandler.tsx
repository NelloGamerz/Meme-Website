// import { useEffect } from 'react';
// import { useChatStore } from '../../store/useChatStore';
// import { useChatWebSocket } from '../../hooks/useChatWebSocket';

// /**
//  * WebSocketEventHandler ensures that WebSocket handlers are properly initialized
//  * for real-time messaging updates on both sender and receiver sides
//  */
// export const WebSocketEventHandler: React.FC = () => {
//   const addMessage = useChatStore.use.addMessage();
//   const updateMessage = useChatStore.use.updateMessage();
//   const setUserOnlineStatus = useChatStore.use.setUserOnlineStatus();
//   const setTypingStatus = useChatStore.use.setTypingStatus();
//   const fetchRecentChatRooms = useChatStore.use.fetchRecentChatRooms();
  
//   // Initialize WebSocket handlers for real-time messaging
//   useChatWebSocket();

//   useEffect(() => {
//     console.log('🔌 [WebSocketEventHandler] Initializing real-time messaging handlers');
    
//     // The useChatWebSocket hook already handles the WebSocket initialization
//     // This component ensures the handlers are properly set up when the app loads
    
//     return () => {
//       console.log('🔌 [WebSocketEventHandler] Cleaning up real-time messaging handlers');
//     };
//   }, []);

//   // This component doesn't render anything, it just manages WebSocket handlers
//   return null;
// };

// export default WebSocketEventHandler;