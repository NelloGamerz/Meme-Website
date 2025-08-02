/**
 * Storage cleanup utility for handling logout data clearing
 */

import { clearAllIndexedDBData, deleteIndexedDBDatabase } from './indexedDBCache';
import { clearAllStorageData, clearUserDataFromLocalStorage } from './localStorageCache';

/**
 * Clear all user data from both IndexedDB and localStorage
 * This is the main function to call during logout
 */
export async function clearAllUserData(): Promise<void> {
  console.log('Starting user data cleanup...');
  
  const cleanupPromises: Promise<void>[] = [];
  
  // Clear IndexedDB data
  cleanupPromises.push(
    clearAllIndexedDBData().catch(error => {
      console.error('Failed to clear IndexedDB data:', error);
    })
  );
  
  // Clear localStorage data
  cleanupPromises.push(
    Promise.resolve().then(() => {
      clearAllStorageData();
    }).catch(error => {
      console.error('Failed to clear localStorage data:', error);
    })
  );
  
  // Wait for all cleanup operations to complete
  await Promise.allSettled(cleanupPromises);
  
  console.log('User data cleanup completed');
}

/**
 * Clear only user-specific data (preserving app-level settings if needed)
 */
export async function clearUserSpecificData(): Promise<void> {
  console.log('Starting user-specific data cleanup...');
  
  const cleanupPromises: Promise<void>[] = [];
  
  // Clear IndexedDB data
  cleanupPromises.push(
    clearAllIndexedDBData().catch(error => {
      console.error('Failed to clear IndexedDB data:', error);
    })
  );
  
  // Clear only user-related localStorage data
  cleanupPromises.push(
    Promise.resolve().then(() => {
      clearUserDataFromLocalStorage();
    }).catch(error => {
      console.error('Failed to clear user data from localStorage:', error);
    })
  );
  
  // Wait for all cleanup operations to complete
  await Promise.allSettled(cleanupPromises);
  
  console.log('User-specific data cleanup completed');
}

/**
 * Nuclear option: Delete the entire IndexedDB database and clear all localStorage
 * Use this if you want to completely reset the application state
 */
export async function performCompleteStorageReset(): Promise<void> {
  console.log('Starting complete storage reset...');
  
  const cleanupPromises: Promise<void>[] = [];
  
  // Delete entire IndexedDB database
  cleanupPromises.push(
    deleteIndexedDBDatabase().catch(error => {
      console.error('Failed to delete IndexedDB database:', error);
    })
  );
  
  // Clear all localStorage
  cleanupPromises.push(
    Promise.resolve().then(() => {
      clearAllStorageData();
    }).catch(error => {
      console.error('Failed to clear localStorage:', error);
    })
  );
  
  // Wait for all cleanup operations to complete
  await Promise.allSettled(cleanupPromises);
  
  console.log('Complete storage reset completed');
}

/**
 * Clear session storage as well (if used)
 */
export function clearSessionStorage(): void {
  try {
    sessionStorage.clear();
    console.log('Session storage cleared successfully');
  } catch (error) {
    console.error('Failed to clear session storage:', error);
  }
}

/**
 * Clear all browser storage (localStorage, sessionStorage, IndexedDB)
 */
export async function clearAllBrowserStorage(): Promise<void> {
  console.log('Starting complete browser storage cleanup...');
  
  // Clear session storage
  clearSessionStorage();
  
  // Clear all other storage
  await performCompleteStorageReset();
  
  console.log('Complete browser storage cleanup completed');
}