import {
  getPendingItems,
  markInFlight,
  markCompleted,
  markFailed,
} from './queue';
import { convexHttpClient } from '@/lib/convexHttpClient';
import { api } from '@convex/_generated/api';

// In-flight request tracking (prevent race conditions)
const inFlightRequests = new Set<string>();

/**
 * Get Clerk auth token for Convex.
 * Uses Clerk's global session (available after sign-in via ClerkProvider).
 */
async function getAuthToken(): Promise<string> {
  // Access Clerk's global instance (set by ClerkProvider)
  const clerk = (window as any).Clerk;
  if (!clerk?.session) {
    throw new Error('No Clerk session — user not authenticated');
  }

  const token = await clerk.session.getToken({ template: 'convex' });
  if (!token) {
    throw new Error('Failed to get Convex token from Clerk');
  }

  return token;
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
    // Get auth token and set on HTTP client
    const token = await getAuthToken();
    convexHttpClient.setAuth(token);

    // Call Convex createSubmission mutation
    const payload = item.payload;
    await convexHttpClient.mutation(api.submissions.createSubmission, {
      localId: payload.localId,
      batchNumber: payload.batchNumber,
      templateId: payload.templateId,
      templateName: payload.templateName || 'Unknown Form',
      orgId: payload.orgId,
      userId: payload.userId,
      workerName: payload.workerName || 'Unknown Worker',
      data: payload.data,
      photos: payload.photos || [],
    });

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
