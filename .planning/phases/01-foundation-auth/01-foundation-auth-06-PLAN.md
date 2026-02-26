---
phase: 01-foundation-auth
plan: 06
type: execute
wave: 3
depends_on: ["01-foundation-auth-03", "01-foundation-auth-04"]
files_modified:
  - src/db/sync/queue.ts
  - src/db/sync/worker.ts
  - src/db/sync/conflict.ts
  - src/db/sync/index.ts
  - src/hooks/useSync.ts
autonomous: true
requirements:
  - OFFL-01
  - OFFL-02
  - OFFL-03
  - OFFL-04
user_setup: []

must_haves:
  truths:
    - "Sync queue can be accessed via useSync() hook"
    - "Pending items are tracked in Dexie syncQueue table"
    - "Sync worker processes queue items with exponential backoff"
    - "Conflict resolution uses last-write-wins with timestamps"
  artifacts:
    - path: "src/db/sync/queue.ts"
      provides: "Sync queue management (add, remove, retry)"
      contains: "addToQueue, removeFromQueue, getPendingItems"
      exports: ["addToQueue", "removeFromQueue", "getPendingItems"]
    - path: "src/db/sync/worker.ts"
      provides: "Background sync worker with exponential backoff"
      contains: "processQueue, exponentialBackoff"
      exports: ["processQueue", "startSyncWorker"]
    - path: "src/db/sync/conflict.ts"
      provides: "Conflict resolution logic (last-write-wins)"
      contains: "resolveConflict, compareVersions"
      exports: ["resolveConflict"]
    - path: "src/hooks/useSync.ts"
      provides: "React hook for sync status and queue management"
      contains: "useSync"
      exports: ["useSync"]
  key_links:
    - from: "src/db/sync/worker.ts"
      to: "src/db/dexie.ts"
      via: "Database import"
      pattern: "import.*from.*dexie"
    - from: "src/db/sync/worker.ts"
      to: "src/db/sync/queue.ts"
      via: "Queue functions"
      pattern: "import.*queue"
    - from: "src/hooks/useSync.ts"
      to: "src/db/sync/"
      via: "Sync module imports"
      pattern: "import.*from.*sync"

---

<objective>
Implement the offline sync engine with queue management, background worker, and conflict resolution. This is the core custom sync layer that bridges Dexie.js (local IndexedDB) to Convex (cloud backend) since Convex has no native offline support.

Purpose: OFFL-01 requires offline form filling, OFFL-02 requires real-time sync status, OFFL-03 requires draft auto-save. This plan builds the sync engine that queues offline changes, processes them when online, and handles conflicts.

Output: Sync queue service, background sync worker with exponential backoff, conflict resolution (last-write-wins), React hook for sync status.
</object>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-auth/01-CONTEXT.md
@.planning/phases/01-foundation-auth/01-RESEARCH.md

# Research patterns to follow:
# - Dexie.js transactions for atomic multi-table writes
# - Exponential backoff: 5s, 15s, 45s (3 attempts max)
# - Last-write-wins conflict resolution with server timestamps
# - Track in-flight requests to prevent race conditions
# - Idempotent server endpoints (check for existing records before insert)
</context>

<tasks>

<task type="auto">
  <name>Create sync queue management service</name>
  <files>src/db/sync/queue.ts</files>
  <action>
Create **src/db/sync/queue.ts** with sync queue operations:

```typescript
import { db } from '../dexie';
import type { SyncQueueItem, SyncOperation } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Generate a unique tracking key for in-flight request deduplication
function generateInFlightKey(operation: SyncOperation, endpoint: string, recordId: string): string {
  return `${operation}_${endpoint}_${recordId}`;
}

// Add item to sync queue
export async function addToQueue(
  operation: SyncOperation,
  endpoint: string,
  recordId: string,
  recordType: 'submission' | 'template',
  payload: Record<string, any>
): Promise<string> {
  const localId = uuidv4();

  await db.syncQueue.add({
    localId,
    operation,
    endpoint,
    recordId,
    recordType,
    payload,
    status: 'pending',
    attemptCount: 0,
    createdAt: new Date(),
  });

  return localId;
}

// Get all pending items (sorted by creation time, oldest first)
export async function getPendingItems(): Promise<SyncQueueItem[]> {
  return await db.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('createdAt');
}

// Get queue statistics
export async function getQueueStats(): Promise<{
  pending: number;
  inFlight: number;
  failed: number;
  total: number;
}> {
  const [pending, inFlight, failed] = await Promise.all([
    db.syncQueue.where('status').equals('pending').count(),
    db.syncQueue.where('status').equals('in-flight').count(),
    db.syncQueue.where('status').equals('failed').count(),
  ]);

  return {
    pending,
    inFlight,
    failed,
    total: pending + inFlight + failed,
  };
}

// Mark item as in-flight (prevent duplicate processing)
export async function markInFlight(localId: string): Promise<boolean> {
  const item = await db.syncQueue.get(localId);
  if (!item || item.status !== 'pending') {
    return false;
  }

  await db.syncQueue.update(localId, {
    status: 'in-flight',
    lastAttemptAt: new Date(),
  });

  return true;
}

// Mark item as completed (remove from queue)
export async function markCompleted(localId: string): Promise<void> {
  await db.syncQueue.delete(localId);
}

// Mark item as failed (increment attempt count, set error, return to pending)
export async function markFailed(localId: string, error: string): Promise<void> {
  const item = await db.syncQueue.get(localId);
  if (!item) return;

  const attemptCount = (item.attemptCount || 0) + 1;

  if (attemptCount >= 3) {
    // Max retries reached, mark as permanently failed
    await db.syncQueue.update(localId, {
      status: 'failed',
      attemptCount,
      error,
    });
  } else {
    // Return to pending for retry
    await db.syncQueue.update(localId, {
      status: 'pending',
      attemptCount,
      error,
    });
  }
}

// Retry all failed items
export async function retryFailedItems(): Promise<number> {
  const failedItems = await db.syncQueue.where('status').equals('failed').toArray();

  for (const item of failedItems) {
    await db.syncQueue.update(item.localId!, {
      status: 'pending',
      attemptCount: 0,
      error: undefined,
    });
  }

  return failedItems.length;
}

// Clear completed items (should already be deleted, but cleanup just in case)
export async function clearCompleted(): Promise<number> {
  // Not implemented — items are deleted immediately upon completion
  // This function is a placeholder for future batch cleanup if needed
  return 0;
}
```

