/**
 * useAGUI Hook - Custom AG-UI Protocol Client
 *
 * Handles SSE communication with AG-UI backend, message state management,
 * and event parsing. Replaces CopilotKit with native AG-UI protocol support.
 */

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

// AG-UI Event Types
export enum AGUIEventType {
  RUN_STARTED = "RUN_STARTED",
  RUN_FINISHED = "RUN_FINISHED",
  RUN_ERROR = "RUN_ERROR",
  TEXT_MESSAGE_START = "TEXT_MESSAGE_START",
  TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT",
  TEXT_MESSAGE_END = "TEXT_MESSAGE_END",
  TOOL_CALL_START = "TOOL_CALL_START",
  TOOL_CALL_ARGS = "TOOL_CALL_ARGS",
  TOOL_CALL_END = "TOOL_CALL_END",
  MESSAGES_SNAPSHOT = "MESSAGES_SNAPSHOT",
  STATE_SNAPSHOT = "STATE_SNAPSHOT",
  STATE_DELTA = "STATE_DELTA",
  CUSTOM = "CUSTOM",
}

// Message Types
export interface AGUIMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  isStreaming?: boolean;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// AG-UI Request Format
interface AGUIRequest {
  threadId: string;
  runId: string;
  state: Record<string, unknown>;
  messages: AGUIMessage[];
  tools: AGUITool[];
  context: AGUIContext[];
  forwardedProps: Record<string, unknown>;
}

interface AGUITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface AGUIContext {
  description: string;
  value: string; // Must be a string - JSON.stringify objects
}

// Hook Options
interface UseAGUIOptions {
  endpoint?: string;
  onToolCall?: (toolCall: ToolCall) => Promise<string>;
  onError?: (error: string) => void;
  onStateChange?: (state: Record<string, unknown>) => void;
}

// Hook Return Type
interface UseAGUIReturn {
  messages: AGUIMessage[];
  isLoading: boolean;
  error: string | null;
  threadId: string;
  state: Record<string, unknown>;
  sendMessage: (content: string, images?: string[]) => Promise<void>;
  clearMessages: () => void;
  setContext: (context: AGUIContext[]) => void;
}

/**
 * Custom hook for AG-UI protocol communication
 */
