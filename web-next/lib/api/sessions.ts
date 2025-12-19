/**
 * Session API client for agent interactions
 */

import { apiClient, fetchWithRetry, API_BASE_URL } from './client'
import { Session, ConfirmationModal, AgentMessageResponse } from './types'

interface SessionResponse {
  session_id: string
}

interface ConfirmationResponse {
  report_id: string
  success: boolean
}

/**
 * Create a new agent session
 */
export async function createSession(
  schemaId: string = 'default-schema',
  metadata?: Record<string, unknown>
): Promise<Session> {
  const data = await apiClient<SessionResponse>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      schema_id: schemaId,
      metadata: metadata || {}
    })
  })

  return {
    id: data.session_id,
    status: 'active',
    created_at: new Date().toISOString()
  }
}

/**
 * Delete an agent session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete session: ${response.statusText}`)
  }
}

/**
 * Send a message to the agent
 */
export async function sendMessage(
  sessionId: string,
  content: string,
  images?: string[]
): Promise<AgentMessageResponse> {
  // Convert image URLs to ImageInput format expected by backend
  const imageInputs = (images || []).map(url => ({ url }))

  const data = await apiClient<AgentMessageResponse>(
    `/api/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: content,  // Changed from 'message' to 'content'
        images: imageInputs // Changed to ImageInput format
      })
    }
  )

  return data
}

/**
 * Get pending confirmation modal for a session
 */
export async function getConfirmationModal(
  sessionId: string
): Promise<ConfirmationModal | null> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/modal`)

  if (response.status === 404) {
    return null // No pending modal
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.detail || 'Failed to get confirmation modal')
  }

  return response.json()
}

/**
 * Submit confirmation (approve/reject with optional modifications)
 */
export async function submitConfirmation(
  sessionId: string,
  confirmed: boolean,
  modifications?: Record<string, unknown> | null
): Promise<ConfirmationResponse> {
  const data = await apiClient<ConfirmationResponse>(
    `/api/sessions/${sessionId}/confirmation`,
    {
      method: 'POST',
      body: JSON.stringify({
        approved: confirmed,
        user_modifications: modifications || null
      })
    }
  )

  return data
}
