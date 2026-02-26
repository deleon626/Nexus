/**
 * VoiceInputButton Component
 *
 * Mic button for voice input with recording state and visual feedback.
 * Shows online gating and disabled state when offline.
 *
 * Features:
 * - Mic icon from lucide-react
 * - Recording state with animated pulse
 * - "Listening..." text when recording
 * - Disabled when offline with tooltip
 * - Absolute positioned inline with input (right side)
 */

import { Mic, MicOff } from 'lucide-react';
import { useState } from 'react';

// ============================================================================
// Props
// ============================================================================

export interface VoiceInputButtonProps {
  /** Whether currently recording audio */
  isRecording: boolean;
  /** Whether currently transcribing audio */
  isTranscribing: boolean;
  /** Whether device is online (voice requires internet) */
  isOnline: boolean;
  /** Callback when user taps to start/stop recording */
  onToggleRecording: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
}

// ============================================================================
// Component
// =============================================================================

/**
 * Mic button for voice input with recording state
 *
 * @example
 * ```tsx
 * <VoiceInputButton
 *   isRecording={isRecording}
 *   isTranscribing={isTranscribing}
 *   isOnline={isOnline}
 *   onToggleRecording={handleToggleRecording}
 * />
 * ```
 */
export function VoiceInputButton({
  isRecording,
  isTranscribing,
  isOnline,
  onToggleRecording,
  disabled = false,
}: VoiceInputButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isDisabled = disabled || !isOnline || isTranscribing;
  const buttonDisabled = isDisabled;

  const handleInteraction = () => {
    if (isDisabled) {
      // Show tooltip briefly when disabled
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    } else {
      onToggleRecording();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={buttonDisabled}
        onClick={handleInteraction}
        className={`
          flex items-center justify-center
          rounded-full p-2 transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-ring
          ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : isDisabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }
        `}
        aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        aria-pressed={isRecording}
      >
        {isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="flex items-center gap-1.5 bg-gray-900 text-white text-xs px-2 py-1 rounded-full dark:bg-white dark:text-gray-900">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>Listening...</span>
          </div>
        </div>
      )}

      {/* Offline tooltip */}
      {showTooltip && !isOnline && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded dark:bg-white dark:text-gray-900">
            Voice requires internet
          </div>
        </div>
      )}

      {/* Transcribing tooltip */}
      {showTooltip && isTranscribing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded dark:bg-white dark:text-gray-900">
            Transcribing...
          </div>
        </div>
      )}
    </div>
  );
}
