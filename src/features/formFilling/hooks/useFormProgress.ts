/**
 * useFormProgress Hook
 *
 * Form completion progress calculation based on required fields.
 * Returns percentage of required fields that have been filled.
 *
 * Key features:
 * - Only counts required fields (optional fields don't affect progress)
 * - Handles all field types: text, number, decimal, date, time, select, checkbox, passFail, textarea, photo
 * - Returns: completed count, total count, percentage (0-100)
 * - Reacts to form value changes
 *
 * @see 03-RESEARCH.md "Progress Calculation for Form Completion"
 * @see 03-CONTEXT.md "Progress Bar" section
 */

import { useMemo } from 'react';
import type { FormTemplate, FormField } from '@/features/formBuilder/types';
import type { FormDataRecord } from '../types';
import { isFieldValueFilled } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Form completion progress metrics
 */
export interface FormProgress {
  /** Number of required fields filled with valid values */
  completed: number;
  /** Total number of required fields in the form */
  total: number;
  /** Completion percentage (0-100) */
  percentage: number;
}

/**
 * Return value for useFormProgress hook
 */
export interface UseFormProgressReturn extends FormProgress {
  /** Whether all required fields are filled (100% complete) */
  isComplete: boolean;
  /** Display string: "X/Y fields filled" */
  displayText: string;
}

// ============================================================================
// Progress Calculation
// ============================================================================

/**
 * Check if a field value is considered "filled" based on field type
 */
function isFieldFilled(field: FormField, value: unknown): boolean {
  // Empty/undefined values are not filled
  if (value === undefined || value === null) {
    return false;
  }

  // Handle different field types
  switch (field.type) {
    case 'text':
    case 'number':
    case 'decimal':
    case 'date':
    case 'time':
    case 'select':
    case 'textarea':
    case 'photo':
      // String values: check non-empty
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      // Number values: check not NaN
      if (typeof value === 'number') {
        return !isNaN(value);
      }
      return false;

    case 'checkbox':
      // Checkbox: check non-empty array
      return Array.isArray(value) && value.length > 0;

    case 'passFail':
      // Pass/fail: must be exactly 'pass' or 'fail'
      return value === 'pass' || value === 'fail';

    default:
      return false;
  }
}

/**
 * Calculate form progress based on required fields only
 */
export function calculateProgress(
  template: FormTemplate,
  values: FormDataRecord
): FormProgress {
  // Filter for required fields only
  const requiredFields = template.fields.filter((field) => field.required);

  // Count how many required fields are filled
  const filledCount = requiredFields.filter((field) => {
    const value = values[field.id];
    return isFieldFilled(field, value);
  }).length;

  const totalCount = requiredFields.length;
  const percentage = totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100);

  return {
    completed: filledCount,
    total: totalCount,
    percentage,
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Form progress calculation hook
 *
 * Calculates completion percentage based on required fields only.
 * Optional fields do not affect progress.
 *
 * @param template - Form template with field definitions
 * @param values - Current form field values
 * @returns Progress metrics and display helpers
 *
 * @example
 * ```tsx
 * const { completed, total, percentage, isComplete, displayText } = useFormProgress(
 *   formTemplate,
 *   formData
 * );
 *
 * return (
 *   <div>
 *     <ProgressBar value={percentage} />
 *     <span>{displayText}</span>
 *   </div>
 * );
 * ```
 */
export function useFormProgress(
  template: FormTemplate | undefined,
  values: FormDataRecord
): UseFormProgressReturn {
  // Calculate progress whenever template or values change
  const progress = useMemo(() => {
    if (!template) {
      return {
        completed: 0,
        total: 0,
        percentage: 0,
      };
    }

    return calculateProgress(template, values);
  }, [template, values]);

  // Derived values
  const isComplete = progress.total > 0 && progress.completed === progress.total;
  const displayText = `${progress.completed}/${progress.total} fields filled`;

  return {
    ...progress,
    isComplete,
    displayText,
  };
}
