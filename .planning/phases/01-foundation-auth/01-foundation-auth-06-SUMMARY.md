---
phase: 01-foundation-auth
plan: 06
subsystem: offline-sync
tags: [dexie, indexeddb, sync, offline, queue, conflict-resolution]

# Dependency graph
requires:
  - phase: 01-foundation-auth-03
    provides: Dexie database schema with syncQueue table, Submission and Template types
  - phase: 01-foundation-auth-04
    provides: Convex client for cloud API integration
provides:
  - Sync queue management with add, remove, retry operations
  - Background sync worker with exponential backoff (5s, 15s, 45s)
  - Conflict resolution using last-write-wins with server timestamps
  - React useSync() hook for sync status and queue management
  - In-flight request tracking to prevent race conditions
affects: [01-foundation-auth-07, 03-forms-core, 04-offline-voice]

# Tech tracking
tech-stack:
  added: [uuid, dexie-react-hooks]
  patterns: [queue-based sync, exponential backoff, last-write-wins conflict resolution, live query hooks]

key-files:
  created: [src/db/sync/queue.ts, src/db/sync/worker.ts, src/db/sync/conflict.ts, src/db/sync/index.ts, src/hooks/useSync.ts]
  modified: []

key-decisions:
  - "UUID for localId generation instead of auto-increment — enables client-side identification before server sync"
  - "Exponential backoff: 5s, 15s, 45s with 3 max attempts — balances retry aggressiveness with user experience"
  - "Last-write-wins with server timestamps as tiebreaker — simple conflict resolution suitable for single-user-per-submission model"
  - "Items deleted immediately upon completion — no completed items table, reduces storage overhead"

patterns-established:
  - "Pattern: Queue-based async processing with in-flight Set tracking for race condition prevention"
  - "Pattern: Dexie live queries via dexie-react-hooks for reactive state updates"
  - "Pattern: Auto-start/stop sync worker based on browser online/offline events"
  - "Pattern: Idempotent queue operations (markInFlight returns false if already processed)"

requirements-completed: [OFFL-01, OFFL-02, OFFL-03, OFFL-04]

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 1 Plan 6: Offline Sync Engine Summary

**Queue-based offline sync engine with exponential backoff retry, last-write-wins conflict resolution, and React useSync() hook for real-time sync status tracking**

## Performance

- **Duration:** ~2 minutes
- **Started:** 2026-02-26T17:57:29Z
- **Completed:** 2026-02-26T17:58:29Z
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments

- Built complete sync queue management system with add, remove, retry operations
- Implemented background sync worker with exponential backoff (5s, 15s, 45s intervals)
- Created conflict resolution module using last-write-wins with server timestamps
- Developed React useSync() hook with live query for reactive sync status updates
- Added in-flight request tracking to prevent race conditions during concurrent operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sync queue management service** - `ad0a2be` (feat)
2. **Task 2: Create background sync worker with exponential backoff** - `7b20351` (feat)
3. **Task 3: Create conflict resolution module** - `1defc4b` (feat)
4. **Task 4: Create React hook for sync status and queue management** - `2d926df` (feat)
5. **Task 5: Create sync module barrel export** - `0c1ebea` (chore)

**Plan metadata:** (summary pending final commit)

## Files Created/Modified

- `src/db/sync/queue.ts` - Sync queue operations: addToQueue, getPendingItems, markInFlight, markCompleted, markFailed, retryFailedItems
- `src/db/sync/worker.ts` - Background sync worker with processQueue, startSyncWorker, stopSyncWorker, triggerSync
- `src/db/sync/conflict.ts` - Conflict resolution with compareVersions, resolveConflict, needsSync
- `src/db/sync/index.ts` - Barrel export for clean imports
- `src/hooks/useSync.ts` - React hook for sync status, queue count, manual sync, and retry actions

## Decisions Made

1. **UUID for localId generation** - Using UUID instead of auto-increment enables client-side identification before server sync, critical for offline-first architecture
2. **Exponential backoff with 3 max attempts** - Balances retry aggressiveness with user experience; failed items after 3 attempts remain in queue for manual retry
3. **Last-write-wins with server tiebreaker** - Simple conflict resolution suitable for single-user-per-submission model; server wins on timestamp ties to prevent merge conflicts
4. **Immediate deletion on completion** - No completed items table reduces storage overhead; items are removed from queue immediately after successful sync

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks executed successfully with TypeScript compilation passing.

## User Setup Required

None - no external service configuration required. The sync engine uses existing Dexie database and will integrate with Convex API when schema is ready (deferred to later phase).

## Next Phase Readiness

**Sync engine architecture complete.** Ready for:

- **Plan 07:** Sync status UI component using useSync() hook for real-time sync indicators
- **Phase 3:** Form submission integration with addToQueue() for offline form saves
- **Phase 4:** Voice data queuing for offline voice-to-form-field filling

**Note:** Actual Convex API calls in worker.ts are stubbed (marked as TODO). These will be implemented when Convex schema and functions are created in Phase 2. The sync architecture is complete and ready for API integration.

---
*Phase: 01-foundation-auth-06*
*Completed: 2026-02-26*
