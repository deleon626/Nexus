/**
 * PhotoFieldFill Component
 *
 * Photo capture field with camera access and thumbnail display.
 * Uses React Hook Form Controller pattern for validation.
 *
 * Features:
 * - Tap to capture photo from camera
 * - Small rounded thumbnail display when photo exists
 * - Tap thumbnail to retake
 * - Loading state during capture
 * - Full offline support
 */

import { useState } from 'react';
import { useController, Control } from 'react-hook-form';
import { Camera, X } from 'lucide-react';
import { FormFieldWrapper } from './FormFieldWrapper';
import { usePhotoCapture } from '@/features/formFilling/hooks/usePhotoCapture';
import type { PhotoField } from '@/features/formBuilder/types';

// ============================================================================
// Props
// ============================================================================

export interface PhotoFieldFillProps {
  /** Field definition from form template */
  field: PhotoField;
  /** React Hook Form control instance */
  control: Control;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Photo capture field with camera and thumbnail display
 *
 * @example
 * ```tsx
 * <PhotoFieldFill
 *   field={field}
 *   control={control}
 * />
 * ```
 */
export function PhotoFieldFill({ field, control }: PhotoFieldFillProps) {
  const [isRetaking, setIsRetaking] = useState(false);

  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    name: field.id,
    control,
    rules: {
      required: field.required ? 'Photo is required' : false,
    },
  });

  const { isCapturing, error: captureError, capturePhoto } = usePhotoCapture();

  const handleCapture = async () => {
    try {
      const result = await capturePhoto();
      onChange(result.base64);
    } catch (err) {
      console.error('Photo capture failed:', err);
    }
  };

  const handleRetake = () => {
    setIsRetaking(true);
    onChange(null); // Clear current photo
  };

  const hasPhoto = typeof value === 'string' && value.length > 0;
  const isLoading = isCapturing || isRetaking;

  return (
    <FormFieldWrapper
      field={field}
      required={field.required}
      error={error?.message || captureError || undefined}
    >
      <div className="flex items-start gap-4">
        {/* Photo thumbnail / capture button */}
        <div className="flex-shrink-0">
          {hasPhoto ? (
            // Thumbnail with retake option
            <div className="relative group">
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <img
                  src={value as string}
                  alt="Captured photo"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Remove button - appears on hover/tap */}
              <button
                type="button"
                onClick={handleRetake}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            // Empty state - capture button
            <button
              type="button"
              onClick={handleCapture}
              disabled={isLoading}
              className={`
                w-16 h-16 rounded-lg border-2 border-dashed flex flex-col
                items-center justify-center transition-colors
                ${
                  isLoading
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700'
                }
              `}
              aria-label="Capture photo"
            >
              <Camera
                className={`h-6 w-6 ${isLoading ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}
              />
            </button>
          )}
        </div>

        {/* Instructions / status */}
        <div className="flex-1 min-w-0">
          {hasPhoto ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium">Photo captured</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                Tap the X to remove and retake
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isLoading ? (
                <p className="font-medium">Capturing photo...</p>
              ) : (
                <>
                  <p className="font-medium">Tap to capture photo</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    Use rear camera for best results
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </FormFieldWrapper>
  );
}
