---
phase: 03-form-filling
plan: 09
type: execute
wave: 4
depends_on: [01, 02, 06, 07, 08]
files_modified:
  - src/features/formFilling/pages/FormFillingPage.tsx
  - src/routes/index.tsx
autonomous: true
requirements: [FILL-01, FILL-02, FILL-03, FILL-04]

must_haves:
  truths:
    - Worker can navigate to /worker/forms to see form list
    - Selecting form shows batch number prompt, then form filling page
    - Existing drafts trigger draft picker modal before form filling
    - Form filling page has progress bar at top, fields in scrollable list
    - Submit triggers confirmation modal, then success screen
    - "Submit & Start New" clears form for new batch
    - Page works offline with cached forms
  artifacts:
    - path: "src/features/formFilling/pages/FormFillingPage.tsx"
      provides: "Main page orchestrating form filling flow"
      min_lines: 100
    - path: "src/routes/index.tsx"
      provides: "Worker route at /worker/forms"
      contains: "/worker/forms"
  key_links:
    - from: "src/features/formFilling/pages/FormFillingPage.tsx"
      to: "src/features/formFilling/components/FormList.tsx"
      via: "Show FormList in initial state"
      pattern: "FormList"
    - from: "src/features/formFilling/pages/FormFillingPage.tsx"
      to: "src/features/formFilling/components/BatchNumberPrompt.tsx"
      via: "Show prompt after form selection"
      pattern: "BatchNumberPrompt"
    - from: "src/features/formFilling/pages/FormFillingPage.tsx"
      to: "src/features/formFilling/components/DraftPickerModal.tsx"
      via: "Show draft picker if drafts exist"
      pattern: "DraftPickerModal"
    - from: "src/features/formFilling/pages/FormFillingPage.tsx"
      to: "src/features/formFilling/components/FormFiller.tsx"
      via: "Show form filler after batch number"
      pattern: "FormFiller"
    - from: "src/features/formFilling/pages/FormFillingPage.tsx"
      to: "src/features/formFilling/components/SubmissionSummary.tsx"
      via: "Show confirmation before submit"
      pattern: "SubmissionSummary"
    - from: "src/features/formFilling/pages/FormFillingPage.tsx"
      to: "src/features/formFilling/components/SuccessScreen.tsx"
      via: "Show success after submit"
      pattern: "SuccessScreen"
---

<objective>

Create main form filling page that orchestrates the entire flow: form list, batch prompt, draft picker, form filling, submission confirmation, and success. Integrates all components into complete worker experience.

Purpose: This is the main page for worker form filling. Orchestrates the flow from form selection through submission. Manages state transitions between modals and screens.

