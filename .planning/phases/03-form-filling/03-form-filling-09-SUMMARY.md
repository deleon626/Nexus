---
phase: 03-form-filling
plan: 09
title: "Main Page Flow Orchestration"
oneLiner: "Created FormFillingPage with state-based flow orchestration and worker route integration"
completedDate: 2026-02-27
duration: 120
tasksCompleted: 2
filesCreated: 1
filesModified: 1

commits:
  - hash: 84b591b
    message: feat(03-form-filling-09): create FormFillingPage component
  - hash: 8460282
    message: feat(03-form-filling-09): add worker route with FormFillingPage

requirements:
  - id: FILL-01
    status: complete
    note: Form field components integrated into FormFiller
  - id: FILL-02
    status: complete
    note: Photo capture integrated in FormFiller
  - id: FILL-03
    status: complete
    note: Voice input integrated in FormFiller
  - id: FILL-04
    status: complete
    note: Form validation errors on blur implemented in FormFiller

decisions: []
metrics:
  - { label: "Component states", value: "6 (listing, batchPrompt, draftPicker, filling, confirming, success)" }
  - { label: "Flow handlers", value: "9" }
  - { label: "Components integrated", value: "6" }

techStack:
  added: []
  patterns:
    - "State-based page flow with discriminated union types"
    - "Submission handling with sync queue pattern"
    - "Draft lifecycle management (create, load, delete)"

keyFiles:
  created:
    - path: "src/features/formFilling/pages/FormFillingPage.tsx"
      provides: "Main page orchestrating form filling flow with state transitions"
      lines: 393
  modified:
    - path: "src/routes/index.tsx"
      change: "Replaced WorkerForms with FormFillingPage at /worker/forms route"

dependencyGraph:
  provides:
    - { type: "page", id: "worker-forms", description: "Worker form filling page" }
  requires:
    - { type: "component", id: "FormList", from: "03-form-filling-08" }
    - { type: "component", id: "BatchNumberPrompt", from: "03-form-filling-08" }
    - { type: "component", id: "DraftPickerModal", from: "03-form-filling-08" }
    - { type: "component", id: "FormFiller", from: "03-form-filling-07" }
    - { type: "component", id: "SubmissionSummary", from: "03-form-filling-08" }
    - { type: "component", id: "SuccessScreen", from: "03-form-filling-08" }
    - { type: "hook", id: "useAuth", from: "01-foundation-auth" }
  affects:
    - { type: "route", id: "worker-forms-route", description: "/worker/forms route" }

deviations: []
---

# Phase 03 - Plan 09: Main Page Flow Orchestration Summary

## Overview

Created the main FormFillingPage component that orchestrates the entire worker form filling flow from form selection through submission. Implemented state-based page transitions with proper submission handling, draft management, and sync queue integration.

## What Was Built

### 1. FormFillingPage Component (Task 1)

**File:** `src/features/formFilling/pages/FormFillingPage.tsx` (393 lines)

The main page that orchestrates the complete form filling workflow:

- **Page States (discriminated union):**
  - `listing` - Showing FormList with search and recent forms
  - `batchPrompt` - Showing BatchNumberPrompt for batch entry
  - `draftPicker` - Showing DraftPickerModal for resume/start new selection
  - `filling` - Showing FormFiller with the form fields
  - `confirming` - Showing SubmissionSummary before final submit
  - `success` - Showing SuccessScreen after submission

- **Flow Handlers:**
  - `handleFormSelect` - Loads template, checks for drafts, transitions to batch prompt or draft picker
  - `handleBatchNumberSubmit` - Stores batch number, transitions to filling
  - `handleResumeDraft` - Loads draft data and batch number, transitions to filling
  - `handleStartNew` - Clears draft state, shows batch prompt
  - `handleFormSubmit` - Stores form data, transitions to confirmation
  - `handleConfirmSubmit` - Saves submission to db, adds to sync queue, deletes draft, shows success
  - `handleSubmitAndStartNew` - Saves submission, deletes draft, returns to batch prompt for new batch
  - `handleEdit` - Returns to filling state from confirmation
  - `handleDone` - Returns to listing state from success screen

- **Submission Handling:**
  - Creates submission object with UUID (localId), templateId, batchNumber, formData, orgId, userId
  - Saves to `db.submissions` with status: 'pending'
  - Adds to sync queue with operation: 'create', recordType: 'submission'
  - Deletes draft if one exists
  - Sync worker auto-processes queue

