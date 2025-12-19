'use client'

/**
 * Hook for managing agent sessions
 */

import { useCallback } from 'react'
import { useSessionStore } from '@/stores/session-store'
import * as sessionApi from '@/lib/api/sessions'
import { Message } from '@/lib/api/types'

export function useAgentSession() {
  const {
    session,
    messages,
    isLoading,
    error,
    setSession,
    addMessage,
    setLoading,
    setError,
    reset,
  } = useSessionStore()

  /**
   * Create a new agent session
   */
  const createNewSession = useCallback(
    async (schemaId: string = 'default-schema', metadata?: Record<string, unknown>) => {
      setLoading(true)
      setError(null)

      try {
        const newSession = await sessionApi.createSession(schemaId, metadata)
        setSession(newSession)
        return newSession
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create session'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [setSession, setLoading, setError]
  )

  /**
   * Send a message to the agent
   */
  const sendMessageToAgent = useCallback(
    async (content: string, images?: string[]) => {
      if (!session) {
        throw new Error('No active session')
      }

      setLoading(true)
      setError(null)

      try {
        // Add user message to store
        const userMessage: Message = {
          id: crypto.randomUUID(),
          session_id: session.id,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }
        addMessage(userMessage)

        // Send to API
        const response = await sessionApi.sendMessage(session.id, content, images)

        // Add assistant response to store
        const assistantMessage: Message = {
          id: crypto.randomUUID(), // Generate client-side ID
          session_id: response.session_id,
          role: response.role,
          content: response.content,
          created_at: new Date().toISOString(),
        }
        addMessage(assistantMessage)

        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [session, addMessage, setLoading, setError]
  )

  /**
   * Reset the session state
   */
  const resetSession = useCallback(() => {
    reset()
  }, [reset])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  return {
    session,
    messages,
    isLoading,
    error,
    createNewSession,
    sendMessageToAgent,
    resetSession,
    clearError,
  }
}
