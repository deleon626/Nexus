/**
 * Hook for managing agent session lifecycle and message sending.
 *
 * Handles:
 * - Creating new sessions
 * - Sending messages to agent
 * - Managing session state
 * - Error handling
 */

import { useState, useCallback } from 'react';
import {
  createSession,
  sendMessage,
  type Session,
  type Message
} from '../services/api';

interface UseAgentSessionReturn {
  session: Session | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  createNewSession: (schemaId: string, metadata?: Record<string, unknown>) => Promise<void>;
  sendMessageToAgent: (content: string, images?: string[]) => Promise<void>;
  clearError: () => void;
  resetSession: () => void;
}

export function useAgentSession(): UseAgentSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewSession = useCallback(async (
    schemaId: string,
    metadata?: Record<string, unknown>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const newSession = await createSession(schemaId, metadata);
      setSession(newSession);
      setMessages([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessageToAgent = useCallback(async (content: string, images?: string[]) => {
    if (!session) {
      setError('No active session');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage(session.id, content, images);

      // Add user message
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        session_id: session.id,
        role: 'user',
        content,
        created_at: new Date().toISOString()
      };

      // Add agent response
      const agentMessage: Message = {
        id: `temp-${Date.now() + 1}`,
        session_id: session.id,
        role: 'assistant',
        content: response.content,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage, agentMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetSession = useCallback(() => {
    setSession(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    session,
    messages,
    isLoading,
    error,
    createNewSession,
    sendMessageToAgent,
    clearError,
    resetSession
  };
}
