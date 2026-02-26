/**
 * BatchNumberPrompt Component
 *
 * Modal for entering batch number before form filling.
 * Batch number is required context for production tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

interface BatchNumberPromptProps {
  /** Name of the form being filled */
  formName: string;
  /** Callback when batch number is submitted */
  onSubmit: (batchNumber: string) => void;
  /** Callback to cancel and return to form list */
  onCancel: () => void;
}

export function BatchNumberPrompt({
  formName,
  onSubmit,
  onCancel,
}: BatchNumberPromptProps) {
  const [batchNumber, setBatchNumber] = useState('');
  const [touched, setTouched] = useState(false);

  const isValid = batchNumber.trim().length > 0;

  // Focus input on mount
  useEffect(() => {
    const input = document.getElementById('batch-number-input');
    input?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    if (isValid) {
      onSubmit(batchNumber.trim());
    }
  }, [batchNumber, isValid, onSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBatchNumber(e.target.value);
    if (touched) {
      setTouched(false);
    }
  }, [touched]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }, [isValid, handleSubmit, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Enter batch number
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              for {formName}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label htmlFor="batch-number-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Batch Number <span className="text-red-500">*</span>
          </label>
          <input
            id="batch-number-input"
            type="text"
            value={batchNumber}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTouched(true)}
            placeholder="Enter batch number (e.g., BATCH-123)"
            className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
              ${touched && !isValid
                ? 'border-red-300 dark:border-red-700 focus:ring-red-500 dark:focus:ring-red-400'
                : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500 dark:focus:ring-blue-400'
              } focus:ring-2 focus:border-transparent outline-none transition-colors`}
          />
          {touched && !isValid && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
              Batch number is required
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            type="button"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            type="button"
            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
