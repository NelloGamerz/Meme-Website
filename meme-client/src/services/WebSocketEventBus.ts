import { WebSocketMessageType, WebSocketMessage } from './WebSocketService';

type EventCallback = (data: WebSocketMessage) => void;

class WebSocketEventBus {
  private static instance: WebSocketEventBus;
  private eventListeners: Map<WebSocketMessageType, Set<EventCallback>>;
  
  private constructor() {
    this.eventListeners = new Map();
    
    const messageTypes: WebSocketMessageType[] = [
      'PING', 'PONG', 'FOLLOW', 'COMMENT', 'LIKE', 'SAVE', 
      'NOTIFICATION', 'JOIN_POST', 'LEAVE_POST'
    ];
    
    messageTypes.forEach(type => {
      this.eventListeners.set(type, new Set());
    });
  }
  
  public static getInstance(): WebSocketEventBus {
    if (!WebSocketEventBus.instance) {
      WebSocketEventBus.instance = new WebSocketEventBus();
    }
    return WebSocketEventBus.instance;
  }
  
  public subscribe(type: WebSocketMessageType, callback: EventCallback): () => void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.add(callback);
    } else {
      this.eventListeners.set(type, new Set([callback]));
    }
    
    return () => {
      const listeners = this.eventListeners.get(type);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }
  
  public publish(message: WebSocketMessage): void {
    const type = message.type;
    const listeners = this.eventListeners.get(type);
    
    if (listeners && listeners.size > 0) {
      listeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {}
      });
    }
  }
  
  public clear(): void {
    this.eventListeners.forEach(listeners => {
      listeners.clear();
    });
  }
}

export const webSocketEventBus = WebSocketEventBus.getInstance();

export function useWebSocketEvent(type: WebSocketMessageType, callback: EventCallback): () => void {
  return webSocketEventBus.subscribe(type, callback);
}