/**
 * Background sync utility for syncing pending changes when connection is restored
 */

import { useSettingsStore } from '../store/useSettingsStore';
import { needsThemeSync } from './indexedDBCache';

class BackgroundSyncManager {
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  private setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for focus events (when user returns to window)
    window.addEventListener('focus', this.handleFocus.bind(this));
  }

  private handleOnline() {
    this.isOnline = true;
    this.syncPendingChanges();
  }

  private handleOffline() {
    this.isOnline = false;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  private handleVisibilityChange() {
    if (!document.hidden && this.isOnline) {
      this.syncPendingChanges();
    }
  }

  private handleFocus() {
    if (this.isOnline) {
      this.syncPendingChanges();
    }
  }

  private startPeriodicSync() {
    // Sync every 30 seconds if online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingChanges();
      }
    }, 30000);
  }

  private async syncPendingChanges(retryCount = 0) {
    if (this.syncInProgress || !this.isOnline) return;

    try {
      // Check if there are pending changes
      const needsSync = await needsThemeSync();
      if (!needsSync) return;

      this.syncInProgress = true;
      
      const syncPendingChanges = useSettingsStore.getState().syncPendingChanges;
      await syncPendingChanges();
            
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }

    } catch (error) {
      console.error('Background sync failed:', error);
      
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount);        
        this.retryTimeout = setTimeout(() => {
          this.syncPendingChanges(retryCount + 1);
        }, delay);
      } else {
        console.error('Max retry attempts reached for background sync');
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Manually trigger sync (useful for testing or immediate sync needs)
   */
  public async forcSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.syncPendingChanges();
  }

  /**
   * Get sync status
   */
  public getStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      hasRetryScheduled: !!this.retryTimeout
    };
  }

  /**
   * Cleanup resources
   */
  public destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('focus', this.handleFocus.bind(this));
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }
}

// Create singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();

// Export utility functions
export const forceSync = () => backgroundSyncManager.forcSync();
export const getSyncStatus = () => backgroundSyncManager.getStatus();
export const destroyBackgroundSync = () => backgroundSyncManager.destroy();