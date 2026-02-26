/**
 * SuccessScreen Component
 *
 * Post-submit success screen with checkmark and Done button.
 * Shown after form submission is complete.
 */

import { CheckCircle } from 'lucide-react';

interface SuccessScreenProps {
  /** Callback when user clicks Done to return to form list */
  onDone: () => void;
}

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-white dark:bg-gray-900">
      {/* Checkmark icon */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          <CheckCircle className="relative h-24 w-24 text-green-500 dark:text-green-400" strokeWidth={1.5} />
        </div>
      </div>

      {/* Success message */}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
        Form submitted successfully
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">
        Your form has been saved and will be synced when online.
      </p>

      {/* Done button */}
      <button
        onClick={onDone}
        type="button"
        className="px-8 py-3 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
      >
        Done
      </button>
    </div>
  );
}
