/**
 * WebSocket Debugger Utility
 * Helps monitor and debug real-time messaging flow
 */

export class WebSocketDebugger {
  private static instance: WebSocketDebugger;
  private messageLog: Array<{
    timestamp: Date;
    type: 'SENT' | 'RECEIVED' | 'PROCESSED' | 'ERROR';
    data: any;
    source: string;
  }> = [];

  static getInstance(): WebSocketDebugger {
    if (!WebSocketDebugger.instance) {
      WebSocketDebugger.instance = new WebSocketDebugger();
    }
    return WebSocketDebugger.instance;
  }

  logSentMessage(data: any, source: string = 'unknown') {
    this.messageLog.push({
      timestamp: new Date(),
      type: 'SENT',
      data,
      source
    });
    console.log(`🚀 [WebSocketDebugger] SENT from ${source}:`, data);
    this.cleanupOldLogs();
  }

  logReceivedMessage(data: any, source: string = 'unknown') {
    this.messageLog.push({
      timestamp: new Date(),
      type: 'RECEIVED',
      data,
      source
    });
    console.log(`📨 [WebSocketDebugger] RECEIVED at ${source}:`, data);
    this.cleanupOldLogs();
  }

  logProcessedMessage(data: any, source: string = 'unknown') {
    this.messageLog.push({
      timestamp: new Date(),
      type: 'PROCESSED',
      data,
      source
    });
    console.log(`✅ [WebSocketDebugger] PROCESSED at ${source}:`, data);
    this.cleanupOldLogs();
  }

  logError(error: any, source: string = 'unknown') {
    this.messageLog.push({
      timestamp: new Date(),
      type: 'ERROR',
      data: error,
      source
    });
    console.error(`❌ [WebSocketDebugger] ERROR at ${source}:`, error);
    this.cleanupOldLogs();
  }

  getRecentLogs(count: number = 50) {
    return this.messageLog.slice(-count);
  }

  printSummary() {
    const recent = this.getRecentLogs(20);
    console.group('📊 [WebSocketDebugger] Recent Message Flow Summary');
    recent.forEach(log => {
      const time = log.timestamp.toLocaleTimeString();
      console.log(`${time} [${log.type}] ${log.source}:`, log.data);
    });
    console.groupEnd();
  }

  private cleanupOldLogs() {
    // Keep only last 100 logs to prevent memory issues
    if (this.messageLog.length > 100) {
      this.messageLog = this.messageLog.slice(-100);
    }
  }
}

// Global instance for easy access
export const wsDebugger = WebSocketDebugger.getInstance();

// Add to window for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).wsDebugger = wsDebugger;
}