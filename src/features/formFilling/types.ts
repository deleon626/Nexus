/**
 * Form Filling Types
 *
 * Type definitions for the form filling feature including session state,
 * field values, and progress tracking.
 */

/**
 * FormFieldValue represents all possible values for form fields.
 * This union type accommodates all field types in the system.
 */
export type FormFieldValue =
  | string // text, date, time
  | number // number, decimal
  | string[] // checkbox, select (multi)
  | 'pass' | 'fail' // passFail field
  | undefined; // empty/unfilled fields

/**
 * FormSession tracks the active form filling session.
 * Used by the useFormDraft hook for auto-save persistence.
 */
export interface FormSession {
  /** Template ID being filled */
  formId: string;
  /** User-entered batch number */
  batchNumber: string;
  /** Local draft ID (if resuming existing draft) */
  draftId?: string;
  /** Whether this session was resumed from an existing draft */
  isResumed: boolean;
}

/**
 * FormProgress represents completion status for the progress bar.
 * Used by the useFormProgress hook to calculate completion percentage.
 */
export interface FormProgress {
  /** Number of required fields that have been filled */
  completed: number;
  /** Total number of required fields in the form */
  total: number;
  /** Completion percentage (0-100) */
  percentage: number;
}

/**
 * FormDraftData represents the stored draft data structure.
 * Maps field IDs to their current values for persistence.
 */
export type FormDraftData = Record<string, FormFieldValue>;
