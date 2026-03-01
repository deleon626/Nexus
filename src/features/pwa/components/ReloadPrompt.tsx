import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ReloadPrompt - Service worker update notification
 *
 * Shows a toast notification when a new service worker is available.
 * User controls when to reload - never auto-reloads.
 * Only shows when tab is active (per Page Visibility API).
 */
export function ReloadPrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useRegisterSW({
    onNeedRefresh() {
      // Only show prompt if tab is active and user is present
      if (document.visibilityState === 'visible') {
        setNeedRefresh(true);
        setIsVisible(true);
      }
    },
    onRegistered(registration) {
      // Check for updates immediately on page load (per CONTEXT.md)
      if (registration) {
        registration.update();

        // Optional: Check for updates every hour for long-running sessions
        const intervalId = setInterval(() => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        }, 60 * 60 * 1000); // 1 hour

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
      }
    },
    onRegisterError(error) {
      console.error('Service worker registration error:', error);
    },
  });

  const handleReload = () => {
    // Skip waiting and activate new service worker immediately
    // The page will reload automatically after service worker activation
    window.location.reload();
  };

  const handleClose = () => {
    setIsVisible(false);
    setNeedRefresh(false);
    // Prompt will re-appear on next page load if update is still pending
  };

  // Don't render if no refresh needed or not visible
  if (!needRefresh || !isVisible) {
    return null;
  }

  // Double-check visibility before rendering (per CONTEXT.md)
  if (document.visibilityState !== 'visible') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="bg-background border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Update Available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              A new version is ready. Reload to update.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleReload}
                className="flex-1"
              >
                Reload
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
