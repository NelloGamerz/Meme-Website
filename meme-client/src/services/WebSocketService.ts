const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

export type WebSocketMessageType = 
  | 'PING' 
  | 'PONG' 
  | 'FOLLOW' 
  | 'COMMENT' 
  | 'LIKE' 
  | 'SAVE' 
  | 'NOTIFICATION'
  | 'JOIN_POST'
  | 'LEAVE_POST';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: unknown;
}

export type MessageHandler = (message: WebSocketMessage) => void;

type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

class WebSocketService {
  private static instance: WebSocketService;

  private client: WebSocket | null = null;
  private connectionState: ConnectionState = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionMonitorTimer: NodeJS.Timeout | null = null;
  private isApplicationActive = false;
  
  private messageHandlers: Record<WebSocketMessageType, Set<MessageHandler>> = {
    'PING': new Set(),
    'PONG': new Set(),
    'FOLLOW': new Set(),
    'COMMENT': new Set(),
    'LIKE': new Set(),
    'SAVE': new Set(),
    'NOTIFICATION': new Set(),
    'JOIN_POST': new Set(),
    'LEAVE_POST': new Set()
  };
  
  private connectionStateListeners: Set<(state: ConnectionState) => void> = new Set();
  
  private constructor() {
    this.setupEventListeners();
    this.startConnectionMonitor();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  // private cleanupEventListeners(): void {
  //   window.removeEventListener('online', this.handleOnline);
  //   window.removeEventListener('offline', this.handleOffline);
  //   document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  // }
  private startConnectionMonitor(): void {
    this.stopConnectionMonitor();
    
    this.connectionMonitorTimer = setInterval(() => {
      if (this.isApplicationActive) {
        try {
          if (this.connectionState !== 'CONNECTED' || 
              !this.client || 
              (this.client && this.client.readyState !== WebSocket.OPEN)) {
            this.restoreConnection();
          } else if (this.connectionState === 'CONNECTED' && this.client) {
            this.checkConnection();
          }
        } catch (error) {}
      }
    }, 30000);
  }

  private stopConnectionMonitor(): void {
    if (this.connectionMonitorTimer) {
      clearInterval(this.connectionMonitorTimer);
      this.connectionMonitorTimer = null;
    }
  }

  public registerApplicationActive(): () => void {
    this.isApplicationActive = true;
    
    if (!this.connectionMonitorTimer) {
      this.startConnectionMonitor();
    }
    
    return () => {
      this.isApplicationActive = false;
    };
  }

  private handleOnline = (): void => {
    if (this.connectionState !== 'CONNECTED') {
      this.restoreConnection();
    }
  };

  private handleOffline = (): void => {
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.checkConnection();
    }
  };

  public connect(): void {
    if (this.client) {
      this.disconnect();
    }
    
    this.clearReconnect();
    
    try {
      this.updateConnectionState('CONNECTING');
      
      const socket = new WebSocket(`${WS_URL}`);
      
      socket.onopen = this.handleOpen;
      socket.onclose = this.handleClose;
      socket.onerror = this.handleError;
      socket.onmessage = this.handleMessage;
      
      this.client = socket;
    } catch (error) {
      this.updateConnectionState('DISCONNECTED');
      
      this.reconnect();
    }
  }

  private handleOpen = (): void => {
    this.reconnectAttempts = 0;
    this.updateConnectionState('CONNECTED');
  };
  
  private lastReconnection: { timestamp: number; code: number } | null = null;
  
  private recentMessages: Map<string, number> = new Map();
  
  private handleClose = (event: CloseEvent): void => {
    this.client = null;
    this.updateConnectionState('DISCONNECTED');
    const now = Date.now();
    if (this.lastReconnection && 
        this.lastReconnection.code === event.code && 
        now - this.lastReconnection.timestamp < 1000) {
      return;
    }
    
    this.lastReconnection = { 
      timestamp: now,
      code: event.code
    };
    
    if (event.code === 1000) {
    } else if (event.code === 1008) {      
      import('react-hot-toast').then(toast => {
        toast.default.error("Too many WebSocket requests. Connection will retry automatically.", {
          duration: 5000,
          id: 'websocket-rate-limit-error',
        });
      });
      
      setTimeout(() => this.reconnect(), 10000); // 10 seconds delay
    } else if (event.code === 1006) {
      setTimeout(() => this.reconnect(), 500);
    } else if (event.code === 1011) {
      setTimeout(() => {
        this.connect();
        setTimeout(() => {
          if (this.client && this.client.readyState === WebSocket.OPEN) {
            const event = new CustomEvent('websocket-reconnected', { 
              detail: { client: this.client } 
            });
            window.dispatchEvent(event);
          }
        }, 500);
      }, 500);
    } else {
      this.reconnect();
    }
  };
  
