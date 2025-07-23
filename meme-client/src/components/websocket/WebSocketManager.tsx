import { useEffect, useRef } from 'react';
import WebSocketService from '../../services/WebSocketService';
import { useWebSocketStore } from '../../hooks/useWebSockets';
import { useWebSocketUserEvents } from '../../hooks/useWebSocketUserEvents';

export const WebSocketManager: React.FC = () => {
  const isInitializedRef = useRef(false);
  
  useWebSocketUserEvents();
  
  useEffect(() => {
    WebSocketService.restoreConnection();
    const unregisterAppActive = WebSocketService.registerApplicationActive();
    isInitializedRef.current = true;

    return () => {
      if (unregisterAppActive) {
        unregisterAppActive();
      }
    };
  }, []);
  
  const lastReconnectEventRef = useRef<number>(0);
  
  useEffect(() => {
    let routeChangeTimeout: NodeJS.Timeout | null = null;
    
    const handleRouteChange = () => {
      if (routeChangeTimeout) {
        clearTimeout(routeChangeTimeout);
      }
      
      routeChangeTimeout = setTimeout(() => {
        const wsStore = useWebSocketStore.getState();
        if (wsStore.isConnected && wsStore.client) {
          if (wsStore.client.readyState !== WebSocket.OPEN) {
            WebSocketService.restoreConnection();  
            setTimeout(() => {
              const newClient = WebSocketService.getClient();
              if (newClient && newClient.readyState === WebSocket.OPEN) {
                dispatchReconnectEvent(newClient);
              }
            }, 1000);
          } else {
            const now = Date.now();
            if (now - lastReconnectEventRef.current > 2000) {
              dispatchReconnectEvent(wsStore.client);
            }
          }
        }
      }, 300);
    };
    
    const dispatchReconnectEvent = (client: WebSocket) => {
      lastReconnectEventRef.current = Date.now();
      const event = new CustomEvent('websocket-reconnected', { 
        detail: { client } 
      });
      window.dispatchEvent(event);
    };
    
    window.addEventListener('popstate', handleRouteChange);    
    window.addEventListener('navigation', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('navigation', handleRouteChange);
      if (routeChangeTimeout) {
        clearTimeout(routeChangeTimeout);
      }
    };
  }, []);
  return null;
};