# Phase 6, Plan 01 — Wire Sync Pipeline

**Status:** COMPLETE
**Completed:** 2026-03-01
**Duration:** ~10min

## What Was Done

Wired the submission sync pipeline from IndexedDB to Convex, closing the P1 critical path gap.

### Changes

| File | Change |
|------|--------|
| `convex/schema.ts` | Added `localId: v.string()` field and `by_localId` index to submissions table |
| `convex/submissions.ts` | Added `createSubmission` mutation with idempotency check via localId |
| `src/lib/convexHttpClient.ts` | Created shared ConvexHttpClient singleton for non-React code |
| `src/db/sync/worker.ts` | Replaced TODO stub with actual Convex mutation calls + Clerk auth |
| `src/features/formFilling/pages/FormFillingPage.tsx` | Added templateName/workerName to payload, immediate sync trigger |

### Key Decisions

- Used `ConvexHttpClient` (not React hooks) for sync worker since it runs outside component tree
- Clerk token retrieved via `window.Clerk.session.getToken()` global for sync worker auth
- Idempotency via `localId` field — Convex rejects duplicates silently, returning existing ID
- `useUserIdentity()` hook (already exists in NavItem.tsx) reused for worker name resolution
- `triggerSync()` called immediately after queue add — no waiting for 30-second interval

### Requirements Closed

- REVW-01: createSubmission populates data for listPendingSubmissions (reviewer dashboard)
- REVW-02: Full submission data stored (data + photos) for getSubmissionDetails
- REVW-03: approveSubmission/rejectSubmission already existed and work
- REVW-04: createSubmission populates data for listWorkerSubmissions (worker status)

## Artifacts

- `convex/submissions.ts` — exports: createSubmission, listPendingSubmissions, getSubmissionDetails, listWorkerSubmissions, approveSubmission, rejectSubmission
- `src/lib/convexHttpClient.ts` — exports: convexHttpClient (ConvexHttpClient singleton)