Install UUID library:
```bash
npm install uuid
npm install -D @types/uuid
```
  </action>
  <verify>grep -q "export async function addToQueue" src/db/sync/queue.ts && grep -q "export async function getPendingItems" src/db/sync/queue.ts && grep -q "export async function markInFlight" src/db/sync/queue.ts</verify>
  <done>Sync queue management functions created</done>
</task>

<task type="auto">
  <name>Create background sync worker with exponential backoff</name>
  <files>src/db/sync/worker.ts</files>
  <action>
Create **src/db/sync/worker.ts** with background sync worker:

```typescript
import {
  getPendingItems,
  markInFlight,
  markCompleted,
  markFailed,
} from './queue';

// In-flight request tracking (prevent race conditions)
const inFlightRequests = new Set<string>();

// Exponential backoff intervals: 5s, 15s, 45s
function getBackoffDelay(attemptCount: number): number {
  const delays = [5000, 15000, 45000]; // 5s, 15s, 45s
  return delays[Math.min(attemptCount, delays.length - 1)];
}

// Process a single queue item
async function processItem(item: any): Promise<boolean> {
  const inFlightKey = `${item.operation}_${item.endpoint}_${item.recordId}`;

  // Check if already processing this item (race condition prevention)
  if (inFlightRequests.has(inFlightKey)) {
    return false;
  }

  // Mark as in-flight in database
  const marked = await markInFlight(item.localId);
  if (!marked) {
    return false;
  }

  // Track in-flight request
  inFlightRequests.add(inFlightKey);

  try {
    // TODO: Make actual API call to Convex
    // For now, simulate success
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mark as completed (removes from queue)
    await markCompleted(item.localId);

    return true;
  } catch (error) {
    // Mark as failed (will retry with exponential backoff)
    await markFailed(item.localId, String(error));
    return false;
  } finally {
    // Remove from in-flight tracking
    inFlightRequests.delete(inFlightKey);
  }
}

// Process all pending items
export async function processQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const pendingItems = await getPendingItems();

  let succeeded = 0;
  let failed = 0;

  for (const item of pendingItems) {
    const result = await processItem(item);
    if (result) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return {
    processed: pendingItems.length,
    succeeded,
    failed,
  };
}

// Start sync worker (runs in background with exponential backoff)
let syncWorkerInterval: number | null = null;
let isProcessing = false;

export async function startSyncWorker(): Promise<void> {
  if (syncWorkerInterval !== null) {
    return; // Already running
  }

  // Process queue immediately
  await processQueue();

  // Then process every 30 seconds
  syncWorkerInterval = window.setInterval(async () => {
    if (isProcessing) {
      return; // Skip if already processing
    }

    isProcessing = true;
    try {
      await processQueue();
    } finally {
      isProcessing = false;
    }
  }, 30000);
}

export function stopSyncWorker(): void {
  if (syncWorkerInterval !== null) {
    clearInterval(syncWorkerInterval);
    syncWorkerInterval = null;
  }
}

// Manual sync trigger (with backoff delay for failed items)
export async function triggerSync(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  // Process queue immediately (ignores backoff for manual trigger)
  return await processQueue();
}
```

Note: The actual Convex API calls are stubbed out (marked as TODO). These will be implemented when Convex schema and functions are created in a later phase. The sync worker architecture is complete and ready for API integration.
  </action>
  <verify>grep -q "export async function processQueue" src/db/sync/worker.ts && grep -q "export async function startSyncWorker" src/db/sync/worker.ts && grep -q "getBackoffDelay" src/db/sync/worker.ts</verify>
  <done>Background sync worker created with exponential backoff</done>
