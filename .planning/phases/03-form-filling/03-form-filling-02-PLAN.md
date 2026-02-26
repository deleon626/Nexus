---
phase: 03-form-filling
plan: 02
type: execute
wave: 1
depends_on: [01]
files_modified:
  - src/features/formFilling/hooks/useFormDraft.ts
  - src/features/formFilling/hooks/useFormProgress.ts
autonomous: true
requirements: [FILL-01, FILL-04]

must_haves:
  truths:
    - Form data auto-saves every 30 seconds without user intervention
    - Progress bar shows accurate percentage of required fields completed
    - Drafts are stored with auto-generated names: "Form Name - Batch 123 - Feb 27"
    - Draft list can be queried by formId to show existing drafts for resume
  artifacts:
    - path: "src/features/formFilling/hooks/useFormDraft.ts"
      provides: "Auto-save hook with 30-second interval"
      min_lines: 40
      exports: ["useFormDraft"]
    - path: "src/features/formFilling/hooks/useFormProgress.ts"
      provides: "Progress calculation based on required fields"
      min_lines: 30
      exports: ["useFormProgress"]
  key_links:
    - from: "src/features/formFilling/hooks/useFormDraft.ts"
      to: "src/db/dexie.ts"
      via: "db.drafts.put() with interval"
      pattern: "setInterval.*30000|db\\.drafts\\.put"
    - from: "src/features/formFilling/hooks/useFormProgress.ts"
      to: "src/features/formBuilder/types.ts"
      via: "FormTemplate fields array for required field counting"
      pattern: "fields\\.filter.*required|formTemplate\\.fields"
    - from: "src/features/formFilling/hooks/useFormProgress.ts"
      to: "src/features/formFilling/constants.ts"
      via: "Import field calculation logic"
      pattern: "calculateProgress"
---

<objective>

Create auto-save hook for draft persistence and progress calculation hook for completion tracking. These hooks provide core form filling behavior: data protection via periodic saves and user feedback via progress indicator.

Purpose: Workers need visibility into completion status and protection against data loss. Auto-save runs transparently. Progress bar motivates completion.

Output: useFormDraft hook with 30-second interval, useFormProgress hook with percentage calculation.
</objective>

---
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
@src/features/formBuilder/types.ts
@src/features/formFilling/types.ts
@src/features/formFilling/constants.ts
@src/db/dexie.ts
@src/db/types.ts
---
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create useFormDraft hook</name>
  <files>src/features/formFilling/hooks/useFormDraft.ts</files>
  <action>
    Create src/features/formFilling/hooks/useFormDraft.ts with:

    1. Hook signature: useFormDraft(formId: string, formName: string, batchNumber: string, formData: Record<string, any>)

    2. Auto-save behavior:
       - useEffect with setInterval running every AUTOSAVE_INTERVAL_MS (30000)
       - On interval: generate draft name using format(new Date(), 'MMM dd') from date-fns
       - db.drafts.put() with localId (crypto.randomUUID()), formId, formName, batchNumber, formData, orgId, userId, expiresAt (Date.now() + DRAFT_EXPIRY_MS)
       - Cleanup interval on unmount

    3. Draft management functions:
       - saveDraft(): manual save trigger (for submit/cancel)
       - deleteDraft(): remove current draft
       - getDraftsByForm(formId): query existing drafts for resume modal

    4. Import from: @/db/dexie (db), @/features/formFilling/types (Draft), @/features/formFilling/constants (DRAFT_EXPIRY_MS, AUTOSAVE_INTERVAL_MS), @/features/formBuilder/types (FormTemplate for type ref), date-fns/format

    Reference: 03-RESEARCH.md Pattern 2 "Draft Auto-Save with Dexie" example. Use crypto.randomUUID() for localId generation per Phase 1 pattern.
  </action>
  <verify>grep -q "useFormDraft" src/features/formFilling/hooks/useFormDraft.ts && grep -q "setInterval" src/features/formFilling/hooks/useFormDraft.ts && grep -q "AUTOSAVE_INTERVAL_MS" src/features/formFilling/hooks/useFormDraft.ts</verify>
  <done>useFormDraft hook created with 30-second auto-save interval and draft management functions</done>
</task>

<task type="auto">
  <name>Task 2: Create useFormProgress hook</name>
  <files>src/features/formFilling/hooks/useFormProgress.ts</files>
  <action>
    Create src/features/formFilling/hooks/useFormProgress.ts with:

    1. Hook signature: useFormProgress(template: FormTemplate, values: Record<string, any>)

    2. Progress calculation:
       - Filter template.fields for required fields (field.required === true)
       - Count how many required fields have non-empty values (not undefined, not null, not '')
       - Calculate percentage: Math.round((filledRequired / totalRequired) * 100)
       - Return object: { completed: number, total: number, percentage: number }

    3. Value checking logic:
       - String/number: value !== undefined && value !== null && value !== ''
       - Array (checkbox): Array.isArray(value) && value.length > 0
       - Pass/fail: value === 'pass' || value === 'fail'

    4. Import from: @/features/formBuilder/types (FormTemplate, FormField)

    Reference: 03-RESEARCH.md "Progress Calculation for Form Completion" example. CONTEXT.md specifies "X/Y fields filled" format.
  </action>
  <verify>grep -q "useFormProgress" src/features/formFilling/hooks/useFormProgress.ts && grep -q "calculateProgress" src/features/formFilling/hooks/useFormProgress.ts && grep -q "required" src/features/formFilling/hooks/useFormProgress.ts</verify>
  <done>useFormProgress hook created with accurate required-field completion calculation</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. useFormDraft hook exists with setInterval for 30-second auto-save
2. Draft names follow format: "Form Name - Batch 123 - Feb 27"
3. useFormProgress calculates percentage based on required fields only
4. Draft expiresAt calculated as Date.now() + DRAFT_EXPIRY_MS (7 days)
5. TypeScript compilation passes
</verification>

<success_criteria>
1. Auto-save runs every 30 seconds via setInterval
2. Draft stored with auto-generated name using date-fns format
3. Progress percentage calculated from required fields (not optional)
4. Draft management functions (save, delete, query by form) exported
5. Hooks ready for integration in FormFiller component (Plan 04)
</success_criteria>

<output>
After completion, create `.planning/phases/03-form-filling/03-form-filling-02-SUMMARY.md`
</output>
