/**
 * Form Builder Types
 *
 * Type-safe form field definitions using discriminated unions.
 * Each field type has specific configuration properties that TypeScript
 * can narrow based on the `type` discriminator.
 */

// ============================================================================
// FieldType Union
// ============================================================================

/**
 * All available field types in the form builder.
 * Each field type has specific configuration and validation rules.
 */
export type FieldType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'date'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'passFail'
  | 'textarea'
  | 'photo';

// ============================================================================
// Base Field Interface
// ============================================================================

/**
 * Base properties shared by all field types.
 * All field types extend this interface with their specific configurations.
 */
export interface BaseField {
  /** Unique identifier for this field instance */
  id: string;
  /** Field type discriminator - enables type narrowing */
  type: FieldType;
  /** Human-readable label shown to users */
  label: string;
  /** Whether this field must be filled before submission */
  required: boolean;
  /** Placeholder text shown in empty input fields */
  placeholder?: string;
  /** Additional help text shown below the field */
  helpText?: string;
}

// ============================================================================
// Validation Rule Types
// ============================================================================

/**
 * Validation rules for text fields (string length, pattern matching)
 */
export interface TextValidation {
  /** Minimum character length */
  minLength?: number;
  /** Maximum character length */
  maxLength?: number;
  /** Regular expression pattern for validation */
  pattern?: string;
}

/**
 * Validation rules for numeric fields
 */
export interface NumberValidation {
  /** Minimum numeric value */
  min?: number;
  /** Maximum numeric value */
  max?: number;
}

/**
 * Validation rules for decimal fields
 */
export interface DecimalValidation {
  /** Minimum numeric value */
  min?: number;
  /** Maximum numeric value */
  max?: number;
  /** Number of decimal places to allow */
  precision?: number;
}

/**
 * Validation rules for date fields (ISO 8601 date strings)
 */
export interface DateValidation {
  /** Earliest allowed date (ISO 8601 format) */
  min?: string;
  /** Latest allowed date (ISO 8601 format) */
  max?: string;
}

/**
 * Validation rules for time fields (HH:mm format)
 */
export interface TimeValidation {
  /** Earliest allowed time (HH:mm 24-hour format) */
  min?: string;
  /** Latest allowed time (HH:mm 24-hour format) */
  max?: string;
}

/**
 * Validation rules for select/multi-select fields
 */
export interface SelectValidation {
  /** Minimum number of options that must be selected */
  minSelections?: number;
  /** Maximum number of options that can be selected */
  maxSelections?: number;
}

/**
 * Validation rules for textarea fields
 */
export interface TextareaValidation {
  /** Minimum character length */
  minLength?: number;
  /** Maximum character length */
  maxLength?: number;
}

/**
 * Validation rules for photo upload fields
 */
export interface PhotoValidation {
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Maximum number of photos allowed */
  maxCount?: number;
  /** Accepted MIME types (e.g., ['image/jpeg', 'image/png']) */
  acceptedTypes?: string[];
}

// ============================================================================
// Option Type
// ============================================================================

/**
 * Single option for select/checkbox fields
 */
export interface FieldOption {
  /** Unique value for this option */
  value: string;
  /** Human-readable label for this option */
  label: string;
}

// ============================================================================
// Field-Specific Interfaces
// ============================================================================

/**
 * Single-line text input field
 */
export interface TextField extends BaseField {
  type: 'text';
  /** Optional validation rules for text input */
  validation?: TextValidation;
}

/**
 * Whole number input field
 */
export interface NumberField extends BaseField {
  type: 'number';
  /** Optional validation rules for numeric input */
  validation?: NumberValidation;
}

/**
 * Decimal number input field
 */
export interface DecimalField extends BaseField {
  type: 'decimal';
  /** Optional validation rules for decimal input */
  validation?: DecimalValidation;
}

/**
 * Date picker field
 */
export interface DateField extends BaseField {
  type: 'date';
  /** Optional validation rules for date range */
  validation?: DateValidation;
}

/**
 * Time picker field
 */
export interface TimeField extends BaseField {
  type: 'time';
  /** Optional validation rules for time range */
  validation?: TimeValidation;
}

/**
 * Dropdown select field (single or multi-select)
 */
export interface SelectField extends BaseField {
  type: 'select';
  /** Available options for the select dropdown */
  options: FieldOption[];
  /** Optional validation rules for selection count */
  validation?: SelectValidation;
}

/**
 * Checkbox group field (multiple selections allowed)
 */
export interface CheckboxField extends BaseField {
  type: 'checkbox';
  /** Available options for the checkbox group */
  options: FieldOption[];
}

/**
 * Pass/Fail binary choice field
 */
export interface PassFailField extends BaseField {
  type: 'passFail';
  /** Label for the "pass" option (defaults to "Pass") */
  passLabel?: string;
  /** Label for the "fail" option (defaults to "Fail") */
  failLabel?: string;
}

/**
 * Multi-line text input field
 */
export interface TextareaField extends BaseField {
  type: 'textarea';
  /** Optional validation rules for text input */
  validation?: TextareaValidation;
  /** Number of visible rows (default varies by UI) */
  rows?: number;
}

/**
 * Photo upload field
 */
export interface PhotoField extends BaseField {
  type: 'photo';
  /** Optional validation rules for photo uploads */
  validation?: PhotoValidation;
}

// ============================================================================
// FormField Discriminated Union
// ============================================================================

/**
 * Discriminated union of all field types.
 * TypeScript can narrow the type based on the `type` field,
 * providing type-safe access to field-specific properties.
 *
 * Example:
 * ```ts
 * function renderField(field: FormField) {
 *   if (field.type === 'select') {
 *     // TypeScript knows field.options is available here
 *     return <Select options={field.options} />;
 *   }
 *   // ... handle other types
 * }
 * ```
 */
export type FormField =
  | TextField
  | NumberField
  | DecimalField
  | DateField
  | TimeField
  | SelectField
  | CheckboxField
  | PassFailField
  | TextareaField
  | PhotoField;

// ============================================================================
// Form Template
// ============================================================================

/**
 * Complete form template definition.
 * Represents a form that admins create and workers fill out.
 */
export interface FormTemplate {
  /** Unique template identifier */
  id: string;
  /** Human-readable template name */
  name: string;
  /** Template version number for audit trail */
  version: number;
  /** Organization this template belongs to */
  orgId: string;
  /** Array of form fields in display order */
  fields: FormField[];
  /** Whether this template is published and available for use */
  published: boolean;
  /** When this template was first created */
  createdAt: Date;
  /** When this template was last modified */
  updatedAt: Date;
  /** When this template was published (undefined if unpublished) */
  publishedAt?: Date;
  /** Clerk user ID of the creator */
  createdBy: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a field has options array
 */
export function fieldHasOptions(field: FormField): field is SelectField | CheckboxField {
  return field.type === 'select' || field.type === 'checkbox';
}

/**
 * Type guard to check if a field has validation rules
 */
export function fieldHasValidation(
  field: FormField
): field is
  | TextField
  | NumberField
  | DecimalField
  | DateField
  | TimeField
  | TextareaField
  | PhotoField
  | SelectField {
  return field.validation !== undefined;
}

/**
 * Type guard to check if a field is required
 */
export function isFieldRequired(field: FormField): boolean {
  return field.required;
}
