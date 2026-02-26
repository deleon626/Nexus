# Phase 4: Review Workflow - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Reviewers can approve or reject submissions with comments, and workers see real-time status updates. This phase delivers a reviewer dashboard, review modal, and worker status view. Creating submissions (Phase 3), editing after review, and bulk operations are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout
- **Data table** layout for pending submissions (not cards or list)
- **Columns:** Core info (worker name, batch number, form type), Timestamp, Photo preview (thumbnail of first photo), Status badge
- **Sorting:** Sort by submission time only — no complex filters or column sorting
- **Pagination:** Paginated table with next/prev buttons — not infinite scroll

### Review Flow
- **View mode:** Modal/dialog overlay — stay on dashboard, not separate detail page
- **Modal content:**
  - Submission metadata (batch, form type, worker, time)
  - Form field data (all submitted fields and values)
  - Photo gallery (all attached photos with zoom capability)
  - Related submissions (previous submissions from same worker/batch for context)
- **Comment policy:** Optional for approve, required for reject (disable Reject button until comment entered)
- **Post-action behavior:** Close modal, return to dashboard, show toast notification

### Worker Status View
- **Location:** Section at top of `/worker/forms` (worker dashboard) — not a separate page
- **Info displayed:** Submission info (batch, form, time), Status badge, Rejection reason (if rejected), Reviewer info (who reviewed, when)
- **List size:** Recent only — show last 5-10 submissions with "View all" link to full history
- **Real-time:** Instant update via Convex `useQuery` reactivity — no manual refresh or update banner needed

### Status Visualization
- **Colors:** Standard traffic light — Yellow/Gray for Pending, Green for Approved, Red for Rejected
- **Icons:** Include lucide-react icons — Clock for Pending, CheckCircle for Approved, XCircle for Rejected
- **Animation:** Subtle pulse or highlight animation when status changes to confirm the update visually
- **Size/shape:** Small pill-shaped badges — compact and consistent with shadcn/ui `Badge` component

### Claude's Discretion
- Exact pagination size (10, 20, or 50 per page)
- Photo gallery layout within modal (grid vs carousel)
- Toast notification wording and duration
- Animation timing/curve for status badge updates
- Empty state messaging for dashboard with no pending submissions

</decisions>

<specifics>
## Specific Ideas

- Related submissions in modal gives reviewer context — "is this worker consistently submitting good/bad batches?"
- Worker sees rejection reason so they understand what to fix
- Instant status update is a "wow moment" — worker sees approval immediately after reviewer clicks

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-review-workflow*
*Context gathered: 2026-02-27*
