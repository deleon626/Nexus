import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { cn } from '@/lib/utils';

/**
 * PWA Install Prompt Bottom Banner
 *
 * Per CONTEXT.md decisions:
 * - Bottom banner placement (fixed bottom-0)
 * - Minimal content: "Install app" with simple description
 * - Shows only when manually triggered via showInstallPrompt()
 * - Never auto-appears on page load
 */
export function InstallPrompt() {
  const { showPrompt, isInstalled, promptInstall, dismissInstall } = usePWAInstall();

  // Don't show if app is already installed or prompt not visible
  if (!showPrompt || isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const accepted = await promptInstall();
    // Banner closes automatically via promptInstall() logic
    if (accepted) {
      console.log('PWA installation accepted');
    }
  };

  const handleDismiss = () => {
    dismissInstall();
  };

  return (
    <div
      className={cn(
        // Fixed bottom banner
        'fixed bottom-0 left-0 right-0 z-50',
        // Background and border
        'bg-background border-t border-border',
        // Padding for comfortable touch targets
        'p-4',
        // Shadow for depth
        'shadow-lg',
        // Animation
        'animate-in slide-in-from-bottom duration-300'
      )}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Left side: Icon and text */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* App icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>

          {/* Text content - minimal per CONTEXT */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight">
              Install App
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to home screen for offline access
            </p>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Install button - primary action */}
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="font-medium"
          >
            Install
          </Button>

          {/* Dismiss button - ghost style */}
          <button
            onClick={handleDismiss}
            className={cn(
              'flex items-center justify-center',
              'w-8 h-8 rounded-md',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
