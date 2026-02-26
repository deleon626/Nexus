---
phase: 01-foundation-auth
plan: 07
type: execute
wave: 4
depends_on: ["01-foundation-auth-05", "01-foundation-auth-06"]
files_modified:
  - src/components/sync/SyncIndicator.tsx
  - src/components/sync/SyncQueueView.tsx
  - src/components/sync/OfflineBanner.tsx
  - src/hooks/useOnline.ts
  - src/routes/index.tsx
  - src/routes/admin/builder.tsx
  - src/routes/worker/forms.tsx
  - src/routes/reviewer/dashboard.tsx
autonomous: true
requirements:
  - OFFL-01
  - OFFL-02
  - OFFL-03
user_setup: []

must_haves:
  truths:
    - "Sync indicator shows 4 states: Offline, Syncing, Synced, Failed"
    - "Sync indicator position: top header bar, always visible"
    - "Tapping indicator expands to show queue count and last sync time"
    - "Red indicator appears for failures with error message"
    - "Manual retry button available in expanded view"
    - "Offline banner shows at top when connection lost"
  artifacts:
    - path: "src/components/sync/SyncIndicator.tsx"
      provides: "Sync status indicator with icon + label"
      contains: "SyncStatus, useSync, offline/syncing/synced/failed states"
    - path: "src/components/sync/SyncQueueView.tsx"
      provides: "Expandable queue list with pending items"
      contains: "useLiveQuery, syncQueue items"
    - path: "src/components/sync/OfflineBanner.tsx"
      provides: "Top banner showing offline status"
      contains: "useOnline, dismissible banner"
    - path: "src/hooks/useOnline.ts"
      provides: "Online/offline detection with heartbeat ping"
      contains: "useOnline, heartbeat interval"
  key_links:
    - from: "src/components/sync/SyncIndicator.tsx"
      to: "src/hooks/useSync.ts"
      via: "useSync hook"
      pattern: "import.*useSync"
    - from: "src/components/sync/OfflineBanner.tsx"
      to: "src/hooks/useOnline.ts"
      via: "useOnline hook"
      pattern: "import.*useOnline"
    - from: "src/routes/index.tsx"
      to: "src/components/sync/"
      via: "Component imports"
      pattern: "import.*SyncIndicator|import.*OfflineBanner"

---

<objective>
Create sync status UI components: indicator in header bar (always visible), expandable queue view, offline banner, and online detection with heartbeat ping. This implements OFFL-02 real-time sync status with 4 states (Offline, Syncing, Synced, Failed).

Purpose: OFFL-02 requires real-time sync status visibility. Users need to know when the app is offline, when data is syncing, when sync completes, and when sync fails. This plan implements the UI components that surface sync state.

Output: Sync indicator component (4 states with icons), expandable queue view, offline banner, useOnline hook with heartbeat ping, integrated into route layouts.
</object>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-auth/01-CONTEXT.md
@.planning/phases/01-foundation-auth/01-RESEARCH.md

# Research patterns to follow:
# - Top header bar position for sync indicator (always visible)
# - 4 states: Offline, Syncing, Synced, Failed (per user decision)
# - Icon + label, tap to expand: queue count + last sync time
# - Auto-retry with exponential backoff + manual retry button
# - Heartbeat ping for reliable offline/online detection (Safari false positives)
# - Silent — no sounds for sync events
</context>

<tasks>

<task type="auto">
  <name>Create useOnline hook with heartbeat ping</name>
  <files>src/hooks/useOnline.ts</files>
  <action>
Create **src/hooks/useOnline.ts** with reliable online/offline detection:

