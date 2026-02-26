/**
 * NumberField Component
 *
 * Renders a number input field for whole numbers with min/max validation.
 */

import type { NumberField } from '../../types';

interface NumberFieldProps {
  field: NumberField;
  value?: number | string;
  onChange?: (value: number) => void;
  error?: string;
  disabled?: boolean;
}

export function NumberFieldComponent({
  field,
  value = '',
  onChange,
  error,
  disabled = false,
}: NumberFieldProps) {
  const { id, label, required, placeholder, helpText, validation } = field;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="number"
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value ? Number(e.target.value) : NaN)}
        placeholder={placeholder}
        disabled={disabled}
        min={validation?.min}
        max={validation?.max}
        step="1"
        className={cn(
          'w-full px-3 py-2 border rounded-md shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error ? 'border-red-500' : 'border-gray-300'
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={helpText ? `${id}-help` : error ? `${id}-error` : undefined}
      />
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
