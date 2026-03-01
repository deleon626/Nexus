---
phase: 05-pwa-polish-production
plan: 03
subsystem: PWA Storage Monitoring and Auto-Cleanup
tags: [pwa, storage, cleanup, indexeddb, monitoring]
title: "PWA Storage Monitoring with Quota-Based Auto-Cleanup"
completed_date: 2026-03-01
duration_seconds: 25276

# Dependency Graph
provides:
  - feature: "Storage quota monitoring"
    via: "useStorageMonitor hook"
    consumers: ["Settings page (future plan 04)"]
  - feature: "Automatic data cleanup"
    via: "runAutoCleanup utility"
    consumers: ["Storage monitor hook", "Manual cleanup trigger (future)"]
  - feature: "PWA storage constants"
    via: "constants.ts"
    consumers: ["Storage monitor", "Cleanup utilities"]

requires:
  - feature: "Dexie database with submissions table"
    via: "db.submissions table"
    source: "src/db/dexie.ts"
  - feature: "Draft cleanup utility"
    via: "cleanupExpiredDrafts"
    source: "src/features/formFilling/utils/cleanupExpiredDrafts.ts"

affects:
  - "PWA storage quota exhaustion prevention"
  - "Offline data retention policy"
  - "User storage visibility (future settings page)"

# Tech Stack
added: []
patterns:
  - "navigator.storage.estimate() API for quota monitoring"
  - "Reactive polling with useEffect and setInterval"
  - "Threshold-based state management (ok/warning/blocking)"
  - "Automatic cleanup with ref-based deduplication"
  - "DRY principle: re-export existing cleanupExpiredDrafts utility"

# Key Files
created:
  - path: "src/features/pwa/constants.ts"
    purpose: "Storage thresholds (80/95), retention periods (7/14 days), check interval (60s)"
  - path: "src/features/pwa/hooks/useStorageMonitor.ts"
    purpose: "React hook for storage quota monitoring with polling and auto-cleanup trigger"
  - path: "src/features/pwa/utils/storageCleanup.ts"
    purpose: "Utilities for automatic cleanup of synced submissions and expired drafts"

modified: []

# Decisions Made
- "Use navigator.storage.estimate() API for cross-browser quota monitoring (RESEARCH.md Pattern 3)"
- "Format bytes with 1024 base (not 1000) for consistency with storage industry standards"
- "Track cleanup state with ref to avoid redundant cleanup calls during same warning state"
- "Re-check storage 1 second after cleanup to reflect updated usage immediately"
- "Reset cleanup flag when status returns to 'ok' to allow cleanup on next warning threshold"

# Deviations from Plan
None - plan executed exactly as written.

# Auth Gates
None encountered.

---

# Phase 05 Plan 03: PWA Storage Monitoring with Quota-Based Auto-Cleanup

## Summary

Created a comprehensive storage monitoring and automatic cleanup system for PWA offline storage. The system monitors IndexedDB quota usage via `navigator.storage.estimate()`, warns at 80% usage, blocks at 95%, and automatically cleans up old data at retention thresholds.

## Implementation Details

### 1. PWA Constants (`src/features/pwa/constants.ts`)
- **Storage thresholds:** Warning at 80%, blocking at 95%
- **Retention periods:** Synced submissions deleted after 7 days, drafts after 14 days
- **Monitoring interval:** Check every 60 seconds (60000ms)
- **Utility constant:** MS_PER_DAY for timestamp calculations

### 2. useStorageMonitor Hook (`src/features/pwa/hooks/useStorageMonitor.ts`)
- Calls `navigator.storage.estimate()` for quota information
- Calculates usage percentage and formats bytes to human-readable strings (e.g., "125.5 MB")
- Returns status: `'ok'` (<80%), `'warning'` (80-95%), `'blocking'` (>=95%)
- Polls every 60 seconds via `setInterval` and `STORAGE_CHECK_INTERVAL_MS`
- Triggers `runAutoCleanup()` when status changes to `'warning'` (80% threshold)
- Uses `cleanupRanRef` to track if cleanup executed for current warning state (avoid redundant calls)
- Resets cleanup flag when status returns to `'ok'`
- Re-checks storage after 1 second delay following cleanup

### 3. Storage Cleanup Utilities (`src/features/pwa/utils/storageCleanup.ts`)
- **`cleanupSyncedSubmissions()`:** Deletes synced submissions older than 7 days using Dexie compound index
- **`cleanupExpiredDrafts()`:** Re-exports existing utility from formFilling (DRY principle)
- **`runAutoCleanup()`:** Orchestrates cleanup of both submissions and drafts, returns total count

## Verification

All success criteria met:
- [x] Storage usage is monitored and reported with percentage
- [x] Warning state triggers at 80% usage with auto-cleanup
- [x] Blocking state triggers at 95% usage
- [x] Old synced submissions are deleted after 7 days
- [x] Expired drafts are deleted after 14 days (via existing utility)
- [x] Cleanup runs automatically without user intervention

## Files Created

1. `src/features/pwa/constants.ts` - PWA storage thresholds and retention period constants
2. `src/features/pwa/hooks/useStorageMonitor.ts` - React hook for storage quota monitoring with polling
3. `src/features/pwa/utils/storageCleanup.ts` - Utility functions for automatic data cleanup

## Commits

- `043e4e7`: feat(05-03): add PWA storage threshold and retention constants
- `9ddb453`: feat(05-03): create useStorageMonitor hook with quota estimation
- `a655eb4`: feat(05-03): create storage cleanup utilities
- `7abef5b`: feat(05-03): integrate auto-cleanup with storage monitor
