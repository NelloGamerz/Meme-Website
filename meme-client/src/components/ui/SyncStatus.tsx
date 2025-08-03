import React from 'react';
import { useBackgroundSync } from '../../hooks/useBackgroundSync';

interface SyncStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ 
  showDetails = false, 
  className = "" 
}) => {
  const { isOnline, syncInProgress, hasRetryScheduled, forceSync } = useBackgroundSync();

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div 
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
        {syncInProgress && (
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Syncing..." />
        )}
      </div>
    );
  }

  return (
    <div className={`p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm ${className}`}>
      <div className="font-semibold mb-2">Sync Status</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Connection:</span>
          <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Sync in progress:</span>
          <span className={syncInProgress ? 'text-yellow-600' : 'text-gray-600'}>
            {syncInProgress ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Retry scheduled:</span>
          <span className={hasRetryScheduled ? 'text-orange-600' : 'text-gray-600'}>
            {hasRetryScheduled ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
      <button
        onClick={() => forceSync().catch(console.error)}
        disabled={!isOnline || syncInProgress}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
      >
        Force Sync
      </button>
    </div>
  );
};