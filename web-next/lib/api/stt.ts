/**
 * Speech-to-Text API client
 */

import { API_BASE_URL } from './client'

interface TranscriptionResponse {
  text: string
  success: boolean
}

/**
 * Transcribe audio blob to text using Speech-to-Text API
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language?: string
): Promise<TranscriptionResponse> {
  const formData = new FormData()
  const file = new File([audioBlob], 'recording.webm', {
    type: audioBlob.type,
  })
  formData.append('audio_file', file)

  if (language) {
    formData.append('language', language)
  }

  const response = await fetch(`${API_BASE_URL}/api/stt/transcribe`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.detail || 'Transcription failed')
  }

  return response.json()
}
