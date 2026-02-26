import { useState } from 'react';
import { useSync, SyncStatus } from '../../hooks/useSync';
import { cn } from '../../lib/utils';

interface SyncIndicatorProps {
  className?: string;
}

// Icons for each state (simple SVG icons)
const OfflineIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
  </svg>
);

const SyncingIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SyncedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const FailedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function SyncIndicator({ className }: SyncIndicatorProps) {
  const { status, queueCount, lastSyncTime, isOnline, manualSync, retryFailed } = useSync();
  const [isExpanded, setIsExpanded] = useState(false);

  // State configuration
  const stateConfig: Record<SyncStatus, { icon: React.ReactNode; label: string; color: string }> = {
    offline: { icon: <OfflineIcon />, label: 'Offline', color: 'text-gray-500' },
    syncing: { icon: <SyncingIcon />, label: 'Syncing', color: 'text-blue-500' },
    synced: { icon: <SyncedIcon />, label: 'Synced', color: 'text-green-500' },
    failed: { icon: <FailedIcon />, label: 'Failed', color: 'text-red-500' },
  };

  const config = stateConfig[status];

  // Format last sync time
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Handle retry click
  const handleRetry = async () => {
    if (status === 'failed') {
      await retryFailed();
    } else {
      await manualSync();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main indicator (always visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors",
          config.color
        )}
        aria-label={`Sync status: ${config.label}`}
      >
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
        <ChevronDownIcon isOpen={isExpanded} />

        {/* Queue count badge (only show if > 0) */}
        {queueCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
            {queueCount}
          </span>
        )}
      </button>

      {/* Expanded view (tap to expand) */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-background border rounded-md shadow-lg p-4 z-50">
          <div className="space-y-3">
            {/* Status details */}
            <div>
              <p className="text-sm font-medium">Sync Status</p>
              <p className="text-xs text-muted-foreground capitalize">{status}</p>
            </div>

            {/* Queue count */}
            <div>
              <p className="text-sm font-medium">Pending Items</p>
              <p className="text-xs text-muted-foreground">{queueCount} item(s)</p>
            </div>

            {/* Last sync time */}
            <div>
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-xs text-muted-foreground">{formatLastSync(lastSyncTime)}</p>
            </div>

            {/* Connection status */}
            <div>
              <p className="text-sm font-medium">Connection</p>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>

            {/* Retry button (show if failed or manual sync available) */}
            {(status === 'failed' || queueCount > 0) && (
              <button
                onClick={handleRetry}
                className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                {status === 'failed' ? 'Retry Failed' : 'Sync Now'}
              </button>
            )}

            {/* Error message (only for failed state) */}
            {status === 'failed' && (
              <div className="p-2 bg-destructive/10 text-destructive text-xs rounded">
                Sync failed. Tap retry to try again.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
