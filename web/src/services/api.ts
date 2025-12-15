/**
 * Backend API client for Nexus QC system
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiError {
  detail: string;
}

export interface TranscriptionResponse {
  text: string;
  success: boolean;
}

export interface Session {
  id: string;
  schema_id?: string;
  status: string;
  created_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface SessionResponse {
  session_id: string;
}

export interface MessageResponse {
  message_id: string;
  message: string; // Changed from 'response' to 'message' to match backend
}

export interface ConfirmationModal {
  confirmation_id: string;
  session_id: string;
  schema_id?: string;
  extracted_data: Record<string, any>;
  created_at: string;
  expires_at: string;
}

export interface ConfirmationResponse {
  report_id: string;
  success: boolean;
}

/**
 * Retry configuration
 */
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for fetch requests
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempts = RETRY_ATTEMPTS
): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, options);

      // Retry on specific status codes
      if (i < attempts - 1 && RETRY_STATUS_CODES.includes(response.status)) {
        console.warn(`Request failed with status ${response.status}, retrying... (${i + 1}/${attempts})`);
        await sleep(RETRY_DELAY_MS * (i + 1)); // Exponential backoff
        continue;
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (i < attempts - 1) {
        console.warn(`Network error, retrying... (${i + 1}/${attempts})`, error);
        await sleep(RETRY_DELAY_MS * (i + 1));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Max retry attempts reached');
}

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.detail || 'API request failed');
  }
  return response.json();
}

/**
 * Create a new agent session
 */
export async function createSession(
  schemaId: string = 'default-schema',
  metadata?: Record<string, unknown>
): Promise<Session> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ schema_id: schemaId, metadata: metadata || {} })
  });
  const data = await handleResponse<SessionResponse>(response);
  return {
    id: data.session_id,
    schema_id: schemaId,
    status: 'active',
    created_at: new Date().toISOString()
  };
}

/**
 * Delete an agent session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete session: ${response.statusText}`);
  }
}

/**
 * Send a message to the agent
 */
export async function sendMessage(
  sessionId: string,
  message: string,
  images?: string[]
): Promise<MessageResponse> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        images: images || [],
      }),
    }
  );
  return handleResponse<MessageResponse>(response);
}

/**
 * Get pending confirmation modal for a session
 */
export async function getConfirmationModal(
  sessionId: string
): Promise<ConfirmationModal | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/sessions/${sessionId}/modal`
  );
  if (response.status === 404) {
    return null; // No pending modal
  }
  return handleResponse<ConfirmationModal>(response);
}

/**
 * Submit confirmation (approve/reject with optional modifications)
 */
export async function submitConfirmation(
  sessionId: string,
  data: {
    approved: boolean;
    user_modifications: Record<string, unknown> | null;
  }
): Promise<ConfirmationResponse> {
  const response = await fetchWithRetry(
    `${API_BASE_URL}/api/sessions/${sessionId}/confirmation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
  return handleResponse<ConfirmationResponse>(response);
}

/**
 * Transcribe audio file to text using Speech-to-Text API
 */
export async function transcribeAudio(
  audioFile: File,
  language?: string
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  if (language) {
    formData.append('language', language);
  }

  const response = await fetch(`${API_BASE_URL}/api/stt/transcribe`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<TranscriptionResponse>(response);
}

/**
 * Transcribe audio blob to text
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  language?: string
): Promise<TranscriptionResponse> {
  const file = new File([audioBlob], 'recording.webm', {
    type: audioBlob.type,
  });
  return transcribeAudio(file, language);
}
