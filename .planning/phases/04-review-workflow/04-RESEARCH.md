# Phase 4: Review Workflow - Research

**Researched:** 2026-02-27
**Domain:** Convex real-time status updates, review/approval UI, file serving
**Confidence:** HIGH

---

## Summary

Phase 4 adds a reviewer dashboard and real-time status feedback for workers. The core architectural insight is that **Convex's reactive query model eliminates the need for any custom pub/sub, polling, or WebSocket logic for REVW-04**. A worker's submission status updates instantly across all clients the moment a reviewer calls the `approveSubmission` or `rejectSubmission` mutation — no additional infrastructure required.

The data model requires extending the Convex schema with a `submissions` table (Phase 3 creates it; Phase 4 reads and updates it). The review action is a `db.patch` on the submission's `status`, `reviewerId`, `reviewerComment`, and `reviewedAt` fields. The reviewer dashboard (`/reviewer/dashboard`) is a `useQuery`-driven list filtered by `orgId` and `status: 'pending'`, rendered with a shadcn/ui DataTable backed by `@tanstack/react-table`. Submission detail view includes photos served via `ctx.storage.getUrl()` returned directly from the query alongside submission data.

The `ReviewerRoute` wrapper already exists in `src/routes/protected.tsx` and the route `/reviewer/dashboard` is already registered in `src/routes/index.tsx`. Phase 4 only needs to implement the `ReviewerDashboard` component (currently a stub) and the Convex backend functions for submissions review.

**Primary recommendation:** Use Convex `useQuery` for real-time dashboard and status updates. Use `db.patch` in a mutation for approve/reject. Return photo URLs from the query using `ctx.storage.getUrl()`. Render dashboard with shadcn/ui DataTable + `@tanstack/react-table`. No polling, no custom pub/sub.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REVW-01 | Reviewer can view dashboard of pending submissions | Convex `useQuery` with index on `orgId + status`; shadcn/ui DataTable with `@tanstack/react-table` |
| REVW-02 | Reviewer can view full submission details including photos | Convex query returns `ctx.storage.getUrl(storageId)` alongside submission data; rendered in a Dialog or detail route |
| REVW-03 | Reviewer can approve or reject submissions with comments | Convex `useMutation` calling `db.patch` to update `status`, `reviewerComment`, `reviewerId`, `reviewedAt` |
| REVW-04 | Worker sees real-time status updates on their submissions | Convex `useQuery` is reactive by default — no extra work; workers query their own submissions filtered by `userId` |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `convex/react` `useQuery` | Already installed | Reactive query subscription for dashboard + status updates | Zero-config real-time; Convex tracks query dependencies and pushes updates automatically |
| `convex/react` `useMutation` | Already installed | Approve/reject mutations | ACID transactions, server-side auth checks |
| `@tanstack/react-table` | Latest (in shadcn ecosystem) | Headless table logic for reviewer dashboard | Official shadcn/ui DataTable pattern; sorting, filtering, pagination built-in |
| shadcn/ui `DataTable`, `Badge`, `Dialog`, `Textarea`, `Button` | Already installed | Dashboard UI, status badges, review modal | Established project UI library |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | Already installed (Phase 2) | Format submission timestamps, relative time display | Use for `formatDistanceToNow`, `format` in table cells |
| `lucide-react` | Already installed | Status icons (CheckCircle, XCircle, Clock) | Use alongside Badge for visual status indicators |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn DataTable + react-table | Custom table | React-table adds sorting/filtering/pagination for free; custom table is 3x more code for same result |
| `ctx.storage.getUrl()` in query | HTTP action for file serving | `getUrl()` is simpler (no extra route) and sufficient since access control is at query level; HTTP action only needed if access control at serve time is required (not required for MVP) |
| `db.patch` for status update | `db.replace` | `patch` is a shallow merge — correct for updating only review fields without touching submission data |

**Installation:**

`@tanstack/react-table` is not yet installed. All other dependencies are already present.

