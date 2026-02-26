/**
 * SelectFieldFill Component
 *
 * Dropdown select field for single selection from options.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Native select for mobile (opens bottom sheet picker on iOS/Android)
 * - Options from field.options array
 * - "Select an option..." placeholder
 * - Required field validation
 */

import { useController, Control } from 'react-hook-form';
import { Select as UISelect } from '@/components/ui/select';
import { FormFieldWrapper } from './FormFieldWrapper';
import type { SelectField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface SelectFieldFillProps {
  /** Field definition from form template */
  field: SelectField;
  /** React Hook Form control instance */
  control: Control;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Dropdown select field with option picker
 *
 * @example
 * ```tsx
 * <SelectFieldFill
 *   field={field}
 *   control={control}
 * />
 * ```
 */
export function SelectFieldFill({ field, control }: SelectFieldFillProps) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({
    name: field.id,
    control,
    rules: {
      required: field.required ? 'This field is required' : false,
    },
  });

  return (
    <FormFieldWrapper
      field={field}
      required={field.required}
      error={error?.message}
    >
      <UISelect
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full"
        disabled={false}
      >
        <option value="" disabled>
          Select an option...
        </option>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </UISelect>
    </FormFieldWrapper>
  );
}
