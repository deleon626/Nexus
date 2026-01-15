"use client";

/**
 * Nexus QC Data Entry Page with AG-UI Protocol.
 *
 * Features:
 * - Schema selection before starting session
 * - Voice recording with transcription
 * - Image upload for scale readings
 * - Real-time chat with AI agent via AG-UI/SSE
 * - Confirmation modal for Human-in-the-Loop
 *
 * Uses custom AG-UI client instead of CopilotKit.
 */

import { useState, useCallback, useEffect } from "react";
import { useAGUI, AGUIMessage, ToolCall } from "@/hooks/useAGUI";
import { AGUIChat } from "@/components/nexus/AGUIChat";
import { NexusConfirmationModal } from "@/components/nexus/NexusConfirmationModal";
import { ImageUpload } from "@/components/nexus/ImageUpload";
import { VoiceRecorder } from "@/components/nexus/VoiceRecorder";
import { SchemaSelector } from "@/components/nexus/SchemaSelector";
import type { SchemaListItem, ConfirmationEventData } from "@/types/nexus";

// Backend URL for API endpoints
const BACKEND_URL =
  process.env.NEXT_PUBLIC_NEXUS_BACKEND_URL || "http://localhost:8000";

// AG-UI endpoint (proxied through Next.js)
const AGUI_ENDPOINT = "/api/copilotkit/nexus";

