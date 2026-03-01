# Phase 6: Fix Submission Pipeline (Gap Closure) - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up the submission data flow from IndexedDB to Convex so reviewer dashboards show pending submissions and workers see real-time status updates on their submissions. This closes the P1 critical path gap from the milestone audit.

</domain>

<decisions>
## Implementation Decisions

### Sync behavior
- Sync immediately on submit — when worker submits a form, push to Convex right away
- If offline: queue in IndexedDB and auto-retry when connectivity returns. Worker sees "pending sync" status
- On sync failure: show a toast notification + mark submission with a retry badge. Worker can tap to retry or view error details
- Idempotency key per submission — each submission gets a unique ID in IndexedDB, Convex rejects duplicates by this key

### Claude's Discretion
- Reviewer dashboard display: how pending submissions appear, sorting, grouping, status indicators
- Worker status feedback: exact UI for real-time updates after submission
- Data mapping: how IndexedDB records map to Convex documents, field transformations
- Retry timing and backoff strategy
- Loading/empty state designs

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The key constraint is that this is gap closure: the reviewer dashboard and worker status views already exist (Phase 4) but are empty. This phase fills them with real data via the sync pipeline.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-fix-submission-pipeline*
*Context gathered: 2026-03-01*
