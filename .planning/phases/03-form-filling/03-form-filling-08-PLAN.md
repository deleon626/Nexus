---
phase: 03-form-filling
plan: 08
type: execute
wave: 3
depends_on: [01, 06, 07]
files_modified:
  - src/features/formFilling/components/FormList.tsx
  - src/features/formFilling/components/BatchNumberPrompt.tsx
  - src/features/formFilling/components/DraftPickerModal.tsx
  - src/features/formFilling/components/SuccessScreen.tsx
  - src/features/formFilling/components/SubmissionSummary.tsx
autonomous: true
requirements: [FILL-01]

must_haves:
  truths:
    - Worker sees flat list of published forms with name, version, last updated
    - Recent forms (3 most recent) shown at top, sorted by last filled
    - Search bar filters forms as worker types
    - Tapping form prompts for batch number before showing fields
    - Draft indicator badge shows on forms with in-progress drafts
    - Tapping form with drafts shows modal to resume or start new
    - Offline shows only cached forms with clear indicator
    - Empty state shows "No forms published yet" with contact suggestion
  artifacts:
    - path: "src/features/formFilling/components/FormList.tsx"
      provides: "Form selection list with search and draft indicators"
      min_lines: 60
    - path: "src/features/formFilling/components/BatchNumberPrompt.tsx"
      provides: "Modal for batch number entry before form filling"
      min_lines: 30
    - path: "src/features/formFilling/components/DraftPickerModal.tsx"
      provides: "Modal for choosing resume or start new"
      min_lines: 40
    - path: "src/features/formFilling/components/SuccessScreen.tsx"
      provides: "Post-submit screen with checkmark and Done button"
      min_lines: 20
    - path: "src/features/formFilling/components/SubmissionSummary.tsx"
      provides: "Pre-submit confirmation modal with field summary"
      min_lines: 30
  key_links:
    - from: "src/features/formFilling/components/FormList.tsx"
      to: "src/db/dexie.ts"
      via: "Query templates table and drafts table"
      pattern: "db\\.templates\\.where|db\\.drafts\\.where"
    - from: "src/features/formFilling/components/BatchNumberPrompt.tsx"
      to: "src/features/formFilling/components/FormFiller.tsx"
      via: "Pass batchNumber to FormFiller after prompt"
      pattern: "batchNumber|onBatchNumberSubmit"
    - from: "src/features/formFilling/components/DraftPickerModal.tsx"
      to: "src/db/dexie.ts"
      via: "Query drafts by formId for resume options"
      pattern: "db\\.drafts\\.where.*formId"
---

<objective>

Create form selection UX with search, batch number prompt, draft recovery, and submission confirmation. Provides worker entry point into form filling flow.

Purpose: Workers need to find forms quickly. Search filters in real-time. Batch number is required context. Draft recovery prevents lost work. Confirmation prevents accidental submissions.

Output: FormList with search, BatchNumberPrompt modal, DraftPickerModal, SuccessScreen, SubmissionSummary components.
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
@src/db/dexie.ts
@src/features/formBuilder/types.ts
---
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create FormList component</name>
  <files>src/features/formFilling/components/FormList.tsx</files>
  <action>
    Create src/features/formFilling/components/FormList.tsx with:

    1. State:
       - searchQuery: string (filters forms as user types)
       - templates: Template[] (from Dexie)
       - recentForms: string[] (3 most recently filled form IDs)
       - draftsByForm: Record<string, Draft[]> (for draft badges)

    2. Data loading:
       - useEffect to load from db.templates.where('published').equals(true)
       - Load drafts: db.drafts.toArray() grouped by formId
       - Load recent forms from localStorage (track last filled)

    3. Filtering:
       - Filter templates by searchQuery matching name
       - Separate recent forms (top 3) from other forms
       - Recent forms sorted by last filled timestamp

    4. Render:
       - Search bar at top (always visible)
       - "Recent forms" section if any recent
       - "All forms" section with remaining
       - Each form item: name, version number, last updated date
       - Draft badge if drafts exist for that form
       - Offline indicator: "Offline - showing cached forms" if !isOnline
       - Empty state: "No forms published yet. Contact your admin." per CONTEXT.md

    5. Interactions:
       - Tap form: trigger onFormSelect callback
       - Show badge count if multiple drafts exist

    Reference: CONTEXT.md specifies flat list display, search filters as you type, recent forms at top, draft indicator badge, offline shows cached forms only.
  </action>
  <verify>grep -q "FormList" src/features/formFilling/components/FormList.tsx && grep -q "searchQuery" src/features/formFilling/components/FormList.tsx && grep -q "recentForms" src/features/formFilling/components/FormList.tsx</verify>
  <done>FormList component created with search, recent forms, and draft badges</done>
</task>

