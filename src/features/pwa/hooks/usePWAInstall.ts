import { useState, useEffect, useCallback } from 'react';

/**
 * PWA install hook with beforeinstallprompt event handling
 *
 * Per CONTEXT.md decisions:
 * - Never auto-prompt — user must manually trigger
 * - Never re-prompt if user dismisses (localStorage)
 * - Store deferredPrompt for manual trigger
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if app is already installed (standalone display mode)
  useEffect(() => {
    const checkInstalled = () => {
      const isInStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true; // iOS Safari
      setIsInstalled(isInStandaloneMode);
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    return () => {
      mediaQuery.removeEventListener('change', checkInstalled);
    };
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent default browser install prompt
      e.preventDefault();

      // Store event for manual trigger
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);

      // Check localStorage for dismissal state
      const wasDismissed = localStorage.getItem('pwa-install-dismissed');

      // DO NOT auto-show banner per CONTEXT: "never auto-prompt"
      // User must manually trigger via settings or other UI
      if (!wasDismissed && !isInstalled) {
        // Just store the event, don't show automatically
        // setShowPrompt(true); // This would be auto-prompt - DON'T do this
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isInstalled]);

  /**
   * Trigger the browser's native install prompt
   * Call this when user clicks "Install" button in settings or banner
   */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      // Show the native browser install prompt
      await deferredPrompt.prompt();

      // Wait for user's choice
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        // Clear the deferred prompt after successful install
        setDeferredPrompt(null);
        setShowPrompt(false);
        return true;
      }

      // User dismissed - don't clear deferredPrompt yet
      // in case they want to try again from settings
      setShowPrompt(false);
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  }, [deferredPrompt]);

  /**
   * Show the install prompt banner
   * Call this from settings page or other manual trigger
   */
  const showInstallPrompt = useCallback(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (!wasDismissed && deferredPrompt && !isInstalled) {
      setShowPrompt(true);
    }
  }, [deferredPrompt, isInstalled]);

  /**
   * Dismiss the install prompt and store in localStorage
   * Per CONTEXT: "never re-prompt if user dismisses"
   */
  const dismissInstall = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  /**
   * Check if install prompt can be shown
   * Returns true if:
   * - Deferred prompt event is available (browser supports PWA install)
   * - App is not already installed
   * - User hasn't permanently dismissed
   */
  const canPrompt = Boolean(
    deferredPrompt &&
    !isInstalled &&
    !localStorage.getItem('pwa-install-dismissed')
  );

  return {
    showPrompt,
    isInstalled,
    canPrompt,
    promptInstall,
    showInstallPrompt,
    dismissInstall,
  };
}
