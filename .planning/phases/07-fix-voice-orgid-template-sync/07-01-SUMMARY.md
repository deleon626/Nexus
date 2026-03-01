---
phase: 07-fix-voice-orgid-template-sync
plan: 01
subsystem: formFilling, auth, offline
tags: [convex, voice, whisper, dexie, offline-sync]

requires:
  - phase: 03-form-filling
    provides: useVoiceInput hook, FormFiller component, Dexie templates table
  - phase: 02-form-builder
    provides: builder.tsx, formTemplates Convex table, useTemplatePersistence
provides:
  - Fixed voice input pipeline (action call, isOnline boolean)
  - Correct orgId access in builder
  - Convex-to-Dexie template sync for offline workers
affects: [05-pwa-polish-production]

tech-stack:
  added: []
  patterns: [convexHttpClient.action for non-React Convex calls, skip pattern for conditional queries]

key-files:
  created:
    - src/features/formFilling/hooks/useTemplateSync.ts
  modified:
    - convex/voice.ts
    - src/features/formFilling/hooks/useVoiceInput.ts
    - src/features/formFilling/components/FormFiller.tsx
    - src/routes/admin/builder.tsx
    - src/features/formFilling/pages/FormFillingPage.tsx

key-decisions:
  - "Use convexHttpClient (not ConvexReactClient) for action calls in hooks outside React tree"
  - "Map Convex _creationTime to Dexie createdAt/updatedAt since Convex templates lack explicit updatedAt"

patterns-established:
  - "convexHttpClient.action(api.module.fn, args) for Convex action calls outside React components"
  - "useTemplateSync() in page-level components for background Convex-to-Dexie sync"

requirements-completed: [FILL-03, AUTH-03, OFFL-01]

duration: 5min
completed: 2026-03-01
---

# Phase 7, Plan 01: Fix Voice Input, OrgId & Template Sync Summary

**Three surgical bug fixes: voice input Convex action call, orgId from auth state, and Convex-to-Dexie template sync hook**

## Performance

- **Duration:** 5 min
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Voice input pipeline fixed: isOnline boolean pass-through, mutation→action conversion, correct Convex client call pattern
- Builder orgId reads directly from useAuth() instead of undefined user?.orgId
- New useTemplateSync hook syncs published templates from Convex to Dexie when workers go online

## Task Commits

1. **Task 1: Fix voice input pipeline** - `5f945b5` (fix)
2. **Task 2: Fix orgId access in builder** - `a80c758` (fix)
3. **Task 3: Add template sync hook** - `18f4bbb` (feat)

## Files Created/Modified
- `convex/voice.ts` - Changed mutation→action for external HTTP call
- `src/features/formFilling/hooks/useVoiceInput.ts` - Fixed Convex call pattern using convexHttpClient.action
- `src/features/formFilling/components/FormFiller.tsx` - Fixed isOnline.isOnline → isOnline
- `src/routes/admin/builder.tsx` - Fixed orgId from useAuth() directly
- `src/features/formFilling/hooks/useTemplateSync.ts` - New hook for Convex-to-Dexie template sync
- `src/features/formFilling/pages/FormFillingPage.tsx` - Added useTemplateSync() call

## Decisions Made
- Used convexHttpClient for action calls since useVoiceInput needs to call Convex outside React component tree
- Mapped Convex _creationTime to both createdAt and updatedAt in Dexie since Convex formTemplates schema lacks explicit updatedAt field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] convexHttpClient instead of ConvexReactClient**
- **Found during:** Task 1 (voice input fix)
- **Issue:** Plan suggested `convex.mutation(...)` but ConvexReactClient doesn't expose .action()/.mutation() methods for direct calls outside React
- **Fix:** Used convexHttpClient (ConvexHttpClient) which has .action() method
- **Files modified:** src/features/formFilling/hooks/useVoiceInput.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 5f945b5

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for correct API usage. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All P2/P3 gaps from v1.0 audit closed
- Voice input, org isolation, and offline template access ready for production

---
*Phase: 07-fix-voice-orgid-template-sync*
*Completed: 2026-03-01*
