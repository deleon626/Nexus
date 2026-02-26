/**
 * PassFailFieldFill Component
 *
 * Pass/Fail binary choice field with large side-by-side buttons.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Two large side-by-side buttons (PASS green / FAIL red)
 * - Custom labels from field.passLabel and field.failLabel
 * - Selected state with darker shade
 * - Large touch targets (min 48px)
 */

import { useController, Control } from 'react-hook-form';
import { Check, X } from 'lucide-react';
import { FormFieldWrapper } from './FormFieldWrapper';
import type { PassFailField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface PassFailFieldFillProps {
  /** Field definition from form template */
  field: PassFailField;
  /** React Hook Form control instance */
  control: Control;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Pass/Fail field with side-by-side colored buttons
 *
 * @example
 * ```tsx
 * <PassFailFieldFill
 *   field={field}
 *   control={control}
 * />
 * ```
 */
export function PassFailFieldFill({ field, control }: PassFailFieldFillProps) {
  const passLabel = field.passLabel || 'Pass';
  const failLabel = field.failLabel || 'Fail';

  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    name: field.id,
    control,
    rules: {
      required: field.required ? 'This field is required' : false,
    },
  });

  const isSelected = (selection: 'pass' | 'fail') => value === selection;

  const handleSelect = (selection: 'pass' | 'fail') => {
    onChange(selection);
  };

  return (
    <FormFieldWrapper
      field={field}
      required={field.required}
      error={error?.message}
    >
      <div className="flex gap-3">
        {/* PASS button - green */}
        <button
          type="button"
          onClick={() => handleSelect('pass')}
          className={`
            flex-1 flex items-center justify-center gap-2
            min-h-[48px] px-4 py-3 rounded-lg font-medium
            transition-all duration-200 focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring
            ${
              isSelected('pass')
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
            }
          `}
          aria-pressed={isSelected('pass')}
        >
          <Check className="h-5 w-5" />
          <span>{passLabel}</span>
        </button>

        {/* FAIL button - red */}
        <button
          type="button"
          onClick={() => handleSelect('fail')}
          className={`
            flex-1 flex items-center justify-center gap-2
            min-h-[48px] px-4 py-3 rounded-lg font-medium
            transition-all duration-200 focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring
            ${
              isSelected('fail')
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
            }
          `}
          aria-pressed={isSelected('fail')}
        >
          <X className="h-5 w-5" />
          <span>{failLabel}</span>
        </button>
      </div>
    </FormFieldWrapper>
  );
}
