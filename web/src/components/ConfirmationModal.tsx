/**
 * ConfirmationModal component displays extracted QC data for user confirmation.
 *
 * Features:
 * - Editable display of extracted data (User Story 3)
 * - Confirm/Reject actions
 * - Shows schema information
 * - Displays timestamp
 * - Form validation based on schema rules
 * - Schema-aware field rendering with DynamicField
 */

import { useState, useEffect, useCallback } from 'react';
import { type ConfirmationModal as ConfirmationData } from '../services/api';
import type { SchemaListItem, SchemaResponse, SchemaField } from '../types/schema';
import { getSchema } from '../services/schemaService';
import { DynamicField } from './DynamicField';

interface ConfirmationModalProps {
  data: ConfirmationData;
  schema?: SchemaListItem | null;
  onConfirm: (modifications?: Record<string, unknown>) => void;
  onReject: () => void;
  onClose?: () => void;
  isSubmitting?: boolean;
}

/**
 * Validate a single field value against its schema definition
 */
function validateField(field: SchemaField, value: unknown): string | null {
  // Required check
  if (field.required) {
    if (value === null || value === undefined || value === '') {
      return `${field.label} is required`;
    }
  }

  // Skip further validation if empty and not required
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const rules = field.validation_rules || {};

  // Number validation
  if (field.field_type === 'number') {
    const numValue = typeof value === 'number' ? value : Number(value);
    
    if (isNaN(numValue)) {
      return `${field.label} must be a valid number`;
    }

    if (rules.min !== undefined && numValue < (rules.min as number)) {
      return `${field.label} must be at least ${rules.min}`;
    }

    if (rules.max !== undefined && numValue > (rules.max as number)) {
      return `${field.label} must be at most ${rules.max}`;
    }
  }

  // Text validation
  if (field.field_type === 'text') {
    const strValue = String(value);

    if (rules.minLength !== undefined && strValue.length < (rules.minLength as number)) {
      return `${field.label} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength !== undefined && strValue.length > (rules.maxLength as number)) {
      return `${field.label} must be at most ${rules.maxLength} characters`;
    }

    if (rules.pattern) {
      const regex = new RegExp(rules.pattern as string);
      if (!regex.test(strValue)) {
        return `${field.label} format is invalid`;
      }
    }
  }

  // Choice validation
  if (field.field_type === 'choice' || field.field_type === 'graded_choice') {
    if (field.options && field.options.length > 0) {
      const validValues = field.options.map(o => String(o.value));
      if (!validValues.includes(String(value))) {
        return `${field.label} must be one of the available options`;
      }
    }
  }

  return null;
}

export function ConfirmationModal({
  data,
  schema,
  onConfirm,
  onReject,
  onClose,
  isSubmitting = false
}: ConfirmationModalProps) {
  // Initialize editable values from extracted data
  const [editedData, setEditedData] = useState<Record<string, unknown>>(
    { ...data.extracted_data }
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [fullSchema, setFullSchema] = useState<SchemaResponse | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fetch full schema with schema_definition if schema is provided
  useEffect(() => {
    if (schema && schema.id !== 'default-schema') {
      setIsLoadingSchema(true);
      getSchema(schema.id)
        .then(setFullSchema)
        .catch(err => {
          console.error('Failed to fetch schema:', err);
        })
        .finally(() => setIsLoadingSchema(false));
    }
  }, [schema]);

  // Validate all fields
  const validateAll = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!fullSchema?.schema_definition.per_sample_fields) {
      return newErrors;
    }

    for (const field of fullSchema.schema_definition.per_sample_fields) {
      const value = editedData[field.id];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.id] = error;
      }
    }

    return newErrors;
  }, [fullSchema, editedData]);

  // Re-validate when data or schema changes
  useEffect(() => {
    if (fullSchema) {
      const newErrors = validateAll();
      setErrors(newErrors);
    }
  }, [fullSchema, validateAll]);

  const handleValueChange = (key: string, value: unknown) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setTouched(prev => ({ ...prev, [key]: true }));

    // Validate single field
    const fieldDef = fullSchema?.schema_definition.per_sample_fields.find(
      f => f.id === key
    );
    if (fieldDef) {
      const error = validateField(fieldDef, value);
      setErrors(prev => {
        if (error) {
          return { ...prev, [key]: error };
        } else {
          const { [key]: _, ...rest } = prev;
          return rest;
        }
      });
    }
  };

  const handleConfirm = () => {
    // Mark all fields as touched to show all errors
    const allTouched: Record<string, boolean> = {};
    Object.keys(editedData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate all fields
    const validationErrors = validateAll();
    setErrors(validationErrors);

    // Don't submit if there are errors
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (hasChanges) {
      onConfirm(editedData);
    } else {
      onConfirm();
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm QC Data
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review and edit the extracted data before submitting
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 -mt-1"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
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

            {isLoadingSchema && (
              <div className="text-sm text-gray-500 text-center py-4">
                Loading schema definition...
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(editedData).map(([key, value]) => {
                // Try to find field definition in schema
                const fieldDef = fullSchema?.schema_definition.per_sample_fields.find(
                  f => f.id === key
                );

                // If schema available and field found, use DynamicField
                if (fieldDef) {
                  return (
                    <DynamicField
                      key={key}
                      field={fieldDef}
                      value={value}
                      onChange={(newValue) => handleValueChange(key, newValue)}
                      disabled={isSubmitting}
                      error={touched[key] ? errors[key] : undefined}
                    />
                  );
                }

                // Fallback to generic input
                return (
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
                          : String(value ?? '')
                      }
                      onChange={(e) => handleValueChange(key, e.target.value)}
                      disabled={isSubmitting}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation Error Summary */}
          {hasErrors && Object.values(touched).some(t => t) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                Please fix the following errors:
              </p>
              <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                {Object.entries(errors).map(([key, error]) => (
                  touched[key] && <li key={key}>{error}</li>
                ))}
              </ul>
            </div>
          )}

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
            className={`px-6 py-2 rounded-lg transition-colors font-medium ${
              hasErrors
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
