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
  pollInterval = 2000, // 2 seconds default
  onModalReady
}: UseModalPollingOptions): UseModalPollingReturn {
  const [modalData, setModalData] = useState<ConfirmationModal | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingEnabledRef = useRef(enabled);

  // Update ref when enabled changes
  useEffect(() => {
    pollingEnabledRef.current = enabled;
  }, [enabled]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const checkForModal = useCallback(async () => {
    if (!sessionId || !pollingEnabledRef.current) {
      return;
    }

    try {
      const modal = await getConfirmationModal(sessionId);

      if (modal) {
        // Check if modal has expired (15-minute TTL)
        const expiresAt = new Date(modal.expires_at).getTime();
        const now = Date.now();

        if (now > expiresAt) {
          setError('Confirmation modal has expired. Please try again.');
          stopPolling();
          return;
        }

        setModalData(modal);
        stopPolling();
        onModalReady?.(modal);
      }

      setError(null);
    } catch (err) {
      // 404 is expected when no modal exists yet, don't treat as error
      // Backend returns "No pending confirmation found" or "Not Found" for 404
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
  }, [sessionId, stopPolling, onModalReady]);

  const startPolling = useCallback(() => {
    if (!sessionId || isPolling) {
      return;
    }

    setIsPolling(true);
    setError(null);

    // Check immediately
    checkForModal();

    // Then poll at interval
    intervalRef.current = setInterval(checkForModal, pollInterval);
  }, [sessionId, isPolling, checkForModal, pollInterval]);

  const clearModal = useCallback(() => {
    setModalData(null);
    setError(null);
  }, []);

  // Auto-start polling when enabled
  useEffect(() => {
    if (enabled && sessionId && !modalData) {
      startPolling();
    } else if (!enabled) {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, sessionId, modalData, startPolling, stopPolling]);

  return {
    modalData,
    isPolling,
    error,
    stopPolling,
    startPolling,
    clearModal
  };
}
