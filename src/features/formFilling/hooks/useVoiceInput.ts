/**
 * useVoiceInput Hook
 *
 * Voice input hook using MediaRecorder API for audio capture and OpenAI Whisper API
 * for transcription. Online-only - requires internet connection.
 *
 * Key features:
 * - Tap-to-speak activation (start/stop recording)
 * - Visual feedback with recording state
 * - Online-only operation (gated by network status)
 * - Indonesian and English language support
 * - Error handling for permission and transcription failures
 *
 * @see 03-RESEARCH.md Pattern 4 "Voice Input with Whisper API"
 * @see 03-CONTEXT.md "Voice Input UX" section
 */

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Voice input state returned by useVoiceInput hook
 */
export interface VoiceInputState {
  /** Whether currently recording audio */
  isRecording: boolean;
  /** Whether currently transcribing audio */
  isTranscribing: boolean;
  /** Error message if recording or transcription failed */
  error: string | null;
}

/**
 * Options for voice input
 */
export interface VoiceInputOptions {
  /** Language code ('id' for Indonesian, 'en' for English) */
  language?: 'id' | 'en';
  /** Maximum recording duration in seconds (default 30) */
  maxDuration?: number;
  /** Whether voice input is enabled (online check) */
  isOnline?: boolean;
}

/**
 * Result from transcribeVoice function
 */
export interface TranscribeVoiceResult {
  /** Transcribed text */
  text: string;
  /** Language detected */
  language: string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Voice input hook with recording and transcription
 *
 * @param options - Optional voice input configuration
 * @returns Voice input state and recording function
 *
 * @example
 * ```tsx
 * const { isRecording, isTranscribing, error, startRecording, stopRecording } = useVoiceInput({
 *   language: 'id',
 *   isOnline: true
 * });
 *
 * const handleToggleRecording = async () => {
 *   if (isRecording) {
 *     const result = await stopRecording();
 *     console.log('Transcribed:', result.text);
 *   } else {
 *     startRecording();
 *   }
 * };
 * ```
 */
export function useVoiceInput(options: VoiceInputOptions = {}) {
  const {
    language = 'id',
    maxDuration = 30,
    isOnline = true,
  } = options;

  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    isTranscribing: false,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start voice recording
   * Requests microphone access and begins capturing audio
   */
  const startRecording = useCallback(async () => {
    // Check online status first
    if (!isOnline) {
      const error = 'Voice input requires internet connection';
      setState((prev) => ({ ...prev, error }));
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setState((prev) => ({ ...prev, isRecording: true, error: null }));

      // Auto-stop after max duration
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setState((prev) => ({ ...prev, isRecording: false }));
        }
      }, maxDuration * 1000);
    } catch (err) {
      let errorMessage = 'Failed to start recording';

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No microphone found on this device.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use by another application.';
        }
      }

      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [isOnline, maxDuration]);

  /**
   * Stop voice recording and get transcription
   * Returns the transcribed text from Whisper API
   */
  const stopRecording = useCallback(
    async (): Promise<TranscribeVoiceResult> => {
      return new Promise((resolve, reject) => {
        if (!mediaRecorderRef.current) {
          reject(new Error('No active recording'));
          return;
        }

        // Clear auto-stop timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Handle recording stop and transcription
        mediaRecorderRef.current.onstop = async () => {
          setState((prev) => ({
            ...prev,
            isRecording: false,
            isTranscribing: true,
          }));

          try {
            // Create audio blob
            const blob = new Blob(chunksRef.current, {
              type: mediaRecorderRef.current?.mimeType || 'audio/webm',
            });

            // TODO: Send to Convex backend for Whisper transcription
            // For now, return empty result - this will be implemented in Plan 05
            // const result = await convex.functions.voice.transcribe({
            //   audio: await blobToBase64(blob),
            //   language,
            // });

            // Placeholder result - actual transcription will be added when Plan 05 is implemented
            const result: TranscribeVoiceResult = {
              text: '',
              language: language === 'id' ? 'indonesian' : 'english',
            };

            setState((prev) => ({
              ...prev,
              isTranscribing: false,
              error: null,
            }));

            resolve(result);
          } catch (err) {
            const errorMessage =
              err instanceof Error
                ? err.message
                : 'Transcription failed. Please try again.';
            setState((prev) => ({
              ...prev,
              isTranscribing: false,
              error: errorMessage,
            }));
            reject(new Error(errorMessage));
          }
        };

        // Stop the recorder
        mediaRecorderRef.current.stop();
      });
    },
    [language]
  );

  /**
   * Clear any active timeout
   * Call this when unmounting component
   */
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isRecording: state.isRecording,
    isTranscribing: state.isTranscribing,
    error: state.error,
    startRecording,
    stopRecording,
    cleanup,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert blob to base64 string
 * Used for sending audio to API
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix to get pure base64
      const pureBase64 = base64.split(',')[1];
      resolve(pureBase64);
    };
    reader.onerror = () => {
      reject(new Error('Failed to convert audio to base64'));
    };
  });
}
