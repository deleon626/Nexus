---
phase: 01-foundation-auth
plan: 07
subsystem: ui, sync
tags: [react, typescript, dexie, offline-first, pwa, sync-indicator]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    plan: 06
    provides: sync queue, sync worker, useSync hook, conflict resolution
provides:
  - Sync status UI with 4-state indicator (Offline, Syncing, Synced, Failed)
  - Online detection with heartbeat ping to avoid Safari false positives
  - Dismissible offline banner with auto-reset on reconnection
  - Expandable sync queue view with live query updates
  - Header bar integration for always-visible sync status
affects: [form-builder, form-submission, offline-mode]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Heartbeat ping pattern for reliable offline detection"
    - "Live query with dexie-react-hooks for reactive UI updates"
    - "Fixed header bar with sync indicator placement"
    - "State-based icon and color coding for status visibility"

key-files:
  created:
    - src/hooks/useOnline.ts
    - src/components/sync/SyncIndicator.tsx
    - src/components/sync/OfflineBanner.tsx
    - src/components/sync/SyncQueueView.tsx
  modified:
    - src/routes/index.tsx

key-decisions:
  - "30-second heartbeat interval balances battery usage with responsiveness"
  - "5-second heartbeat timeout prevents hanging on slow networks"
  - "Yellow banner for offline state provides visibility without alarm"
  - "Queue warning threshold at 50 items prompts users to connect"

patterns-established:
  - "Sync status components use useSync/useOnline hooks for reactive state"
  - "Time formatter provides human-readable timestamps (just now, Xm ago, Xh ago)"
  - "Expanded view pattern for detailed status information"

requirements-completed: [OFFL-01, OFFL-02, OFFL-03]

# Metrics
duration: 18min
completed: 2026-02-27
---

# Phase 01: Foundation Auth - Plan 07 Summary

**Sync UI with 4-state indicator (Offline, Syncing, Synced, Failed), heartbeat ping for reliable online detection, dismissible offline banner, and expandable queue view**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-26T18:00:31Z
- **Completed:** 2026-02-27T02:18:00Z
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments

- **useOnline hook with heartbeat ping** - Combines navigator.onLine with actual reachability checks to avoid Safari false positives
- **SyncIndicator component** - 4-state visual indicator with tap-to-expand for detailed sync information
- **OfflineBanner** - Fixed top banner showing offline state with dismissible behavior
- **SyncQueueView** - Live-query based queue list showing pending/in-flight/failed items
- **Header integration** - Sync indicator positioned in top-right header bar for always-visible status

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useOnline hook with heartbeat ping** - `dddd05` (feat)
2. **Task 2: Create SyncIndicator component with 4 states** - `862a385` (feat)
3. **Task 3: Create OfflineBanner component** - `fb18a1a` (feat)
4. **Task 4: Create SyncQueueView component** - `aae5222` (feat)
5. **Task 5: Integrate sync components into route layouts** - `fd806f1` (feat)

**Plan metadata:** (to be added in final commit)

## Files Created/Modified

- `src/hooks/useOnline.ts` - Online/offline detection with 30s heartbeat ping, combines navigator.onLine with reachability
- `src/components/sync/SyncIndicator.tsx` - 4-state sync indicator with icons, tap-to-expand, queue count badge, manual retry button
- `src/components/sync/OfflineBanner.tsx` - Fixed top yellow banner for offline state, dismissible with auto-reset
- `src/components/sync/SyncQueueView.tsx` - Live query for pending/in-flight/failed items with status badges and attempt counts
- `src/routes/index.tsx` - Added OfflineBanner and header bar with SyncIndicator

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript build errors from previous plan**
- **Found during:** Pre-task verification
- **Issue:** Multiple TypeScript errors from plan 06: needsSync property, unused imports, wrong react-router import path, wrong Clerk metadata property
- **Fix:** Removed needsSync properties from conflict.ts, removed unused imports, changed react-router-dom to react-router (v7), changed sessionClaims.metadata.role to sessionClaims.unsafeMetadata.role with type assertion
- **Files modified:** src/db/sync/conflict.ts, src/db/sync/queue.ts, src/db/sync/worker.ts, src/hooks/useAuth.ts, src/hooks/useSync.ts, src/routes/protected.tsx, src/routes/sign-in.tsx
- **Verification:** `npm run build` passes with no errors
- **Committed in:** Part of pre-execution (not part of task commits)

**2. [Rule 3 - Blocking] Fixed unused import in OfflineBanner**
- **Found during:** Task 3 build verification
- **Issue:** cn imported but never used in OfflineBanner component
- **Fix:** Removed unused cn import
- **Files modified:** src/components/sync/OfflineBanner.tsx
- **Verification:** Build passes
- **Committed in:** fd806f1 (Task 5 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** All fixes necessary for correctness and build stability. No scope creep.

## Issues Encountered

None - plan executed smoothly after fixing build errors from previous plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 (Foundation & Auth) is now complete - all 7 plans executed
- Sync UI components ready for integration with form submission flows
- Ready to proceed to Phase 2: Form Schema and Template Builder
- No blockers identified

---
*Phase: 01-foundation-auth-07*
*Completed: 2026-02-27*
