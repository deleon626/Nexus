/**
 * VoiceRecorder component for recording and transcribing voice input.
 *
 * Ported from Nexus web frontend for Dojo AG-UI integration.
 *
 * Features:
 * - Microphone button with recording indicator
 * - Recording duration timer
 * - Stop recording
 * - Automatic transcription via Whisper API
 * - Permission error handling
 */

'use client';

import { useEffect } from 'react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { transcribeAudio } from '@/services/api';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscription, disabled = false }: VoiceRecorderProps) {
  const {
    isRecording,
    duration,
    error,
    permissionGranted,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    requestPermission
  } = useVoiceRecording();

  // Handle transcription when recording stops
  useEffect(() => {
    if (audioBlob) {
      handleTranscribe(audioBlob);
    }
  }, [audioBlob]);

  const handleTranscribe = async (blob: Blob) => {
    try {
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
      const result = await transcribeAudio(file);

      if (result.text) {
        onTranscription(result.text);
      }

      clearRecording();
    } catch (err) {
      console.error('Transcription failed:', err);
      alert('Failed to transcribe audio. Please try again.');
      clearRecording();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleButtonClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (!permissionGranted) {
        await requestPermission();
      }
      await startRecording();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`relative p-3 rounded-full transition-all ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700'
        } disabled:bg-gray-300 disabled:cursor-not-allowed text-white shadow-lg`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <rect x="6" y="6" width="8" height="8" rx="1" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        )}

        {isRecording && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="font-mono font-medium">{formatDuration(duration)}</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