```bash
npm install @tanstack/react-table
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── routes/
│   └── reviewer/
│       ├── dashboard.tsx          # ReviewerDashboard (main route component - already stub)
│       └── submission/
│           └── [id].tsx           # Optional: detail route, OR use Dialog in dashboard
├── features/
│   └── reviewWorkflow/
│       ├── components/
│       │   ├── SubmissionTable.tsx    # DataTable with columns definition
│       │   ├── SubmissionColumns.tsx  # Column definitions for react-table
│       │   ├── ReviewDialog.tsx       # Approve/reject modal with comment textarea
│       │   ├── StatusBadge.tsx        # Badge component for submission status
│       │   └── WorkerStatusList.tsx   # Worker's view of their own submission statuses
│       └── hooks/
│           └── useReviewWorkflow.ts   # Wraps useMutation for approve/reject actions
convex/
├── schema.ts          # Add submissions table (Phase 3 owns creation; Phase 4 adds review indexes)
├── submissions.ts     # Add: listPendingSubmissions, getSubmissionWithPhotos,
│                      #      approveSubmission, rejectSubmission,
│                      #      listWorkerSubmissions
└── functions.ts       # Existing template functions (unchanged)
```

**Decision: Dialog, not route, for submission detail.** The reviewer workflow is a focused task — open a submission, review it, approve/reject, return to list. A Dialog keeps the user in context and is simpler than a nested route. This follows the pattern of the shadcn/ui CRUD Status Workflow block.

### Pattern 1: Reactive Reviewer Dashboard

Convex `useQuery` subscriptions are reactive by default. Any change to queried documents triggers a re-render. No polling, no WebSocket management, no `staleTime` configuration.

```typescript
// Source: https://docs.convex.dev/client/react
// convex/submissions.ts
export const listPendingSubmissions = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    return await ctx.db
      .query('submissions')
      .withIndex('by_org_status', (q) =>
        q.eq('orgId', args.orgId).eq('status', 'pending')
      )
      .order('desc')
      .collect();
  },
});

// src/routes/reviewer/dashboard.tsx
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

export default function ReviewerDashboard() {
  const { orgId } = useAuth();
  const submissions = useQuery(
    api.submissions.listPendingSubmissions,
    orgId ? { orgId } : 'skip',
  );
  // submissions updates automatically in real-time when any submission changes
}
```

**Confidence:** HIGH — verified via Context7 (docs.convex.dev/realtime, docs.convex.dev/client/react)

### Pattern 2: Approve/Reject Mutation with db.patch

```typescript
// Source: https://docs.convex.dev/database/writing-data
// convex/submissions.ts
export const approveSubmission = mutation({
  args: {
    id: v.id('submissions'),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const submission = await ctx.db.get(args.id);
    if (!submission) throw new Error('Submission not found');

    await ctx.db.patch(args.id, {
      status: 'approved',
      reviewerId: identity.subject,
      reviewerComment: args.comment,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const rejectSubmission = mutation({
  args: {
    id: v.id('submissions'),
    comment: v.string(), // required for rejections
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const submission = await ctx.db.get(args.id);
    if (!submission) throw new Error('Submission not found');

    await ctx.db.patch(args.id, {
      status: 'rejected',
      reviewerId: identity.subject,
      reviewerComment: args.comment,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// src/features/reviewWorkflow/hooks/useReviewWorkflow.ts
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function useReviewWorkflow() {
  const approve = useMutation(api.submissions.approveSubmission);
  const reject = useMutation(api.submissions.rejectSubmission);
  return { approve, reject };
}
```

**Confidence:** HIGH — verified via Context7 (docs.convex.dev/database/writing-data)

### Pattern 3: Photo URLs Returned Directly from Query

Photos stored as Convex storage IDs are resolved to signed URLs inside the query handler. The frontend receives ready-to-use URLs — no client-side URL generation logic needed.

