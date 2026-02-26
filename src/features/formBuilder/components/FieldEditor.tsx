/**
 * FieldEditor Component
 *
 * Properties editor panel for selected form field.
 * Shows type-specific validation rules and configuration options.
 */

import { useEffect, useState } from 'react';
import { useFormBuilderStore } from '../store/formBuilderStore';
import type { FormField, FieldOption } from '../types';

interface FieldEditorProps {
  /** Currently selected field ID */
  fieldId: string | null;
  /** Callback when field is updated */
  onUpdate?: (id: string, updates: Partial<FormField>) => void;
  /** Callback when field is removed */
  onRemove?: (id: string) => void;
}

export function FieldEditor({ fieldId, onUpdate, onRemove }: FieldEditorProps) {
  const { fields, updateField, removeField } = useFormBuilderStore();
  const [localLabel, setLocalLabel] = useState('');
  const [localPlaceholder, setLocalPlaceholder] = useState('');
  const [localHelpText, setLocalHelpText] = useState('');
  const [localRequired, setLocalRequired] = useState(false);

  // Find selected field
  const selectedField = fieldId ? fields.find((f) => f.id === fieldId) : null;

  // Update local state when field changes
  useEffect(() => {
    if (selectedField) {
      setLocalLabel(selectedField.label);
      setLocalPlaceholder(selectedField.placeholder || '');
      setLocalHelpText(selectedField.helpText || '');
      setLocalRequired(selectedField.required);
    }
  }, [selectedField]);

  // Handle field update
  const handleUpdate = (updates: Partial<FormField>) => {
    if (selectedField) {
      if (onUpdate) {
        onUpdate(selectedField.id, updates);
      } else {
        updateField(selectedField.id, updates);
      }
    }
  };

  // Handle field removal
  const handleRemove = () => {
    if (selectedField) {
      if (onRemove) {
        onRemove(selectedField.id);
      } else {
        removeField(selectedField.id);
      }
    }
  };

  // If no field selected, show placeholder
  if (!selectedField) {
    return (
      <aside className="w-80 border-l bg-muted/10 p-4">
        <h2 className="text-lg font-semibold mb-4">Field Properties</h2>
        <p className="text-sm text-muted-foreground">Select a field to edit its properties</p>
      </aside>
    );
  }

  // Render validation fields based on field type
  const renderValidationFields = () => {
    switch (selectedField.type) {
      case 'text':
      case 'textarea':
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Length</label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.minLength ?? ''}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      minLength: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Length</label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.maxLength ?? ''}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                min="0"
              />
            </div>
            {selectedField.type === 'text' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Pattern (Regex)</label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border px-3 py-2"
                  value={selectedField.validation?.pattern ?? ''}
                  onChange={(e) =>
                    handleUpdate({
                      validation: {
                        ...selectedField.validation,
                        pattern: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="e.g. ^[A-Za-z]+$"
                />
              </div>
            )}
            {selectedField.type === 'textarea' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rows</label>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border px-3 py-2"
                  value={selectedField.rows ?? 3}
                  onChange={(e) =>
                    handleUpdate({
                      rows: e.target.value ? parseInt(e.target.value) : 3,
                    })
                  }
                  min="1"
                  max="20"
                />
              </div>
            )}
          </>
        );

      case 'number':
      case 'decimal':
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Value</label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.min ?? ''}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      min: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
                step={selectedField.type === 'decimal' ? '0.01' : '1'}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Value</label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.max ?? ''}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      max: e.target.value ? parseFloat(e.target.value) : undefined,
                    },
                  })
                }
                step={selectedField.type === 'decimal' ? '0.01' : '1'}
              />
            </div>
            {selectedField.type === 'decimal' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Precision (decimal places)</label>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border px-3 py-2"
                  value={selectedField.validation?.precision ?? 2}
                  onChange={(e) =>
                    handleUpdate({
                      validation: {
                        ...selectedField.validation,
                        precision: e.target.value ? parseInt(e.target.value) : 2,
                      },
                    })
                  }
                  min="0"
                  max="10"
                />
              </div>
            )}
          </>
        );

      case 'date':
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Date</label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.min ?? ''}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      min: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Date</label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.max ?? ''}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      max: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
          </>
        );

      case 'time':
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Time</label>
              <input
                type="time"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.min ?? ''}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      min: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Time</label>
              <input
                type="time"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.max ?? ''}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      max: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
          </>
        );

      case 'select':
      case 'checkbox':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Options</label>
              <div className="space-y-2">
                {selectedField.options?.map((option: FieldOption, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border px-3 py-2"
                      value={option.value}
                      onChange={(e) => {
                        const newOptions = [...(selectedField.options || [])];
                        newOptions[index] = { ...option, value: e.target.value };
                        handleUpdate({ options: newOptions });
                      }}
                      placeholder="Value"
                    />
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border px-3 py-2"
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...(selectedField.options || [])];
                        newOptions[index] = { ...option, label: e.target.value };
                        handleUpdate({ options: newOptions });
                      }}
                      placeholder="Label"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = selectedField.options?.filter((_, i) => i !== index) || [];
                        handleUpdate({ options: newOptions });
                      }}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const newOptions = [
                    ...(selectedField.options || []),
                    { value: `option${(selectedField.options?.length || 0) + 1}`, label: `Option ${(selectedField.options?.length || 0) + 1}` },
                  ];
                  handleUpdate({ options: newOptions });
                }}
                className="w-full px-3 py-2 text-sm border rounded hover:bg-muted"
              >
                Add Option
              </button>
            </div>
          </div>
        );

      case 'passFail':
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pass Label</label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.passLabel ?? 'Pass'}
                onChange={(e) => handleUpdate({ passLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fail Label</label>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.failLabel ?? 'Fail'}
                onChange={(e) => handleUpdate({ failLabel: e.target.value })}
              />
            </div>
          </>
        );

      case 'photo':
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max File Size (bytes)</label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.maxFileSize ?? 5 * 1024 * 1024}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      maxFileSize: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                min="0"
                step="1024"
              />
              <p className="text-xs text-muted-foreground">Default: 5MB (5242880 bytes)</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Count</label>
              <input
                type="number"
                className="flex h-10 w-full rounded-md border px-3 py-2"
                value={selectedField.validation?.maxCount ?? 1}
                onChange={(e) =>
                  handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      maxCount: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                min="1"
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              Photo capture will be implemented in Phase 3
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-80 border-l bg-muted/10 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Field Properties</h2>
        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
          {selectedField.type}
        </span>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Label</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border px-3 py-2"
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={() => handleUpdate({ label: localLabel })}
            placeholder="Field label"
          />
        </div>

        {/* Placeholder */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Placeholder (optional)</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border px-3 py-2"
            value={localPlaceholder}
            onChange={(e) => setLocalPlaceholder(e.target.value)}
            onBlur={() => handleUpdate({ placeholder: localPlaceholder || undefined })}
            placeholder="Placeholder text"
          />
        </div>

        {/* Help Text */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Help Text (optional)</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border px-3 py-2"
            value={localHelpText}
            onChange={(e) => setLocalHelpText(e.target.value)}
            onBlur={() => handleUpdate({ helpText: localHelpText || undefined })}
            placeholder="Additional help text"
          />
        </div>

        {/* Required */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="required"
            className="h-4 w-4 rounded border"
            checked={localRequired}
            onChange={(e) => {
              setLocalRequired(e.target.checked);
              handleUpdate({ required: e.target.checked });
            }}
          />
          <label htmlFor="required" className="text-sm font-medium">
            Required field
          </label>
        </div>

        <hr className="my-4" />

        {/* Type-specific validation */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Validation</h3>
          <div className="space-y-4">
            {renderValidationFields()}
          </div>
        </div>

        <hr className="my-4" />

        {/* Remove Field */}
        <button
          type="button"
          onClick={handleRemove}
          className="w-full px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors font-medium"
        >
          Remove Field
        </button>
      </div>
    </aside>
  );
}
