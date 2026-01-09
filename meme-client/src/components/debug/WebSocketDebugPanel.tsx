import React, { useState, useEffect } from 'react';
import { wsDebugger } from '../../utils/websocketDebugger';
import { useWebSocketStore } from '../../hooks/useWebSockets';

interface WebSocketDebugPanelProps {
  isVisible?: boolean;
}

export const WebSocketDebugPanel: React.FC<WebSocketDebugPanelProps> = ({ 
  isVisible = false 
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isConnected, client } = useWebSocketStore();

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setLogs(wsDebugger.getRecentLogs(10));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg max-w-md">
        <div 
          className="p-3 cursor-pointer flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">WebSocket Debug</span>
          </div>
          <span className="text-xs">{isExpanded ? '▼' : '▲'}</span>
        </div>
        
        {isExpanded && (
          <div className="border-t border-gray-700 p-3 max-h-64 overflow-y-auto">
            <div className="text-xs mb-2">
              <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
              <div>Client: {client ? '✅ Active' : '❌ None'}</div>
            </div>
            
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="text-xs text-gray-400">No recent activity</div>
              ) : (
                logs.slice(-5).map((log, index) => (
                  <div key={index} className="text-xs">
                    <div className="flex items-center space-x-1">
                      <span className={`
                        ${log.type === 'SENT' ? 'text-blue-400' : ''}
                        ${log.type === 'RECEIVED' ? 'text-green-400' : ''}
                        ${log.type === 'PROCESSED' ? 'text-yellow-400' : ''}
                        ${log.type === 'ERROR' ? 'text-red-400' : ''}
                      `}>
                        {log.type}
                      </span>
                      <span className="text-gray-300">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-400 truncate">
                      {log.source}: {JSON.stringify(log.data).substring(0, 50)}...
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-700">
              <button
                onClick={() => wsDebugger.printSummary()}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
              >
                Print Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketDebugPanel;