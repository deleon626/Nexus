import { HardDrive, AlertCircle, Check, AlertTriangle } from 'lucide-react';
import { useStorageMonitor, type StorageStatus } from '../hooks/useStorageMonitor';
import { cn } from '@/lib/utils';

/**
 * StorageIndicator Component
 *
 * Visual storage usage indicator with:
 * - Progress bar showing usage percentage
 * - Used/total bytes display (e.g., "125.5 MB / 5 GB")
 * - Color-coded status: green (ok), yellow (warning), red (blocking)
 * - Status badge: OK, Warning, Full
 * - Warning message at blocking state (95%+)
 *
 * Per CONTEXT.md: Storage status visible only on Settings page
 */
export function StorageIndicator() {
  const { usage, status } = useStorageMonitor();

  // Status color mapping
  const getStatusColor = (status: StorageStatus) => {
    switch (status) {
      case 'idle':
        return {
          text: 'text-muted-foreground',
          bg: 'bg-muted',
          fill: 'bg-muted-foreground',
          icon: null
        };
      case 'ok':
        return {
          text: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-950/20',
          fill: 'bg-green-500',
          icon: Check
        };
      case 'warning':
        return {
          text: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-950/20',
          fill: 'bg-yellow-500',
          icon: AlertTriangle
        };
      case 'blocking':
        return {
          text: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950/20',
          fill: 'bg-red-500',
          icon: AlertCircle
        };
      default:
        return {
          text: 'text-muted-foreground',
          bg: 'bg-muted',
          fill: 'bg-muted-foreground',
          icon: null
        };
    }
  };

  const statusColor = getStatusColor(status);
  const StatusIcon = statusColor.icon;

  // Status badge text
  const getStatusBadgeText = (status: StorageStatus): string => {
    switch (status) {
      case 'idle':
        return 'Checking...';
      case 'ok':
        return 'OK';
      case 'warning':
        return 'Warning';
      case 'blocking':
        return 'Full';
      default:
        return 'Unknown';
    }
  };

  // Loading/skeleton state
  if (usage === null) {
    return (
      <div className="border rounded-lg p-4 space-y-4">
        {/* Header with skeleton badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Storage</h3>
          </div>
          <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
        </div>

        {/* Skeleton progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-0 bg-muted-foreground animate-pulse" />
          </div>
          <div className="h-4 bg-muted animate-pulse rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className={cn('w-5 h-5', statusColor.text)} />
          <h3 className="font-semibold">Storage</h3>
        </div>

        {/* Status badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            statusColor.bg,
            statusColor.text
          )}
        >
          {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
          <span>{getStatusBadgeText(status)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              statusColor.fill
            )}
            style={{ width: `${Math.min(usage.percent, 100)}%` }}
          />
        </div>

        {/* Details: used/total and percentage */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {usage.used} / {usage.total}
          </span>
          <span className={cn('font-medium', statusColor.text)}>
            {usage.percent}% used
          </span>
        </div>
      </div>

      {/* Blocking state warning message */}
      {status === 'blocking' && (
        <div className={cn(
          'flex items-start gap-2 p-3 rounded-md',
          statusColor.bg
        )}>
          <AlertCircle className={cn('w-4 h-4 mt-0.5 shrink-0', statusColor.text)} />
          <p className={cn('text-xs', statusColor.text)}>
            Storage nearly full. Some features may be limited.
          </p>
        </div>
      )}

      {/* Additional info for idle/checking state */}
      {status === 'idle' && (
        <p className="text-xs text-muted-foreground">
          Checking storage usage...
        </p>
      )}
    </div>
  );
}
