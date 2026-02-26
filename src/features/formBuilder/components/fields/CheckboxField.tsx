/**
 * CheckboxField Component
 *
 * Renders a group of checkboxes for multiple selections.
 */

import type { CheckboxField } from '../../types';

interface CheckboxFieldProps {
  field: CheckboxField;
  value?: string[];
  onChange?: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export function CheckboxFieldComponent({
  field,
  value = [],
  onChange,
  error,
  disabled = false,
}: CheckboxFieldProps) {
  const { id, label, required, helpText, options } = field;

  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange?.([...value, optionValue]);
    } else {
      onChange?.(value.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2" role="group" aria-describedby={helpText ? `${id}-help` : error ? `${id}-error` : undefined}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="checkbox"
              id={`${id}-${option.value}`}
              name={id}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              disabled={disabled}
              className={cn(
                'h-4 w-4 rounded border-gray-300',
                'text-blue-600 focus:ring-2 focus:ring-blue-500',
                'disabled:cursor-not-allowed disabled:bg-gray-100'
              )}
            />
            <label
              htmlFor={`${id}-${option.value}`}
              className="ml-2 text-sm text-gray-700 cursor-pointer"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {helpText && !error && (
        <p id={`${id}-help`} className="text-xs text-gray-500">
          {helpText}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