function NexusDataEntry() {
  // Schema state
  const [selectedSchema, setSelectedSchema] = useState<SchemaListItem | null>(
    null
  );
  const [sessionStarted, setSessionStarted] = useState(false);

  // Input state
  const [images, setImages] = useState<string[]>([]);
  const [pendingVoiceText, setPendingVoiceText] = useState<string>("");

  // Confirmation modal state
  const [confirmationData, setConfirmationData] =
    useState<ConfirmationEventData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success toast state
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Handle tool calls from the agent
  const handleToolCall = useCallback(
    async (toolCall: ToolCall): Promise<string> => {
      console.log("Tool call received:", toolCall);

      if (toolCall.function.name === "show_confirmation_modal") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          setConfirmationData({
            session_id: args.session_id,
            schema_id: args.schema_id,
            schema_name: args.schema_name || selectedSchema?.form_name || "",
            extracted_data: args.extracted_data || {},
            schema_definition: args.schema_definition || {},
            status: "pending_confirmation",
          });
          return "Confirmation modal displayed. Waiting for user input.";
        } catch (e) {
          console.error("Failed to parse tool call arguments:", e);
          return "Error parsing confirmation data.";
        }
      }

      return `Tool ${toolCall.function.name} not handled on frontend.`;
    },
    [selectedSchema]
  );

  // Handle errors
  const handleError = useCallback((error: string) => {
    console.error("AG-UI Error:", error);
  }, []);

  // Initialize AG-UI hook
  const {
    messages,
    isLoading,
    error,
    threadId,
    sendMessage,
    clearMessages,
    setContext,
  } = useAGUI({
    endpoint: AGUI_ENDPOINT,
    onToolCall: handleToolCall,
    onError: handleError,
  });

  // Update context when schema changes
  useEffect(() => {
    if (selectedSchema) {
      setContext([
        {
          description: "Current QC schema context",
          // AG-UI requires value to be a string
          value: JSON.stringify({
            schema_id: selectedSchema.id,
            schema_name: selectedSchema.form_name,
            schema_code: selectedSchema.form_code,
            version: selectedSchema.version,
          }),
        },
      ]);
    }
  }, [selectedSchema, setContext]);

  // Handle sending message with images
  const handleSendMessage = useCallback(
    (content: string) => {
      // Include image context in the message if images are present
      let messageContent = content;
      if (images.length > 0) {
        messageContent = `${content}\n\n[${images.length} image(s) attached for analysis]`;
      }

      sendMessage(messageContent, images.length > 0 ? images : undefined);
    },
    [sendMessage, images]
  );

  // Handle schema selection
  const handleSchemaSelect = useCallback(
    (schemaId: string, schema: SchemaListItem) => {
      setSelectedSchema(schema);
    },
    []
  );

  // Start session after schema selection
  const handleStartSession = useCallback(() => {
    if (selectedSchema) {
      setSessionStarted(true);
      clearMessages();
    }
  }, [selectedSchema, clearMessages]);

  // Handle confirmation
  const handleConfirm = useCallback(
    async (modifications?: Record<string, unknown>) => {
      if (!confirmationData) return;

      setIsSubmitting(true);
      try {
        // Send confirmation to agent
        const confirmMessage = modifications
          ? `User confirmed with modifications: ${JSON.stringify(modifications)}`
          : "User confirmed the extracted data. Please proceed with commit_qc_data.";

        await sendMessage(confirmMessage);

        // Clear confirmation modal
        setConfirmationData(null);

        // Show success toast
        setShowSuccessToast(true);

        // Clear images
        setImages([]);

        // Hide success toast after 3 seconds and reset
        setTimeout(() => {
          setShowSuccessToast(false);
          // Reset for next entry
          setSessionStarted(false);
          setSelectedSchema(null);
          clearMessages();
        }, 3000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [confirmationData, sendMessage, clearMessages]
  );

  // Handle rejection
  const handleReject = useCallback(() => {
    setConfirmationData(null);
    // Send rejection to agent
    sendMessage(
      "User rejected the extracted data. Please ask for clarification or try again."
    );
  }, [sendMessage]);

  // Handle voice transcription
  const handleTranscription = useCallback(
    (text: string) => {
      // Immediately send the transcribed text
      handleSendMessage(text);
    },
    [handleSendMessage]
  );

  // Handle image changes
  const handleImagesChange = useCallback((newImages: string[]) => {
    setImages(newImages);
  }, []);

  // Pre-session: Schema selection
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Nexus QC Data Entry
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Select a QC schema to begin capturing data
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                QC Schema
              </label>
              <SchemaSelector
                selectedId={selectedSchema?.id || null}
                onSelect={handleSchemaSelect}
                apiBaseUrl={BACKEND_URL}
              />
            </div>

            {selectedSchema && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedSchema.form_name}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Code: {selectedSchema.form_code} | Version:{" "}
                  {selectedSchema.version}
                </div>
              </div>
            )}

            <button
              onClick={handleStartSession}
              disabled={!selectedSchema}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active session: Chat interface
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              QC Data Entry
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {selectedSchema?.form_name} ({selectedSchema?.form_code})
            </p>
          </div>
          <button
            onClick={() => {
              setSessionStarted(false);
              setSelectedSchema(null);
              setImages([]);
              clearMessages();
            }}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Change Schema
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Image Upload - Collapsible */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <ImageUpload
              images={images}
              onImagesChange={handleImagesChange}
              disabled={confirmationData !== null}
              maxImages={5}
              maxSizeMB={5}
            />
            {images.length > 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {images.length} image(s) ready. They will be included with your
                next message.
              </p>
            )}
          </div>
        </div>

        {/* Chat Area - AG-UI Chat */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-3xl mx-auto">
            <AGUIChat
              messages={messages}
              isLoading={isLoading}
              error={error}
              onSendMessage={handleSendMessage}
              disabled={confirmationData !== null}
              placeholder={
                images.length > 0
                  ? `Describe what to extract from the ${images.length} image(s)...`
                  : "Type a message or use voice input..."
              }
              className="h-full"
            />
          </div>
        </div>

        {/* Voice Input Controls */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <VoiceRecorder
              onTranscription={handleTranscription}
              disabled={confirmationData !== null || isLoading}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Click mic to record voice, or type in the chat above
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationData && (
        <NexusConfirmationModal
          data={confirmationData}
          schema={selectedSchema}
          onConfirm={handleConfirm}
          onReject={handleReject}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg px-6 py-4 shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Success!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                QC data submitted successfully
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NexusPage() {
  return <NexusDataEntry />;
}
