/**
 * Form Filling Constants
 *
 * Configuration values for draft behavior, auto-save intervals,
 * and expiration policies per CONTEXT.md specifications.
 */

/**
 * Draft expiration time in milliseconds (7 days).
 * Drafts older than this are automatically deleted on app load.
 * @see 03-CONTEXT.md "Draft Auto-save"
 */
export const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Auto-save interval in milliseconds (30 seconds).
 * Form data is automatically saved to IndexedDB at this interval.
 * @see 03-CONTEXT.md "Draft Auto-save"
 */
export const AUTOSAVE_INTERVAL_MS = 30000;

/**
 * Draft name format template.
 * Used to generate auto-generated draft names like "Form Name - Batch 123 - Feb 27".
 * Uses date-fns format() function with MMM dd pattern.
 */
export const DRAFT_NAME_FORMAT = '{formName} - Batch {batchNumber} - {date}';

/**
 * Date format for draft names (e.g., "Feb 27").
 * Uses date-fns format pattern.
 */
export const DRAFT_DATE_FORMAT = 'MMM dd';