Output: FormFillingPage component with full flow orchestration and route integration.
</objective>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-form-filling/03-CONTEXT.md
@.planning/phases/03-form-filling/03-RESEARCH.md
@.planning/phases/03-form-filling/03-form-filling-01-PLAN.md
@.planning/phases/03-form-filling/03-form-filling-07-PLAN.md
@.planning/phases/03-form-filling/03-form-filling-08-PLAN.md
@src/routes/index.tsx
@src/features/formBuilder/types.ts
@src/db/dexie.ts
---
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create FormFillingPage component</name>
  <files>src/features/formFilling/pages/FormFillingPage.tsx</files>
  <action>
    Create src/features/formFilling/pages/FormFillingPage.tsx with:

    1. Page states (discriminated union or enum):
       - 'listing': showing FormList
       - 'batchPrompt': showing BatchNumberPrompt for selected form
       - 'draftPicker': showing DraftPickerModal
       - 'filling': showing FormFiller
       - 'confirming': showing SubmissionSummary
       - 'success': showing SuccessScreen

    2. State:
       - pageState: enum from above
       - selectedForm: FormTemplate | null
       - batchNumber: string | null
       - selectedDraft: Draft | null
       - formData: Record<string, any>

    3. Flow handlers:
       - onFormSelect(form): check for drafts, show prompt or draft picker
       - onBatchNumberSubmit(batch): set batchNumber, transition to filling or draft picker
       - onResumeDraft(draft): load draft data, transition to filling
       - onStartNew(): clear draft, transition to filling
       - onFormSubmit(data): set formData, transition to confirming
       - onConfirmSubmit(): save submission, delete draft, transition to success
       - onSubmitAndStartNew(): save submission, delete draft, show batch prompt for new batch
       - onDone(): return to listing

    4. Submission handling:
       - Create submission object with localId (UUID), templateId, batchNumber, formData, orgId, userId
       - Save to db.submissions with status: 'pending'
       - Add to sync queue: db.syncQueue.add({ operation: 'create', recordType: 'submission', ... })
       - Delete draft if exists: db.drafts.delete(draftId)
       - Trigger sync worker: sync worker auto-processes queue

    5. Render based on pageState:
       - listing: <FormList onFormSelect={handleFormSelect} />
       - batchPrompt: <BatchNumberPrompt formName={selectedForm.name} onSubmit={handleBatchNumber} onCancel={handleCancel} />
       - draftPicker: <DraftPickerModal drafts={drafts} onResume={handleResume} onStartNew={handleStartNew} onCancel={handleCancel} />
       - filling: <FormFiller template={selectedForm} batchNumber={batchNumber} draftId={selectedDraft?.localId} onSubmit={handleSubmit} />
       - confirming: <SubmissionSummary template={selectedForm} formData={formData} batchNumber={batchNumber} onConfirm={handleConfirm} onEdit={handleEdit} />
       - success: <SuccessScreen onDone={handleDone} />

    Import from: All form filling components, db/dexie, formBuilder types, auth hooks for orgId/userId

    Reference: CONTEXT.md specifies complete flow from selection to success. Use Phase 1 sync queue pattern for offline submissions.
  </action>
  <verify>grep -q "FormFillingPage" src/features/formFilling/pages/FormFillingPage.tsx && grep -q "pageState" src/features/formFilling/pages/FormFillingPage.tsx && grep -q "onFormSelect" src/features/formFilling/pages/FormFillingPage.tsx</verify>
  <done>FormFillingPage component created with full flow orchestration</done>
</task>

<task type="auto">
  <name>Task 2: Add worker route</name>
  <files>src/routes/index.tsx</files>
<action>
    Update src/routes/index.tsx:

    1. Add FormFillingPage import:
       import { FormFillingPage } from '@/features/formFilling/pages/FormFillingPage';

    2. Add worker route:
       <Route path="/worker/forms" element={<WorkerRoute><FormFillingPage /></WorkerRoute>} />

    3. Ensure WorkerRoute component exists (from Phase 1):
       - WorkerRoute wraps route, checks useRole().isWorker
       - Redirects to appropriate dashboard if not worker

    Reference: Phase 1 Plan 05 created role-based routing. WorkerRoute should already exist.
  </action>
  <verify>grep -q "/worker/forms" src/routes/index.tsx && grep -q "FormFillingPage" src/routes/index.tsx</verify>
  <done>Worker route added at /worker/forms with FormFillingPage</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. FormFillingPage exists with state-based flow
2. Page transitions work: listing -> batchPrompt/draftPicker -> filling -> confirming -> success
3. Draft picker shows when form has existing drafts
4. Batch number prompt appears after form selection
5. FormFiller loads with template, batch number, optional draft data
6. SubmissionSummary shows before final submit
7. SuccessScreen shows after submit, Done returns to listing
8. "Submit & Start New" returns to batch prompt for new submission
9. Submissions saved to db.submissions with status: 'pending'
10. Sync queue receives create operation for offline sync
11. Drafts deleted after successful submit
12. Worker route exists at /worker/forms
</verification>

<success_criteria>
1. Complete form filling flow works end-to-end
2. Draft recovery functional (resume or start new)
3. Batch number captured before form filling
4. Submission confirmation prevents accidental submits
5. Success screen returns to form list
6. "Submit & Start New" enables rapid batch processing
7. Offline submissions queued for sync
8. Route protected by WorkerRoute component
9. All CONTEXT.md flow specifications met
</success_criteria>

<output>
After completion, create `.planning/phases/03-form-filling/03-form-filling-09-SUMMARY.md`
</output>