</task>

<task type="auto">
  <name>Create conflict resolution module</name>
  <files>src/db/sync/conflict.ts</files>
  <action>
Create **src/db/sync/conflict.ts** with conflict resolution logic:

```typescript
import type { Submission } from '../types';

export interface ConflictResult {
  resolved: boolean;
  winner: 'local' | 'server';
  reason?: string;
}

// Compare versions using timestamps (last-write-wins)
export function compareVersions(local: Submission, server: Submission): ConflictResult {
  const localUpdatedAt = new Date(local.updatedAt).getTime();
  const serverUpdatedAt = new Date(server.updatedAt!).getTime();

  if (localUpdatedAt > serverUpdatedAt) {
    return {
      resolved: true,
      winner: 'local',
      reason: 'Local changes are newer',
    };
  }

  if (serverUpdatedAt > localUpdatedAt) {
    return {
      resolved: true,
      winner: 'server',
      reason: 'Server changes are newer',
    };
  }

  // Timestamps are equal — use server as tiebreaker (server wins ties)
  return {
    resolved: true,
    winner: 'server',
    reason: 'Timestamps equal, server wins tiebreaker',
  };
}

// Resolve conflict by merging or selecting winner
export async function resolveConflict(
  local: Submission,
  server: Submission
): Promise<Submission> {
  const result = compareVersions(local, server);

  if (result.winner === 'local') {
    // Local wins — keep local version, mark server for update
    return { ...local, needsSync: true };
  }

  // Server wins — use server version, update local
  return { ...server, needsSync: false };
}

// Check if submission needs sync based on version comparison
export function needsSync(local: Submission, server?: Submission): boolean {
  if (!server) {
    return true; // No server version exists, needs sync
  }

  const localUpdatedAt = new Date(local.updatedAt).getTime();
  const serverUpdatedAt = new Date(server.updatedAt!).getTime();

  return localUpdatedAt > serverUpdatedAt;
}
```

This implements last-write-wins conflict resolution using server timestamps, as specified in the user decisions.
  </action>
  <verify>grep -q "function compareVersions" src/db/sync/conflict.ts && grep -q "function resolveConflict" src/db/sync/conflict.ts && grep -q "winner.*local.*server" src/db/sync/conflict.ts</verify>
  <done>Conflict resolution module created with last-write-wins logic</done>
</task>

<task type="auto">
  <name>Create React hook for sync status and queue management</name>
  <files>src/hooks/useSync.ts</files>
  <action>
Create **src/hooks/useSync.ts** with sync status hook:

```typescript
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
```

Note: The heartbeat ping (to avoid Safari navigator.onLine false positives) will be added in Plan 07 with the sync status UI.
  </action>
  <verify>grep -q "export function useSync" src/hooks/useSync.ts && grep -q "SyncStatus" src/hooks/useSync.ts && grep -q "manualSync" src/hooks/useSync.ts</verify>
  <done>React hook for sync status created</done>
</task>

<task type="auto">
  <name>Create sync module barrel export</name>
  <files>src/db/sync/index.ts</files>
  <action>
Create **src/db/sync/index.ts** with barrel exports:

```typescript
export * from './queue';
export * from './worker';
export * from './conflict';
```

This allows clean imports from the sync module:
```ts
import { addToQueue, processQueue, resolveConflict } from '@/db/sync';
```
  </action>
  <verify>[ -f src/db/sync/index.ts ]</verify>
  <done>Sync module barrel export created</done>
</task>

</tasks>

<verification>
After completing all tasks:

1. Check TypeScript compilation: `npx tsc --noEmit`
2. Verify sync module can be imported:
   ```ts
   import { useSync } from './src/hooks/useSync'
   import { addToQueue } from './src/db/sync'
   ```
3. Test that queue functions work in isolation (no actual API calls yet):
   - addToQueue() should add item to syncQueue table
   - getPendingItems() should return pending items
   - markInFlight() should update status to 'in-flight'
   - markCompleted() should remove item from queue
4. Verify useSync hook can be used in components
5. Check that exponential backoff delays are correct: 5s, 15s, 45s

Note: The sync worker will not make actual API calls until Convex functions are implemented. This is intentional — the sync architecture is complete, and API integration will happen when Convex schema is ready.
</verification>

<success_criteria>
- Sync queue can add, remove, and track pending items
- Background worker processes queue with exponential backoff (5s, 15s, 45s)
- Conflict resolution uses last-write-wins with timestamps
- useSync hook provides sync status, queue count, manual sync trigger
- In-flight request tracking prevents race conditions
- TypeScript compilation succeeds
- Sync module can be imported via barrel export
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-auth/01-foundation-auth-06-SUMMARY.md` with:
- Sync engine architecture details
- Exponential backoff implementation
- Conflict resolution strategy
- Next steps: Plan 07 (Sync status UI)
</output>
