'use client'

import { useEffect } from 'react'
import { Mic, Square } from 'lucide-react'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  disabled?: boolean
  transcribeAudio: (file: File) => Promise<{ text: string }>
}

export function VoiceRecorder({
  onTranscription,
  disabled = false,
  transcribeAudio
}: VoiceRecorderProps) {
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
  } = useVoiceRecording()

  // Handle transcription when recording stops
  useEffect(() => {
    if (audioBlob) {
      handleTranscribe(audioBlob)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob])

  const handleTranscribe = async (blob: Blob) => {
    try {
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
      const result = await transcribeAudio(file)

      if (result.text) {
        onTranscription(result.text)
      }

      clearRecording()
    } catch (err) {
      console.error('Transcription failed:', err)
      alert('Failed to transcribe audio. Please try again.')
      clearRecording()
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleButtonClick = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      if (!permissionGranted) {
        await requestPermission()
      }
      await startRecording()
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        variant={isRecording ? 'destructive' : 'default'}
        size="icon"
        className={cn(
          'relative rounded-full shadow-lg transition-all',
          isRecording && 'animate-pulse'
        )}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <Square className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}

        {isRecording && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        )}
      </Button>

      {isRecording && (
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="font-mono font-medium">{formatDuration(duration)}</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-destructive max-w-xs">
          {error}
        </div>
      )}
    </div>
  )
}
