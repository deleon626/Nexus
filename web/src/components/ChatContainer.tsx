/**
 * ChatContainer component displays the message history with auto-scroll.
 *
 * Features:
 * - Displays list of messages
 * - Auto-scrolls to bottom on new messages
 * - Loading indicator
 * - Empty state
 */

import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { type Message } from '../services/api';

interface ChatContainerProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatContainer({ messages, isLoading = false }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No messages yet</div>
          <div className="text-sm">Start a conversation by typing a message below</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted"
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="bg-muted border border rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="animate-pulse flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animation-delay-200"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animation-delay-400"></div>
              </div>
              <span className="text-sm text-muted-foreground">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
