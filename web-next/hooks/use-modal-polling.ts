'use client'

/**
 * Hook for polling confirmation modal data
 */

import { useEffect, useCallback } from 'react'
import { useModalStore } from '@/stores/modal-store'
import { getConfirmationModal } from '@/lib/api/sessions'

const POLL_INTERVAL = 2000 // 2 seconds
const MODAL_TTL = 15 * 60 * 1000 // 15 minutes in milliseconds

export function useModalPolling(sessionId: string | null, enabled: boolean = true) {
  const { modalData, isPolling, pollingError, setModalData, setPolling, setPollingError, clearModal } = useModalStore()

  /**
   * Check if modal has expired (15 min TTL)
   */
  const isModalExpired = useCallback((expiresAt: string): boolean => {
    const expiryTime = new Date(expiresAt).getTime()
    return Date.now() > expiryTime
  }, [])

  /**
   * Poll for modal data
   */
  const pollModal = useCallback(async () => {
    if (!sessionId || !enabled) {
      return
    }

    try {
      setPollingError(null)
      const data = await getConfirmationModal(sessionId)

      if (data) {
        // Check if modal is expired
        if (isModalExpired(data.expires_at)) {
          setPollingError('Confirmation modal has expired')
          clearModal()
          setPolling(false)
          return
        }

        // Modal found - stop polling
        setModalData(data)
        setPolling(false)
      }
      // 404 (no modal yet) is handled gracefully by getConfirmationModal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to poll modal'
      setPollingError(errorMessage)
      console.error('Modal polling error:', err)
    }
  }, [sessionId, enabled, setModalData, setPolling, setPollingError, clearModal, isModalExpired])

  /**
   * Start polling
   */
  useEffect(() => {
    if (!enabled || !sessionId || modalData) {
      return
    }

    setPolling(true)

    // Initial poll
    pollModal()

    // Set up interval
    const intervalId = setInterval(pollModal, POLL_INTERVAL)

    return () => {
      clearInterval(intervalId)
      setPolling(false)
    }
  }, [enabled, sessionId, modalData, pollModal, setPolling])

  return {
    modalData,
    isPolling,
    pollingError,
    clearModal,
  }
}
