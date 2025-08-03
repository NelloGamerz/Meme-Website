import { useEffect, useState } from 'react';
import { backgroundSyncManager, getSyncStatus } from '../utils/backgroundSync';

export const useBackgroundSync = () => {
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());

  useEffect(() => {
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