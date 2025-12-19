/**
 * Session state management with Zustand
 */

import { create } from 'zustand'
import { Session, Message } from '@/lib/api/types'

interface SessionState {
  session: Session | null
  messages: Message[]
  isLoading: boolean
  error: string | null

  setSession: (session: Session | null) => void
  addMessage: (message: Message) => void
  addMessages: (messages: Message[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  session: null,
  messages: [],
  isLoading: false,
  error: null,
}

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSession: (session) => set({ session }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  addMessages: (messages) =>
    set((state) => ({
      messages: [...state.messages, ...messages],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))
