/**
 * API service for Nexus backend communication.
 *
 * Handles speech-to-text transcription via Whisper API.
 * Other endpoints (sessions, schemas) are handled by AG-UI protocol.
 */

// Backend URL - defaults to localhost:8000 for AG-UI backend
const BACKEND_URL = process.env.NEXT_PUBLIC_NEXUS_BACKEND_URL || 'http://localhost:8000';

/**
 * Transcribe audio file to text via Whisper API.
 *
 * @param file - Audio file (WebM, WAV, MP3, etc.)
 * @returns Transcription result with text
 */
export async function transcribeAudio(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/api/stt/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Transcription failed' }));
    throw new Error(error.detail || 'Transcription failed');
  }

  return response.json();
}

/**
 * Fetch available QC schemas.
 *
 * @returns List of schemas
 */
export async function fetchSchemas(): Promise<Array<{
  id: string;
  form_name: string;
  form_code: string;
  version: string;
}>> {
  const response = await fetch(`${BACKEND_URL}/api/schemas`);

  if (!response.ok) {
    throw new Error('Failed to fetch schemas');
  }

  const data = await response.json();
  return data.schemas || data;
}

/**
 * Fetch a specific schema by ID.
 *
 * @param schemaId - Schema identifier
 * @returns Full schema details
 */
export async function fetchSchema(schemaId: string): Promise<{
  id: string;
  form_name: string;
  form_code: string;
  version: string;
  schema_definition: Record<string, unknown>;
}> {
  const response = await fetch(`${BACKEND_URL}/api/schemas/${schemaId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch schema');
  }

  return response.json();
}
