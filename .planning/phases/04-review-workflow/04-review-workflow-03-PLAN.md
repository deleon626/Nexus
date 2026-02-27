---
phase: 04-review-workflow
plan: 03
type: execute
wave: 3
depends_on:
  - 04-review-workflow-01
  - 04-review-workflow-02
files_modified:
  - src/features/reviewWorkflow/components/StatusBadge.tsx
  - src/features/reviewWorkflow/components/SubmissionColumns.tsx
  - src/features/reviewWorkflow/components/SubmissionTable.tsx
  - src/routes/reviewer/dashboard.tsx
autonomous: true
requirements:
  - REVW-01
user_setup: []

must_haves:
  truths:
    - "Reviewer sees paginated table of pending submissions"
    - "Table shows batch number, form type, submitted time, status badge"
    - "Table has Review button that opens detail view"
    - "Status badges use traffic light colors (yellow pending, green approved, red rejected)"
  artifacts:
    - path: "src/routes/reviewer/dashboard.tsx"
      provides: "ReviewerDashboard page with useQuery for pending submissions"
      contains: "useQuery(api.submissions.listPendingSubmissions"
    - path: "src/features/reviewWorkflow/components/SubmissionTable.tsx"
      provides: "DataTable component for submission list"
      exports: ["SubmissionTable"]
    - path: "src/features/reviewWorkflow/components/StatusBadge.tsx"
      provides: "Status badge component with color variants"
      exports: ["StatusBadge"]
  key_links:
    - from: "src/routes/reviewer/dashboard.tsx"
      to: "convex/submissions.ts"
      via: "useQuery(api.submissions.listPendingSubmissions"
      pattern: "api\\.submissions\\.listPendingSubmissions"
    - from: "SubmissionTable.tsx"
      to: "@tanstack/react-table"
      via: "useReactTable hook"
      pattern: "useReactTable"
---
<objective>
Build the ReviewerDashboard page with a paginated data table showing pending submissions. Reviewers see batch number, form type, submission time, and status badges.

Purpose: Enable reviewers to view and manage pending submissions at a glance.
Output: ReviewerDashboard page with StatusBadge component and SubmissionTable using @tanstack/react-table.
</objective>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/04-review-workflow/04-CONTEXT.md
@.planning/phases/04-review-workflow/04-RESEARCH.md
@src/context/AuthContext.tsx
@src/components/ui/table.tsx
@src/components/ui/badge.tsx
@convex/submissions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create StatusBadge and SubmissionColumns components</name>
  <files>src/features/reviewWorkflow/components/StatusBadge.tsx, src/features/reviewWorkflow/components/SubmissionColumns.tsx</files>
  <action>
Create the StatusBadge component and SubmissionColumns definitions for the reviewer dashboard.

**Step 1: Create src/features/reviewWorkflow/components/StatusBadge.tsx**
Create a status badge component with traffic light colors per CONTEXT.md:
- Props: `status: 'pending' | 'approved' | 'rejected'`
- Use shadcn/ui Badge component as base
- Color mapping:
  - pending: `bg-yellow-100 text-yellow-800 border-yellow-300` with Clock icon
  - approved: `bg-green-100 text-green-800 border-green-300` with CheckCircle icon
  - rejected: `bg-red-100 text-red-800 border-red-300` with XCircle icon
- Import icons from lucide-react
- Pill-shaped badge with small size

**Step 2: Create src/features/reviewWorkflow/components/SubmissionColumns.tsx**
Create column definitions for @tanstack/react-table:
- Import ColumnDef from '@tanstack/react-table'
- Import formatDistanceToNow from 'date-fns'
- Define Submission type interface matching Convex schema
- Columns:
  1. `batchNumber`: String cell, header "Batch"
  2. `templateName`: String cell, header "Form"
  3. `workerName`: String cell, header "Worker"
  4. `createdAt`: Cell with formatDistanceToNow(row.original.createdAt, { addSuffix: true }), header "Submitted"
  5. `status`: Cell with StatusBadge component, header "Status"
  6. `actions`: Cell with "Review" button, header "" (empty)
- Export columns array and Submission type
  </action>
  <verify>
    <automated>test -f src/features/reviewWorkflow/components/StatusBadge.tsx && test -f src/features/reviewWorkflow/components/SubmissionColumns.tsx && grep -q "StatusBadge" src/features/reviewWorkflow/components/StatusBadge.tsx</automated>
    <manual>Verify TypeScript compiles with npm run check-types</manual>
  </verify>
  <done>StatusBadge and SubmissionColumns components created</done>
</task>

<task type="auto">
  <name>Task 2: Create SubmissionTable and ReviewerDashboard page</name>
  <files>src/features/reviewWorkflow/components/SubmissionTable.tsx, src/routes/reviewer/dashboard.tsx</files>
  <action>
Create the SubmissionTable component using @tanstack/react-table and update the ReviewerDashboard page.

**Step 1: Create src/features/reviewWorkflow/components/SubmissionTable.tsx**
Create a DataTable component using @tanstack/react-table + shadcn/ui Table:
- Props: `data: Submission[]`, `onReview: (submission: Submission) => void`
- Use useReactTable hook with:
  - data, columns (from SubmissionColumns)
  - getCoreRowModel: getCoreRowModel()
  - getSortedRowModel: getSortedRowModel()
- Pagination state: pageSize 10 per CONTEXT.md
- Render using shadcn/ui Table components (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
- Empty state: "No pending submissions" message
- Pass onReview callback to actions column

**Step 2: Update src/routes/reviewer/dashboard.tsx**
Replace the stub with a full ReviewerDashboard:
- Import useQuery from 'convex/react'
- Import api from '@/convex/_generated/api'
- Import useAuth from '@/context/AuthContext'
- Import SubmissionTable and StatusBadge
- Use skip pattern: `useQuery(api.submissions.listPendingSubmissions, orgId ? { orgId } : 'skip')`
- State for selected submission for review modal (will be used in Plan 04)
- Loading state: "Loading submissions..."
- Empty state: Card with "No pending submissions" message
- Render SubmissionTable with data
- Layout: Container with title "Review Dashboard", subtitle showing pending count

Create directory if needed: `mkdir -p src/features/reviewWorkflow/components`
  </action>
  <verify>
    <automated>grep -q "useQuery.*listPendingSubmissions" src/routes/reviewer/dashboard.tsx && grep -q "SubmissionTable" src/routes/reviewer/dashboard.tsx && test -f src/features/reviewWorkflow/components/SubmissionTable.tsx</automated>
    <manual>Verify dashboard loads at /reviewer/dashboard route</manual>
  </verify>
  <done>ReviewerDashboard with SubmissionTable displaying pending submissions</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. Navigate to /reviewer/dashboard as reviewer user
2. Verify pending submissions appear in table
3. Verify columns display correctly (Batch, Form, Worker, Submitted, Status)
4. Verify StatusBadge shows correct colors
5. Verify Review button appears in actions column
</verification>

<success_criteria>
- [ ] StatusBadge component with traffic light colors created
- [ ] SubmissionColumns with 6 columns defined
- [ ] SubmissionTable using @tanstack/react-table created
- [ ] ReviewerDashboard uses useQuery for pending submissions
- [ ] Skip pattern used for auth race condition
- [ ] Empty state message displays when no submissions
- [ ] TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/phases/04-review-workflow/04-review-workflow-03-SUMMARY.md`
</output>