  private handleError = (event: Event): void => {
    const errorMessage = event.toString();
    if (errorMessage.includes('429') || errorMessage.includes('rate') || errorMessage.includes('limit')) {
      import('react-hot-toast').then(toast => {
        toast.default.error("Too many WebSocket requests. Please wait before reconnecting.", {
          duration: 5000,
          id: 'websocket-rate-limit-error',
        });
      });
    }
  };

  private handleMessage = (event: MessageEvent): void => {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      
      if (data.type !== 'PONG' && data.type !== 'PING') {
      }
      import('./WebSocketEventBus').then(({ webSocketEventBus }) => {
        webSocketEventBus.publish(data);
      }).catch(error => {
        console.error(`Failed to parse WebSocket message: ${event.data}`, error);
      });
      
      const handlers = this.messageHandlers[data.type as WebSocketMessageType];
      
      if (handlers && handlers.size > 0) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (handlerError) {
          }
        });
      } else if (data.type !== 'PONG' && data.type !== 'PING') {
      }
    } catch (error) {}
  };
  public disconnect(): void {
    this.clearReconnect();
    this.stopConnectionMonitor();
    
    if (this.client) {
      try {
        this.client.close(1000, "User logged out");
      } catch (error) {
        console.log(error)
      }
    }
    
    this.client = null;
    this.reconnectAttempts = 0;
    this.isApplicationActive = false;
    this.updateConnectionState('DISCONNECTED');
  }
  private reconnect(): void {
    this.clearReconnect();    
    this.updateConnectionState('RECONNECTING');
    
    const baseDelay = 1000;
    const maxDelay = 10000; 
    const maxAttempts = 10; 
    
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(1.5, Math.min(this.reconnectAttempts, 8)),
      maxDelay
    );
    
    const delay = this.reconnectAttempts >= maxAttempts ? maxDelay : exponentialDelay;
    this.reconnectTimer = setTimeout(() => {
      if (this.connectionState !== 'CONNECTED') {
        this.reconnectAttempts++;
        this.connect();
      }
    }, delay);
  }
  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public checkConnection(): void {
    if (
      this.connectionState === 'CONNECTED' && 
      this.client && 
      (this.client.readyState === WebSocket.CLOSED || this.client.readyState === WebSocket.CLOSING)
    ) {
      this.client = null;
      this.updateConnectionState('DISCONNECTED');
      this.reconnect();
    }
  }

  public restoreConnection(): void {
    if (
      (this.connectionState === 'CONNECTED' && 
       this.client && 
       this.client.readyState === WebSocket.OPEN) ||
      this.connectionState === 'CONNECTING'
    ) {
      return;
    }
    
    if (this.client && this.client.readyState !== WebSocket.OPEN) {
      try {
        this.client.close();
      } catch (error) {
      }
      
      this.client = null;
      this.updateConnectionState('DISCONNECTED');
    }
    
    this.connect();
  }

  private generateMessageId(message: WebSocketMessage): string {
    if (message.type === 'LIKE') {
      return `${message.type}-${message.memeId}`;
    }
    if (message.type === 'SAVE') {
      return `${message.type}-${message.memeId}`;
    }
    if (message.type === 'JOIN_POST' || message.type === 'LEAVE_POST') {
      return `${message.type}-${message.postId}`;
    }
    return `${message.type}-${JSON.stringify(message)}`;
  }
  private wasRecentlySent(message: WebSocketMessage): boolean {
    const messageId = this.generateMessageId(message);
    const now = Date.now();
    if (message.type === 'JOIN_POST' || message.type === 'LEAVE_POST') {
      const lastSent = this.recentMessages.get(messageId);
      const deduplicationWindow = message.type === 'JOIN_POST' ? 500 : 2000;
      
      if (lastSent && now - lastSent < deduplicationWindow) {
        return true;
      }
    }
    else if (message.type === 'LIKE' || message.type === 'SAVE') {
      const lastSent = this.recentMessages.get(messageId);
      if (lastSent && now - lastSent < 2000) {
        return true;
      }
      
      if (message.type === 'LIKE' && this.lastLikeOperation && 
          this.lastLikeOperation.memeId === message.memeId && 
          now - this.lastLikeOperation.timestamp < 2000 &&
          this.lastLikeOperation.sent) {
        return true;
      }
      
      if (message.type === 'SAVE' && this.lastSaveOperation && 
          this.lastSaveOperation.memeId === message.memeId && 
          now - this.lastSaveOperation.timestamp < 2000 &&
          this.lastSaveOperation.sent) {
        return true;
      }
    } else {
      const lastSent = this.recentMessages.get(messageId);
      if (lastSent && now - lastSent < 1000) {
        return true;
      }
    }
    
    this.recentMessages.set(messageId, now);
    
    if (message.type === 'LIKE' && this.lastLikeOperation && 
        this.lastLikeOperation.memeId === message.memeId) {
      this.lastLikeOperation.sent = true;
    }
    
    if (message.type === 'SAVE' && this.lastSaveOperation && 
        this.lastSaveOperation.memeId === message.memeId) {
      this.lastSaveOperation.sent = true;
    }
    
    this.recentMessages.forEach((timestamp, id) => {
      if (now - timestamp > 5000) {
        this.recentMessages.delete(id);
      }
    });
    
    return false;
  }
  public sendMessage(message: WebSocketMessage): boolean {
    if (this.wasRecentlySent(message)) {
      return true;
    }
    
    const messageToSend = JSON.stringify(message);
    if ((this.connectionState !== 'CONNECTED' && this.connectionState !== 'CONNECTING') || !this.client) {      
      this.restoreConnection();
      setTimeout(() => {
        if (this.wasRecentlySent(message)) {
          return;
        }
        
        if (this.client && this.client.readyState === WebSocket.OPEN) {
          try {
            this.client.send(messageToSend);
          } catch (error) {
          }
        }
      }, 1000);
      return true;
    }
    
    if (this.client.readyState === WebSocket.OPEN) {
      try {
        this.client.send(messageToSend);
        return true;
      } catch (error) {
        if (this.connectionState !== 'CONNECTING') {
          this.reconnect();
        }
        return false;
      }
    } else if (this.client.readyState === WebSocket.CONNECTING) {
      setTimeout(() => {
        if (this.client && this.client.readyState === WebSocket.OPEN) {
          try {
            this.client.send(messageToSend);
          } catch (error) {
          }
        }
      }, 1000);
      return true;
    }
    
    return false;
  }
  public registerMessageHandler(type: WebSocketMessageType, handler: MessageHandler): () => void {
    this.messageHandlers[type].add(handler);
    return () => {
      this.messageHandlers[type].delete(handler);
    };
  }
  public registerConnectionStateListener(listener: (state: ConnectionState) => void): () => void {
    this.connectionStateListeners.add(listener);
    
    listener(this.connectionState);
    
    return () => {
      this.connectionStateListeners.delete(listener);
    };
  }
  
  private updateConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.connectionStateListeners.forEach(listener => {
        try {
          listener(state);
        } catch (error) {}
      });
    }
  }
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  public isConnected(): boolean {
    return this.connectionState === 'CONNECTED';
  }
  
  public getClient(): WebSocket | null {
    return this.client;
  }

  public sendFollowRequest(targetUserId: string, targetUsername: string, isFollowing: boolean): boolean {
    import('../store/useAuthStore').then(({ useAuthStore }) => {
      const authState = useAuthStore.getState();
      const user = authState.user;
      
      // Check if we have a valid user
      if (!user?.username) {
        return false;
      }
      
      if (this.connectionState !== 'CONNECTED' && this.connectionState !== 'CONNECTING') {
        this.restoreConnection();
      }
      
      const message = {
        type: 'FOLLOW' as WebSocketMessageType,
        followerUsername: user.username,
        followingUserId: targetUserId,
        followingUsername: targetUsername,
        isFollowing: isFollowing,
        profilePictureUrl: user.profilePicture || ''
      };
      
      this.sendMessage(message);
    }).catch(() => {});
    
    return true; // Return true to indicate the request was initiated
  }

  public sendJoinPostRequest(postId: string): boolean {
    if (this.connectionState !== 'CONNECTED' || !this.client || this.client.readyState !== WebSocket.OPEN) {
      this.restoreConnection();
      setTimeout(() => {
        if (this.connectionState === 'CONNECTED' && this.client && this.client.readyState === WebSocket.OPEN) {
          this.sendMessage({
            type: 'JOIN_POST' as WebSocketMessageType,
            postId
          });
        } else {}
      }, 1000);
      return true;
    }
    
    return this.sendMessage({
      type: 'JOIN_POST' as WebSocketMessageType,
      postId
    });
  }

  public sendLeavePostRequest(postId: string): boolean {
    if (this.connectionState === 'CONNECTED' && this.client && this.client.readyState === WebSocket.OPEN) {
      return this.sendMessage({
        type: 'LEAVE_POST' as WebSocketMessageType,
        postId
      });
    }
    return false;
  }

  private lastLikeOperation: { memeId: string; timestamp: number; sent: boolean } | null = null;

  public async sendLikeRequest(memeId: string): Promise<boolean> {
    const { useAuthStore } = await import('../store/useAuthStore');
    const authState = useAuthStore.getState();
    const user = authState.user;
    
    if (!user?.username) {
      return false;
    }
    
    const now = Date.now();
    if (this.lastLikeOperation && 
        this.lastLikeOperation.memeId === memeId && 
        now - this.lastLikeOperation.timestamp < 1000 &&
        this.lastLikeOperation.sent) {
      return true;
    }

    const { useMemeContentStore } = await import("../store/useMemeContentStore");
    const memeContentStore = useMemeContentStore.getState();
    const likedMemes = memeContentStore.likedMemes;
    const isCurrentlyLiked = likedMemes.some(m => m.id === memeId);
    const message = {
      type: 'LIKE' as WebSocketMessageType,
      memeId,
      username: user.username,
      action: isCurrentlyLiked ? 'UNLIKE' : 'LIKE',
    };
    
    this.lastLikeOperation = { 
      memeId, 
      timestamp: now,
      sent: false
    };
    return this.sendMessage(message);
  }

  private lastSaveOperation: { memeId: string; timestamp: number; sent: boolean } | null = null;

  public async sendSaveRequest(memeId: string): Promise<boolean> {
    const { useAuthStore } = await import('../store/useAuthStore');
    const authState = useAuthStore.getState();
    const user = authState.user;
    
    if (!user?.username) {
      return false;
    }
    
    const now = Date.now();
    if (this.lastSaveOperation && 
        this.lastSaveOperation.memeId === memeId && 
        now - this.lastSaveOperation.timestamp < 1000 &&
        this.lastSaveOperation.sent) {
      return true;
    }

    const { useMemeContentStore } = await import("../store/useMemeContentStore");
    const memeContentStore = useMemeContentStore.getState();
    const savedMemes = memeContentStore.savedMemes;
    const isCurrentlySaved = savedMemes.some(m => m.id === memeId);
    const message = {
      type: 'SAVE' as WebSocketMessageType,
      memeId,
      username: user.username,
      action: isCurrentlySaved ? 'UNSAVE' : 'SAVE'
    };
    
    this.lastSaveOperation = { 
      memeId, 
      timestamp: now,
      sent: false
    };
    return this.sendMessage(message);
  }

  private lastCommentOperation: { memeId: string; text: string; timestamp: number; sent: boolean } | null = null;

  public sendCommentRequest(memeId: string, text: string, profilePictureUrl: string): boolean {
    import('../store/useAuthStore').then(({ useAuthStore }) => {
      const authState = useAuthStore.getState();
      const user = authState.user;
      
      if (!user?.username) {
        return false;
      }
      
      const now = Date.now();
      if (this.lastCommentOperation && 
          this.lastCommentOperation.memeId === memeId && 
          this.lastCommentOperation.text === text &&
          now - this.lastCommentOperation.timestamp < 1000 &&
          this.lastCommentOperation.sent) {
        return true;
      }
      
      const message = {
        type: 'COMMENT' as WebSocketMessageType,
        memeId,
        username: user.username,
        text,
        profilePictureUrl,
        createdAt: new Date().toISOString()
      };
      
      this.lastCommentOperation = { 
        memeId,
        text,
        timestamp: now,
        sent: false
      };
      this.sendMessage(message);
    }).catch(() => {});
    
    return true; // Return true to indicate the request was initiated
  }
}

export default WebSocketService.getInstance();