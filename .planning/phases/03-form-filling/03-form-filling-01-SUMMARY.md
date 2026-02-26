---
phase: 03-form-filling
plan: 01
subsystem: draft-persistence-layer
tags: [dexie, indexeddb, types, constants, offline-first]
---

# Phase 3 Plan 1: Draft Persistence Layer Summary

## One-Liner
Added Draft type with Dexie v2 schema for auto-save form sessions with 7-day expiration and 30-second auto-save intervals.

## Objective Met
Created the draft persistence layer with Dexie schema, type definitions, and constants for auto-save behavior. This establishes the foundation for form filling sessions with data protection via periodic saves.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ---- | ---- |
| 1 | Add Draft type and Dexie table | 8a7cd2e | src/db/types.ts, src/db/dexie.ts |
| 2 | Create form filling types and constants | 521ef2e | src/features/formFilling/types.ts, src/features/formFilling/constants.ts |
| 3 | Create draft cleanup utility | 23a8415 | src/features/formFilling/utils/cleanupExpiredDrafts.ts |

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

## Key Files Created/Modified

### Created
- `src/features/formFilling/types.ts` - Form filling state types (FormSession, FormFieldValue, FormProgress)
- `src/features/formFilling/constants.ts` - Auto-save and expiration constants
- `src/features/formFilling/utils/cleanupExpiredDrafts.ts` - Draft cleanup utility with Dexie where() clause

### Modified
- `src/db/types.ts` - Added Draft interface with expiresAt timestamp
- `src/db/dexie.ts` - Added drafts table, version 2 schema, exported Draft type

## Technical Stack Added

| Technology | Purpose |
| ---------- | ------- |
| Dexie.js v4 | Draft table with expiresAt index for efficient cleanup queries |
| TypeScript | Draft interface with 7-day expiration timestamp support |

## Key Decisions

1. **Separate drafts table**: Chose dedicated Draft type/table over reusing submissions table. Rationale: Different lifecycle (auto-expire, multiple per batch), different queries (by expiresAt), different retention policy (7 days vs permanent).

2. **Version 2 schema**: Incremented Dexie version to 2 to add drafts table while preserving existing data (submissions, templates, syncQueue, organizations).

3. **7-day expiration**: Used millisecond timestamp (expiresAt: number) instead of Date object for efficient Dexie where().below() queries per 03-RESEARCH.md recommendation.

## Integration Points

| From | To | Via | Pattern |
| ---- | --- | --- | ---- |
| useFormDraft.ts | db.dexie.ts | db.drafts.put(), db.drafts.where() | Draft auto-save every 30s |
| useFormDraft.ts | constants.ts | DRAFT_EXPIRY_MS, AUTOSAVE_INTERVAL_MS | Auto-save timing |
| cleanupExpiredDrafts | db.dexie.ts | db.drafts.where('expiresAt').below().delete() | Efficient deletion |

## Requirements Satisfied

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| FILL-01 | Partial | Types and storage ready, useFormDraft hook to be implemented in next plan |
| FILL-02 | N/A | Photo capture in later plan |
| FILL-03 | N/A | Voice input in later plan |
| FILL-04 | N/A | Validation in later plan |

## Metrics

| Metric | Value |
| ------ | ----- |
| Duration | ~3 minutes |
| Tasks | 3/3 complete |
| Files Created | 3 |
| Files Modified | 2 |
| Commits | 3 |

## Next Steps

1. Plan 02: Implement useFormDraft hook for 30-second auto-save
2. Plan 03: Implement form selection UI with batch number prompt
3. Plan 04: Implement form field components with validation

## Verification

- [x] Draft interface defined with localId, formId, batchNumber, formData, expiresAt
- [x] Dexie version 2 schema includes drafts table with indexes
- [x] Constants match CONTEXT.md specifications (7 days, 30 seconds)
- [x] Draft cleanup utility uses Dexie where() clause for efficient deletion
- [x] TypeScript compilation passes

---

**Completed:** 2026-02-27
**Plan File:** 03-form-filling-01-PLAN.md
