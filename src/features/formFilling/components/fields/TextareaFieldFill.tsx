/**
 * TextareaFieldFill Component
 *
 * Multi-line text input field with auto-grow and voice input.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Auto-grow up to 5 visible lines
 * - Voice input button (online only)
 * - Min/max length validation
 * - Rows attribute from field.rows
 */

import { useController, Control } from 'react-hook-form';
import { Textarea as UITextarea } from '@/components/ui/textarea';
import { FormFieldWrapper } from './FormFieldWrapper';
import { VoiceInputButton } from './VoiceInputButton';
import { useVoiceInput } from '@/features/formFilling/hooks/useVoiceInput';
import type { TextareaField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface TextareaFieldFillProps {
  /** Field definition from form template */
  field: TextareaField;
  /** React Hook Form control instance */
  control: Control;
  /** Whether device is online (for voice input) */
  isOnline?: boolean;
}

// ============================================================================
// Component
// ============================================================================

const MAX_VISIBLE_LINES = 5;
const LINE_HEIGHT = 1.5; // rem
const MAX_HEIGHT = `${MAX_VISIBLE_LINES * LINE_HEIGHT}rem`;

/**
 * Multi-line text input with auto-grow and voice input
 *
 * @example
 * ```tsx
 * <TextareaFieldFill
 *   field={field}
 *   control={control}
 *   isOnline={isOnline}
 * />
 * ```
 */
export function TextareaFieldFill({ field, control, isOnline = false }: TextareaFieldFillProps) {
  const rows = field.rows || 3;

  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({
    name: field.id,
    control,
    rules: {
      required: field.required ? 'This field is required' : false,
      minLength: field.validation?.minLength
        ? {
            value: field.validation.minLength,
            message: `Minimum ${field.validation.minLength} characters required`,
          }
        : undefined,
      maxLength: field.validation?.maxLength
        ? {
            value: field.validation.maxLength,
            message: `Maximum ${field.validation.maxLength} characters allowed`,
          }
        : undefined,
    },
  });

  const {
    isRecording,
    isTranscribing,
    error: voiceError,
    startRecording,
    stopRecording,
  } = useVoiceInput({
    language: 'id',
    isOnline,
  });

  const handleVoiceInput = async () => {
    if (isRecording) {
      try {
        const result = await stopRecording();
        if (result.text) {
          onChange(result.text);
        }
      } catch (err) {
        console.error('Voice input failed:', err);
      }
    } else {
      startRecording();
    }
  };

  return (
    <FormFieldWrapper
      field={field}
      required={field.required}
      error={error?.message || voiceError || undefined}
    >
      <div className="relative">
        <UITextarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          rows={rows}
          disabled={isTranscribing}
          className="pr-10 resize-none"
          style={{
            maxHeight: MAX_HEIGHT,
            overflowY: 'auto',
          }}
        />
        <div className="absolute right-2 top-2">
          <VoiceInputButton
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            isOnline={isOnline}
            onToggleRecording={handleVoiceInput}
          />
        </div>
      </div>
    </FormFieldWrapper>
  );
}
