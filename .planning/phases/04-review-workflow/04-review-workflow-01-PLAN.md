---
phase: 04-review-workflow
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - convex/schema.ts
  - convex/submissions.ts
autonomous: true
requirements:
  - REVW-01  # Backend for dashboard query
  - REVW-03  # Backend for approve/reject mutations
  - REVW-04  # Backend for worker submissions query
user_setup: []

must_haves:
  truths:
    - "Reviewer can query pending submissions from Convex"
    - "Reviewer can approve/reject submissions via mutation"
    - "Worker can query their own submission status"
  artifacts:
    - path: "convex/schema.ts"
      provides: "Submissions table with review fields and indexes"
      contains: "submissions: defineTable"
    - path: "convex/submissions.ts"
      provides: "Query and mutation functions for review workflow"
      exports: ["listPendingSubmissions", "getSubmissionDetails", "approveSubmission", "rejectSubmission", "listWorkerSubmissions"]
  key_links:
    - from: "convex/submissions.ts"
      to: "convex/schema.ts"
      via: "v.id('submissions') type reference"
      pattern: "v\\.id\\('submissions'\\)"
---

<objective>
Create Convex backend for review workflow: submissions table schema, reactive queries for pending/worker submissions, and approve/reject mutations.

Purpose: Enable real-time data access for reviewer dashboard and worker status views.
Output: Convex schema extension and submissions.ts with 5 exported functions.
</objective>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04-review-workflow/04-CONTEXT.md
@.planning/phases/04-review-workflow/04-RESEARCH.md
@convex/schema.ts
@convex/formTemplates.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add submissions table to Convex schema</name>
  <files>convex/schema.ts</files>
  <action>
Extend the existing Convex schema with a `submissions` table. Add after the `formTemplates` table definition.

The submissions table must include:
- `batchNumber: v.string()` - Production batch association (OFFL-04)
- `templateId: v.string()` - Reference to form template
- `templateName: v.string()` - Denormalized for display
- `orgId: v.string()` - Organization for multi-tenant isolation
- `userId: v.string()` - Clerk user ID of worker who submitted
- `workerName: v.string()` - Denormalized for display
- `data: v.any()` - Form field values (JSON)
- `photos: v.array(v.string())` - Array of base64 image strings (Phase 3 stores base64, not storage IDs)
- `status: v.string()` - 'pending' | 'approved' | 'rejected'
- `reviewerId: v.optional(v.string())` - Clerk user ID of reviewer
- `reviewerComment: v.optional(v.string())` - Comment from review action
- `reviewedAt: v.optional(v.number())` - Unix timestamp of review
- `createdAt: v.number()` - Unix timestamp
- `updatedAt: v.number()` - Unix timestamp

Add three indexes:
- `by_org_status: ['orgId', 'status']` - For REVW-01 pending dashboard query
- `by_org_user: ['orgId', 'userId']` - For REVW-04 worker status query
- `by_org: ['orgId']` - For general org queries

Follow the pattern from formTemplates table definition in the same file.
  </action>
  <verify>
    <automated>grep -q "submissions: defineTable" convex/schema.ts && grep -q "by_org_status" convex/schema.ts && grep -q "by_org_user" convex/schema.ts</automated>
    <manual>Verify schema compiles without TypeScript errors</manual>
  </verify>
  <done>Submissions table with all fields and three indexes added to schema</done>
</task>

<task type="auto">
  <name>Task 2: Create submissions.ts with queries and mutations</name>
  <files>convex/submissions.ts</files>
  <action>
Create a new Convex functions file for the review workflow. Import from 'convex/server' and 'convex/values'.

Export these 5 functions:

**1. listPendingSubmissions (query)**
- Args: `orgId: v.string()`
- Handler: Verify auth with `ctx.auth.getUserIdentity()`, throw if null
- Query: Use `.withIndex('by_org_status', q => q.eq('orgId', orgId).eq('status', 'pending'))`
- Order: `.order('desc')` for newest first
- Return: `.collect()` array

**2. getSubmissionDetails (query)**
- Args: `id: v.id('submissions')`
- Handler: Verify auth, get submission with `ctx.db.get(id)`
- Return: Full submission object or null

**3. approveSubmission (mutation)**
- Args: `id: v.id('submissions')`, `comment: v.optional(v.string())`
- Handler: Verify auth, get existing submission, validate exists
- Update: Use `ctx.db.patch(id, { status: 'approved', reviewerId: identity.subject, reviewerComment: comment, reviewedAt: Date.now(), updatedAt: Date.now() })`
- Return: `{ success: true, id }`

**4. rejectSubmission (mutation)**
- Args: `id: v.id('submissions')`, `comment: v.string()` (REQUIRED for rejections per CONTEXT.md)
- Handler: Verify auth, get existing submission, validate exists
- Update: Use `ctx.db.patch(id, { status: 'rejected', reviewerId: identity.subject, reviewerComment: comment, reviewedAt: Date.now(), updatedAt: Date.now() })`
- Return: `{ success: true, id }`

**5. listWorkerSubmissions (query)**
- Args: `orgId: v.string()`, `userId: v.string()`
- Handler: Verify auth matches userId (worker can only see their own submissions)
- Query: Use `.withIndex('by_org_user', q => q.eq('orgId', orgId).eq('userId', userId))`
- Order: `.order('desc')` for newest first
- Return: `.collect()` array (limit to 10 with `.take(10)` for worker status view)

Reference patterns from convex/formTemplates.ts for auth checks and query patterns. Reference RESEARCH.md for verified Convex patterns.
  </action>
  <verify>
    <automated>grep -q "export const listPendingSubmissions" convex/submissions.ts && grep -q "export const approveSubmission" convex/submissions.ts && grep -q "export const rejectSubmission" convex/submissions.ts</automated>
    <manual>Run npx convex dev to verify functions deploy without errors</manual>
  </verify>
  <done>All 5 functions exported and deployable to Convex</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. Run `npx convex dev` to deploy schema and functions
2. Check Convex dashboard for submissions table in schema
3. Verify all 5 functions appear in Functions list
</verification>

<success_criteria>
- [ ] Submissions table added to Convex schema with all required fields
- [ ] Three indexes created (by_org_status, by_org_user, by_org)
- [ ] listPendingSubmissions query filters by org and status
- [ ] getSubmissionDetails query returns single submission
- [ ] approveSubmission mutation patches status with optional comment
- [ ] rejectSubmission mutation requires comment and patches status
- [ ] listWorkerSubmissions query returns worker's own submissions (max 10)
- [ ] All functions have auth checks via getUserIdentity()
- [ ] Schema and functions deploy successfully to Convex
</success_criteria>

<output>
After completion, create `.planning/phases/04-review-workflow/04-review-workflow-01-SUMMARY.md`
</output>