```typescript
import { useEffect, useState, useCallback, useRef } from 'react';

// Heartbeat endpoint configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds (Claude's discretion)
const HEARTBEAT_TIMEOUT = 5000; // 5 second timeout for ping

export function useOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReachable, setIsReachable] = useState(true);
  const heartbeatIntervalRef = useRef<number | null>(null);

  // Heartbeat ping to check actual connectivity (not just network interface)
  const heartbeat = useCallback(async () => {
    try {
      // Ping a lightweight endpoint with cache busting
      // Using Convex health endpoint or a simple fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT);

      // Fetch with cache busting to avoid cached responses
      await fetch(`/health?_=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsReachable(true);
      setIsOnline(true);
    } catch (error) {
      // Heartbeat failed — might be offline or server unreachable
      setIsReachable(false);
      // Don't immediately set offline — could be temporary blip
      // navigator.onLine event will handle actual offline state
    }
  }, []);

  // Start/stop heartbeat based on navigator.onLine
  useEffect(() => {
    if (!navigator.onLine) {
      // Definitely offline — stop heartbeat
      setIsOnline(false);
      setIsReachable(false);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Online — start heartbeat
    heartbeat(); // Immediate check
    heartbeatIntervalRef.current = window.setInterval(heartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [heartbeat]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      heartbeat(); // Immediate ping when browser reports online
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [heartbeat]);

  // Combine navigator.onLine with heartbeat reachability
  const effectivelyOnline = isOnline && isReachable;

  return {
    isOnline: effectivelyOnline,
    isReachable,
    navigatorOnLine: navigator.onLine,
  };
}
```

This implements heartbeat ping to avoid Safari navigator.onLine false positives, as specified in the user decisions. The 30-second interval is Claude's discretion (balance between battery usage and responsiveness).
  </action>
  <verify>grep -q "export function useOnline" src/hooks/useOnline.ts && grep -q "heartbeat" src/hooks/useOnline.ts && grep -q "HEARTBEAT_INTERVAL" src/hooks/useOnline.ts</verify>
  <done>useOnline hook created with heartbeat ping</done>
</task>

<task type="auto">
  <name>Create SyncIndicator component with 4 states</name>
  <files>src/components/sync/SyncIndicator.tsx</files>
  <action>
Create **src/components/sync/SyncIndicator.tsx** with sync status indicator:

```tsx
import { useState } from 'react';
import { useSync, SyncStatus } from '../../hooks/useSync';
import { cn } from '../../lib/utils';

interface SyncIndicatorProps {
  className?: string;
}

// Icons for each state (simple SVG icons)
const OfflineIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
  </svg>
);

const SyncingIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SyncedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const FailedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function SyncIndicator({ className }: SyncIndicatorProps) {
  const { status, queueCount, lastSyncTime, isOnline, manualSync, retryFailed } = useSync();
  const [isExpanded, setIsExpanded] = useState(false);

  // State configuration
  const stateConfig: Record<SyncStatus, { icon: React.ReactNode; label: string; color: string }> = {
    offline: { icon: <OfflineIcon />, label: 'Offline', color: 'text-gray-500' },
    syncing: { icon: <SyncingIcon />, label: 'Syncing', color: 'text-blue-500' },
    synced: { icon: <SyncedIcon />, label: 'Synced', color: 'text-green-500' },
    failed: { icon: <FailedIcon />, label: 'Failed', color: 'text-red-500' },
  };

  const config = stateConfig[status];

  // Format last sync time
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Handle retry click
  const handleRetry = async () => {
    if (status === 'failed') {
      await retryFailed();
    } else {
      await manualSync();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main indicator (always visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors",
          config.color
        )}
        aria-label={`Sync status: ${config.label}`}
      >
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
        <ChevronDownIcon isOpen={isExpanded} />

        {/* Queue count badge (only show if > 0) */}
        {queueCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
            {queueCount}
          </span>
        )}
      </button>

      {/* Expanded view (tap to expand) */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-background border rounded-md shadow-lg p-4 z-50">
          <div className="space-y-3">
            {/* Status details */}
            <div>
              <p className="text-sm font-medium">Sync Status</p>
              <p className="text-xs text-muted-foreground capitalize">{status}</p>
            </div>

            {/* Queue count */}
            <div>
              <p className="text-sm font-medium">Pending Items</p>
              <p className="text-xs text-muted-foreground">{queueCount} item(s)</p>
            </div>

            {/* Last sync time */}
            <div>
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-xs text-muted-foreground">{formatLastSync(lastSyncTime)}</p>
            </div>

            {/* Connection status */}
            <div>
              <p className="text-sm font-medium">Connection</p>
              <p className="text-xs text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>

            {/* Retry button (show if failed or manual sync available) */}
            {(status === 'failed' || queueCount > 0) && (
              <button
                onClick={handleRetry}
                className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                {status === 'failed' ? 'Retry Failed' : 'Sync Now'}
              </button>
            )}

            {/* Error message (only for failed state) */}
            {status === 'failed' && (
              <div className="p-2 bg-destructive/10 text-destructive text-xs rounded">
                Sync failed. Tap retry to try again.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

This implements the 4-state sync indicator per user decision: Offline, Syncing, Synced, Failed with icon + label, tap to expand showing queue count and last sync time.
  </action>
  <verify>grep -q "SyncIndicator" src/components/sync/SyncIndicator.tsx && grep -q "SyncStatus" src/components/sync/SyncIndicator.tsx && grep -q "stateConfig" src/components/sync/SyncIndicator.tsx</verify>
  <done>SyncIndicator component created with 4 states</done>
</task>

<task type="auto">
  <name>Create OfflineBanner component</name>
  <files>src/components/sync/OfflineBanner.tsx</files>
  <action>
Create **src/components/sync/OfflineBanner.tsx** with dismissible offline banner:

```tsx
import { useState, useEffect } from 'react';
import { useOnline } from '../../hooks/useOnline';
import { cn } from '../../lib/utils';

export default function OfflineBanner() {
  const { isOnline } = useOnline();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when coming back online
  useEffect(() => {
    if (isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  // Don't show if online or dismissed
  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <p className="text-sm font-medium">
          You're offline. Some features may be limited.
        </p>
        <button
          onClick={() => setIsDismissed(true)}
          className="ml-4 text-sm underline hover:no-underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
```

This implements the offline banner per user decision: "You're offline" banner at top, dismissible but reappears if still offline.
  </action>
  <verify>grep -q "OfflineBanner" src/components/sync/OfflineBanner.tsx && grep -q "useOnline" src/components/sync/OfflineBanner.tsx && grep -q "isDismissed" src/components/sync/OfflineBanner.tsx</verify>
  <done>OfflineBanner component created</done>
</task>

<task type="auto">
  <name>Create SyncQueueView component (expandable queue list)</name>
  <files>src/components/sync/SyncQueueView.tsx</files>
  <action>
Create **src/components/sync/SyncQueueView.tsx** with expandable queue list:

```tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/dexie';
import { cn } from '../../lib/utils';

export default function SyncQueueView({ className }: { className?: string }) {
  // Live query for all pending and in-flight items
  const queueItems = useLiveQuery(
    () => db.syncQueue
      .where('status')
      .anyOf(['pending', 'in-flight'])
      .reverse()
      .limit(50)
      .toArray(),
    []
  );

  if (!queueItems || queueItems.data === undefined) {
    return <div className={cn("text-sm text-muted-foreground", className)}>Loading queue...</div>;
  }

  if (queueItems.data.length === 0) {
    return <div className={cn("text-sm text-muted-foreground", className)}>No pending items</div>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {queueItems.data.map((item) => (
        <div
          key={item.localId}
          className="flex items-center justify-between p-3 bg-muted rounded-md"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {item.operation} {item.recordType}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {item.endpoint}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span
              className={cn(
                "text-xs px-2 py-1 rounded",
                item.status === 'pending' && "bg-yellow-500/20 text-yellow-700",
                item.status === 'in-flight' && "bg-blue-500/20 text-blue-700",
                item.status === 'failed' && "bg-red-500/20 text-red-700"
              )}
            >
              {item.status}
            </span>

            {/* Attempt count */}
            {item.attemptCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {item.attemptCount}/3
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Warning if queue exceeds 50 items */}
      {queueItems.data.length >= 50 && (
        <div className="p-3 bg-yellow-500/10 text-yellow-700 rounded-md text-sm">
          Warning: {queueItems.data.length} pending items. Consider connecting to stable internet.
        </div>
      )}
    </div>
  );
}
```

This implements the expandable queue list per user decision: shows pending items with individual status, warning at 50+ items.
  </action>
  <verify>grep -q "SyncQueueView" src/components/sync/SyncQueueView.tsx && grep -q "useLiveQuery" src/components/sync/SyncQueueView.tsx && grep -q "syncQueue" src/components/sync/SyncQueueView.tsx</verify>
  <done>SyncQueueView component created with live queue list</done>
</task>

<task type="auto">
  <name>Integrate sync components into route layouts</name>
  <files>src/routes/index.tsx, src/routes/admin/builder.tsx, src/routes/worker/forms.tsx, src/routes/reviewer/dashboard.tsx</files>
  <action>
Update route files to include sync components:

Update **src/routes/index.tsx** to wrap routes with OfflineBanner:
```tsx
import { Routes, Route, Navigate } from "react-router";
import ProtectedRoute, { AdminRoute, WorkerRoute, ReviewerRoute } from "./protected";
import SignInPage from "./sign-in";
import AdminBuilder from "./admin/builder";
import WorkerForms from "./worker/forms";
import ReviewerDashboard from "./reviewer/dashboard";
import OfflineBanner from "../components/sync/OfflineBanner";
import SyncIndicator from "../components/sync/SyncIndicator";

export default function AppRoutes() {
  return (
    <ProtectedRoute>
      <OfflineBanner />
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Nexus QC Forms</h1>
          <SyncIndicator />
        </div>
      </header>
      <Routes>
        {/* Sign-in route */}
        <Route path="/sign-in" element={<SignInPage />} />

        {/* Root redirects to role-based dashboard */}
        <Route path="/" element={<Navigate to="/" replace />} />

        {/* Role-specific routes */}
        <Route
          path="/admin/builder"
          element={
            <AdminRoute>
              <AdminBuilder />
            </AdminRoute>
          }
        />
        <Route
          path="/worker/forms"
          element={
            <WorkerRoute>
              <WorkerForms />
            </WorkerRoute>
          }
        />
        <Route
          path="/reviewer/dashboard"
          element={
            <ReviewerRoute>
              <ReviewerDashboard />
            </ReviewerRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProtectedRoute>
  );
}
```

This integrates the sync components into the layout with header bar position for SyncIndicator (per user decision) and top banner for OfflineBanner.
  </action>
  <verify>grep -q "OfflineBanner" src/routes/index.tsx && grep -q "SyncIndicator" src/routes/index.tsx</verify>
  <done>Sync components integrated into route layouts</done>
</task>

</tasks>

<verification>
After completing all tasks:

1. Run `npm run dev`
2. Sign in via Clerk
3. Verify sync indicator shows in header bar (top right)
4. Test each state:
   - Offline: Disconnect internet, indicator should show "Offline" state
   - Syncing: Add item to queue, should show "Syncing" state
   - Synced: When queue empty, should show "Synced" state
   - Failed: Force a sync failure, should show "Failed" state with red indicator
5. Tap sync indicator to expand — verify queue count and last sync time display
6. Verify offline banner appears when connection lost
7. Check browser DevTools Network tab for heartbeat pings (every 30 seconds)
8. Verify no TypeScript errors: `npx tsc --noEmit`

Note: Actual sync failures require Convex API integration. For testing, you can manually trigger failed state by adding an item with invalid endpoint to the sync queue.
</verification>

<success_criteria>
- Sync indicator shows 4 states with correct icons and colors
- Sync indicator positioned in top header bar (always visible)
- Tapping indicator expands to show queue count and last sync time
- Red indicator appears for failures with error message
- Manual retry button works in expanded view
- Offline banner shows at top when connection lost
- Offline banner is dismissible but reappears if still offline
- Heartbeat ping runs every 30 seconds
- No TypeScript or runtime errors
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-auth/01-foundation-auth-07-SUMMARY.md` with:
- Sync UI component details
- 4-state indicator implementation
- Heartbeat ping configuration
- Phase 1 completion status
</output>
