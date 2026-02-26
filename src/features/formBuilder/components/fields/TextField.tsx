/**
 * TextField Component
 *
 * Renders a single-line text input field with label, placeholder, and help text.
 */

import type { TextField } from '../../types';

interface TextFieldProps {
  field: TextField;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function TextFieldComponent({
  field,
  value = '',
  onChange,
  error,
  disabled = false,
}: TextFieldProps) {
  const { id, label, required, placeholder, helpText, validation } = field;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        minLength={validation?.minLength}
        maxLength={validation?.maxLength}
        pattern={validation?.pattern}
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

// Import cn from utils - using a local implementation for this component
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
