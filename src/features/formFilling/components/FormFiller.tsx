/**
 * FormFiller Component
 *
 * Main form filling container for workers to complete quality control forms.
 * Integrates React Hook Form with Zod validation, progress tracking, and auto-save.
 *
 * Features:
 * - Single scrolling page layout with all fields visible
 * - React Hook Form with Zod validation, onBlur mode
 * - Progress bar showing X/Y fields filled
 * - Auto-save to IndexedDB every 30 seconds
 * - Scroll to first error on submit validation failure
 * - Submit and Submit & Start New buttons
 *
 * @see 03-CONTEXT.md "Field Entry Flow" and "Submission Flow" sections
 * @see 03-RESEARCH.md Pattern 1 "React Hook Form with onBlur Validation"
 */

import { useForm, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodType } from 'zod';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from './ProgressBar';
import { useFormProgress } from '@/features/formFilling/hooks/useFormProgress';
import { useFormDraft } from '@/features/formFilling/hooks/useFormDraft';
import { useOnline } from '@/hooks/useOnline';
import type { FormTemplate, FormField } from '@/features/formBuilder/types';
import type { FormDataRecord } from '@/features/formFilling/types';
import * as FieldComponents from './fields';

// ============================================================================
// Props
// ============================================================================

export interface FormFillerProps {
  /** Form template with field definitions */
  template: FormTemplate;
  /** Production batch number for this submission */
  batchNumber: string;
  /** Draft ID if resuming from existing draft */
  draftId?: string;
  /** Callback when form is submitted */
  onSubmit: (data: FormDataRecord) => void;
  /** Callback when user submits and starts new form */
  onSubmitAndStartNew?: (data: FormDataRecord) => void;
  /** Initial form data (from draft or previous submission) */
  initialData?: FormDataRecord;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Field component map type
 * Maps field types to their React components
 */
type FieldComponentMap = {
  [K in FormField['type']]: React.ComponentType<{
    field: Extract<FormField, { type: K }>;
    control: Control;
    isOnline?: boolean;
  }>;
};

// ============================================================================
// Zod Schema Builder
// ============================================================================

/**
 * Build Zod validation schema from form template fields
 * Dynamically creates schema based on field types and validation rules
 */
function buildValidationSchema(fields: FormField[]): ZodType<FormDataRecord> {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
        fieldSchema = z.string();
        if (field.validation?.minLength) {
          fieldSchema = fieldSchema.min(field.validation.minLength, {
            message: `Minimum ${field.validation.minLength} characters required`,
          });
        }
        if (field.validation?.maxLength) {
          fieldSchema = fieldSchema.max(field.validation.maxLength, {
            message: `Maximum ${field.validation.maxLength} characters allowed`,
          });
        }
        if (field.validation?.pattern) {
          fieldSchema = fieldSchema.regex(
            new RegExp(field.validation.pattern),
            { message: 'Invalid format' }
          );
        }
        break;

      case 'number':
        fieldSchema = z.number({
          invalid_type_error: 'Must be a whole number',
          required_error: 'This field is required',
        });
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min, {
            message: `Must be at least ${field.validation.min}`,
          });
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max, {
            message: `Must be at most ${field.validation.max}`,
          });
        }
        break;

      case 'decimal':
        fieldSchema = z.number({
          invalid_type_error: 'Must be a number',
          required_error: 'This field is required',
        });
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min, {
            message: `Must be at least ${field.validation.min}`,
          });
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max, {
            message: `Must be at most ${field.validation.max}`,
          });
        }
        break;

      case 'date':
        fieldSchema = z.string().datetime({ message: 'Invalid date format' });
        break;

      case 'time':
        fieldSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
          message: 'Invalid time format (use HH:MM)',
        });
        break;

      case 'select':
        fieldSchema = z.string();
        break;

      case 'checkbox':
        fieldSchema = z.array(z.string());
        break;

      case 'passFail':
        fieldSchema = z.enum(['pass', 'fail'], {
          errorMap: () => ({ message: 'Please select Pass or Fail' }),
        });
        break;

      case 'photo':
        fieldSchema = z.string().min(1, { message: 'Photo is required' });
        break;

      default:
        fieldSchema = z.any();
    }

    // Make optional if not required
    if (!field.required) {
      fieldSchema = fieldSchema.optional().nullable();
    }

    schemaFields[field.id] = fieldSchema;
  }

  return z.object(schemaFields) as ZodType<FormDataRecord>;
}

