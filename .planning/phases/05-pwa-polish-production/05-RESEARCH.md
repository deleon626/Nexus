# Phase 5: PWA Polish & Production - Research

**Researched:** 2026-02-27
**Domain:** Progressive Web App (PWA) lifecycle, service worker updates, storage management, deployment
**Confidence:** HIGH

## Summary

Phase 5 focuses on making the PWA installable, handling service worker updates gracefully, monitoring storage quota, and deploying to production on Coolify. The app already has `vite-plugin-pwa` configured with basic offline support via Workbox. This phase adds user-facing PWA features: install prompts, update notifications, storage monitoring, and production deployment.

**Primary recommendation:** Use `vite-plugin-pwa`'s `useRegisterSW` hook for service worker updates, implement `beforeinstallprompt` event handling for custom install UI, use `navigator.storage.estimate()` for storage monitoring, and deploy to Coolify with environment-based configuration.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Install Prompt UX**
- Never auto-prompt — user discovers via settings or browser's built-in install UI
- Never re-prompt if user dismisses
- Bottom banner placement (standard PWA pattern) if manually triggered
- Minimal content: "Install app" with simple description

**Service Worker Updates**
- Prompt to reload with toast notification when update available
- Only prompt when tab is active and user is present
- Never force updates — user always controls when to reload
- Check for updates on page load (immediate detection)

**Storage Management**
- Warn at 80% quota usage, block operations at 95%
- Auto-cleanup: synced submissions deleted after 7 days, drafts after 14 days
- Storage status visible in settings page only (not always-visible indicator)
- Cleanup runs automatically at retention thresholds (not manual trigger)

**Production Deployment**
- Two environments: Staging and Production on Coolify
- All configuration via Coolify environment variables (no config files)
- Basic monitoring: health checks + error logging
- Coolify subdomain (*.sslip.io) — no custom domain setup required

### Claude's Discretion

- Exact toast/notification styling
- Install banner visual design
- Settings page storage indicator design
- Error logging implementation details
- Health check endpoints

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | ^0.21.2 | PWA configuration and service worker generation | Zero-config PWA for Vite with Workbox integration, industry standard |
| workbox-precaching | ^7.3.0 | Service worker asset caching | Google's Workbox library for robust caching strategies |
| workbox-routing | ^7.3.0 | Runtime route caching | Standard routing patterns for PWA caching |
| workbox-strategies | ^7.3.0 | Cache strategies (NetworkFirst, StaleWhileRevalidate) | Proven caching patterns for different content types |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| navigator.storage.estimate() | Built-in | Storage quota monitoring | Check available IndexedDB quota and usage |
| beforeinstallprompt event | Built-in | Custom install prompts | Trigger PWA install prompt from custom UI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vite-plugin-pwa | @angular/service-worker or workbox directly | vite-plugin-pwa is Vite-native with zero config; alternatives require manual setup |
| Toast notification | Modal or inline banner | Toast is less intrusive, follows PWA best practices for updates |
| Auto-cleanup | Manual cleanup trigger | Workers won't manually manage storage; auto-cleanup is hands-off |

**Installation:**
No additional packages needed — all dependencies already in `package.json`.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   └── pwa/                 # PWA-specific features
│       ├── hooks/           # useRegisterSW, usePWAInstall, useStorageMonitor
│       ├── components/      # ReloadPrompt, InstallPrompt banner, StorageIndicator
│       ├── utils/           # storage cleanup utilities
│       └── constants.ts     # PWA thresholds (80%, 95%, retention days)
├── routes/
│   └── settings.tsx         # Settings page with storage indicator
└── App.tsx                  # Add ReloadPrompt wrapper
```

### Pattern 1: Service Worker Registration with Update Prompt

**What:** Use `vite-plugin-pwa`'s React hook for service worker lifecycle management.

**When to use:** Need to notify users of available updates and control when reload happens.

**Example:**
```typescript
// Source: https://context7.com/vite-pwa/vite-plugin-pwa/llms.txt
import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onRegistered(registration) {
      // Check for updates periodically (optional)
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Every hour
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded shadow-lg">
      <p>New version available</p>
      <button onClick={() => updateServiceWorker(true)}>Reload</button>
      <button onClick={() => setNeedRefresh(false)}>Close</button>
    </div>
  );
}
```

### Pattern 2: PWA Install Prompt with beforeinstallprompt

**What:** Capture the `beforeinstallprompt` event to show a custom install button.

**When to use:** Want to provide in-app install option (not just browser's built-in prompt).

**Example:**
```typescript
// Source: https://web.dev/learn/pwa/installation-prompt
import { useState, useEffect } from 'react';

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent default browser install prompt
      e.preventDefault();
      setDeferredPrompt(e);
      // Show custom prompt (if user hasn't dismissed)
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
      <p>Install app for offline access</p>
      <button onClick={handleInstall}>Install</button>
      <button onClick={handleDismiss}>Dismiss</button>
    </div>
  );
}
```

### Pattern 3: Storage Quota Monitoring

**What:** Use `navigator.storage.estimate()` to track IndexedDB usage.

**When to use:** Need to warn users before storage quota is exhausted.

**Example:**
```typescript
// Source: https://dexie.org/docs/StorageManager
async function getStorageUsage() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimation = await navigator.storage.estimate();
    const quota = estimation.quota || 0;
    const usage = estimation.usage || 0;
    const usagePercent = (usage / quota) * 100;
    return { quota, usage, usagePercent };
  }
  return null;
}

