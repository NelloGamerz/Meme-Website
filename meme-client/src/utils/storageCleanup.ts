import { clearAllIndexedDBData, deleteIndexedDBDatabase } from './indexedDBCache';
import { clearAllStorageData, clearUserDataFromLocalStorage } from './localStorageCache';

export async function clearAllUserData(): Promise<void> {
  
  const cleanupPromises: Promise<void>[] = [];
  
  cleanupPromises.push(
    clearAllIndexedDBData().catch(error => {
      console.error('Failed to clear IndexedDB data:', error);
    })
  );
  
  cleanupPromises.push(
    Promise.resolve().then(() => {
      clearAllStorageData();
    }).catch(error => {
      console.error('Failed to clear localStorage data:', error);
    })
  );
  
  await Promise.allSettled(cleanupPromises);
  
}

export async function clearUserSpecificData(): Promise<void> {
  
  const cleanupPromises: Promise<void>[] = [];
  
  cleanupPromises.push(
    clearAllIndexedDBData().catch(error => {
      console.error('Failed to clear IndexedDB data:', error);
    })
  );
  
  cleanupPromises.push(
    Promise.resolve().then(() => {
      clearUserDataFromLocalStorage();
    }).catch(error => {
      console.error('Failed to clear user data from localStorage:', error);
    })
  );
  
  await Promise.allSettled(cleanupPromises);
  
}

export async function performCompleteStorageReset(): Promise<void> {
  
  const cleanupPromises: Promise<void>[] = [];
  
  cleanupPromises.push(
    deleteIndexedDBDatabase().catch(error => {
      console.error('Failed to delete IndexedDB database:', error);
    })
  );
  
  cleanupPromises.push(
    Promise.resolve().then(() => {
      clearAllStorageData();
    }).catch(error => {
      console.error('Failed to clear localStorage:', error);
    })
  );
  
  await Promise.allSettled(cleanupPromises);
  
}

export function clearSessionStorage(): void {
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear session storage:', error);
  }
}

export async function clearAllBrowserStorage(): Promise<void> {  
  clearSessionStorage();
  await performCompleteStorageReset();
}