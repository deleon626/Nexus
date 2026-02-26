/**
 * DateFieldFill Component
 *
 * Date input field with native date picker.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Native date input (opens calendar picker on mobile)
 * - Min/max validation from field.validation
 * - Required field validation
 * - ISO 8601 date format storage
 */

import { useController, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from './FormFieldWrapper';
import type { DateField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface DateFieldFillProps {
  /** Field definition from form template */
  field: DateField;
  /** React Hook Form control instance */
  control: Control;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Date input field with calendar picker
 *
 * @example
 * ```tsx
 * <DateFieldFill
 *   field={field}
 *   control={control}
 * />
 * ```
 */
export function DateFieldFill({ field, control }: DateFieldFillProps) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({
    name: field.id,
    control,
    rules: {
      required: field.required ? 'This field is required' : false,
      validate: (value) => {
        if (!value) return true;

        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return 'Invalid date format';
        }

        // Min validation
        if (field.validation?.min) {
          const minDate = new Date(field.validation.min);
          if (date < minDate) {
            return `Date must be after ${formatDisplayDate(field.validation.min)}`;
          }
        }

        // Max validation
        if (field.validation?.max) {
          const maxDate = new Date(field.validation.max);
          if (date > maxDate) {
            return `Date must be before ${formatDisplayDate(field.validation.max)}`;
          }
        }

        return true;
      },
    },
  });

  // Convert ISO datetime to date input format (YYYY-MM-DD)
  const toInputValue = (val: unknown): string => {
    if (!val) return '';
    if (typeof val === 'string') {
      // Extract date part from ISO datetime or use as-is
      return val.startsWith('T') ? val.split('T')[0] : val.split(' ')[0];
    }
    return String(val);
  };

  return (
    <FormFieldWrapper
      field={field}
      required={field.required}
      error={error?.message}
    >
      <Input
        type="date"
        value={toInputValue(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        min={field.validation?.min ? toInputValue(field.validation.min) : undefined}
        max={field.validation?.max ? toInputValue(field.validation.max) : undefined}
      />
    </FormFieldWrapper>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format ISO datetime to display-friendly date
 */
function formatDisplayDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
