/**
 * DraftPickerModal Component
 *
 * Modal for choosing to resume an existing draft or start a new form.
 * Shown when tapping a form that has in-progress drafts.
 */

import { X, Clock, FileText } from 'lucide-react';
import type { Draft } from '@/db/types';

interface DraftPickerModalProps {
  /** Name of the form being filled */
  formName: string;
  /** Existing drafts for this form */
  drafts: Draft[];
  /** Callback when user selects a draft to resume */
  onResumeDraft: (draft: Draft) => void;
  /** Callback when user chooses to start a new form */
  onStartNew: () => void;
  /** Callback to cancel and return to form list */
  onCancel: () => void;
}

/**
 * Format relative time (e.g., "5 minutes ago", "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    // For older drafts, show the date
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Generate draft display name
 */
function getDraftDisplayName(draft: Draft): string {
  const date = new Date(draft.createdAt);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${draft.formName} - Batch ${draft.batchNumber} - ${dateStr}`;
}

export function DraftPickerModal({
  formName,
  drafts,
  onResumeDraft,
  onStartNew,
  onCancel,
}: DraftPickerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Resume draft or start new?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formName}
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

        {/* Draft list */}
        <div className="flex-1 overflow-y-auto p-4">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No drafts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map((draft) => (
                <button
                  key={draft.localId}
                  onClick={() => onResumeDraft(draft)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Clock className="h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {getDraftDisplayName(draft)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatRelativeTime(draft.updatedAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onStartNew}
            type="button"
            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Start new form
          </button>
          <button
            onClick={onCancel}
            type="button"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
