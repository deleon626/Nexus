/**
 * Hook for polling confirmation modal status with exponential backoff.
 *
 * Continuously polls the backend to check if the agent has requested
 * user confirmation. When a modal is ready, it retrieves the confirmation
 * data and stops polling.
 *
 * Features:
 * - Exponential backoff: starts at 1s, doubles after empty responses, caps at 10s
 * - Resets to 1s when modal is found
 * - Pauses polling when browser tab is hidden (visibility API)
 * - Resumes polling when tab becomes visible
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getConfirmationModal, type ConfirmationModal } from '../services/api';

interface UseModalPollingOptions {
  sessionId: string | null;
  enabled: boolean;
  initialInterval?: number; // milliseconds (default: 1000)
  maxInterval?: number; // milliseconds (default: 10000)
  onModalReady?: (modal: ConfirmationModal) => void;
}

interface UseModalPollingReturn {
  modalData: ConfirmationModal | null;
  isPolling: boolean;
  error: string | null;
  currentInterval: number;
  stopPolling: () => void;
  startPolling: () => void;
  clearModal: () => void;
}

export function useModalPolling({
  sessionId,
  enabled,
  initialInterval = 1000,
  maxInterval = 10000,
  onModalReady
}: UseModalPollingOptions): UseModalPollingReturn {
  const [modalData, setModalData] = useState<ConfirmationModal | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentInterval, setCurrentInterval] = useState(initialInterval);
  const [isVisible, setIsVisible] = useState(!document.hidden);

  // Store callback in ref to avoid dependency issues
  const onModalReadyRef = useRef(onModalReady);
  useEffect(() => {
    onModalReadyRef.current = onModalReady;
  }, [onModalReady]);

  // Track current interval in ref for use in timeout callbacks
  const intervalRef = useRef(initialInterval);
  useEffect(() => {
    intervalRef.current = currentInterval;
  }, [currentInterval]);

  const clearModal = useCallback(() => {
    setModalData(null);
    setError(null);
    setCurrentInterval(initialInterval); // Reset backoff
  }, [initialInterval]);

  // Manual control functions (exposed for external use if needed)
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    setCurrentInterval(initialInterval); // Reset backoff when manually starting
    setIsPolling(true);
  }, [initialInterval]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Main polling effect with exponential backoff
  useEffect(() => {
    // Don't poll if not enabled, no session, modal already exists, or tab not visible
    if (!enabled || !sessionId || modalData || !isVisible) {
      if (!isVisible && enabled && sessionId && !modalData) {
        // Keep isPolling true but don't actually poll when hidden
        // This way UI shows "polling" but we're paused
      } else {
        setIsPolling(false);
      }
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;
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

          // Modal found - reset backoff and stop polling
          setModalData(modal);
          setIsPolling(false);
          setCurrentInterval(initialInterval);
          onModalReadyRef.current?.(modal);
          return;
        }

        // No modal found - increase backoff interval
        setError(null);
        setCurrentInterval(prev => {
          const nextInterval = Math.min(prev * 2, maxInterval);
          return nextInterval;
        });

        // Schedule next poll with current interval
        if (isMounted) {
          timeoutId = setTimeout(checkForModal, intervalRef.current * 2);
        }
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

        // Continue polling even on error, with backoff
        if (isMounted) {
          setCurrentInterval(prev => Math.min(prev * 2, maxInterval));
          timeoutId = setTimeout(checkForModal, intervalRef.current * 2);
        }
      }
    };

    // Start polling
    setIsPolling(true);
    checkForModal(); // Check immediately

    // Cleanup on unmount or dependency change
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled, sessionId, modalData, isVisible, initialInterval, maxInterval]);

  return {
    modalData,
    isPolling,
    error,
    currentInterval,
    stopPolling,
    startPolling,
    clearModal
  };
}
