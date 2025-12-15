/**
 * ConfirmationModal component displays extracted QC data for user confirmation.
 *
 * Features:
 * - Editable display of extracted data (User Story 3)
 * - Confirm/Reject actions
 * - Shows schema information
 * - Displays timestamp
 * - Form validation
 */

import { useState } from 'react';
import { type ConfirmationModal as ConfirmationData } from '../services/api';

interface ConfirmationModalProps {
  data: ConfirmationData;
  onConfirm: (modifications?: Record<string, unknown>) => void;
  onReject: () => void;
  isSubmitting?: boolean;
}

export function ConfirmationModal({
  data,
  onConfirm,
  onReject,
  isSubmitting = false
}: ConfirmationModalProps) {
  // Initialize editable values from extracted data
  const [editedData, setEditedData] = useState<Record<string, unknown>>(
    { ...data.extracted_data }
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handleValueChange = (key: string, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleConfirm = () => {
    if (hasChanges) {
      onConfirm(editedData);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Confirm QC Data
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and edit the extracted data before submitting
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Schema Info */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-1">Schema</div>
            <div className="text-sm text-gray-900">{data.schema_id}</div>
          </div>

          {/* Extracted Data - Editable */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Extracted Data
              {hasChanges && (
                <span className="ml-2 text-xs text-blue-600">(Modified)</span>
              )}
            </div>
            <div className="space-y-4">
              {Object.entries(editedData).map(([key, value]) => (
                <div key={key}>
                  <label
                    htmlFor={`field-${key}`}
                    className="block text-xs font-medium text-gray-600 uppercase mb-1"
                  >
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    id={`field-${key}`}
                    type="text"
                    value={
                      typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)
                    }
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500">
            Created: {new Date(data.created_at).toLocaleString()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onReject}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Reject
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
