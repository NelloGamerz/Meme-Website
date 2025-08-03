interface SettingsData {
  theme: string;
  lastUpdated: number;
  syncedWithServer: boolean;
}

class IndexedDBCache {
  private dbName = 'MemeAppDB';
  private dbVersion = 1;
  private storeName = 'settings';
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
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
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
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
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
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
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
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
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
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          console.error('Failed to clear all data from IndexedDB:', request.error);
          reject(new Error('Failed to clear all data from IndexedDB'));
        };
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
}

export const indexedDBCache = new IndexedDBCache();

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

export const clearAllIndexedDBData = () => 
  indexedDBCache.clearAllData();

export const deleteIndexedDBDatabase = () => 
  indexedDBCache.deleteDatabase();

export const getIndexedDBStats = () => 
  indexedDBCache.getStats();