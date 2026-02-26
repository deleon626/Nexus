/**
 * Form Template Zod Schema
 *
 * Complete schema for form templates with version tracking.
 * Used for runtime validation of form templates on both client and server.
 */

import { z } from 'zod';
import { formFieldSchema } from './validationSchemas';

/**
 * Form template schema for runtime validation.
 * 
 * This schema validates the complete structure of a form template,
 * including metadata, fields array, and version tracking information.
 */
export const formTemplateSchema = z.object({
  /** Unique template identifier (UUID) */
  id: z.string().uuid(),
  
  /** Human-readable template name */
  name: z.string().min(1, 'Template name is required'),
  
  /** Template version number for audit trail */
  version: z.number().int().positive('Version must be a positive integer'),
  
  /** Organization this template belongs to */
  orgId: z.string().min(1, 'Organization ID is required'),
  
  /** Array of form fields in display order */
  fields: z.array(formFieldSchema).min(0, 'Fields array is required'),
  
  /** Whether this template is published and available for use */
  published: z.boolean(),
  
  /** When this template was first created */
  createdAt: z.date(),
  
  /** When this template was last modified */
  updatedAt: z.date(),
  
  /** When this template was published (undefined if unpublished) */
  publishedAt: z.date().optional(),
  
  /** Clerk user ID of the creator */
  createdBy: z.string().min(1, 'Creator user ID is required'),
});

/**
 * Infer TypeScript type from the Zod schema
 * This type should match the FormTemplate type in types.ts
 */
export type FormTemplate = z.infer<typeof formTemplateSchema>;

/**
 * Schema for form template creation (without generated fields)
 * Used when creating a new template where id, dates are generated
 */
export const formTemplateCreateSchema = formTemplateSchema.partial({
  id: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
}).extend({
  name: z.string().min(1),
  orgId: z.string().min(1),
  fields: z.array(formFieldSchema),
  published: z.boolean().default(false),
  createdBy: z.string().min(1),
});

/**
 * Schema for form template updates
 * All fields are optional when updating
 */
export const formTemplateUpdateSchema = formTemplateSchema.partial({
  id: true,
  orgId: true,
  createdBy: true,
  createdAt: true,
}).extend({
  name: z.string().min(1).optional(),
  version: z.number().int().positive().optional(),
  fields: z.array(formFieldSchema).optional(),
  published: z.boolean().optional(),
  publishedAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Validate a form template object
 * Throws ZodError if validation fails
 */
export function validateFormTemplate(template: unknown): FormTemplate {
  return formTemplateSchema.parse(template);
}

/**
 * Safely validate a form template
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateFormTemplate(
  template: unknown
): z.SafeParseReturnType<unknown, FormTemplate> {
  return formTemplateSchema.safeParse(template);
}

/**
 * Create a new form template with generated defaults
 * Use this when creating a template from user input
 */
export function createFormTemplate(
  input: z.infer<typeof formTemplateCreateSchema>
): FormTemplate {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
}

/**
 * Create a new version of an existing template
 * Increments version number and updates timestamps
 */
export function createTemplateVersion(
  existing: FormTemplate,
  updates: Partial<Omit<FormTemplate, 'id' | 'version' | 'createdAt' | 'createdBy'>>
): FormTemplate {
  return {
    ...existing,
    ...updates,
    version: existing.version + 1,
    updatedAt: new Date(),
    // Preserve original id, createdAt, createdBy
  };
}

/**
 * Check if a template can be published
 * Returns true if template has at least one field and meets minimum requirements
 */
export function canPublishTemplate(template: FormTemplate): boolean {
  return template.fields.length > 0;
}

/**
 * Validate template for publishing
 * Throws error if template cannot be published
 */
export function validateTemplateForPublishing(template: FormTemplate): void {
  if (template.fields.length === 0) {
    throw new Error('Cannot publish a template with no fields');
  }
  
  // Check that all fields have labels
  for (const field of template.fields) {
    if (!field.label || field.label.trim() === '') {
      throw new Error(`Field "${field.id}" is missing a label`);
    }
  }
}
