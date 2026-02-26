/**
 * Zod Validation Schemas for Form Fields
 *
 * Runtime validation with TypeScript type inference using discriminated unions.
 * Each field type has its own schema with specific validation rules.
 * The formFieldSchema discriminated union ensures type safety at runtime.
 */

import { z } from 'zod';

// ============================================================================
// Validation Rule Schemas
// ============================================================================

/**
 * Validation rules for text fields
 */
export const textValidationSchema = z.object({
  minLength: z.number().int().positive().optional(),
  maxLength: z.number().int().positive().optional(),
  pattern: z.string().optional(),
});

/**
 * Validation rules for numeric fields
 */
export const numberValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
});

/**
 * Validation rules for decimal fields
 */
export const decimalValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  precision: z.number().int().min(0).max(10).optional(),
});

/**
 * Validation rules for date fields (ISO 8601 date strings)
 */
export const dateValidationSchema = z.object({
  min: z.string().datetime().optional(),
  max: z.string().datetime().optional(),
});

/**
 * Validation rules for time fields (HH:mm format)
 */
export const timeValidationSchema = z.object({
  min: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  max: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

/**
 * Validation rules for select/multi-select fields
 */
export const selectValidationSchema = z.object({
  minSelections: z.number().int().nonnegative().optional(),
  maxSelections: z.number().int().positive().optional(),
});

/**
 * Validation rules for textarea fields
 */
export const textareaValidationSchema = z.object({
  minLength: z.number().int().positive().optional(),
  maxLength: z.number().int().positive().optional(),
});

/**
 * Validation rules for photo upload fields
 */
export const photoValidationSchema = z.object({
  maxFileSize: z.number().int().positive().optional(),
  maxCount: z.number().int().positive().optional(),
  acceptedTypes: z.array(z.string()).optional(),
});

/**
 * Schema for field options (used by select and checkbox fields)
 */
export const fieldOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

// ============================================================================
// Base Field Schema
// ============================================================================

/**
 * Base properties shared by all field types
 */
const baseFieldSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['text', 'number', 'decimal', 'date', 'time', 'select', 'checkbox', 'passFail', 'textarea', 'photo']),
  label: z.string().min(1),
  required: z.boolean(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
});

// ============================================================================
// Field Type Schemas
// ============================================================================

/**
 * Text field schema
 */
export const textFieldSchema = baseFieldSchema.extend({
  type: z.literal('text'),
  validation: textValidationSchema.optional(),
});

/**
 * Number field schema
 */
export const numberFieldSchema = baseFieldSchema.extend({
  type: z.literal('number'),
  validation: numberValidationSchema.optional(),
});

/**
 * Decimal field schema
 */
export const decimalFieldSchema = baseFieldSchema.extend({
  type: z.literal('decimal'),
  validation: decimalValidationSchema.optional(),
});

/**
 * Date field schema
 */
export const dateFieldSchema = baseFieldSchema.extend({
  type: z.literal('date'),
  validation: dateValidationSchema.optional(),
});

/**
 * Time field schema
 */
export const timeFieldSchema = baseFieldSchema.extend({
  type: z.literal('time'),
  validation: timeValidationSchema.optional(),
});

/**
 * Select field schema
 */
export const selectFieldSchema = baseFieldSchema.extend({
  type: z.literal('select'),
  options: z.array(fieldOptionSchema).min(1),
  validation: selectValidationSchema.optional(),
});

/**
 * Checkbox field schema
 */
export const checkboxFieldSchema = baseFieldSchema.extend({
  type: z.literal('checkbox'),
  options: z.array(fieldOptionSchema).min(1),
});

/**
 * Pass/Fail field schema
 */
export const passFailFieldSchema = baseFieldSchema.extend({
  type: z.literal('passFail'),
  passLabel: z.string().min(1).optional(),
  failLabel: z.string().min(1).optional(),
});

/**
 * Textarea field schema
 */
export const textareaFieldSchema = baseFieldSchema.extend({
  type: z.literal('textarea'),
  validation: textareaValidationSchema.optional(),
  rows: z.number().int().positive().optional(),
});

/**
 * Photo field schema
 */
export const photoFieldSchema = baseFieldSchema.extend({
  type: z.literal('photo'),
  validation: photoValidationSchema.optional(),
});

// ============================================================================
// Discriminated Union Schema
// ============================================================================

/**
 * Discriminated union of all field type schemas.
 * Uses the 'type' field as the discriminator for runtime validation.
 * 
 * This ensures that:
 * - Only valid field types are accepted
 * - Type-specific properties are validated correctly
 * - TypeScript can infer the correct type based on the discriminator
 */
export const formFieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  numberFieldSchema,
  decimalFieldSchema,
  dateFieldSchema,
  timeFieldSchema,
  selectFieldSchema,
  checkboxFieldSchema,
  passFailFieldSchema,
  textareaFieldSchema,
  photoFieldSchema,
]);

/**
 * Infer TypeScript type from the Zod schema
 * This type should match the FormField type in types.ts
 */
export type FormField = z.infer<typeof formFieldSchema>;

// ============================================================================
// Helper Validators
// ============================================================================

/**
 * Validate a single field value based on its type and validation rules
 * Returns the validated value or throws a ZodError
 */
export function validateFieldValue(field: FormField, value: unknown): unknown {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return z.string().optional().parse(value);
    
    case 'number':
      const numSchema = z.number().optional();
      if (field.validation?.min !== undefined) {
        numSchema.min(field.validation.min);
      }
      if (field.validation?.max !== undefined) {
        numSchema.max(field.validation.max);
      }
      return numSchema.parse(value);
    
    case 'decimal':
      const decSchema = z.number().optional();
      if (field.validation?.min !== undefined) {
        decSchema.min(field.validation.min);
      }
      if (field.validation?.max !== undefined) {
        decSchema.max(field.validation.max);
      }
      return decSchema.parse(value);
    
    case 'date':
      return z.string().datetime().optional().parse(value);
    
    case 'time':
      return z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().parse(value);
    
    case 'select':
      if (field.validation?.maxSelections === 1) {
        return z.string().optional().parse(value);
      }
      return z.array(z.string()).optional().parse(value);
    
    case 'checkbox':
      return z.array(z.string()).optional().parse(value);
    
    case 'passFail':
      return z.enum(['pass', 'fail']).optional().parse(value);
    
    case 'photo':
      return z.array(z.any()).optional().parse(value); // File objects are any
    
    default:
      return value;
  }
}

/**
 * Validate all fields in a template
 * Returns true if all fields are valid, throws otherwise
 */
export function validateFormFields(fields: unknown[]): FormField[] {
  return z.array(formFieldSchema).parse(fields);
}
