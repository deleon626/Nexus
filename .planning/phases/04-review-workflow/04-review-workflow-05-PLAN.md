---
phase: 04-review-workflow
plan: 05
type: execute
wave: 3
depends_on:
  - 04-review-workflow-01
  - 04-review-workflow-02
files_modified:
  - src/features/reviewWorkflow/components/WorkerStatusList.tsx
  - src/features/formFilling/pages/FormFillingPage.tsx
autonomous: true
requirements:
  - REVW-04
user_setup: []

must_haves:
  truths:
    - "Worker sees their recent submissions at top of /worker/forms"
    - "Each submission shows batch, form type, submission time, and status badge"
    - "Rejected submissions show rejection reason"
    - "Status updates in real-time when reviewer approves/rejects"
  artifacts:
    - path: "src/features/reviewWorkflow/components/WorkerStatusList.tsx"
      provides: "Worker's submission status list component"
      exports: ["WorkerStatusList"]
    - path: "src/features/formFilling/pages/FormFillingPage.tsx"
      provides: "Form filling page with status list integration"
      contains: "WorkerStatusList"
  key_links:
    - from: "WorkerStatusList.tsx"
      to: "convex/submissions.ts"
      via: "useQuery(api.submissions.listWorkerSubmissions"
      pattern: "listWorkerSubmissions"
    - from: "WorkerStatusList.tsx"
      to: "StatusBadge"
      via: "import for status display"
      pattern: "StatusBadge"
---
<objective>
Build the WorkerStatusList component that shows workers their recent submissions with real-time status updates. Integrate into the FormFillingPage so workers see their submission status at a glance.

Purpose: Enable workers to track the review status of their submissions without manual refresh.
Output: WorkerStatusList component integrated into worker's form filling page.
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
@src/features/reviewWorkflow/components/StatusBadge.tsx
@src/features/formFilling/pages/FormFillingPage.tsx
@convex/submissions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create WorkerStatusList component</name>
  <files>src/features/reviewWorkflow/components/WorkerStatusList.tsx</files>
  <action>
Create the WorkerStatusList component for displaying worker's submission status.

**Create src/features/reviewWorkflow/components/WorkerStatusList.tsx**

Props interface:
```typescript
interface WorkerStatusListProps {
  orgId: string;
  userId: string;
}
```

Component structure:
1. **Query**: Use `useQuery(api.submissions.listWorkerSubmissions, { orgId, userId })`
   - Uses skip pattern if orgId or userId is null
   - Returns max 10 recent submissions (enforced by backend)

2. **Loading State**: Skeleton or "Loading..." text

3. **Empty State**: "No submissions yet" message

4. **List Layout**:
   - Title: "My Recent Submissions" with "View all" link (placeholder for future)
   - Each submission item:
     - Left side: Batch number (bold), Form name (muted)
     - Right side: StatusBadge
     - Below: Submission time (formatDistanceToNow)
     - If rejected: Show rejection reason in red/muted text
     - If reviewed: Show reviewer name and time (optional, if data available)

5. **Real-time Animation**:
   - Per CONTEXT.md: "Subtle pulse or highlight animation when status changes"
   - Use CSS animation: pulse effect on status change
   - Can use useEffect + previous value comparison to trigger animation

6. **Styling**:
   - Card or bordered container
   - Compact list items (not table)
   - Responsive layout
   - Use shadcn/ui Card if available, or simple div with Tailwind

Import StatusBadge from './StatusBadge' (created in Plan 03)
Import formatDistanceToNow from 'date-fns'
  </action>
  <verify>
    <automated>test -f src/features/reviewWorkflow/components/WorkerStatusList.tsx && grep -q "listWorkerSubmissions" src/features/reviewWorkflow/components/WorkerStatusList.tsx</automated>
    <manual>Verify component shows worker's submissions with correct status badges</manual>
  </verify>
  <done>WorkerStatusList component showing recent submissions with status badges</done>
</task>

<task type="auto">
  <name>Task 2: Integrate WorkerStatusList into FormFillingPage</name>
  <files>src/features/formFilling/pages/FormFillingPage.tsx</files>
  <action>
Integrate the WorkerStatusList into the FormFillingPage so workers see their submission status.

**Update src/features/formFilling/pages/FormFillingPage.tsx**

Per CONTEXT.md: "Section at top of /worker/forms (worker dashboard) - not a separate page"

Integration approach:
1. Import WorkerStatusList at top of file
2. Show WorkerStatusList ONLY when pageState is 'listing' (the form list view)
3. Layout: WorkerStatusList appears ABOVE the FormList component
4. Use a collapsible or expandable section for the status list (optional UX enhancement)

Example integration in the 'listing' state render:
```tsx
if (pageState === 'listing') {
  return (
    <div className="space-y-6">
      {userId && orgId && (
        <WorkerStatusList orgId={orgId} userId={userId} />
      )}
      <FormList onFormSelect={handleFormSelect} />
    </div>
  );
}
```

This ensures:
- Workers see their recent submissions at the top
- Status updates in real-time (Convex useQuery reactivity)
- No interference with the form filling flow
- Simple, non-intrusive placement per CONTEXT.md
  </action>
  <verify>
    <automated>grep -q "WorkerStatusList" src/features/formFilling/pages/FormFillingPage.tsx</automated>
    <manual>Navigate to /worker/forms and verify status list appears above form list</manual>
  </verify>
  <done>WorkerStatusList integrated into worker's form page</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. Navigate to /worker/forms as a worker user
2. Verify "My Recent Submissions" section appears at top
3. Verify recent submissions display with batch, form, time, status
4. If rejected submissions exist, verify rejection reason shows
5. Have reviewer approve/reject a submission
6. Verify worker sees status update in real-time (no page refresh needed)
</verification>

<success_criteria>
- [ ] WorkerStatusList component created with useQuery for worker submissions
- [ ] StatusBadge used for status display
- [ ] Rejection reason shown for rejected submissions
- [ ] Empty state shown when no submissions
- [ ] WorkerStatusList integrated into FormFillingPage
- [ ] Status list appears at top of form list view
- [ ] Real-time updates work (Convex reactivity)
</success_criteria>

<output>
After completion, create `.planning/phases/04-review-workflow/04-review-workflow-05-SUMMARY.md`
</output>
