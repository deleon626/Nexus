/**
 * SubmissionSummary Component
 *
 * Pre-submit confirmation modal showing form data summary.
 * Shown before final submission to prevent accidental submissions.
 */

import { X, CheckCircle2, FileText } from 'lucide-react';
import type { FormTemplate, FormField } from '../types';

interface SubmissionSummaryProps {
  /** Form template with field definitions */
  template: FormTemplate;
  /** Form field values keyed by field ID */
  formData: Record<string, unknown>;
  /** Batch number for this submission */
  batchNumber: string;
  /** Callback to confirm and submit */
  onConfirm: () => void;
  /** Callback to go back and edit */
  onEdit: () => void;
}

/**
 * Get display value for a field
 */
function getFieldDisplayValue(field: FormField, value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  switch (field.type) {
    case 'checkbox':
      if (Array.isArray(value) && value.length > 0) {
        return value.join(', ');
      }
      return '—';

    case 'passFail':
      return value === 'pass' ? 'Pass' : value === 'fail' ? 'Fail' : '—';

    case 'photo':
      return typeof value === 'string' ? 'Photo attached' : '—';

    case 'select':
      // Find option label for value
      if ('options' in field && Array.isArray(field.options)) {
        const option = field.options.find((opt) => opt.value === value);
        return option?.label || String(value);
      }
      return String(value);

    case 'date':
    case 'time':
      if (typeof value === 'string') {
        try {
          const date = new Date(value);
          if (field.type === 'date') {
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          } else {
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        } catch {
          return String(value);
        }
      }
      return String(value);

    default:
      return String(value);
  }
}

/**
 * Count filled required fields
 */
function countFilledRequiredFields(
  fields: FormField[],
  formData: Record<string, unknown>
): { filled: number; total: number } {
  const requiredFields = fields.filter((f) => f.required);
  const filled = requiredFields.filter((f) => {
    const value = formData[f.id];
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  });

  return {
    filled: filled.length,
    total: requiredFields.length,
  };
}

export function SubmissionSummary({
  template,
  formData,
  batchNumber,
  onConfirm,
  onEdit,
}: SubmissionSummaryProps) {
  const { filled, total } = countFilledRequiredFields(template.fields, formData);
  const isComplete = filled === total;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onEdit}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Confirm submission
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {template.name}
            </p>
          </div>
          <button
            onClick={onEdit}
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Batch number */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              Batch: {batchNumber}
            </p>
          </div>

          {/* Progress summary */}
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className={`h-5 w-5 ${isComplete ? 'text-green-500' : 'text-amber-500'}`} />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filled} of {total} required fields filled
            </p>
          </div>

          {!isComplete && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Some required fields are empty. Please fill them before submitting.
              </p>
            </div>
          )}

          {/* Field summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Form details
            </h3>

            {template.fields
              .filter((field) => field.required || formData[field.id])
              .map((field) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {field.label}
                      </p>
                      {field.required && (
                        <span className="text-red-500 text-xs">*</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {getFieldDisplayValue(field, formData[field.id])}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onEdit}
            type="button"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onConfirm}
            disabled={!isComplete}
            type="button"
            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
