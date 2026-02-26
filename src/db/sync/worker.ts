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