- **Draft Management:**
  - Loads existing drafts from Dexie when form is selected
  - Passes drafts to DraftPickerModal for user selection
  - Loads draft data into form when resuming
  - Deletes draft after successful submission

### 2. Worker Route Update (Task 2)

**File:** `src/routes/index.tsx`

Updated the `/worker/forms` route to use FormFillingPage instead of the placeholder WorkerForms component:

```tsx
<Route
  path="/worker/forms"
  element={
    <WorkerRoute>
      <FormFillingPage />
    </WorkerRoute>
  }
/>
```

WorkerRoute protection was already implemented in Phase 01.

## Technical Implementation Details

### State Management Pattern

Used a discriminated union type for page state:

```typescript
type PageState =
  | 'listing'
  | 'batchPrompt'
  | 'draftPicker'
  | 'filling'
  | 'confirming'
  | 'success';
```

This ensures type-safe state transitions and prevents invalid state combinations.

### Template Loading

Form templates are loaded from Dexie (offline cache) and converted from the database `Template` type to the form builder `FormTemplate` type for consistency with field components.

### Sync Queue Pattern

Submissions are saved locally and queued for sync using the Phase 01 pattern:

1. Save to `db.submissions` with `status: 'pending'`
2. Add to `db.syncQueue` with operation details
3. Delete associated draft
4. Sync worker processes queue when online

### "Submit & Start New" Flow

Enables rapid batch processing for factory floor workers:

1. User fills form and clicks "Submit & Start New"
2. Submission is saved and queued
3. Form state is cleared
4. Batch prompt is shown again for next batch
5. Same form template is reused

## Flow Diagram

```
┌─────────────────┐
│  Form List      │  ← Worker starts here
└────────┬────────┘
         │ onFormSelect(form)
         ▼
    ┌─────────────┐
    │ Check       │
    │ Drafts?     │
    └──┬──────┬───┘
       │ Yes  │ No
       ▼      ▼
  ┌────────┐ ┌────────────────┐
  │ Draft  │ │ Batch Number   │
  │ Picker │ │ Prompt         │
  └───┬────┘ └────┬───────────┘
      │ Resume    │ Batch entered
      │ or Start  │
      │ New       ▼
      │      ┌───────────┐
      └──────│ Form      │─────────────┐
             │ Filler    │             │
             └─────┬─────┘             │
                   │ Submit            │
                   ▼                   │ Submit & Start New
              ┌─────────┐              │
              │ Confirm │              │
              │ Summary │              │
              └────┬────┘              │
                   │ Confirm           │
                   ▼                   ▼
              ┌─────────┐      ┌────────────────┐
              │ Success │      │ Batch Prompt   │ (for new batch)
              │ Screen  │      │ (same form)    │
              └────┬────┘      └────────────────┘
                   │
                   │ Done
                   ▼
              ┌─────────┐
              │ Form    │ (back to start)
              │ List    │
              └─────────┘
```

## Dependencies

### Components Used

All components were built in previous plans within Phase 03:

- `FormList` - Form selection with search (Plan 08)
- `BatchNumberPrompt` - Batch number entry modal (Plan 08)
- `DraftPickerModal` - Draft resume/start new modal (Plan 08)
- `FormFiller` - Main form filling container (Plan 07)
- `SubmissionSummary` - Pre-submit confirmation (Plan 08)
- `SuccessScreen` - Post-submit success screen (Plan 08)

### Database Tables

- `db.templates` - Form template cache
- `db.drafts` - Auto-saved form drafts
- `db.submissions` - Submitted form data
- `db.syncQueue` - Offline sync operations

### Auth Context

- `useAuth()` - Provides userId and orgId for submission data

## Deviations from Plan

None - the plan was executed exactly as written.

## Success Criteria Met

- [x] Complete form filling flow works end-to-end
- [x] Draft recovery functional (resume or start new)
- [x] Batch number captured before form filling
- [x] Submission confirmation prevents accidental submits
- [x] Success screen returns to form list
- [x] "Submit & Start New" enables rapid batch processing
- [x] Offline submissions queued for sync
- [x] Route protected by WorkerRoute component
- [x] All CONTEXT.md flow specifications met

## Files Modified/Created

| File | Action | Lines |
|------|--------|-------|
| `src/features/formFilling/pages/FormFillingPage.tsx` | Created | 393 |
| `src/routes/index.tsx` | Modified | 2 |

## Next Steps

Phase 03 is now complete. The next phase would be Phase 04 (Form Review) for implementing the reviewer dashboard and submission review workflow.
