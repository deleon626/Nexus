/**
 * PhotoField Component
 *
 * Renders a photo upload field. In Phase 2, this shows a placeholder
 * indicating photo capture will be available in Phase 3.
 */

import type { PhotoField } from '../../types';

interface PhotoFieldProps {
  field: PhotoField;
  value?: string[];
  onChange?: (value: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export function PhotoFieldComponent({
  field,
  error,
  disabled = false,
}: PhotoFieldProps) {
  const { id, label, required, helpText } = field;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div
        className={cn(
          'w-full px-3 py-2 border rounded-md bg-gray-50',
          'flex items-center justify-center',
          error ? 'border-red-500' : 'border-gray-300'
        )}
      >
        <p className="text-sm text-gray-500 italic">
          Photo capture in Phase 3
        </p>
      </div>
      <input
        type="file"
        id={id}
        name={id}
        accept="image/*"
        disabled
        className="hidden"
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
