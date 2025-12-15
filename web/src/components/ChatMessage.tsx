/**
 * ChatMessage component displays a single message in the chat interface.
 *
 * Features:
 * - Differentiates between user and assistant messages
 * - Displays message content with proper formatting
 * - Shows timestamp
 */

import { type Message } from '../services/api';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 border border-gray-200'
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
