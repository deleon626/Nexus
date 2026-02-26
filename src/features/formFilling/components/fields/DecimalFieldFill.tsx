/**
 * DecimalFieldFill Component
 *
 * Decimal number input field with voice input integration for form filling.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Decimal number input with precision control
 * - Voice input button (online only)
 * - Min/max validation
 * - Step attribute from field precision
 */

import { useController, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormFieldWrapper } from './FormFieldWrapper';
import { VoiceInputButton } from './VoiceInputButton';
import { useVoiceInput } from '@/features/formFilling/hooks/useVoiceInput';
import type { DecimalField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface DecimalFieldFillProps {
  /** Field definition from form template */
  field: DecimalField;
  /** React Hook Form control instance */
  control: Control;
  /** Whether device is online (for voice input) */
  isOnline?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Decimal number input field with voice input support
 *
 * @example
 * ```tsx
 * <DecimalFieldFill
 *   field={field}
 *   control={control}
 *   isOnline={isOnline}
 * />
 * ```
 */
export function DecimalFieldFill({ field, control, isOnline = false }: DecimalFieldFillProps) {
  // Calculate step from precision
  const step = field.validation?.precision
    ? 1 / Math.pow(10, field.validation.precision)
    : 0.01;

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
        if (isNaN(num)) {
          return 'Must be a valid number';
        }
        // Check precision if specified
        if (field.validation?.precision !== undefined) {
          const decimals = value.toString().split('.')[1]?.length || 0;
          if (decimals > field.validation.precision) {
            return `Maximum ${field.validation.precision} decimal places`;
          }
        }
        return true;
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
          // Parse spoken text to decimal
          const parsed = parseDecimalText(result.text);
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
          step={step}
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
 * Parse spoken text to decimal number
 * Handles basic decimal words in Indonesian and English
 */
function parseDecimalText(text: string): number {
  // Remove extra whitespace
  const clean = text.trim().toLowerCase();

  // Direct decimal parsing
  const direct = parseFloat(clean);
  if (!isNaN(direct)) {
    return direct;
  }

  // Indonesian: "koma" for decimal point
  // English: "point" for decimal point
  const normalized = clean
    .replace(/ koma /gi, '.')
    .replace(/ point /gi, '.');

  const parsed = parseFloat(normalized);
  if (!isNaN(parsed)) {
    return parsed;
  }

  return NaN;
}