```typescript
// Source: https://docs.convex.dev/file-storage/serve-files
// convex/submissions.ts
export const getSubmissionWithPhotos = query({
  args: { id: v.id('submissions') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const submission = await ctx.db.get(args.id);
    if (!submission) return null;

    // Resolve storage IDs to URLs inside the query
    const photoUrls = await Promise.all(
      (submission.photos ?? []).map((storageId: string) =>
        ctx.storage.getUrl(storageId as Id<'_storage'>)
      )
    );

    return { ...submission, photoUrls };
  },
});
```

**Confidence:** HIGH — verified via Context7 (docs.convex.dev/file-storage/serve-files)

### Pattern 4: Worker Real-Time Status View

REVW-04 requires zero additional infrastructure. The worker's submission list query is reactive. When a reviewer approves/rejects, the worker's `useQuery` subscription updates automatically.

```typescript
// convex/submissions.ts
export const listWorkerSubmissions = query({
  args: { orgId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    return await ctx.db
      .query('submissions')
      .withIndex('by_org_user', (q) =>
        q.eq('orgId', args.orgId).eq('userId', args.userId)
      )
      .order('desc')
      .collect();
  },
});
```

The worker route (Phase 3) calls `useQuery(api.submissions.listWorkerSubmissions, { orgId, userId })`. When a reviewer calls `approveSubmission`, Convex invalidates all subscriptions that read that document — including the worker's query — and pushes the updated result. The worker sees their status change in real-time with no polling.

**Confidence:** HIGH — verified via docs.convex.dev/realtime ("Convex tracks the dependencies to your query functions, including database changes, and triggers the subscription in the client libraries.")

### Pattern 5: shadcn/ui DataTable with @tanstack/react-table

```typescript
// Source: https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/components/base/data-table.mdx
// src/features/reviewWorkflow/components/SubmissionColumns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';

export const columns: ColumnDef<Submission>[] = [
  {
    accessorKey: 'batchNumber',
    header: 'Batch',
  },
  {
    accessorKey: 'templateName',
    header: 'Form',
  },
  {
    accessorKey: 'createdAt',
    header: 'Submitted',
    cell: ({ row }) => formatDistanceToNow(row.original.createdAt, { addSuffix: true }),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button variant="outline" size="sm" onClick={() => onReview(row.original)}>
        Review
      </Button>
    ),
  },
];
```

### Pattern 6: Convex Schema Extension for Submissions Review Fields

Phase 3 creates the `submissions` table. Phase 4 requires these review-related fields to be present in the schema. The Phase 4 plan must coordinate with Phase 3 schema definition or add the fields if Phase 3 omits them.

```typescript
// convex/schema.ts — submissions table additions needed by Phase 4
submissions: defineTable({
  // ... Phase 3 fields (batchNumber, templateId, orgId, userId, data, photos, status)
  // Review fields added for Phase 4:
  reviewerId: v.optional(v.string()),       // Clerk user ID of reviewer
  reviewerComment: v.optional(v.string()),  // Comment from approve/reject action
  reviewedAt: v.optional(v.number()),       // Unix timestamp of review decision
  updatedAt: v.number(),
})
  .index('by_org_status', ['orgId', 'status'])      // REVW-01: pending dashboard
  .index('by_org_user', ['orgId', 'userId'])         // REVW-04: worker status view
  .index('by_org', ['orgId'])                        // General org queries
```

**Confidence:** HIGH — index strategy verified against Convex docs (docs.convex.dev/database/reading-data/indexes)

### Anti-Patterns to Avoid