<task type="auto">
  <name>Task 2: Create BatchNumberPrompt modal</name>
  <files>src/features/formFilling/components/BatchNumberPrompt.tsx</files>
  <action>
    Create src/features/formFilling/components/BatchNumberPrompt.tsx with:

    1. Props:
       - formName: string (for display)
       - onSubmit: (batchNumber: string) => void
       - onCancel: () => void

    2. Render:
       - Modal overlay (fixed inset-0 with bg-black/50)
       - Content: "Enter batch number for {formName}"
       - Text input for batch number
       - "Continue" button (enabled when input not empty)
       - "Cancel" button

    3. Validation:
       - Batch number required (min length 1)
       - Trim whitespace

    4. Behavior:
       - Appears immediately after form selection per CONTEXT.md
       - Blocks form filling until batch number entered
       - Batch number passed to FormFiller

    Reference: CONTEXT.md specifies "Batch number prompt appears immediately after form selection (before showing fields)".
  </action>
  <verify>grep -q "BatchNumberPrompt" src/features/formFilling/components/BatchNumberPrompt.tsx && grep -q "batchNumber" src/features/formFilling/components/BatchNumberPrompt.tsx</verify>
  <done>BatchNumberPrompt modal created for batch number entry before form filling</done>
</task>

<task type="auto">
  <name>Task 3: Create DraftPickerModal component</name>
  <files>src/features/formFilling/components/DraftPickerModal.tsx</files>
  <action>
    Create src/features/formFilling/components/DraftPickerModal.tsx with:

    1. Props:
       - formName: string
       - drafts: Draft[] (for this form)
       - onResumeDraft: (draft: Draft) => void
       - onStartNew: () => void
       - onCancel: () => void

    2. Render:
       - Modal overlay
       - Title: "Resume draft or start new?"
       - Draft list: each with name ("Form Name - Batch 123 - Feb 27"), last updated time
       - "Start new form" button at bottom
       - "Cancel" button

    3. Draft item:
       - Draft name with batch number and date
       - "X minutes ago" relative time
       - Tap to resume

    4. Behavior:
       - Shown when tapping form with existing drafts per CONTEXT.md
       - onResumeDraft loads draft data into FormFiller
       - onStartNew clears draft selection, opens fresh form
       - Unlimited drafts per form allowed per CONTEXT.md

    Reference: CONTEXT.md specifies "show draft picker modal (resume or start new)", "unlimited drafts per form". Use date-fns formatRelativeTime or similar.
  </action>
  <verify>grep -q "DraftPickerModal" src/features/formFilling/components/DraftPickerModal.tsx && grep -q "onResumeDraft" src/features/formFilling/components/DraftPickerModal.tsx</verify>
  <done>DraftPickerModal component created for resume or start new selection</done>
</task>

<task type="auto">
  <name>Task 4: Create SuccessScreen and SubmissionSummary</name>
  <files>src/features/formFilling/components/SuccessScreen.tsx, src/features/formFilling/components/SubmissionSummary.tsx</files>
  <action>
    Create two submission flow components:

    1. SuccessScreen.tsx:
       - Props: onDone () => void
       - Render: Large checkmark icon, "Form submitted successfully" message, "Done" button
       - Behavior: onDone returns to form list per CONTEXT.md
       - Styling: Centered content, green checkmark

    2. SubmissionSummary.tsx:
       - Props: template: FormTemplate, formData: Record<string, any>, batchNumber: string, onConfirm () => void, onEdit () => void
       - Render: Summary of form data, batch number, field values
       - "Submit" button, "Edit" button
       - Behavior: Pre-submit confirmation per CONTEXT.md
       - Show required fields with values, optional fields collapsed or omitted

    Both components:
       - Modal overlay styling
       - Clear action buttons
       - Accessible labels

    Reference: CONTEXT.md specifies "Confirmation: summary modal before final submit", "Success: success screen with checkmark and Done button".
  </action>
  <verify>grep -q "SuccessScreen" src/features/formFilling/components/SuccessScreen.tsx && grep -q "SubmissionSummary" src/features/formFilling/components/SubmissionSummary.tsx</verify>
  <done>SuccessScreen and SubmissionSummary components created for submission flow</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. FormList shows published forms with name, version, last updated
2. Search bar filters forms in real-time
3. Recent forms (3 most recent) appear at top
4. Draft badge shows on forms with in-progress drafts
5. Offline indicator shows when offline
6. Empty state shows "No forms published yet"
7. BatchNumberPrompt appears after form selection
8. DraftPickerModal offers resume or start new
9. SubmissionSummary shows form data before submit
10. SuccessScreen shows checkmark and Done button
</verification>

<success_criteria>
1. Form selection UX matches CONTEXT.md specifications exactly
2. Search filters as user types (no submit button)
3. Batch number prompt blocks form filling until entered
4. Draft picker shows all drafts with auto-generated names
5. Submission summary confirms data before final submit
6. Success screen returns to form list on Done
7. Offline mode shows only cached forms with indicator
8. Empty state is informative and actionable
</success_criteria>

<output>
After completion, create `.planning/phases/03-form-filling/03-form-filling-08-SUMMARY.md`
</output>
