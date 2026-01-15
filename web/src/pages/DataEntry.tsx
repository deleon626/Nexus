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

import { useState, useEffect } from 'react';
import { useAgentSession } from '../hooks/useAgentSession';
import { useModalPolling } from '../hooks/useModalPolling';
import { ChatContainer } from '../components/ChatContainer';
import { ChatInput } from '../components/ChatInput';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { SchemaPicker } from '../components/SchemaPicker';
import { SchemaInfoCard } from '../components/SchemaInfoCard';
import { ImageUpload } from '../components/ImageUpload';
import { submitConfirmation } from '../services/api';
import { getSchema } from '../services/schemaService';
import type { SchemaListItem, SchemaResponse } from '../types/schema';

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
  const [fullSchemaData, setFullSchemaData] = useState<SchemaResponse | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showChangeSchemaDialog, setShowChangeSchemaDialog] = useState(false);
  const [showSchemaPanel, setShowSchemaPanel] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(true);

  // Poll for confirmation modal
  const {
    modalData,
    isPolling,
    error: pollingError,
    clearModal
  } = useModalPolling({
    sessionId: session?.id ?? null,
    enabled: session !== null && !isSessionLoading,
    initialInterval: 1000, // Start at 1s, will backoff to max 10s
    onModalReady: (modal) => {
      console.log('Modal ready:', modal);
    }
  });

  // Auto-show modal when new modal data arrives
  useEffect(() => {
    if (modalData) {
      setIsModalVisible(true);
    }
  }, [modalData]);

  // Fetch full schema details when a schema is selected
  useEffect(() => {
    if (!selectedSchema) {
      setFullSchemaData(null);
      return;
    }

    // Skip fetching for default schema (it doesn't exist in DB)
    if (selectedSchema.id === 'default-schema') {
      setFullSchemaData(null);
      return;
    }

    const fetchFullSchema = async () => {
      setIsLoadingSchema(true);
      try {
        const data = await getSchema(selectedSchema.id);
        setFullSchemaData(data);
      } catch (err) {
        console.error('Failed to fetch schema details:', err);
        setFullSchemaData(null);
      } finally {
        setIsLoadingSchema(false);
      }
    };

    fetchFullSchema();
  }, [selectedSchema]);

  const handleSendMessage = async (content: string) => {
    clearError();
    try {
      // Include pending images with the message
      const imagesToSend = pendingImages.length > 0 ? pendingImages : undefined;
      await sendMessageToAgent(content, imagesToSend);
      // Clear images after successful send
      setPendingImages([]);
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
        setPendingImages([]);
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
    setPendingImages([]);
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
      <div className="flex-1 flex flex-col">
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
                disabled={isSessionLoading || isLoadingSchema}
              />

              {/* Schema Preview */}
              {selectedSchema && (
                <div className="mt-4">
                  {isLoadingSchema ? (
                    <div className="animate-pulse bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                      <span className="text-sm text-gray-500">Loading schema details...</span>
                    </div>
                  ) : fullSchemaData ? (
                    <SchemaInfoCard
                      formName={fullSchemaData.form_name}
                      formCode={fullSchemaData.form_code}
                      version={fullSchemaData.version}
                      schema={fullSchemaData.schema_definition}
                      defaultCollapsed={false}
                    />
                  ) : selectedSchema.id === 'default-schema' ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                      <p className="font-medium text-gray-700 mb-1">Default Schema</p>
                      <p>Basic QC data entry without predefined fields. The AI will extract data based on your input.</p>
                    </div>
                  ) : null}
                </div>
              )}

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
            {/* Selected Schema Info Bar + Collapsible Panel */}
            {selectedSchema && (
              <div className="bg-blue-50 border-b border-blue-100">
                {/* Info bar row */}
                <div className="px-6 py-3 flex items-center justify-between">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Schema:</span> {selectedSchema.form_name} (v{selectedSchema.version})
                  </div>
                  <div className="flex items-center gap-3">
                    {fullSchemaData && (
                      <button
                        onClick={() => setShowSchemaPanel(!showSchemaPanel)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>{showSchemaPanel ? 'Hide Details' : 'View Details'}</span>
                        <svg className={`w-4 h-4 transition-transform ${showSchemaPanel ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={handleChangeSchema}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Change Schema
                    </button>
                  </div>
                </div>

                {/* Collapsible panel */}
                {showSchemaPanel && fullSchemaData && (
                  <div className="px-6 pb-4 border-t border-blue-100 bg-white max-h-64 overflow-y-auto">
                    <SchemaInfoCard
                      formName={fullSchemaData.form_name}
                      formCode={fullSchemaData.form_code}
                      version={fullSchemaData.version}
                      schema={fullSchemaData.schema_definition}
                      defaultCollapsed={true}
                    />
                  </div>
                )}
              </div>
            )}

            <ChatContainer messages={messages} isLoading={isSessionLoading} />
            <div className="border-t border-gray-200 p-4 bg-white space-y-3">
              {/* Image Upload Area */}
              <ImageUpload
                images={pendingImages}
                onImagesChange={setPendingImages}
                disabled={isSessionLoading || Boolean(modalData)}
                maxImages={5}
                maxSizeMB={5}
              />
              
              {/* Chat Input Area */}
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={isSessionLoading || Boolean(modalData)}
                    placeholder={
                      modalData
                        ? 'Please review the confirmation modal...'
                        : pendingImages.length > 0
                          ? 'Describe what the image shows...'
                          : 'Describe your QC reading (e.g., "Scale shows 150.5 kg")'
                    }
                  />
                </div>
                {/* QC Data Toggle Button - Gray when empty, Green when data exists */}
                <button
                  onClick={() => setIsModalVisible(true)}
                  disabled={!modalData}
                  className={`p-3 rounded-lg transition-all flex items-center justify-center ${
                    modalData
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={modalData ? 'Review QC data' : 'No QC data yet'}
                >
                  <div className="relative">
                    {modalData ? (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
                      </>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                  </div>
                </button>
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
      {modalData && isModalVisible && (
        <ConfirmationModal
          data={modalData}
          schema={selectedSchema}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onClose={() => setIsModalVisible(false)}
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