- **Polling for status updates:** Never use `setInterval` + `fetch` for real-time status. Convex `useQuery` is reactive. Polling adds latency and battery drain with zero benefit.
- **Storing photo URLs in the database:** Store storage IDs (`Id<"_storage">`), resolve to URLs in the query handler with `ctx.storage.getUrl()`. URLs are short-lived and must not be persisted.
- **Client-side role enforcement only:** Always check role in the Convex mutation handler (`ctx.auth.getUserIdentity()`) and verify the user's role before allowing approve/reject. The `ReviewerRoute` wrapper is UI-only protection.
- **Using `db.replace` instead of `db.patch`:** Replace overwrites the entire document. Patch is the correct operation for adding review fields to an existing submission.
- **Calling `collect()` without an index on large tables:** The pending submissions query MUST use `.withIndex('by_org_status', ...)` — never `.filter()` on an unindexed field for production queries.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time status push to workers | WebSocket server, polling interval, SSE endpoint | Convex `useQuery` subscription | Convex is reactive by default; all query dependencies tracked server-side |
| Table with sort/filter/pagination | Custom table component | `@tanstack/react-table` + shadcn DataTable | Handles sorting state, column visibility, pagination, row selection — 500+ lines of logic provided free |
| Photo URL signing/expiry management | Custom signed URL service | `ctx.storage.getUrl()` in Convex query | Convex manages URL lifetime; returns fresh URLs on each query evaluation |
| Approval state machine | Custom state transition validator | Simple `status` field + mutation-level validation | For a two-state workflow (pending → approved/rejected), a full state machine library is overkill |
| Reviewer activity log | Custom audit table | `reviewerId` + `reviewerComment` + `reviewedAt` on submission | MVP needs only who/when/comment; full audit trail is a v2 requirement (COMP-01) |

**Key insight:** Convex's reactive query model is purpose-built for exactly this use case. Review/approval UIs that would require custom WebSocket servers with other databases are trivial with Convex — you only write the mutation that changes `status`, and every client subscribed to a query that reads that document receives the update automatically.

---

## Common Pitfalls

### Pitfall 1: Querying Without Index on Status Field

**What goes wrong:** `ctx.db.query('submissions').filter(q => q.eq(q.field('status'), 'pending')).collect()` performs a full table scan. At scale (hundreds of submissions), this is slow and Convex will warn about unbounded queries.

**Why it happens:** Developers use `.filter()` because it looks like SQL WHERE — but in Convex, `.filter()` scans all rows. Only `.withIndex()` uses an index.

**How to avoid:** Define a compound index `['orgId', 'status']` in the schema and always query with `.withIndex('by_org_status', q => q.eq('orgId', orgId).eq('status', 'pending'))`.

**Warning signs:** Convex dev dashboard shows slow query warnings; query result count is close to total document count.

### Pitfall 2: ctx.auth.getUserIdentity() Returns null on First Render

**What goes wrong:** A Convex query that calls `ctx.auth.getUserIdentity()` returns `null` on the first render even when the user is logged in, because the client hasn't completed authentication handshake yet.

**Why it happens:** Convex client authentication is asynchronous. On page load, `useQuery` fires before the JWT token is sent to the backend.

**How to avoid:** Two options:
1. Use `"skip"` pattern: `useQuery(api.submissions.listPending, orgId ? { orgId } : 'skip')` — don't call the query until auth state is known.
2. In the query handler, return `null` (not throw) if identity is null — the query will re-run once auth is established.

**Warning signs:** Dashboard shows empty state on load then suddenly populates; console errors about unauthorized access.

**Source:** docs.convex.dev/auth/debug — explicitly documented as "frequently encountered issue."

### Pitfall 3: Review Comment Required for Rejection (UI Validation Gap)

**What goes wrong:** Reviewer clicks "Reject" without entering a comment. The mutation succeeds (if comment is optional server-side) or throws a cryptic error (if required). Worker receives a rejection with no explanation.

**Why it happens:** Frontend doesn't enforce the comment field before calling the mutation.

**How to avoid:** In `ReviewDialog`, disable the "Reject" button until `comment.trim().length > 0`. Make `reviewerComment` `v.string()` (required, not optional) in the `rejectSubmission` mutation args. For `approveSubmission`, comment is `v.optional(v.string())`.

**Warning signs:** Workers complaining about rejections with no explanation.

### Pitfall 4: Photos Not Loading Due to Stale Storage URLs

**What goes wrong:** Photo URLs returned by `ctx.storage.getUrl()` are short-lived. If the frontend caches the query result (e.g., navigates away and back), the URL may have expired.

**Why it happens:** Convex storage URLs are signed and expire. If they're stored in component state or local storage rather than re-fetched from a live `useQuery`, they go stale.

