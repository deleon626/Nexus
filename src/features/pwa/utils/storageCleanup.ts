/**
 * Storage Cleanup Utilities
 *
 * Automatic data cleanup at retention thresholds per CONTEXT.md:
 * - Synced submissions deleted after 7 days
 * - Drafts deleted after 14 days (via existing cleanupExpiredDrafts)
 *
 * Auto-cleanup runs automatically (not manually triggered) when storage
 * reaches warning threshold (80%).
 *
 * Per CONTEXT.md: "cleanup runs automatically at retention thresholds"
 * Per CONTEXT.md: "hands-off automatic cleanup"
 */

import { db } from '@/db/dexie';
import {
  SYNCED_SUBMISSION_RETENTION_DAYS,
  MS_PER_DAY,
} from '../constants';

// Re-export existing draft cleanup utility for DRY principle
export { cleanupExpiredDrafts } from '@/features/formFilling/utils/cleanupExpiredDrafts';

/**
 * Delete synced submissions older than retention period
 *
 * Calculates cutoff timestamp and deletes submissions where:
 * - status === 'synced' (successfully synced to server)
 * - syncedAt < cutoff (older than 7 days)
 *
 * Uses Dexie's compound indexes for efficient querying:
 * - 'status, syncedAt' index for filtering by status and date
 *
 * @returns Promise<number> Number of submissions deleted
 */
export async function cleanupSyncedSubmissions(): Promise<number> {
  try {
    const cutoffTimestamp = Date.now() - (SYNCED_SUBMISSION_RETENTION_DAYS * MS_PER_DAY);
    const cutoffDate = new Date(cutoffTimestamp);

    // Delete synced submissions older than retention period
    // Using compound index: status + syncedAt for efficient query
    const deletedCount = await db.submissions
      .where('status')
      .equals('synced')
      .and(submission => submission.syncedAt !== undefined && submission.syncedAt < cutoffDate)
      .delete();

    if (deletedCount > 0) {
      console.log(
        `[Storage Cleanup] Removed ${deletedCount} synced submission(s) older than ` +
        `${SYNCED_SUBMISSION_RETENTION_DAYS} days`
      );
    }

    return deletedCount;
  } catch (error) {
    console.error('[Storage Cleanup] Failed to cleanup synced submissions:', error);
    return 0;
  }
}

/**
 * Run automatic cleanup for all retention-based data
 *
 * Orchestrates cleanup of:
 * - Synced submissions older than 7 days
 * - Expired drafts (via existing utility)
 *
 * Called automatically when storage reaches warning threshold (80%).
 * Hands-off per CONTEXT.md - no user intervention required.
 *
 * @returns Promise<number> Total count of cleaned records
 */
export async function runAutoCleanup(): Promise<number> {
  try {
    console.log('[Storage Cleanup] Starting automatic cleanup...');

    // Run cleanup for synced submissions
    const submissionsCleaned = await cleanupSyncedSubmissions();

    // Run cleanup for expired drafts (re-exported from formFilling)
    const draftsCleaned = await cleanupExpiredDrafts();

    const totalCleaned = submissionsCleaned + draftsCleaned;

    if (totalCleaned > 0) {
      console.log(
        `[Storage Cleanup] Cleanup complete: ${submissionsCleaned} submissions, ` +
        `${draftsCleaned} drafts (${totalCleaned} total)`
      );
    } else {
      console.log('[Storage Cleanup] No records to clean');
    }

    return totalCleaned;
  } catch (error) {
    console.error('[Storage Cleanup] Auto-cleanup failed:', error);
    return 0;
  }
}
