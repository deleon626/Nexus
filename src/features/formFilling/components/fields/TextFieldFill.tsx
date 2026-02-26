/**
 * TextFieldFill Component
 *
 * Text input field with voice input integration for form filling.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Single-line text input
 * - Voice input button (online only)
 * - Validation errors on blur
 * - Required field asterisk
 */

import { useController, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from './FormFieldWrapper';
import { VoiceInputButton } from './VoiceInputButton';
import { useVoiceInput } from '@/features/formFilling/hooks/useVoiceInput';
import type { TextField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface TextFieldFillProps {
  /** Field definition from form template */
  field: TextField;
  /** React Hook Form control instance */
  control: Control;
  /** Whether device is online (for voice input) */
  isOnline?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Text input field with voice input support
 *
 * @example
 * ```tsx
 * <TextFieldFill
 *   field={field}
 *   control={control}
 *   isOnline={isOnline}
 * />
 * ```
 */
export function TextFieldFill({ field, control, isOnline = false }: TextFieldFillProps) {
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
      pattern: field.validation?.pattern
        ? {
            value: new RegExp(field.validation.pattern),
            message: 'Invalid format',
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
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          className="pr-10"
          disabled={isTranscribing}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
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