**How to avoid:** Always render photos from live `useQuery` data. Never persist storage URLs to Dexie or component state. The `useQuery` for `getSubmissionWithPhotos` will re-evaluate and return fresh URLs when the component re-mounts.

**Warning signs:** Photos show broken image icons after navigating away and back.

### Pitfall 5: ReviewerRoute Already Exists But Dashboard is a Stub

**What goes wrong:** The route `/reviewer/dashboard` is registered in `src/routes/index.tsx` and protected by `ReviewerRoute`. The `ReviewerDashboard` component at `src/routes/reviewer/dashboard.tsx` likely exists as a placeholder. Accidentally overwriting it with a create-new-file operation instead of editing could break imports.

**How to avoid:** Use `Edit` tool on the existing file at `src/routes/reviewer/dashboard.tsx`. Do not create a new file.

**Warning signs:** TypeScript import errors after creating a duplicate file.

---

## Code Examples

Verified patterns from official sources:

### Convex Schema with Review Indexes

```typescript
// Source: https://docs.convex.dev/database/reading-data/indexes
// convex/schema.ts — add to existing schema
submissions: defineTable({
  batchNumber: v.string(),
  templateId: v.string(),
  orgId: v.string(),
  userId: v.string(),
  data: v.any(),
  photos: v.array(v.string()),        // Array of Id<"_storage"> as strings
  status: v.string(),                 // 'pending' | 'approved' | 'rejected' | 'synced'
  reviewerId: v.optional(v.string()),
  reviewerComment: v.optional(v.string()),
  reviewedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_org_status', ['orgId', 'status'])
  .index('by_org_user', ['orgId', 'userId'])
  .index('by_org', ['orgId']),
```

### Conditional useQuery with Skip Pattern

```typescript
// Source: https://docs.convex.dev/client/react
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

export default function ReviewerDashboard() {
  const { orgId } = useAuth();

  // Skip query until orgId is known to avoid auth race condition
  const submissions = useQuery(
    api.submissions.listPendingSubmissions,
    orgId ? { orgId } : 'skip',
  );

  if (submissions === undefined) return <div>Loading...</div>;
  if (submissions.length === 0) return <div>No pending submissions</div>;

  return <SubmissionTable data={submissions} />;
}
```

### DataTable Column Definition

```typescript
// Source: https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/components/base/data-table.mdx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

export function SubmissionTable({ data }: { data: Submission[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Review Dialog (Approve/Reject)

```typescript
// Using shadcn/ui Dialog + Textarea + Button
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useState } from 'react';

interface ReviewDialogProps {
  submission: Submission | null;
  onClose: () => void;
}

