/**
 * NumberFieldFill Component
 *
 * Number input field with voice input integration for form filling.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Number-only input
 * - Voice input button (online only)
 * - Min/max validation
 * - Validation errors on blur
 */

import { useController, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from './FormFieldWrapper';
import { VoiceInputButton } from './VoiceInputButton';
import { useVoiceInput } from '@/features/formFilling/hooks/useVoiceInput';
import type { NumberField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface NumberFieldFillProps {
  /** Field definition from form template */
  field: NumberField;
  /** React Hook Form control instance */
  control: Control;
  /** Whether device is online (for voice input) */
  isOnline?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Number input field with voice input support
 *
 * @example
 * ```tsx
 * <NumberFieldFill
 *   field={field}
 *   control={control}
 *   isOnline={isOnline}
 * />
 * ```
 */
export function NumberFieldFill({ field, control, isOnline = false }: NumberFieldFillProps) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({
    name: field.id,
    control,
    rules: {
      required: field.required ? 'This field is required' : false,
      min: field.validation?.min
        ? {
            value: field.validation.min,
            message: `Minimum value is ${field.validation.min}`,
          }
        : undefined,
      max: field.validation?.max
        ? {
            value: field.validation.max,
            message: `Maximum value is ${field.validation.max}`,
          }
        : undefined,
      validate: (value) => {
        if (value === '' || value === null || value === undefined) {
          return true; // Let required rule handle empty
        }
        const num = Number(value);
        return !isNaN(num) || 'Must be a valid number';
      },
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
          // Parse spoken text to number
          // Handle common number words in Indonesian and English
          const parsed = parseNumberText(result.text);
          if (!isNaN(parsed)) {
            onChange(parsed);
          } else {
            // If parsing fails, set raw text for user to correct
            onChange(result.text);
          }
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
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              onChange(null);
            } else {
              const num = parseFloat(val);
              onChange(isNaN(num) ? val : num);
            }
          }}
          onBlur={onBlur}
          placeholder={field.placeholder}
          className="pr-10"
          disabled={isTranscribing}
          step="1"
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse spoken text to number
 * Handles basic number words in Indonesian and English
 */
function parseNumberText(text: string): number {
  // Remove extra whitespace
  const clean = text.trim().toLowerCase();

  // Direct number parsing
  const direct = parseFloat(clean);
  if (!isNaN(direct)) {
    return direct;
  }

  // Indonesian number words
  const indoNumbers: Record<string, number> = {
    nol: 0,
    satu: 1,
    dua: 2,
    tiga: 3,
    empat: 4,
    lima: 5,
    enam: 6,
    tujuh: 7,
    delapan: 8,
    sembilan: 9,
    sepuluh: 10,
  };

  // English number words
  const englishNumbers: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  // Check Indonesian words
  if (indoNumbers[clean] !== undefined) {
    return indoNumbers[clean];
  }

  // Check English words
  if (englishNumbers[clean] !== undefined) {
    return englishNumbers[clean];
  }

  return NaN;
}
