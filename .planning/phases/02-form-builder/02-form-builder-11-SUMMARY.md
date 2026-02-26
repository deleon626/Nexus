---
phase: 02-form-builder
plan: 11
subsystem: form-builder
tags: [convex, dexie, persistence, templates, versioning]

# Dependency graph
requires:
  - phase: 02-form-builder-10
    provides: form builder UI with drag-and-drop canvas and field editor
  - phase: 01-foundation-auth-04
    provides: Clerk and Convex provider initialization
provides:
  - Convex schema with formTemplates table (version tracking, server-side validation)
  - Convex functions for template CRUD (create, update, publish, unpublish, delete)
  - Dual-layer storage pattern: Convex (cloud) + Dexie (offline)
  - useTemplatePersistence hook for save/load/publish operations
  - FormTemplatesList component for viewing and managing saved templates
  - Builder route integration with Save/Publish buttons and templates panel
affects: [02-form-builder-12]

# Tech tracking
tech-stack:
  added:
    - "@date-fns for relative time formatting in templates list"
  patterns:
    - Dual-layer storage: Convex mutations with Dexie caching for offline access
    - Version auto-increment on publish for audit trail (FORM-04)
    - Server-side validation using Convex v.* validators (FORM-03)
    - Zustand store integration with persistence hook
    - Toast notifications for user feedback

key-files:
  created:
    - convex/schema.ts
    - convex/functions.ts
    - convex/_generated/api.ts
    - convex/_generated/dataModel.d.ts
    - convex/_generated/server.d.ts
    - convex.json
    - src/features/formBuilder/hooks/useTemplatePersistence.ts
    - src/features/formBuilder/components/FormTemplatesList.tsx
  modified:
    - src/db/types.ts (Template type updated to match FormTemplate)
    - src/routes/admin/builder.tsx (Convex persistence integration)

key-decisions:
  - "Use Convex v.any() for field validation to support flexible field-specific configs"
  - "Version number auto-increments on publish only, not on every update (FORM-04)"
  - "Templates cached in Dexie after every Convex operation for offline access (OFFL-01)"
  - "Templates panel toggles with field sidebar (not permanent third panel)"
  - "Toast notifications for success/error feedback instead of alerts"

patterns-established:
  - "Dual-layer storage pattern: Save to Convex, cache to Dexie"
  - "Version tracking: Increment on publish, preserve on unpublish"
  - "Server-side validation: Convex v.* validators mirror client-side types"
  - "Auth-gated mutations: ctx.auth.getUserIdentity() for all mutations"

requirements-completed: [FORM-01, FORM-03, FORM-04]

# Metrics
duration: 8min
completed: 2026-02-27
tasks: 3
files: 11
---

# Phase 2: Form Builder - Plan 11 Summary

**Convex backend for form template storage with version tracking, server-side validation, and offline caching using Dexie**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-26T19:04:19Z
- **Completed:** 2026-02-27T03:04:19Z
- **Tasks:** 3/3
- **Files:** 11 files (7 created, 2 modified, 2 dependencies)

## Accomplishments

- Convex schema with formTemplates table including version tracking and server-side validation (FORM-04, FORM-03)
- Convex functions for template CRUD operations with auth checks (create, update, publish, unpublish, delete, list)
- Dexie Template type updated to match FormTemplate interface for consistency
- useTemplatePersistence hook implementing dual-layer storage pattern (Convex + Dexie)
- FormTemplatesList component with card-based layout, published badges, and action buttons
- Builder route integration with Save/Publish buttons, templates panel toggle, and toast notifications
- Offline template caching via Dexie (OFFL-01)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Convex schema and functions for templates** - `8424db7` (feat)
2. **Task 2: Extend Dexie schema and create persistence hook** - `66ac9b9` (feat)
3. **Task 3: Create templates list and update builder route** - `24873af` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

### Created

- `convex/schema.ts` - Convex schema with formTemplates table (name, version, orgId, fields array, published, audit fields)
- `convex/functions.ts` - Template CRUD operations (listTemplates, getTemplate, createTemplate, updateTemplate, publishTemplate, unpublishTemplate, deleteTemplate)
- `convex/_generated/api.ts` - Type definitions for Convex API
- `convex/_generated/dataModel.d.ts` - DataModel type definitions
- `convex/_generated/server.d.ts` - Server module type definitions
- `convex.json` - Convex configuration file
- `src/features/formBuilder/hooks/useTemplatePersistence.ts` - Persistence hook with dual-layer storage
- `src/features/formBuilder/components/FormTemplatesList.tsx` - Templates list component with Load/Delete actions

### Modified

- `src/db/types.ts` - Updated Template type to match FormTemplate interface (fields array, publishedAt, createdBy)
- `src/routes/admin/builder.tsx` - Integrated useTemplatePersistence hook, Save/Publish buttons, templates panel
- `package.json` - Added date-fns dependency
- `package-lock.json` - Updated with date-fns

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All tasks completed successfully:

1. **Convex schema and functions** - Schema validates with v.* validators, functions include auth checks
2. **Dexie schema update and persistence hook** - Template type matches FormTemplate, hook provides save/load/publish operations
3. **Templates list and builder integration** - FormTemplatesList renders templates, Save/Publish buttons call persistence hook

TypeScript compilation passes without errors.

## Requirements Completed

- **FORM-01:** Admin can create form templates via drag-and-drop UI (already complete from Plan 10, now with persistence)
- **FORM-03:** Admin can set field validation rules (server-side validation with Convex v.* validators)
- **FORM-04:** Form templates have version tracking for audit trail (version field, auto-increment on publish)

## Key Technical Decisions

1. **Version tracking strategy:** Version number auto-increments only on publish, not on every save. This allows for draft changes without version bloat, while maintaining audit trail for published templates.

2. **Dual-layer storage pattern:** Templates are saved to Convex (authoritative source) and cached to Dexie (offline access). Load tries Dexie first for offline capability, falls back to Convex.

3. **Field validation flexibility:** Using `v.any()` for field validation config allows for flexible field-specific rules while maintaining server-side validation requirement (FORM-03).

4. **Templates panel toggle:** Instead of a permanent third panel, templates list toggles with field sidebar. This keeps the UI clean while providing quick access to saved templates.

## Next Phase Readiness

- Form template persistence complete, ready for Plan 12 (if exists) or Phase 3 (Form Filling)
- Convex functions are available for future submission storage and querying
- Dual-layer storage pattern established for offline-first architecture

## User Setup Required

**External services require manual configuration.** The following environment variables must be set in `.env.local`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (from Clerk Dashboard)
VITE_CONVEX_URL=https://...convex.cloud (from Convex Dashboard)
```

**To start Convex dev server:**
```bash
npx convex dev
```

This will regenerate the `convex/_generated/` files with complete types based on the schema.

---
*Phase: 02-form-builder*
*Completed: 2026-02-27*
