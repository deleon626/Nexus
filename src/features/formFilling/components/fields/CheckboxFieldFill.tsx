/**
 * CheckboxFieldFill Component
 *
 * Checkbox group field for multiple selections from options.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Multiple checkboxes from field.options array
 * - Returns array of selected values
 * - Vertical stack layout
 * - Required field validation (min selections)
 */

import { useController, Control } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { FormFieldWrapper } from './FormFieldWrapper';
import type { CheckboxField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface CheckboxFieldFillProps {
  /** Field definition from form template */
  field: CheckboxField;
  /** React Hook Form control instance */
  control: Control;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Checkbox group field for multiple selections
 *
 * @example
 * ```tsx
 * <CheckboxFieldFill
 *   field={field}
 *   control={control}
 * />
 * ```
 */
export function CheckboxFieldFill({ field, control }: CheckboxFieldFillProps) {
  const {
    field: { value = [], onChange },
    fieldState: { error },
  } = useController({
    name: field.id,
    control,
    rules: {
      required: field.required ? 'At least one option must be selected' : false,
      validate: (value) => {
        if (!Array.isArray(value)) {
          return 'Invalid value type';
        }
        return true;
      },
    },
  });

  const selectedValues = Array.isArray(value) ? value : [];

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const isChecked = (optionValue: string) => selectedValues.includes(optionValue);

  return (
    <FormFieldWrapper
      field={field}
      required={field.required}
      error={error?.message}
    >
      <div className="space-y-2">
        {field.options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 cursor-pointer py-1"
          >
            <Checkbox
              checked={isChecked(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
              disabled={false}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </FormFieldWrapper>
  );
}