export function useAGUI(options: UseAGUIOptions = {}): UseAGUIReturn {
  const {
    endpoint = "/api/copilotkit/nexus",
    onToolCall,
    onError,
    onStateChange,
  } = options;

  // State
  const [messages, setMessages] = useState<AGUIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<Record<string, unknown>>({});

  // Refs for stable values
  const threadIdRef = useRef<string>(uuidv4());
  const contextRef = useRef<AGUIContext[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageRef = useRef<string>("");
  const currentMessageIdRef = useRef<string>("");
  const currentToolCallRef = useRef<{ id: string; args: string } | null>(null);

  /**
   * Set context data for the agent
   */
  const setContext = useCallback((context: AGUIContext[]) => {
    contextRef.current = context;
  }, []);

  /**
   * Clear all messages and reset thread
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    threadIdRef.current = uuidv4();
    setError(null);
  }, []);

  /**
   * Parse SSE event data
   */
  const parseSSEEvent = useCallback(
    (eventData: string): void => {
      try {
        const event = JSON.parse(eventData);

        switch (event.type) {
          case AGUIEventType.RUN_STARTED:
            // Run started, reset current message
            currentMessageRef.current = "";
            currentMessageIdRef.current = "";
            break;

          case AGUIEventType.TEXT_MESSAGE_START:
            // Start new assistant message
            currentMessageIdRef.current = event.messageId;
            currentMessageRef.current = "";
            setMessages((prev) => [
              ...prev,
              {
                id: event.messageId,
                role: "assistant",
                content: "",
                isStreaming: true,
              },
            ]);
            break;

          case AGUIEventType.TEXT_MESSAGE_CONTENT:
            // Append content to current message
            currentMessageRef.current += event.delta;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === event.messageId
                  ? { ...msg, content: currentMessageRef.current }
                  : msg
              )
            );
            break;

          case AGUIEventType.TEXT_MESSAGE_END:
            // Mark message as complete
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === event.messageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            break;

          case AGUIEventType.TOOL_CALL_START:
            // Start tracking tool call
            currentToolCallRef.current = { id: event.toolCallId, args: "" };
            break;

          case AGUIEventType.TOOL_CALL_ARGS:
            // Accumulate tool call arguments
            if (currentToolCallRef.current) {
              currentToolCallRef.current.args += event.delta;
            }
            break;

          case AGUIEventType.TOOL_CALL_END:
            // Tool call complete - execute if handler provided
            if (currentToolCallRef.current && onToolCall) {
              const toolCall: ToolCall = {
                id: currentToolCallRef.current.id,
                type: "function",
                function: {
                  name: event.toolCallName || "unknown",
                  arguments: currentToolCallRef.current.args,
                },
              };
              onToolCall(toolCall).catch(console.error);
            }
            currentToolCallRef.current = null;
            break;

          case AGUIEventType.MESSAGES_SNAPSHOT:
            // Replace all messages with snapshot
            if (event.messages) {
              setMessages(event.messages);
            }
            break;

          case AGUIEventType.STATE_SNAPSHOT:
            // Replace state with snapshot
            if (event.state) {
              setAgentState(event.state);
              onStateChange?.(event.state);
            }
            break;

          case AGUIEventType.STATE_DELTA:
            // Apply state delta
            if (event.delta) {
              setAgentState((prev) => {
                const newState = { ...prev, ...event.delta };
                onStateChange?.(newState);
                return newState;
              });
            }
            break;

          case AGUIEventType.RUN_FINISHED:
            // Run complete
            setIsLoading(false);
            break;

          case AGUIEventType.RUN_ERROR:
            // Handle error
            const errorMsg = event.message || "Unknown error occurred";
            setError(errorMsg);
            onError?.(errorMsg);
            setIsLoading(false);
            break;

          case AGUIEventType.CUSTOM:
            // Handle custom events (e.g., confirmation modal)
            console.log("Custom event received:", event);
            break;

          default:
            console.log("Unknown AG-UI event:", event.type, event);
        }
      } catch (e) {
        console.error("Failed to parse SSE event:", eventData, e);
      }
    },
    [onToolCall, onError, onStateChange]
  );

  /**
   * Send a message to the AG-UI agent
   */
  const sendMessage = useCallback(
    async (content: string, images?: string[]): Promise<void> => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsLoading(true);
      setError(null);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Add user message to state
      const userMessage: AGUIMessage = {
        id: uuidv4(),
        role: "user",
        content: images?.length
          ? `${content}\n\n[Images attached: ${images.length}]`
          : content,
      };

      // Get current messages before updating state (to avoid stale closure)
      const currentMessages = [...messages, userMessage];
      setMessages(currentMessages);

      // Build request with current messages
      const request: AGUIRequest = {
        threadId: threadIdRef.current,
        runId: uuidv4(),
        state: agentState,
        messages: currentMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
        tools: [], // Tools are defined on backend
        context: contextRef.current,
        forwardedProps: images?.length
          ? { images }
          : {},
      };

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(request),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Read SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data && data !== "[DONE]") {
                parseSSEEvent(data);
              }
            }
          }
        }

        // Process any remaining data
        if (buffer.startsWith("data: ")) {
          const data = buffer.slice(6);
          if (data && data !== "[DONE]") {
            parseSSEEvent(data);
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // Request was cancelled
          return;
        }

        const errorMsg =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [endpoint, messages, agentState, parseSSEEvent, onError]
  );

  return {
    messages,
    isLoading,
    error,
    threadId: threadIdRef.current,
    state: agentState,
    sendMessage,
    clearMessages,
    setContext,
  };
}

export default useAGUI;
