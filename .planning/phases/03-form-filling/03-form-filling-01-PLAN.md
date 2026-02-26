---
phase: 03-form-filling
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/db/types.ts
  - src/db/dexie.ts
  - src/features/formFilling/types.ts
  - src/features/formFilling/constants.ts
autonomous: true
requirements: [FILL-01, FILL-02, FILL-03, FILL-04]

must_haves:
  truths:
    - Worker can select a published form from a list and enter a batch number
    - Worker's form data auto-saves every 30 seconds to prevent data loss
    - Drafts expire after 7 days and are automatically cleaned up
    - Worker sees in-progress drafts and can resume or start new
  artifacts:
    - path: "src/db/types.ts"
      provides: "Draft type definition for auto-save functionality"
      contains: "export interface Draft"
    - path: "src/db/dexie.ts"
      provides: "Dexie drafts table with indexes for querying"
      exports: ["drafts"]
    - path: "src/features/formFilling/types.ts"
      provides: "Form filling state types and draft interfaces"
      min_lines: 30
    - path: "src/features/formFilling/constants.ts"
      provides: "Draft expiration, auto-save interval constants"
      exports: ["DRAFT_EXPIRY_MS", "AUTOSAVE_INTERVAL_MS"]
  key_links:
    - from: "src/features/formFilling/hooks/useFormDraft.ts"
      to: "src/db/dexie.ts"
      via: "db.drafts.put() for auto-save, db.drafts.where() for queries"
      pattern: "db\\.drafts\\.(put|where|delete)"
    - from: "src/features/formFilling/hooks/useFormDraft.ts"
      to: "src/features/formFilling/constants.ts"
      via: "Import DRAFT_EXPIRY_MS, AUTOSAVE_INTERVAL_MS"
      pattern: "DRAFT_EXPIRY_MS|AUTOSAVE_INTERVAL_MS"
---

<objective>
Create the draft persistence layer with Dexie schema, type definitions, and constants for auto-save behavior. This establishes the foundation for form filling sessions with data protection via periodic saves.

Purpose: Workers may close the app unexpectedly (battery, network issues). Auto-save prevents data loss. Expiration prevents stale drafts from cluttering the database.

Output: Draft table in IndexedDB, type definitions, constants for timing, draft cleanup utility.
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
@.planning/phases/01-foundation-auth/01-foundation-auth-03-SUMMARY.md
@src/db/types.ts
@src/db/dexie.ts
@src/features/formBuilder/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Draft type and Dexie table</name>
  <files>src/db/types.ts, src/db/dexie.ts</files>
  <action>
    1. In src/db/types.ts, add Draft interface:
       - localId: string (UUID)
       - formId: string (template ID)
       - formName: string (for display)
       - batchNumber: string
       - formData: Record<string, any> (field values)
       - orgId: string (multi-tenant isolation)
       - userId: string (Clerk user ID)
       - expiresAt: number (timestamp for 7-day expiry)
       - createdAt: Date
       - updatedAt: Date

    2. In src/db/dexie.ts:
       - Add drafts!: Table<Draft> to NexusDB class
       - Create version 2 schema (increment from version 1)
       - Add drafts table indexes: '++id, localId, formId, batchNumber, orgId, userId, expiresAt, createdAt'
       - Keep all existing tables intact (submissions, templates, syncQueue, organizations)

    Pattern: Follow existing Submission/Template patterns for consistency. Use localId (UUID) for client-side identification per Phase 1 pattern.
  </action>
  <verify>grep -q "export interface Draft" src/db/types.ts && grep -q "drafts!:" src/db/dexie.ts && grep -q "version(2)" src/db/dexie.ts</verify>
  <done>Draft interface defined in types.ts, drafts table added to Dexie with version 2 schema</done>
</task>

<task type="auto">
  <name>Task 2: Create form filling types and constants</name>
  <files>src/features/formFilling/types.ts, src/features/formFilling/constants.ts</files>
  <action>
    1. Create src/features/formFilling/types.ts:
       - FormSession type: tracks active form filling session (formId, batchNumber, draftId, isResumed)
       - FormFieldValue type: union of string | number | string[] | 'pass' | 'fail' (for all field types)
       - FormProgress type: completed, total fields, percentage

    2. Create src/features/formFilling/constants.ts:
       - DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 (7 days per CONTEXT.md)
       - AUTOSAVE_INTERVAL_MS = 30000 (30 seconds per CONTEXT.md)
       - MAX_DRAFTS_PER_FORM = undefined (unlimited per CONTEXT.md)
       - DRAFT_NAME_FORMAT = "{formName} - Batch {batchNumber} - {MMM dd}" (auto-generated)

    Reference: Use date-fns format() function (already installed per Phase 2 history) for draft naming.
  </action>
  <verify>grep -q "DRAFT_EXPIRY_MS" src/features/formFilling/constants.ts && grep -q "FormSession" src/features/formFilling/types.ts</verify>
  <done>Type definitions and constants created for form filling sessions</done>
</task>

<task type="auto">
  <name>Task 3: Create draft cleanup utility</name>
  <files>src/features/formFilling/utils/cleanupExpiredDrafts.ts</files>
  <action>
    Create src/features/formFilling/utils/cleanupExpiredDrafts.ts:
    - cleanupExpiredDrafts() function that queries db.drafts.where('expiresAt').below(Date.now()).delete()
    - Export function to be called on app initialization

    Pattern: Follows Phase 1 sync worker pattern for IndexedDB operations. Uses Dexie's where() clause for efficient querying.

    Reference: 03-RESEARCH.md "Cleanup Expired Drafts on App Load" example.
  </action>
  <verify>grep -q "cleanupExpiredDrafts" src/features/formFilling/utils/cleanupExpiredDrafts.ts && grep -q "expiresAt" src/features/formFilling/utils/cleanupExpiredDrafts.ts</verify>
  <done>Draft cleanup utility created to auto-delete expired drafts on app load</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. TypeScript compilation passes: npx tsc --noEmit
2. Draft type includes all required fields (localId, formId, batchNumber, formData, expiresAt)
3. Dexie version 2 schema includes drafts table with proper indexes
4. Constants match CONTEXT.md specifications (7 days, 30 seconds)
5. Draft cleanup utility uses Dexie where() clause for efficient deletion
</verification>

<success_criteria>
1. Draft interface exists with 7-day expiration support
2. Dexie version 2 schema includes drafts table with indexes for querying by formId, batchNumber, expiresAt
3. Form filling types define session state and field values
4. Constants define auto-save interval (30s) and expiry (7 days) per CONTEXT.md
5. Draft cleanup utility ready for app initialization hook
</success_criteria>

<output>
After completion, create `.planning/phases/03-form-filling/03-form-filling-01-SUMMARY.md`
</output>