// ============================================================================
// Field Renderer
// ============================================================================

/**
 * Render a single field based on its type
 * Uses field component registry to get appropriate component
 */
function renderField(
  field: FormField,
  control: Control,
  isOnline: boolean
): React.ReactNode {
  const Component = FieldComponents[
    `${field.type.charAt(0).toUpperCase() + field.type.slice(1)}FieldFill`
  ] as React.ComponentType<{ field: FormField; control: Control; isOnline?: boolean }>;

  if (!Component) {
    return (
      <div className="text-red-500 text-sm">
        Unknown field type: {field.type}
      </div>
    );
  }

  // Voice input fields need isOnline prop
  const needsOnline = ['text', 'number', 'decimal', 'textarea'].includes(field.type);

  return (
    <Component
      key={field.id}
      field={field}
      control={control}
      {...(needsOnline ? { isOnline } : {})}
    />
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Main form filling component
 *
 * @example
 * ```tsx
 * <FormFiller
 *   template={formTemplate}
 *   batchNumber="BATCH-123"
 *   onSubmit={(data) => handleSubmit(data)}
 *   onSubmitAndStartNew={(data) => handleStartNew(data)}
 * />
 * ```
 */
export function FormFiller({
  template,
  batchNumber,
  draftId,
  onSubmit,
  onSubmitAndStartNew,
  initialData,
}: FormFillerProps) {
  const { isOnline } = useOnline();
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // Build validation schema from template
  const validationSchema = buildValidationSchema(template.fields);

  // React Hook Form setup with onBlur validation mode
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormDataRecord>({
    resolver: zodResolver(validationSchema),
    mode: 'onBlur', // Validate on blur per CONTEXT.md
    defaultValues: initialData || {},
  });

  // Watch form values for progress and draft
  const formValues = watch();

  // Progress tracking
  const { completed, total, percentage, displayText } = useFormProgress(
    template,
    formValues
  );

  // Auto-save draft
  const { saveDraft, deleteDraft } = useFormDraft(
    {
      formId: template.id,
      formName: template.name,
      batchNumber,
    },
    formValues
  );

  // Scroll to first error on validation failure
  useEffect(() => {
    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0];
      const errorElement = document.getElementById(`field-${firstErrorField}`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [errors]);

  /**
   * Handle form submission
   * Validates all fields and scrolls to first error if invalid
   */
  const handleFormSubmit = handleSubmit(
    (data) => {
      // Delete draft on successful submit
      deleteDraft();
      onSubmit(data);
    },
    (errors) => {
      // Scroll to first error and show summary
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const firstErrorField = errorFields[0];
        const errorElement = document.getElementById(`field-${firstErrorField}`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Focus error summary for accessibility
        errorSummaryRef.current?.focus();
      }
    }
  );

  /**
   * Handle submit and start new
   * Submits form and then prepares for new submission with same batch
   */
  const handleSubmitAndStartNew = handleSubmit((data) => {
    deleteDraft();
    onSubmitAndStartNew?.(data);
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      {/* Progress bar at top */}
      <div className="mb-6">
        <ProgressBar
          completed={completed}
          total={total}
          percentage={percentage}
          className="sticky top-0 bg-white dark:bg-gray-900 py-2 z-10"
        />
      </div>

      {/* Error summary when validation fails */}
      {Object.keys(errors).length > 0 && (
        <div
          ref={errorSummaryRef}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
          tabIndex={-1}
        >
          <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">
            Please fix the following errors
          </h3>
          <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
            {Object.entries(errors).slice(0, 5).map(([fieldId, error]) => {
              const field = template.fields.find((f) => f.id === fieldId);
              return (
                <li key={fieldId}>
                  <strong>{field?.label || fieldId}:</strong> {error.message}
                </li>
              );
            })}
            {Object.keys(errors).length > 5 && (
              <li>
                ...and {Object.keys(errors).length - 5} more errors
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Form fields */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {template.fields.map((field) => (
          <div key={field.id} id={`field-${field.id}`}>
            {renderField(field, control, isOnline)}
          </div>
        ))}

        {/* Submit buttons at bottom */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
          {onSubmitAndStartNew && (
            <Button
              type="button"
              onClick={handleSubmitAndStartNew}
              disabled={!isValid || isSubmitting}
              variant="outline"
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Start New'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
