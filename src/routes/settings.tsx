import { Download, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWAInstall } from '@/features/pwa/hooks/usePWAInstall';

/**
 * Settings Page
 *
 * Per CONTEXT.md: Storage status visible in settings page only
 * Per Plan 01: Add manual install trigger button
 */
export default function SettingsPage() {
  const { canPrompt, isInstalled, showInstallPrompt } = usePWAInstall();

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          App settings and preferences
        </p>
      </div>

      {/* App section */}
      <section className="space-y-4">
        {/* PWA Installation Card */}
        {!isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Install App
              </CardTitle>
              <CardDescription>
                Install this app on your device for offline access and a native app experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canPrompt ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Your device supports installing this app as a Progressive Web App.
                  </p>
                  <Button onClick={showInstallPrompt} size="sm">
                    Install App
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                  <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Install not available</p>
                    <p className="text-xs">
                      This app cannot be installed on this device. Make sure you're using a supported browser (Chrome, Edge, Safari) and the app is served over HTTPS.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Already installed indicator */}
        {isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-green-600" />
                App Installed
              </CardTitle>
              <CardDescription>
                This app is installed on your device and running in standalone mode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 rounded-md bg-green-50 dark:bg-green-950/20">
                <Info className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                    Installation complete
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    You can launch this app from your home screen or app drawer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Storage Management Card - placeholder for Plan 04 */}
        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
            <CardDescription>
              Manage offline data and cached content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Storage management features coming soon.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
