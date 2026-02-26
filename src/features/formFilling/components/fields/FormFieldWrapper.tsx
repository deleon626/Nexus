/**
 * FormFieldWrapper Component
 *
 * Wrapper component for form fields with label, asterisk, help text, and error display.
 * Ensures consistent styling and behavior across all field types.
 *
 * Features:
 * - Required field indicator (asterisk in red)
 * - Help text display below label
 * - Validation error display in red
 * - Consistent spacing and typography
 */

import { ReactNode } from 'react';
import type { FormField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface FormFieldWrapperProps {
  /** Field definition from form template */
  field: FormField;
  /** Whether the field is required (shows asterisk) */
  required: boolean;
  /** Validation error message to display */
  error?: string;
  /** Field input component to wrap */
  children: ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Wrapper for form fields with label, required marker, help text, and errors
 *
 * @example
 * ```tsx
 * <FormFieldWrapper field={field} required={field.required} error={errorMessage}>
 *   <input {...props} />
 * </FormFieldWrapper>
 * ```
 */
export function FormFieldWrapper({
  field,
  required,
  error,
  children,
}: FormFieldWrapperProps) {
  return (
    <div className="space-y-1">
      {/* Label with required asterisk */}
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}
        {required && (
          <span className="text-red-500 ml-0.5" aria-label="required">
            *
          </span>
        )}
      </label>

      {/* Help text if provided */}
      {field.helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {field.helpText}
        </p>
      )}

      {/* Field input */}
      {children}

      {/* Validation error */}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
