/**
 * DataEntry page - Main interface for QC data entry via text/voice/chat.
 *
 * User Story 1: Text-Based QC Data Entry MVP
 * User Story 2: Voice-Based QC Data Entry
 *
 * Features:
 * - Create agent session
 * - Send text messages to agent
 * - Record and transcribe voice input
 * - Display conversation history
 * - Poll for confirmation modal
 * - Confirm/reject extracted data
 * - Success feedback and reset
 */

import { useState } from 'react';
import { useAgentSession } from '../hooks/useAgentSession';
import { useModalPolling } from '../hooks/useModalPolling';
import { ChatContainer } from '../components/ChatContainer';
import { ChatInput } from '../components/ChatInput';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { SchemaPicker } from '../components/SchemaPicker';
import { submitConfirmation } from '../services/api';
import type { SchemaListItem } from '../types/schema';

export function DataEntry() {
  const {
    session,
    messages,
    isLoading: isSessionLoading,
    error: sessionError,
    createNewSession,
    sendMessageToAgent,
    clearError,
    resetSession
  } = useAgentSession();

  const [selectedSchema, setSelectedSchema] = useState<SchemaListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showChangeSchemaDialog, setShowChangeSchemaDialog] = useState(false);

  // Poll for confirmation modal
  const {
    modalData,
    isPolling,
    error: pollingError,
    clearModal
  } = useModalPolling({
    sessionId: session?.id ?? null,
    enabled: session !== null && !isSessionLoading,
    pollInterval: 2000,
    onModalReady: (modal) => {
      console.log('Modal ready:', modal);
    }
  });

  // No longer auto-create session on mount - user must select schema first

  const handleSendMessage = async (content: string) => {
    clearError();
    try {
      await sendMessageToAgent(content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleTranscription = async (text: string) => {
    // Automatically send transcribed text as a message
    await handleSendMessage(text);
  };

  const handleConfirm = async (modifications?: Record<string, unknown>) => {
    if (!modalData || !session) return;

    setIsSubmitting(true);

    try {
      await submitConfirmation(session.id, {
        approved: true,
        user_modifications: modifications ?? null
      });

      // Clear modal and show success
      clearModal();
      setShowSuccessToast(true);

      // Reset session after 2 seconds
      setTimeout(() => {
        resetSession();
        setShowSuccessToast(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to confirm:', err);
      alert('Failed to submit confirmation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    clearModal();
    alert('Data rejected. Please provide corrections in the chat.');
  };

  const handleStartSession = async () => {
    if (!selectedSchema) return;

    clearError();
    try {
      await createNewSession(selectedSchema.id, { source: 'web' });
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleChangeSchema = () => {
    setShowChangeSchemaDialog(true);
  };

  const handleConfirmChangeSchema = () => {
    resetSession();
    setSelectedSchema(null);
    setShowChangeSchemaDialog(false);
  };

  const handleCancelChangeSchema = () => {
    setShowChangeSchemaDialog(false);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">QC Data Entry</h1>
        <p className="text-sm text-gray-600 mt-1">
          Describe your QC readings and the AI will help extract and validate the data
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Error Display */}
        {(sessionError || pollingError) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {sessionError || pollingError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Schema Selection - Before Session */}
        {!session && !sessionError && (
          <div className="flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Select QC Schema</h2>
                <p className="text-sm text-gray-600">Choose the schema for this QC session</p>
              </div>

              <SchemaPicker
                selectedId={selectedSchema?.id ?? null}
                onSelect={(_id, schema) => setSelectedSchema(schema)}
                disabled={isSessionLoading}
              />

              <button
                onClick={handleStartSession}
                disabled={!selectedSchema || isSessionLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSessionLoading ? 'Starting Session...' : 'Start Session'}
              </button>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {session && (
          <>
            {/* Selected Schema Info */}
            {selectedSchema && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Schema:</span> {selectedSchema.form_name} (v{selectedSchema.version})
                </div>
                <button
                  onClick={handleChangeSchema}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Change Schema
                </button>
              </div>
            )}

            <ChatContainer messages={messages} isLoading={isSessionLoading} />
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={isSessionLoading || Boolean(modalData)}
                    placeholder={
                      modalData
                        ? 'Please review the confirmation modal...'
                        : 'Describe your QC reading (e.g., "Scale shows 150.5 kg")'
                    }
                  />
                </div>
                <VoiceRecorder
                  onTranscription={handleTranscription}
                  disabled={isSessionLoading || Boolean(modalData)}
                />
              </div>
            </div>
          </>
        )}

        {/* Polling Indicator */}
        {isPolling && !modalData && (
          <div className="absolute bottom-24 right-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Checking for confirmation...</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalData && (
        <ConfirmationModal
          data={modalData}
          schema={selectedSchema}
          onConfirm={handleConfirm}
          onReject={handleReject}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 bg-green-50 border border-green-200 rounded-lg px-6 py-4 shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-900">Success!</p>
              <p className="text-xs text-green-700">QC data submitted successfully</p>
            </div>
          </div>
        </div>
      )}

      {/* Change Schema Confirmation Dialog */}
      {showChangeSchemaDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Change Schema?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Changing the schema will end your current session. Any unsaved conversation data will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelChangeSchema}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChangeSchema}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Change Schema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
