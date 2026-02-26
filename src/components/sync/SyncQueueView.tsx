import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';
import { cn } from '../../lib/utils';

export default function SyncQueueView({ className }: { className?: string }) {
  // Live query for all pending and in-flight items
  const queueItems = useLiveQuery(
    () => db.syncQueue
      .where('status')
      .anyOf(['pending', 'in-flight', 'failed'])
      .reverse()
      .limit(50)
      .toArray(),
    []
  );

  if (!queueItems) {
    return <div className={cn("text-sm text-muted-foreground", className)}>Loading queue...</div>;
  }

  if (queueItems.length === 0) {
    return <div className={cn("text-sm text-muted-foreground", className)}>No pending items</div>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {queueItems.map((item) => (
        <div
          key={item.localId}
          className="flex items-center justify-between p-3 bg-muted rounded-md"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {item.operation} {item.recordType}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {item.endpoint}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span
              className={cn(
                "text-xs px-2 py-1 rounded",
                item.status === 'pending' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
                item.status === 'in-flight' && "bg-blue-500/20 text-blue-700 dark:text-blue-300",
                item.status === 'failed' && "bg-red-500/20 text-red-700 dark:text-red-300"
              )}
            >
              {item.status}
            </span>

            {/* Attempt count */}
            {item.attemptCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {item.attemptCount}/3
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Warning if queue exceeds 50 items */}
      {queueItems.length >= 50 && (
        <div className="p-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 rounded-md text-sm">
          Warning: {queueItems.length} pending items. Consider connecting to stable internet.
        </div>
      )}
    </div>
  );
}
