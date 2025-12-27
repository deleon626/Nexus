/**
 * Hook for polling confirmation modal status.
 *
 * Continuously polls the backend to check if the agent has requested
 * user confirmation. When a modal is ready, it retrieves the confirmation
 * data and stops polling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getConfirmationModal, type ConfirmationModal } from '../services/api';

interface UseModalPollingOptions {
  sessionId: string | null;
  enabled: boolean;
  pollInterval?: number; // milliseconds
  onModalReady?: (modal: ConfirmationModal) => void;
}

interface UseModalPollingReturn {
  modalData: ConfirmationModal | null;
  isPolling: boolean;
  error: string | null;
  stopPolling: () => void;
  startPolling: () => void;
  clearModal: () => void;
}

export function useModalPolling({
  sessionId,
  enabled,
  pollInterval = 2000,
  onModalReady
}: UseModalPollingOptions): UseModalPollingReturn {
  const [modalData, setModalData] = useState<ConfirmationModal | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store callback in ref to avoid dependency issues
  const onModalReadyRef = useRef(onModalReady);
  useEffect(() => {
    onModalReadyRef.current = onModalReady;
  }, [onModalReady]);

  const clearModal = useCallback(() => {
    setModalData(null);
    setError(null);
  }, []);

  // Manual control functions (exposed for external use if needed)
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  // Single effect handles all polling logic - eliminates dependency cycle
  useEffect(() => {
    // Don't poll if not enabled, no session, or modal already exists
    if (!enabled || !sessionId || modalData) {
      setIsPolling(false);
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const checkForModal = async () => {
      if (!isMounted) return;

      try {
        const modal = await getConfirmationModal(sessionId);

        if (!isMounted) return;

        if (modal) {
          // Check if modal has expired (15-minute TTL)
          const expiresAt = new Date(modal.expires_at).getTime();
          const now = Date.now();

          if (now > expiresAt) {
            setError('Confirmation modal has expired. Please try again.');
            setIsPolling(false);
            return;
          }

          setModalData(modal);
          setIsPolling(false);
          onModalReadyRef.current?.(modal);

          // Clear interval since we found a modal
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          return;
        }

        setError(null);
      } catch (err) {
        if (!isMounted) return;

        // 404 is expected when no modal exists yet, don't treat as error
        if (err instanceof Error) {
          const msg = err.message.toLowerCase();
          const isExpected404 = msg.includes('404') ||
                                msg.includes('not found') ||
                                msg.includes('no pending');
          if (!isExpected404) {
            console.error('Modal polling error:', err);
            setError(err.message);
          }
        }
      }
    };

    // Start polling
    setIsPolling(true);
    checkForModal(); // Check immediately
    intervalId = setInterval(checkForModal, pollInterval);

    // Cleanup on unmount or dependency change
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      setIsPolling(false);
    };
  }, [enabled, sessionId, modalData, pollInterval]);

  return {
    modalData,
    isPolling,
    error,
    stopPolling,
    startPolling,
    clearModal
  };
}
