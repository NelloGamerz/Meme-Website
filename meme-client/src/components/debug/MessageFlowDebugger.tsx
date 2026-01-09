import React, { useEffect, useState } from 'react';
import { useWebSocketStore } from '../../hooks/useWebSockets';
import { useChatStore } from '../../store/useChatStore';
import { getCurrentUser } from '../../utils/chatHelpers';

interface MessageFlowDebuggerProps {
  isVisible?: boolean;
}

export const MessageFlowDebugger: React.FC<MessageFlowDebuggerProps> = ({ 
  isVisible = false 
}) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { isConnected, client } = useWebSocketStore();
  const messages = useChatStore((s) => s.messages);
  const recentChatRooms = useChatStore((s) => s.recentChatRooms);
  const activeChatRoomId = useChatStore((s) => s.activeChatRoomId);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        const currentUser = getCurrentUser();
        const activeMessages = activeChatRoomId ? messages[activeChatRoomId] || [] : [];
        
        setDebugInfo({
          timestamp: new Date().toLocaleTimeString(),
          websocket: {
            isConnected,
            hasClient: !!client,
            clientState: client?.readyState
          },
          user: {
            currentUser,
            isLoggedIn: !!currentUser
          },
          chat: {
            activeChatRoomId,
            totalChatRooms: recentChatRooms.length,
            activeMessagesCount: activeMessages.length,
            lastMessage: activeMessages[activeMessages.length - 1],
            totalMessagesAcrossAllChats: Object.values(messages).reduce((sum, msgs) => sum + msgs.length, 0)
          },
          store: {
            messagesKeys: Object.keys(messages),
            chatRoomIds: recentChatRooms.map(room => room.chatRoomId)
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible, isConnected, client, messages, recentChatRooms, activeChatRoomId]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-black text-green-400 rounded-lg shadow-lg p-4 text-xs font-mono">
        <div className="mb-2 font-bold text-green-300">Message Flow Debug</div>
        
        <div className="space-y-2">
          <div>
            <div className="text-yellow-400">WebSocket Status:</div>
            <div>Connected: {debugInfo.websocket?.isConnected ? '✅' : '❌'}</div>
            <div>Client: {debugInfo.websocket?.hasClient ? '✅' : '❌'}</div>
            <div>State: {debugInfo.websocket?.clientState}</div>
          </div>

          <div>
            <div className="text-yellow-400">User Info:</div>
            <div>Current: {debugInfo.user?.currentUser || 'None'}</div>
            <div>Logged In: {debugInfo.user?.isLoggedIn ? '✅' : '❌'}</div>
          </div>

          <div>
            <div className="text-yellow-400">Chat State:</div>
            <div>Active Room: {debugInfo.chat?.activeChatRoomId || 'None'}</div>
            <div>Total Rooms: {debugInfo.chat?.totalChatRooms || 0}</div>
            <div>Active Messages: {debugInfo.chat?.activeMessagesCount || 0}</div>
            <div>Total Messages: {debugInfo.chat?.totalMessagesAcrossAllChats || 0}</div>
          </div>

          {debugInfo.chat?.lastMessage && (
            <div>
              <div className="text-yellow-400">Last Message:</div>
              <div className="truncate">From: {debugInfo.chat.lastMessage.senderUsername}</div>
              <div className="truncate">Text: {debugInfo.chat.lastMessage.message}</div>
              <div>Time: {new Date(debugInfo.chat.lastMessage.timestamp).toLocaleTimeString()}</div>
            </div>
          )}

          <div>
            <div className="text-yellow-400">Store Keys:</div>
            <div>Messages: [{debugInfo.store?.messagesKeys?.join(', ') || 'None'}]</div>
            <div>Rooms: [{debugInfo.store?.chatRoomIds?.slice(0, 3).join(', ') || 'None'}]</div>
          </div>

          <div className="text-gray-400 text-xs">
            Updated: {debugInfo.timestamp}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageFlowDebugger;