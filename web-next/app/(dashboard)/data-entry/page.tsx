'use client'

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

import { useState, useEffect } from 'react'
import { useAgentSession } from '@/hooks/use-agent-session'
import { useModalPolling } from '@/hooks/use-modal-polling'
import { ChatContainer } from '@/components/chat/chat-container'
import { ChatInput } from '@/components/chat/chat-input'
import { VoiceRecorder } from '@/components/chat/voice-recorder'
import { ConfirmationModal } from '@/components/modals/confirmation-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { submitConfirmation } from '@/lib/api/sessions'
import { transcribeAudio } from '@/lib/api/stt'
import { toast } from 'sonner'
import { AlertCircle, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function DataEntryPage() {
  const {
    session,
    messages,
    isLoading: isSessionLoading,
    error: sessionError,
    createNewSession,
    sendMessageToAgent,
    clearError,
    resetSession
  } = useAgentSession()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Poll for confirmation modal
  const {
    modalData,
    isPolling,
    pollingError,
    clearModal
  } = useModalPolling(session?.id ?? null, session !== null && !isSessionLoading)

  // Create session on mount
  useEffect(() => {
    if (!session) {
      createNewSession('default-schema', { source: 'web' }).catch(err => {
        console.error('Failed to create session:', err)
      })
    }
  }, [session, createNewSession])

  // Show modal when data is ready
  useEffect(() => {
    if (modalData) {
      setShowModal(true)
    }
  }, [modalData])

  const handleSendMessage = async (content: string) => {
    clearError()
    try {
      await sendMessageToAgent(content)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleTranscription = async (text: string) => {
    // Automatically send transcribed text as a message
    await handleSendMessage(text)
  }

  const handleConfirm = async (modifications?: Record<string, unknown>) => {
    if (!modalData || !session) return

    setIsSubmitting(true)

    try {
      await submitConfirmation(session.id, true, modifications ?? null)

      // Clear modal and show success
      clearModal()
      setShowModal(false)
      toast.success('QC data submitted successfully', {
        description: 'The data has been saved and is pending approval.'
      })

      // Reset session after 2 seconds
      setTimeout(() => {
        resetSession()
      }, 2000)
    } catch (err) {
      console.error('Failed to confirm:', err)
      toast.error('Failed to submit confirmation', {
        description: 'Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = () => {
    clearModal()
    setShowModal(false)
    toast.info('Data rejected', {
      description: 'Please provide corrections in the chat.'
    })
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Page Header */}
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-semibold">QC Data Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe your QC readings and the AI will help extract and validate the data
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Error Display */}
        {(sessionError || pollingError) && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {sessionError || pollingError}
            </AlertDescription>
          </Alert>
        )}

        {/* Session Status - Loading */}
        {!session && !sessionError && (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Initializing session...</p>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {session && (
          <>
            <ChatContainer messages={messages} isLoading={isSessionLoading} />
            <div className="border-t bg-card p-4">
              <div className="flex gap-3 items-end max-w-4xl mx-auto">
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
                  transcribeAudio={async (file: File) => transcribeAudio(file)}
                />
              </div>
            </div>
          </>
        )}

        {/* Polling Indicator */}
        {isPolling && !modalData && (
          <div className="absolute bottom-24 right-6 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking for confirmation...</span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modalData && (
        <ConfirmationModal
          data={{
            session_id: modalData.session_id,
            schema_id: modalData.schema_id,
            extracted_data: modalData.extracted_data,
            created_at: modalData.created_at
          }}
          open={showModal}
          onOpenChange={setShowModal}
          onConfirm={handleConfirm}
          onReject={handleReject}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
