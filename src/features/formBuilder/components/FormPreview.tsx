/**
 * FormPreview Component
 *
 * Renders a form preview using the field registry to display fields.
 * Used in:
 * - Plan 10: Form builder canvas (right panel preview)
 * - Phase 3: Form filling for workers
 */

import { useFieldRegistry } from '../hooks/useFieldRegistry';
import type { FormField } from '../types';

export interface FormPreviewProps {
  /** Array of form fields to render */
  fields: FormField[];
  /** Current values for each field (field.id -> value) */
  values?: Record<string, any>;
  /** Callback when a field value changes */
  onChange?: (fieldId: string, value: any) => void;
  /** Error messages for each field (field.id -> error message) */
  errors?: Record<string, string>;
  /** Whether the form is disabled */
  disabled?: boolean;
}

/**
 * FormPreview renders a list of form fields using the field registry.
 * Each field is rendered with its appropriate component based on type.
 */
export function FormPreview({
  fields,
  values = {},
  onChange,
  errors = {},
  disabled = false,
}: FormPreviewProps) {
  const { getComponent } = useFieldRegistry();

  if (fields.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-center">
          No fields added yet. Add fields from the sidebar.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      {fields.map((field) => {
        const Component = getComponent(field.type);
        const fieldValue = values[field.id];
        const fieldError = errors[field.id];

        if (!Component) {
          return (
            <div key={field.id} className="text-red-500">
              Unknown field type: {field.type}
            </div>
          );
        }

        return (
          <Component
            key={field.id}
            field={field}
            value={fieldValue}
            onChange={(value) => onChange?.(field.id, value)}
            error={fieldError}
            disabled={disabled}
          />
        );
      })}
    </form>
  );
}
