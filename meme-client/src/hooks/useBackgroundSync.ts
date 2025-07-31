import { useEffect, useState } from 'react';
import { backgroundSyncManager, getSyncStatus } from '../utils/backgroundSync';

/**
 * Hook to manage background sync functionality
 * Automatically initializes background sync and provides status
 */
export const useBackgroundSync = () => {
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());

  useEffect(() => {
    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    ...syncStatus,
    forceSync: async () => {
      try {
        await backgroundSyncManager.forcSync();
        setSyncStatus(getSyncStatus());
      } catch (error) {
        console.error('Force sync failed:', error);
        throw error;
      }
    }
  };
};