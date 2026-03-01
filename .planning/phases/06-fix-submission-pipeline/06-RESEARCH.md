# Phase 6: Fix Submission Pipeline — Research

**Researched:** 2026-03-01
**Phase Goal:** Submissions sync from IndexedDB to Convex so reviewer dashboards show pending submissions and workers see status updates.

## Current State Analysis

### What Exists (Working)

1. **Convex schema** (`convex/schema.ts`): `submissions` table with all needed fields (batchNumber, templateId, templateName, orgId, userId, workerName, data, photos, status, review fields, timestamps). Indexes: `by_org_status`, `by_org_user`, `by_org`.

2. **Convex queries** (`convex/submissions.ts`):
   - `listPendingSubmissions` — filters by orgId + status='pending' (REVW-01)
   - `getSubmissionDetails` — full submission by ID (REVW-02)
   - `listWorkerSubmissions` — filters by orgId + userId, limit 10 (REVW-04)

3. **Convex mutations** (`convex/submissions.ts`):
   - `approveSubmission` — sets status='approved' with optional comment (REVW-03)
   - `rejectSubmission` — sets status='rejected' with required comment (REVW-03)

4. **IndexedDB layer** (`src/db/dexie.ts`): `submissions` and `syncQueue` tables in Dexie.

5. **Sync queue** (`src/db/sync/queue.ts`): Full queue management — `addToQueue`, `getPendingItems`, `markInFlight`, `markCompleted`, `markFailed`, `retryFailedItems`.

6. **Reviewer dashboard** (`src/routes/reviewer/dashboard.tsx`): Uses `listPendingSubmissions` query, `SubmissionTable`, `ReviewDialog`. All wired up and working — just no data flows into it.

7. **Worker status list** (`src/features/reviewWorkflow/components/WorkerStatusList.tsx`): Uses `listWorkerSubmissions` query with real-time updates, status badges, rejection reasons. Integrated into FormFillingPage.

8. **FormFillingPage** (`src/features/formFilling/pages/FormFillingPage.tsx`): On submit, saves to `db.submissions` (IndexedDB) and adds to `db.syncQueue` with operation='create', endpoint='/submissions'.

### The Gap (What's Broken)

**`src/db/sync/worker.ts` line 30-32:**
```typescript
// TODO: Make actual API call to Convex
// For now, simulate success
await new Promise(resolve => setTimeout(resolve, 1000));
```

The sync worker processes queue items but **never calls Convex**. It just waits 1 second and marks everything as "completed." This means:
- Submissions stay only in IndexedDB
- Reviewer dashboard shows 0 pending submissions
- Worker status list shows 0 submissions

**Missing mutation:** `convex/submissions.ts` has no `createSubmission` mutation. The sync worker needs this to push submissions to Convex.

### Secondary Issues

1. **No `templateName` or `workerName` in submission payload:** FormFillingPage's submission object doesn't include `templateName` or `workerName`, but the Convex schema requires them. The sync worker or createSubmission mutation needs to handle this.

2. **Idempotency:** CONTEXT.md requires idempotency via localId. The `createSubmission` mutation should reject duplicates by checking if a submission with the same localId already exists.

3. **Immediate sync on submit:** CONTEXT.md says "sync immediately on submit." Currently the sync worker runs on a 30-second interval. After saving to queue, should trigger immediate processing.

4. **Toast notifications on failure:** CONTEXT.md mentions "show a toast notification + mark submission with a retry badge" on sync failure. Currently failures are silent (console.error only).

## Implementation Approach

### Plan 01: Wire Sync Pipeline (Single Plan)

This is a focused gap-closure — all changes are tightly coupled and should be in one plan:

1. **Add `createSubmission` mutation** to `convex/submissions.ts` — accepts all submission fields, checks idempotency via localId field, inserts into submissions table with status='pending'.

2. **Replace TODO stub in sync worker** — import ConvexHttpClient, call `createSubmission` mutation instead of simulating success. Use ConvexHttpClient (not the React hook) since the sync worker runs outside React.

3. **Add `templateName` and `workerName`** to the submission payload in FormFillingPage — available from `selectedForm.name` and could use Clerk user data.

4. **Trigger immediate sync** after adding to queue — call `processQueue()` or `triggerSync()` right after `db.syncQueue.add()`.

5. **Add toast notifications** for sync failure feedback to the worker.

### Technical Decisions

- **ConvexHttpClient vs useMutation:** The sync worker runs outside React component lifecycle (it's a plain async function called on an interval). Must use `ConvexHttpClient` for direct API calls.
- **Idempotency field:** Add a `localId` field to the Convex submissions schema to enable duplicate detection. The `createSubmission` mutation queries by localId before inserting.
- **Worker name resolution:** Use Clerk's `useUser()` data available in FormFillingPage at submission time — pass `workerName` into the payload stored in IndexedDB.

## Requirements Coverage

| Requirement | How Covered |
|-------------|-------------|
| REVW-01 | `createSubmission` mutation populates data for `listPendingSubmissions` query (already wired to reviewer dashboard) |
| REVW-02 | `getSubmissionDetails` query already exists; `createSubmission` stores full data + photos |
| REVW-03 | `approveSubmission` / `rejectSubmission` mutations already exist and work |
| REVW-04 | `listWorkerSubmissions` query already exists; `createSubmission` populates data for it |

## RESEARCH COMPLETE
