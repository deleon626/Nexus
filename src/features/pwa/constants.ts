/**
 * PWA Storage Constants
 *
 * Defines storage thresholds, retention periods, and monitoring intervals
 * for PWA storage management and automatic cleanup.
 *
 * Per CONTEXT.md:
 * - Warn at 80% quota usage
 * - Block operations at 95% quota usage
 * - Auto-cleanup: synced submissions after 7 days, drafts after 14 days
 * - Cleanup runs automatically at retention thresholds
 */

/**
 * Storage threshold percentages
 * Warning state triggers at 80% usage (non-blocking)
 * Blocking state triggers at 95% usage (prevents new operations)
 */
export const STORAGE_WARNING_PERCENT = 80;
export const STORAGE_BLOCKING_PERCENT = 95;

/**
 * Data retention periods (in days)
 * Synced submissions are deleted after 7 days
 * Drafts are deleted after 14 days (via expiresAt field)
 */
export const SYNCED_SUBMISSION_RETENTION_DAYS = 7;
export const DRAFT_RETENTION_DAYS = 14;

/**
 * Storage monitoring interval
 * Check storage usage every 60 seconds per RESEARCH.md
 */
export const STORAGE_CHECK_INTERVAL_MS = 60000;

/**
 * Milliseconds per day for retention calculations
 */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
