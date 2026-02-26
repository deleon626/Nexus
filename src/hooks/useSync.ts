import { useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import {
  getQueueStats,
  retryFailedItems,
  triggerSync,
  startSyncWorker,
  stopSyncWorker,
} from '../db/sync';

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'failed';

export interface SyncState {
  status: SyncStatus;
  queueCount: number;
  lastSyncTime: Date | null;
  isOnline: boolean;
}

export function useSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Live query for pending items count
  const pendingItems = useLiveQuery(
    () => db.syncQueue.where('status').equals('pending').count(),
    []
  );
  const queueCount = pendingItems?.data || 0;

  // Update sync status based on queue count
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus('offline');
    } else if (queueCount > 0) {
      setSyncStatus('syncing');
    } else {
      setSyncStatus('synced');
    }
  }, [isOnline, queueCount]);

  // Online/offline detection with heartbeat
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Start sync worker when online, stop when offline
  useEffect(() => {
    if (isOnline) {
      startSyncWorker();
    } else {
      stopSyncWorker();
    }

    return () => {
      stopSyncWorker();
    };
  }, [isOnline]);

  // Manual sync trigger
  const manualSync = useCallback(async () => {
    if (!isOnline) {
      return; // Can't sync when offline
    }

    setSyncStatus('syncing');
    try {
      const result = await triggerSync();
      setLastSyncTime(new Date());

      if (result.failed > 0) {
        setSyncStatus('failed');
      } else if (result.succeeded > 0) {
        // Brief success flash, then back to synced
        setSyncStatus('synced');
      }
    } catch (error) {
      setSyncStatus('failed');
      console.error('Sync failed:', error);
    }
  }, [isOnline]);

  // Retry failed items
  const retryFailed = useCallback(async () => {
    const count = await retryFailedItems();
    await manualSync();
    return count;
  }, [manualSync]);

  return {
    status: syncStatus,
    queueCount,
    lastSyncTime,
    isOnline,
    manualSync,
    retryFailed,
  };
}
