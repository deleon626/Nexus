---
phase: 04-review-workflow
plan: 04
type: execute
wave: 4
depends_on:
  - 04-review-workflow-03
files_modified:
  - src/features/reviewWorkflow/components/ReviewDialog.tsx
  - src/features/reviewWorkflow/components/SubmissionColumns.tsx
  - src/routes/reviewer/dashboard.tsx
autonomous: true
requirements:
  - REVW-02
  - REVW-03
user_setup: []

must_haves:
  truths:
    - "Reviewer can view full submission details including all form fields"
    - "Reviewer can view attached photos in a gallery"
    - "Reviewer can enter a comment for approval or rejection"
    - "Reject button is disabled until comment is entered"
    - "After approve/reject, dialog closes and dashboard updates in real-time"
  artifacts:
    - path: "src/features/reviewWorkflow/components/ReviewDialog.tsx"
      provides: "Modal for viewing submission and approving/rejecting"
      exports: ["ReviewDialog"]
    - path: "src/routes/reviewer/dashboard.tsx"
      provides: "Dashboard with review modal integration"
      contains: "ReviewDialog"
  key_links:
    - from: "ReviewDialog.tsx"
      to: "convex/submissions.ts"
      via: "useMutation for approve/reject"
      pattern: "useMutation.*approveSubmission|rejectSubmission"
    - from: "ReviewDialog.tsx"
      to: "shadcn/ui Dialog"
      via: "Dialog component import"
      pattern: "from '@/components/ui/dialog'"
---
<objective>
Build the ReviewDialog component that displays full submission details with photos and provides approve/reject functionality with comment requirement for rejections.

Purpose: Enable reviewers to make informed decisions on submissions and record their feedback.
Output: ReviewDialog component with form data display, photo gallery, and approve/reject actions.
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
@src/components/ui/dialog.tsx
@src/components/ui/button.tsx
@src/components/ui/textarea.tsx
@convex/submissions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ReviewDialog component</name>
  <files>src/features/reviewWorkflow/components/ReviewDialog.tsx</files>
  <action>
Create a ReviewDialog component for viewing submission details and approving/rejecting.

**Create src/features/reviewWorkflow/components/ReviewDialog.tsx**

Props interface:
```typescript
interface ReviewDialogProps {
  submission: Submission | null;
  onClose: () => void;
}
```

Dialog structure using shadcn/ui Dialog:
1. **Dialog Header**
   - Title: "Review Submission - Batch {batchNumber}"
   - Subtitle: "{templateName} by {workerName}"

2. **Submission Metadata Section**
   - Batch Number, Form Type, Worker, Submitted time
   - Status badge (StatusBadge component)

3. **Form Data Section**
   - Title: "Form Data"
   - Render each field from submission.data as key-value pairs
   - Use a simple definition list layout (dt/dd pairs)
   - Handle photo fields by extracting base64 and rendering as img

4. **Photo Gallery Section** (if photos exist)
   - Title: "Attached Photos"
   - Grid layout (3 columns on desktop, 2 on mobile)
   - Each photo: clickable thumbnail with zoom capability
   - Photos come from formData fields with type 'photo' (base64 strings)

5. **Comment Section**
   - Textarea with placeholder "Add a comment (required for rejection)"
   - Track comment state with useState

6. **Action Buttons** (DialogFooter)
   - Cancel button (outline variant)
   - Reject button (destructive variant) - DISABLED if comment.trim() is empty
   - Approve button (default variant)

Behavior:
- Use useMutation for approveSubmission and rejectSubmission
- On approve: call `approveSubmission({ id: submission._id, comment: comment || undefined })`
- On reject: call `rejectSubmission({ id: submission._id, comment })` (comment required)
- Show loading state on buttons during submission
- After success: call onClose() - Convex reactivity updates dashboard automatically
- Error handling: show error message in dialog

Per CONTEXT.md:
- Comment is optional for approve, required for reject
- Post-action: close modal, return to dashboard
- Photo gallery: grid layout with zoom (use dialog or lightbox pattern)
  </action>
  <verify>
    <automated>test -f src/features/reviewWorkflow/components/ReviewDialog.tsx && grep -q "approveSubmission" src/features/reviewWorkflow/components/ReviewDialog.tsx && grep -q "rejectSubmission" src/features/reviewWorkflow/components/ReviewDialog.tsx</automated>
    <manual>Verify dialog opens with submission details and approve/reject buttons work</manual>
  </verify>
  <done>ReviewDialog component with form data, photos, and approve/reject actions</done>
</task>

<task type="auto">
  <name>Task 2: Integrate ReviewDialog into ReviewerDashboard</name>
  <files>src/routes/reviewer/dashboard.tsx, src/features/reviewWorkflow/components/SubmissionColumns.tsx</files>
  <action>
Integrate the ReviewDialog into the ReviewerDashboard and wire up the Review button.

**Update src/routes/reviewer/dashboard.tsx**
- Import ReviewDialog component
- Add state: `const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)`
- Add handler: `const handleReview = (submission: Submission) => setSelectedSubmission(submission)`
- Add handler: `const handleCloseDialog = () => setSelectedSubmission(null)`
- Pass handleReview to SubmissionTable's onReview prop
- Render ReviewDialog after SubmissionTable:
  ```tsx
  <ReviewDialog
    submission={selectedSubmission}
    onClose={handleCloseDialog}
  />
  ```

**Update src/features/reviewWorkflow/components/SubmissionColumns.tsx**
- Modify the actions column to call onReview callback with the row's submission data
- The onReview callback is passed via meta or props pattern
  </action>
  <verify>
    <automated>grep -q "ReviewDialog" src/routes/reviewer/dashboard.tsx && grep -q "setSelectedSubmission" src/routes/reviewer/dashboard.tsx</automated>
    <manual>Click Review button on a submission and verify dialog opens with correct data</manual>
  </verify>
  <done>ReviewDialog integrated with dashboard, Review button opens dialog</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. Navigate to /reviewer/dashboard
2. Click Review button on a submission
3. Verify dialog shows: batch number, form type, worker, submission time
4. Verify form data displays all field values
5. Verify photos display in grid (if any)
6. Verify Reject button is disabled until comment entered
7. Test approve with optional comment
8. Test reject with required comment
9. Verify dialog closes and table updates after action
</verification>

<success_criteria>
- [ ] ReviewDialog displays submission metadata
- [ ] Form data renders as key-value pairs
- [ ] Photos display in grid layout
- [ ] Comment textarea for reviewer feedback
- [ ] Reject button disabled until comment entered
- [ ] Approve calls approveSubmission mutation
- [ ] Reject calls rejectSubmission mutation with comment
- [ ] Dialog closes after successful action
- [ ] Dashboard updates in real-time after action (Convex reactivity)
</success_criteria>

<output>
After completion, create `.planning/phases/04-review-workflow/04-review-workflow-04-SUMMARY.md`
</output>
