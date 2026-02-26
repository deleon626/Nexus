/**
 * Cleanup Expired Drafts Utility
 *
 * Removes drafts that have exceeded their 7-day expiration period.
 * Should be called on app initialization to prevent stale drafts accumulation.
 * @see 03-RESEARCH.md "Cleanup Expired Drafts on App Load"
 */

import { db } from '@/db/dexie';
import type { Draft } from '@/db/types';

/**
 * Deletes all drafts that have expired (expiresAt < current time).
 * Uses Dexie's where() clause for efficient querying by expiration timestamp.
 *
 * @returns Promise<number> Number of deleted drafts
 *
 * @example
 * // Call on app initialization
 * const deletedCount = await cleanupExpiredDrafts();
 * if (deletedCount > 0) {
 *   console.log(`Cleaned up ${deletedCount} expired drafts`);
 * }
 */
export async function cleanupExpiredDrafts(): Promise<number> {
  const now = Date.now();

  // Delete all drafts where expiresAt is in the past
  const deletedCount = await db.drafts.where('expiresAt').below(now).delete();

  return deletedCount;
}

/**
 * Checks if a draft is expired based on its expiresAt timestamp.
 * Useful for UI indicators or pre-deletion validation.
 *
 * @param draft - The draft to check
 * @returns true if the draft is expired, false otherwise
 *
 * @example
 * if (isDraftExpired(draft)) {
 *   showDraftExpiredMessage();
 * }
 */
export function isDraftExpired(draft: Draft): boolean {
  return Date.now() > draft.expiresAt;
}

/**
 * Calculates the expiration timestamp for a new draft.
 * Adds DRAFT_EXPIRY_MS to the current time.
 *
 * @returns Expiration timestamp in milliseconds
 *
 * @example
 * const expiresAt = calculateDraftExpiry();
 * await db.drafts.put({ ..., expiresAt });
 */
export function calculateDraftExpiry(): number {
  return Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
}
