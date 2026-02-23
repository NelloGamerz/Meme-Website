import type { Message } from "../types/mems";

interface SettingsData {
  theme: string;
  lastUpdated: number;
  syncedWithServer: boolean;
}

interface ChatMessagesRow {
  key: string;
  chatRoomId: string;
  page: number;
  size: number;
  messages: Message[];
  lastUpdated: number;
}

class IndexedDBCache {
  private dbName = 'MemeAppDB';
  private dbVersion = 2; // upgraded to add 'chatMessages' store
  private settingsStore = 'settings';
  private chatStore = 'chatMessages';
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('IndexedDB not supported');
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // settings store
        if (!db.objectStoreNames.contains(this.settingsStore)) {
          const store = db.createObjectStore(this.settingsStore, { keyPath: 'key' });
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
        // chatMessages store
        if (!db.objectStoreNames.contains(this.chatStore)) {
          const store = db.createObjectStore(this.chatStore, { keyPath: 'key' });
          store.createIndex('chatRoomId', 'chatRoomId', { unique: false });
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
          store.createIndex('page', 'page', { unique: false });
        }
      };
    });
  }

  async saveThemeSettings(theme: string, syncedWithServer: boolean = false): Promise<void> {
    await this.init();

    const settingsData: SettingsData & { key: string } = {
      key: 'theme',
      theme,
      lastUpdated: Date.now(),
      syncedWithServer
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.settingsStore], 'readwrite');
        const store = transaction.objectStore(this.settingsStore);
        const request = store.put(settingsData);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to save to IndexedDB:', request.error);
          reject(new Error('Failed to save theme settings to IndexedDB'));
        };
      });
    } else {
      throw new Error('IndexedDB not available');
    }
  }

  async getThemeSettings(): Promise<SettingsData | null> {
    await this.init();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.settingsStore], 'readonly');
        const store = transaction.objectStore(this.settingsStore);
        const request = store.get('theme');

        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve({
              theme: result.theme,
              lastUpdated: result.lastUpdated,
              syncedWithServer: result.syncedWithServer
            });
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('Failed to read from IndexedDB:', request.error);
          reject(new Error('Failed to read theme settings from IndexedDB'));
        };
      });
    } else {
      throw new Error('IndexedDB not available');
    }
  }

  async markThemeAsSynced(): Promise<void> {
    const currentSettings = await this.getThemeSettings();
    if (currentSettings) {
      await this.saveThemeSettings(currentSettings.theme, true);
    }
  }

  async needsServerSync(): Promise<boolean> {
    const settings = await this.getThemeSettings();
    return settings ? !settings.syncedWithServer : false;
  }

  async clearThemeSettings(): Promise<void> {
    await this.init();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.settingsStore], 'readwrite');
        const store = transaction.objectStore(this.settingsStore);
        const request = store.delete('theme');

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to delete from IndexedDB:', request.error);
          reject(new Error('Failed to clear theme settings from IndexedDB'));
        };
      });
    } else {
      throw new Error('IndexedDB not available');
    }
  }

  async clearAllData(): Promise<void> {
    await this.init();

    if (this.db) {
      return new Promise((resolve, reject) => {
        try {
          const tx1 = this.db!.transaction([this.settingsStore], 'readwrite');
          tx1.objectStore(this.settingsStore).clear();
        } catch {}
        try {
          const tx2 = this.db!.transaction([this.chatStore], 'readwrite');
          tx2.objectStore(this.chatStore).clear();
        } catch {}
        resolve();
      });
    } else {
      throw new Error('IndexedDB not available');
    }
  }

  async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('IndexedDB not supported');
        reject(new Error('IndexedDB not supported'));
        return;
      }

      if (this.db) {
        this.db.close();
        this.db = null;
        this.isInitialized = false;
      }

      const deleteRequest = indexedDB.deleteDatabase(this.dbName);

      deleteRequest.onsuccess = () => {
        ('IndexedDB database deleted successfully');
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error('Failed to delete IndexedDB database:', deleteRequest.error);
        reject(new Error('Failed to delete IndexedDB database'));
      };

      deleteRequest.onblocked = () => {
        console.warn('IndexedDB database deletion blocked. Close all tabs and try again.');
        resolve();
      };
    });
  }

  async getStats(): Promise<{ hasIndexedDB: boolean; dbInitialized: boolean; storageUsed: number }> {
    await this.init();
    
    let storageUsed = 0;
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        storageUsed = estimate.usage || 0;
      }
    } catch (error) {
      console.warn('Could not get storage estimate:', error);
    }

    return {
      hasIndexedDB: !!window.indexedDB,
      dbInitialized: this.isInitialized && !!this.db,
      storageUsed
    };
  }

  // ----- Chat Messages Cache (merged) -----
  private buildChatKey(chatRoomId: string, page: number, size: number) {
    return `chat:${chatRoomId}:page:${page}:size:${size}`;
  }

  async getChatMessages(chatRoomId: string, page: number, size: number): Promise<Message[] | null> {
    await this.init().catch(() => {});
    if (!this.db) return null;
    return new Promise<Message[] | null>((resolve) => {
      try {
        const tx = this.db!.transaction([this.chatStore], 'readonly');
        const store = tx.objectStore(this.chatStore);
        const req = store.get(this.buildChatKey(chatRoomId, page, size));
        req.onsuccess = () => resolve(req.result?.messages ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async saveChatMessages(chatRoomId: string, page: number, size: number, messages: Message[]): Promise<void> {
    await this.init().catch(() => {});
    if (!this.db) return;
    const row: ChatMessagesRow = {
      key: this.buildChatKey(chatRoomId, page, size),
      chatRoomId, page, size, messages,
      lastUpdated: Date.now(),
    };
    await new Promise<void>((resolve) => {
      try {
        const tx = this.db!.transaction([this.chatStore], 'readwrite');
        const store = tx.objectStore(this.chatStore);
        const req = store.put(row);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async clearChatMessagesForRoom(chatRoomId: string): Promise<void> {
    await this.init().catch(() => {});
    if (!this.db) return;
    await new Promise<void>((resolve) => {
      try {
        const tx = this.db!.transaction([this.chatStore], 'readwrite');
        const store = tx.objectStore(this.chatStore);
        const index = store.index('chatRoomId');
        const cursorReq = index.openCursor(IDBKeyRange.only(chatRoomId));
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result as IDBCursorWithValue | null;
          if (cursor) { cursor.delete(); cursor.continue(); } else { resolve(); }
        };
        cursorReq.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export const indexedDBCache = new IndexedDBCache();

// Theme helpers
export const saveThemeToIndexedDB = (theme: string, synced: boolean = false) => 
  indexedDBCache.saveThemeSettings(theme, synced);
export const getThemeFromIndexedDB = () => 
  indexedDBCache.getThemeSettings();
export const markThemeAsSynced = () => 
  indexedDBCache.markThemeAsSynced();
export const needsThemeSync = () => 
  indexedDBCache.needsServerSync();
export const clearThemeFromIndexedDB = () => 
  indexedDBCache.clearThemeSettings();

// Chat messages helpers (merged)
export const getChatMessagesFromCache = (chatRoomId: string, page: number, size: number) =>
  indexedDBCache.getChatMessages(chatRoomId, page, size);
export const saveChatMessagesToCache = (chatRoomId: string, page: number, size: number, messages: Message[]) =>
  indexedDBCache.saveChatMessages(chatRoomId, page, size, messages);
export const clearChatMessagesCacheForRoom = (chatRoomId: string) =>
  indexedDBCache.clearChatMessagesForRoom(chatRoomId);

export const clearAllIndexedDBData = () => 
  indexedDBCache.clearAllData();
export const deleteIndexedDBDatabase = () => 
  indexedDBCache.deleteDatabase();
export const getIndexedDBStats = () => 
  indexedDBCache.getStats();