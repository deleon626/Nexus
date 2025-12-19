'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage } from './chat-message'
import { Skeleton } from '@/components/ui/skeleton'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ChatContainerProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatContainer({ messages, isLoading = false }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg font-medium mb-2 text-muted-foreground">
            No messages yet
          </div>
          <div className="text-sm text-muted-foreground">
            Start a conversation by typing a message below
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="bg-muted border rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:200ms]" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:400ms]" />
              </div>
              <span className="text-sm text-muted-foreground">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
