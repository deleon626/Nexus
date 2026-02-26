/**
 * PassFailField Component
 *
 * Renders two radio buttons for binary pass/fail selection.
 */

import type { PassFailField } from '../../types';

interface PassFailFieldProps {
  field: PassFailField;
  value?: 'pass' | 'fail';
  onChange?: (value: 'pass' | 'fail') => void;
  error?: string;
  disabled?: boolean;
}

export function PassFailFieldComponent({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: PassFailFieldProps) {
  const { id, label, required, helpText, passLabel = 'Pass', failLabel = 'Fail' } = field;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-4" role="group" aria-describedby={helpText ? `${id}-help` : error ? `${id}-error` : undefined}>
        <div className="flex items-center">
          <input
            type="radio"
            id={`${id}-pass`}
            name={id}
            value="pass"
            checked={value === 'pass'}
            onChange={() => onChange?.('pass')}
            disabled={disabled}
            className={cn(
              'h-4 w-4 border-gray-300',
              'text-blue-600 focus:ring-2 focus:ring-blue-500',
              'disabled:cursor-not-allowed disabled:bg-gray-100'
            )}
          />
          <label
            htmlFor={`${id}-pass`}
            className="ml-2 text-sm text-gray-700 cursor-pointer"
          >
            {passLabel}
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="radio"
            id={`${id}-fail`}
            name={id}
            value="fail"
            checked={value === 'fail'}
            onChange={() => onChange?.('fail')}
            disabled={disabled}
            className={cn(
              'h-4 w-4 border-gray-300',
              'text-blue-600 focus:ring-2 focus:ring-blue-500',
              'disabled:cursor-not-allowed disabled:bg-gray-100'
            )}
          />
          <label
            htmlFor={`${id}-fail`}
            className="ml-2 text-sm text-gray-700 cursor-pointer"
          >
            {failLabel}
          </label>
        </div>
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
