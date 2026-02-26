/**
 * Form Filling Types
 *
 * Type definitions for form filling sessions, drafts, and progress tracking.
 * These types support the worker form filling workflow with auto-save and resume capabilities.
 */

// Re-export FormField types from formBuilder
export type {
  FormField,
  FieldType,
  BaseField,
  TextField,
  NumberField,
  DecimalField,
  DateField,
  TimeField,
  SelectField,
  CheckboxField,
  PassFailField,
  TextareaField,
  PhotoField,
  FieldOption,
  FormTemplate,
} from '../formBuilder/types';

// Re-export PhotoCapture types from usePhotoCapture
export type {
  PhotoCaptureState,
  CapturePhotoOptions,
  CapturePhotoResult,
} from './hooks/usePhotoCapture';

// ============================================================================
// Form Field Value Types
// ============================================================================

/**
 * Union type of all possible form field values.
 * Supports all field types defined in FormBuilder.
 */
export type FormFieldValue =
  | string        // text, number, decimal, date, time, select, textarea, photo (base64)
  | number        // number, decimal
  | string[]      // checkbox (multiple selections)
  | 'pass'        // passFail field
  | 'fail'        // passFail field
  | null          // empty/unfilled field
  | undefined;    // empty/unfilled field

/**
 * Record mapping field IDs to their values.
 * Used for form data storage and draft persistence.
 */
export type FormDataRecord = Record<string, FormFieldValue>;

// ============================================================================
// Form Session Types
// ============================================================================

/**
 * Active form filling session state.
 * Tracks the current form being filled and its draft status.
 */
export interface FormSession {
  /** Form template ID being filled */
  formId: string;
  /** Production batch number for this submission */
  batchNumber: string;
  /** Local draft ID (if resuming or after first auto-save) */
  draftId?: string;
  /** Whether this session was resumed from an existing draft */
  isResumed: boolean;
}

// ============================================================================
// Form Progress Types
// ============================================================================

/**
 * Form completion progress metrics.
 * Based on required fields only (optional fields don't affect progress).
 */
export interface FormProgress {
  /** Number of required fields filled with valid values */
  completed: number;
  /** Total number of required fields in the form */
  total: number;
  /** Percentage of completion (0-100) */
  percentage: number;
}

// ============================================================================
// Draft Types
// ============================================================================

/**
 * Draft metadata for display in draft picker.
 * Re-exports Draft from db/types.ts for convenience.
 */
export type DraftMetadata = {
  localId: string;
  formName: string;
  batchNumber: string;
  createdAt: Date;
  expiresAt: number;
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a form field value is considered "filled" (not empty).
 * Used for progress calculation.
 */
export function isFieldValueFilled(value: FormFieldValue): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.length > 0;
  }

  if (typeof value === 'number') {
    return !isNaN(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return false;
}

/**
 * Check if a pass/fail value is valid.
 */
export function isPassFailValue(value: FormFieldValue): value is 'pass' | 'fail' {
  return value === 'pass' || value === 'fail';
}