function useStorageMonitor() {
  const [usage, setUsage] = useState<{ percent: number; used: string; total: string } | null>(null);

  useEffect(() => {
    const checkStorage = async () => {
      const result = await getStorageUsage();
      if (result) {
        setUsage({
          percent: result.usagePercent,
          used: formatBytes(result.usage),
          total: formatBytes(result.quota),
        });
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return usage;
}
```

### Anti-Patterns to Avoid

- **Auto-showing install prompt on page load:** Browser already shows native prompt; don't annoy users with duplicate prompts
- **Forcing reload on service worker update:** Always let user choose when to reload to avoid data loss
- **Storing install dismissal in sessionStorage:** User will see prompt again on next session; use localStorage
- **Checking storage too frequently:** More than once per minute is unnecessary and wastes resources
- **Blocking form submission at 80% storage:** 80% is warning threshold; only block at 95%

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker registration | Manual SW registration with update listeners | `useRegisterSW` from vite-plugin-pwa | Handles edge cases, cross-browser differences, update detection |
| Storage quota estimation | Manual heuristics based on record count | `navigator.storage.estimate()` | Browser's actual quota tracking, accurate across devices |
| Install prompt detection | Guessing if app is installable | `beforeinstallprompt` event | Browser-validated, only fires when criteria met |
| Cache strategies | Custom fetch handlers with caching logic | Workbox strategies (NetworkFirst, StaleWhileRevalidate) | Battle-tested, handles edge cases like race conditions |

**Key insight:** PWA lifecycle management is complex with many browser-specific behaviors. Using vite-plugin-pwa and Workbox abstracts away 90% of the complexity.

## Common Pitfalls

### Pitfall 1: beforeinstallprompt Not Firing

**What goes wrong:** Install prompt never shows, event listener never called.

**Why it happens:** Browser has strict PWA installability criteria (HTTPS, service worker, manifest with icons, 192x192 minimum). Dev on localhost often works but production fails.

**How to avoid:**
- Ensure manifest has all required fields (name, short_name, icons, display)
- Serve via HTTPS in production
- Verify service worker is registered and active
- Test on actual device, not desktop browser

**Warning signs:** Event never fires in production despite working locally.

### Pitfall 2: Service Worker Update Loop

**What goes wrong:** User sees update prompt repeatedly, reload triggers another update.

**Why it happens:** Not calling `skipWaiting()` in service worker or not handling `waiting` state correctly.

**How to avoid:**
- Use `useRegisterSW` hook which handles this correctly
- Call `updateServiceWorker(true)` to skip waiting
- Ensure only one service worker registration per page

**Warning signs:** Update prompt shows immediately after reload.

### Pitfall 3: Storage Quota Underestimation

**What goes wrong:** App hits quota before 80% warning threshold.

**Why it happens:** `navigator.storage.estimate()` returns total origin quota (including all storage types), not just IndexedDB. Photos and cache take significant space.

**How to avoid:**
- Use 80% as conservative warning threshold
- Implement auto-cleanup well before quota exhaustion
- Test on low-storage devices (older phones)

**Warning signs:** QuotaError in console when saving photos.

### Pitfall 4: Update Prompt During Critical Operations

**What goes wrong:** User is filling form when update prompt appears, reload loses data.

**Why it happens:** Showing update prompt regardless of user activity.

**How to avoid:**
- Only prompt when tab is active (Page Visibility API)
- Don't prompt during form filling (check form dirty state)
- Use `onNeedRefresh` callback which respects user presence

**Warning signs:** User complaints about lost data after updates.

### Pitfall 5: iOS Safari Install Limitations

**What goes wrong:** Install button doesn't work on iOS.

**Why it happens:** iOS Safari doesn't support `beforeinstallprompt` event. Users must manually "Add to Home Screen" via share menu.

**How to avoid:**
- Show iOS-specific instructions (Share → Add to Home Screen)
- Detect iOS and show different UI
- Accept that iOS install is manual

**Warning signs:** Install button visible but does nothing on iPhone.

## Code Examples

Verified patterns from official sources:

### Check for Service Worker Updates on Page Load
```typescript
// Source: https://github.com/vite-pwa/vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react'

function App() {
  const { updateServiceWorker } = useRegisterSW({
    onRegistered(registration) {
      // Check for updates immediately on load
      if (registration) {
        registration.update();
      }
    },
  });

  return <YourApp />;
}
```

### Storage Cleanup with Dexie
```typescript
// Delete records older than retention period
async function cleanupExpiredData(db: NexusDB, retentionDays: number) {
  const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

  await db.submissions
    .where('syncedAt')
    .below(cutoff)
    .delete();

  await db.drafts
    .where('expiresAt')
    .below(cutoff)
    .delete();
}
```

### Format Bytes for Human-Readable Display
```typescript
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual service worker management | vite-plugin-pwa with autoUpdate | 2022+ | Zero-config PWA setup, automatic update detection |
| Native browser install prompts only | Custom beforeinstallprompt UI | 2019+ | Better UX, higher install rates |
| localStorage for storage tracking | navigator.storage.estimate() | 2017+ | Accurate quota measurement, not just string length |
| Full page reload for updates | Client-side reload with skipWaiting | 2020+ | Faster updates, better UX |

**Deprecated/outdated:**
- **App Manifest (appcache):** Replaced by Service Worker + Web Manifest
- **navigator.onLine only:** Insufficient for real connectivity, combine with fetch heartbeat
- **Storing large data in localStorage:** Use IndexedDB instead (5MB vs GBs quota)

## Open Questions

1. **Coolify health check endpoint format**
   - What we know: Need `/health` endpoint for heartbeat monitoring
   - What's unclear: Exact response format expected by Coolify
   - Recommendation: Return `200 OK` with `{"status": "healthy"}` JSON

2. **Environment variable naming in Coolify**
   - What we know: Coolify supports build and runtime env vars
   - What's unclear: Whether Convex URL should be build var or runtime var
   - Recommendation: Use runtime vars for Convex URL (may change between deployments)

## Validation Architecture

> Nyquist validation is disabled in `.planning/config.json`. Skip this section.

## Sources

### Primary (HIGH confidence)
- [vite-plugin-pwa - /vite-pwa/vite-plugin-pwa](https://context7.com/vite-pwa/vite-plugin-pwa/llms.txt) - Service worker registration, update prompts, React hooks
- [Dexie StorageManager - /websites/dexie](https://dexie.org/docs/StorageManager) - Storage quota estimation using navigator.storage.estimate()
- [Google Workbox - /googlechrome/workbox](https://github.com/googlechrome/workbox) - Service worker strategies, caching patterns

### Secondary (MEDIUM confidence)
- [web.dev PWA Installation Prompt](https://web.dev/learn/pwa/installation-prompt) - beforeinstallprompt event handling
- [MDN Trigger Install Prompt](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt) - Custom install UI implementation
- [Coolify Environment Variables Docs](https://coolify.io/docs/knowledge-base/environment-variables) - Environment variable configuration

### Tertiary (LOW confidence)
- [IndexedDB Storage Best Practices - web.dev](https://web.dev/articles/indexeddb-best-practices-app-state) - Storage failure handling
- [PWA Update Best Practices 2026](https://www.digitalapplied.com/blog/progressive-web-apps-2026-pwa-performance-guide) - User prompt patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from official sources and already in project
- Architecture: HIGH - Patterns verified from vite-plugin-pwa and Dexie official docs
- Pitfalls: HIGH - Common issues documented in MDN, web.dev, and community sources

**Research date:** 2026-02-27
**Valid until:** 2026-03-29 (30 days - PWA APIs stable, vite-plugin-pwa actively maintained)

---

*Phase: 05-pwa-polish-production*
*Research: 2026-02-27*
