/**
 * useStorageMonitor Hook
 *
 * Monitors IndexedDB quota usage via navigator.storage.estimate() API.
 * Polls every 60 seconds and provides storage status for UI decisions.
 *
 * Per RESEARCH.md Pattern 3:
 * - Uses navigator.storage.estimate() for quota information
 * - Calculates usage percentage
 * - Returns status: 'ok' (<80%), 'warning' (80-95%), 'blocking' (>=95%)
 *
 * Status meanings:
 * - 'ok': Usage below 80%, no action needed
 * - 'warning': Usage at 80%+, triggers auto-cleanup
 * - 'blocking': Usage at 95%+, prevent new operations
 */

import { useState, useEffect, useRef } from 'react';
import { STORAGE_WARNING_PERCENT, STORAGE_BLOCKING_PERCENT, STORAGE_CHECK_INTERVAL_MS } from '../../constants';
import { runAutoCleanup } from '../../utils/storageCleanup';

export type StorageStatus = 'idle' | 'ok' | 'warning' | 'blocking';

export interface StorageUsage {
  percent: number;
  used: string;
  total: string;
  available: string;
}

interface UseStorageMonitorReturn {
  usage: StorageUsage | null;
  status: StorageStatus;
  lastChecked: number | null;
}

/**
 * Format bytes to human-readable string (e.g., "125.5 MB")
 * Uses 1024 as base (not 1000) per RESEARCH.md
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * React hook for monitoring storage quota usage
 *
 * @returns { usage, status, lastChecked } - Current storage state
 */
export function useStorageMonitor(): UseStorageMonitorReturn {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [status, setStatus] = useState<StorageStatus>('idle');
  const [lastChecked, setLastChecked] = useState<number | null>(null);

  // Track if cleanup already ran for current warning state to avoid redundant cleanup
  const cleanupRanRef = useRef<boolean>(false);

  const checkStorageRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Check storage usage via navigator.storage.estimate()
   * Calculates percentage and determines status
   *
   * Triggers auto-cleanup when status changes to 'warning' (80% threshold)
   * Only runs cleanup once per warning state (uses ref to track)
   * After cleanup, re-checks storage to see if usage dropped
   */
  const checkStorage = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();

        const usageBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || 0;

        const usagePercent = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0;

        const newUsage: StorageUsage = {
          percent: Math.round(usagePercent * 10) / 10, // Round to 1 decimal
          used: formatBytes(usageBytes),
          total: formatBytes(quotaBytes),
          available: formatBytes(quotaBytes - usageBytes),
        };

        // Determine status based on thresholds
        let newStatus: StorageStatus = 'ok';
        if (usagePercent >= STORAGE_BLOCKING_PERCENT) {
          newStatus = 'blocking';
        } else if (usagePercent >= STORAGE_WARNING_PERCENT) {
          newStatus = 'warning';
        }

        setUsage(newUsage);
        setStatus(newStatus);
        setLastChecked(Date.now());

        console.log(`[Storage Monitor] Usage: ${newUsage.percent}%, Status: ${newStatus}`);

        // Trigger auto-cleanup when status changes to 'warning'
        // Only run once per warning state to avoid redundant cleanup
        if (newStatus === 'warning' && !cleanupRanRef.current) {
          console.log('[Storage Monitor] Warning threshold reached, triggering auto-cleanup...');
          cleanupRanRef.current = true;

          // Run cleanup and re-check storage after 1 second
          const cleanedCount = await runAutoCleanup();
          if (cleanedCount > 0) {
            console.log(`[Storage Monitor] Cleanup complete (${cleanedCount} records), re-checking storage...`);
            setTimeout(() => checkStorage(), 1000);
          }
        }

        // Reset cleanup flag when status returns to 'ok'
        if (newStatus === 'ok' && cleanupRanRef.current) {
          cleanupRanRef.current = false;
        }
      } else {
        console.warn('[Storage Monitor] navigator.storage.estimate() not supported');
      }
    } catch (error) {
      console.error('[Storage Monitor] Failed to check storage:', error);
    }
  };

  checkStorageRef.current = checkStorage;

  useEffect(() => {
    // Check immediately on mount
    checkStorage();

    // Set up polling interval
    const intervalId = setInterval(() => {
      checkStorage();
    }, STORAGE_CHECK_INTERVAL_MS);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return { usage, status, lastChecked };
}