export function ReviewDialog({ submission, onClose }: ReviewDialogProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const approve = useMutation(api.submissions.approveSubmission);
  const reject = useMutation(api.submissions.rejectSubmission);

  async function handleApprove() {
    if (!submission) return;
    setIsSubmitting(true);
    try {
      await approve({ id: submission._id, comment: comment || undefined });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!submission || !comment.trim()) return;
    setIsSubmitting(true);
    try {
      await reject({ id: submission._id, comment });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={!!submission} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Submission — Batch {submission?.batchNumber}</DialogTitle>
        </DialogHeader>
        {/* Photo gallery */}
        {/* Form field data display */}
        <Textarea
          placeholder="Add a comment (required for rejection)"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting || !comment.trim()}
          >
            Reject
          </Button>
          <Button onClick={handleApprove} disabled={isSubmitting}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling `setInterval` for status updates | Convex `useQuery` reactive subscriptions | Convex's core design | Eliminates polling entirely; updates are push-based, consistent, and cache-efficient |
| Custom WebSocket server for live dashboard | Convex query subscriptions | Convex's core design | No WebSocket infrastructure to manage; free real-time for all queries |
| Separate HTTP GET for photo URLs | `ctx.storage.getUrl()` inside query handler | Convex file storage API | Photos and submission data returned in one query; URL freshness managed by Convex |
| Client-side table libraries (react-data-grid, Handsontable) | `@tanstack/react-table` + shadcn/ui | ~2023 onward | Headless approach — full control over markup, shadcn provides the visual layer |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Replaced by `@dnd-kit` (already done in Phase 2)
- Custom WebSocket real-time: Not applicable when using Convex
- Storing photo base64 in database: Wrong for Convex — use `Id<"_storage">` and resolve URLs in queries

---

## Open Questions

1. **Phase 3 Schema Ownership**
   - What we know: Phase 3 (Form Filling) creates the `submissions` table. Phase 4 needs review fields (`reviewerId`, `reviewerComment`, `reviewedAt`) and two indexes (`by_org_status`, `by_org_user`).
   - What's unclear: Whether Phase 3's plan will include these fields or leave them for Phase 4 to add.
   - Recommendation: Phase 4 plan should include a schema migration task (Dexie version bump + Convex schema update) as Wave 0. If Phase 3 already defines the full schema, this task is a no-op verification step.

2. **Worker Status View Location**
   - What we know: REVW-04 says workers see real-time status on their submissions. The worker route is `/worker/forms`.
   - What's unclear: Whether REVW-04 means a status indicator within the form filling flow (Phase 3) or a separate submissions history list.
   - Recommendation: Implement as a "My Submissions" list in the `/worker/forms` route using `listWorkerSubmissions` query. This is minimal and satisfies REVW-04 without requiring Phase 3 changes. Phase 3 handles form filling; Phase 4 adds the status view.

3. **photos Field Type: String IDs vs Convex Id<"_storage">**
   - What we know: `Submission.photos` in `src/db/types.ts` is typed as `string[]` and described as "base64 or blob URLs (Phase 3)". Convex file storage uses `Id<"_storage">`.
   - What's unclear: Whether Phase 3 will store Convex storage IDs or base64 strings in `photos`.
   - Recommendation: Phase 4 must coordinate with Phase 3. For `ctx.storage.getUrl()` to work, `photos` must contain Convex storage IDs. If Phase 3 stores base64 inline, Phase 4 photo display is `<img src={base64}>` directly — no `getUrl()` needed. The Phase 4 plan should handle both cases with a conditional check.

---

## Sources

### Primary (HIGH confidence)

- `/llmstxt/convex_dev_llms_txt` (Context7) — queried for: reactive useQuery, skip pattern, useMutation, db.patch, file storage getUrl, generateUploadUrl, schema indexes, auth getUserIdentity
- `https://docs.convex.dev/realtime` — confirmed zero-config real-time; no polling needed
- `https://docs.convex.dev/file-storage/serve-files` — confirmed `ctx.storage.getUrl()` pattern and URL lifetime considerations
- `https://docs.convex.dev/auth/debug` — confirmed `getUserIdentity()` null-on-first-render issue
- `/shadcn-ui/ui` (Context7) — DataTable pattern with `@tanstack/react-table`, column definitions, full table component structure
- `src/routes/protected.tsx` — confirmed `ReviewerRoute` already exists
- `src/routes/index.tsx` — confirmed `/reviewer/dashboard` route already registered
- `src/db/types.ts` — confirmed `Submission` interface and `photos: string[]` field
- `convex/schema.ts` — confirmed existing schema, no submissions table yet

### Secondary (MEDIUM confidence)

- `https://stack.convex.dev/building-an-application-portal` — real-world application portal on Convex with submission review pattern; confirms `withIndex` + TypeScript filter pattern, `useQuery` reactivity for admin views
- `https://www.shadcn.io/blocks/crud-status-workflow-01` — shadcn.io status workflow block confirms Dialog + Badge + Button pattern for approval UIs; paywalled so only metadata examined

### Tertiary (LOW confidence)

- None — all critical claims verified with primary or secondary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified (Convex docs, shadcn Context7, project package.json)
- Architecture: HIGH — patterns verified against official Convex docs via Context7; existing code confirmed via Read tool
- Pitfalls: HIGH for auth null issue (officially documented); MEDIUM for photo URL expiry (inferred from docs, not explicitly stated)

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (Convex API stable; shadcn/ui stable)
