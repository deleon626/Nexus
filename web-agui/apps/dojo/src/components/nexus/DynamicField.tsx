/**
 * DynamicField - Renders different field types based on schema definition.
 * Adapted from Nexus web UI for Dojo environment.
 */
import type { SchemaField } from "@/types/nexus";

interface DynamicFieldProps {
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export function DynamicField({
  field,
  value,
  onChange,
  error,
  disabled,
}: DynamicFieldProps) {
  const renderInput = () => {
    const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-white";

    switch (field.field_type) {
      case "text":
        return (
          <input
            id={field.id}
            type="text"
            className={baseInputClasses}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={String(field.default_value || "")}
          />
        );

      case "number": {
        const min = field.validation_rules?.min as number | undefined;
        const max = field.validation_rules?.max as number | undefined;
        return (
          <div className="flex items-center gap-2">
            <input
              id={field.id}
              type="number"
              className={`${baseInputClasses} flex-1`}
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              disabled={disabled}
              min={min}
              max={max}
              placeholder={String(field.default_value || "")}
            />
            {field.unit && (
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {field.unit}
              </span>
            )}
          </div>
        );
      }

      case "date":
        return (
          <input
            id={field.id}
            type="date"
            className={baseInputClasses}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <input
              id={field.id}
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
            <label
              htmlFor={field.id}
              className="text-sm font-normal cursor-pointer dark:text-white"
            >
              {field.label}
            </label>
          </div>
        );

      case "choice":
        return (
          <select
            id={field.id}
            className={baseInputClasses}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">{`Select ${field.label.toLowerCase()}`}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.label}
                {option.label_id && ` (${option.label_id})`}
              </option>
            ))}
          </select>
        );

      case "graded_choice":
        return (
          <select
            id={field.id}
            className={baseInputClasses}
            value={String(value ?? "")}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
          >
            <option value="">{`Select ${field.label.toLowerCase()}`}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.value} - {option.label}
                {option.label_id && ` (${option.label_id})`}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Unsupported field type: {field.field_type}
          </div>
        );
    }
  };

  // Boolean fields have their label inside the checkbox area
  if (field.field_type === "boolean") {
    return (
      <div className="space-y-2">
        {renderInput()}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}
        {field.label_id && (
          <span className="text-gray-500 dark:text-gray-400"> ({field.label_id})</span>
        )}
        {field.required && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Required
          </span>
        )}
      </label>

      {renderInput()}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
