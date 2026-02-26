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
