/**
 * TimeFieldFill Component
 *
 * Time input field with native time picker.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Native time input (opens time picker on mobile)
 * - Min/max validation from field.validation
 * - Required field validation
 * - HH:mm format storage
 */

import { useController, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from './FormFieldWrapper';
import type { TimeField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface TimeFieldFillProps {
  /** Field definition from form template */
  field: TimeField;
  /** React Hook Form control instance */
  control: Control;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Time input field with time picker
 *
 * @example
 * ```tsx
 * <TimeFieldFill
 *   field={field}
 *   control={control}
 * />
 * ```
 */
export function TimeFieldFill({ field, control }: TimeFieldFillProps) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({
    name: field.id,
    control,
    rules: {
      required: field.required ? 'This field is required' : false,
      pattern: {
        value: /^([01]\d|2[0-3]):([0-5]\d)$/,
        message: 'Invalid time format (use HH:mm)',
      },
      validate: (value) => {
        if (!value) return true;

        // Check format
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
          return 'Invalid time format (use HH:mm)';
        }

        // Min validation
        if (field.validation?.min && value < field.validation.min) {
          return `Time must be after ${field.validation.min}`;
        }

        // Max validation
        if (field.validation?.max && value > field.validation.max) {
          return `Time must be before ${field.validation.max}`;
        }

        return true;
      },
    },
  });

  return (
    <FormFieldWrapper
      field={field}
      required={field.required}
      error={error?.message}
    >
      <Input
        type="time"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        min={field.validation?.min}
        max={field.validation?.max}
      />
    </FormFieldWrapper>
  );
}
