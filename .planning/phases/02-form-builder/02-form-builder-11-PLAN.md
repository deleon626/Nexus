---
phase: 02-form-builder
plan: 11
type: execute
wave: 3
depends_on: [08, 09, 10]
files_modified:
  - convex/schema.ts
  - convex/functions.ts
  - src/db/dexie.ts
  - src/features/formBuilder/components/FormTemplatesList.tsx
  - src/routes/admin/builder.tsx
  - src/lib/convex.ts
  - src/features/formBuilder/hooks/useTemplatePersistence.ts
autonomous: true
requirements:
  - FORM-01
  - FORM-03
  - FORM-04

must_haves:
  truths:
    - "Admin can save form templates to Convex backend"
    - "Admin can publish/unpublish templates"
    - "Published templates increment version number automatically"
    - "Admin can see list of saved templates in org"
    - "Published templates are cached in Dexie for offline access"
    - "Convex validates field schemas server-side"
  artifacts:
    - path: "convex/schema.ts"
      provides: "Convex schema with formTemplates table"
      contains: "defineTable({ name, version, orgId, fields, published, createdBy, publishedAt })"
    - path: "convex/functions.ts"
      provides: "Convex functions for template CRUD"
      exports: ["createTemplate", "updateTemplate", "publishTemplate", "unpublishTemplate", "listTemplates", "getTemplate"]
    - path: "src/db/dexie.ts"
      provides: "Extended Dexie schema for form templates"
      contains: "templates: Table<Template> with version index"
    - path: "src/features/formBuilder/components/FormTemplatesList.tsx"
      provides: "Template list component for admin"
    - path: "src/features/formBuilder/hooks/useTemplatePersistence.ts"
      provides: "Hook for saving/loading templates"
  key_links:
    - from: "convex/schema.ts"
      to: "src/features/formBuilder/types.ts"
      via: "FormTemplate type mapping"
      pattern: "v\\.object\\(\\{.*name.*version.*fields"
    - from: "src/routes/admin/builder.tsx"
      to: "src/features/formBuilder/hooks/useTemplatePersistence.ts"
      via: "useTemplatePersistence hook"
      pattern: "useTemplatePersistence\\(\\)"
    - from: "src/features/formBuilder/hooks/useTemplatePersistence.ts"
      to: "convex/functions.ts"
      via: "Convex mutation calls"
      pattern: "mutation.*createTemplate|updateTemplate"

---

<objective>
Implement Convex backend for form template storage with version tracking, server-side validation, and offline caching.

**Purpose:** FORM-04 requires template version tracking. FORM-03 requires server-side validation. Convex provides ACID transactions for template storage. Dexie extends templates table for offline caching. This plan connects the frontend builder to persistent backend storage.

**Output:**
- Convex schema with formTemplates table (version, orgId, fields array, published flag)
- Convex functions: create, update, publish, unpublish, list, get templates
- Server-side validation using Convex v.* validators
- Dexie templates table extended for offline caching
- useTemplatePersistence hook for save/load operations
- FormTemplatesList component for viewing saved templates
</objective>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-form-builder/02-RESEARCH.md
@src/db/dexie.ts
@src/db/types.ts
@src/features/formBuilder/types.ts
@src/lib/convex.ts

# Phase 1 Convex patterns
@.planning/phases/01-foundation-auth/01-foundation-auth-04-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Create Convex schema and functions for templates</name>
  <files>convex/schema.ts, convex/functions.ts</files>
  <action>
    Create Convex backend for form template storage. Follow the research pattern from 02-RESEARCH.md "Convex Schema for Form Templates".

    Create convex directory:
    ```bash
    mkdir -p /Users/dennyleonardo/Code/nexus/convex
    ```

    **convex/schema.ts**:
    1. Import { defineSchema, defineTable } from 'convex/server'
    2. Import { v } from 'convex/values'
    3. Export default defineSchema with formTemplates table:
       - name: v.string()
       - version: v.number()
       - orgId: v.id('organizations')
       - fields: v.array(v.object({
           id: v.string(),
           type: v.string(),
           label: v.string(),
           required: v.boolean(),
           placeholder: v.optional(v.string()),
           helpText: v.optional(v.string()),
           validation: v.optional(v.any()), // Field-specific validation
           options: v.optional(v.array(v.object({
             value: v.string(),
             label: v.string(),
           }))),
           passLabel: v.optional(v.string()),
           failLabel: v.optional(v.string()),
           rows: v.optional(v.number()),
         }))
       - published: v.boolean()
       - createdBy: v.id('users')
       - publishedAt: v.optional(v.number())
       - createdAt: v.number()
       - updatedAt: v.number()
    4. Add indexes: by_org (orgId), by_org_published (orgId, published)
    5. Note: Schema extends Phase 1 organizations and users tables (if they exist)

    **convex/functions.ts**:
    1. Import { query, mutation } from 'convex/server'
    2. Import { v } from 'convex/values'
    3. Define validation schema for create/update using v.object()

    **Queries**:
    - listTemplates: query({ orgId: v.string() })
      - Returns templates filtered by orgId, sorted by updatedAt desc
      - Use ctx.db.query('formTemplates').withIndex('by_org', q => q.eq('orgId', orgId)).order('desc').collect()

    - getTemplate: query({ id: v.id('formTemplates') })
      - Returns template by id
      - Use ctx.db.get(id)

    **Mutations**:
    - createTemplate: mutation({
        name: v.string(),
        orgId: v.string(),
        fields: v.array(v.any()), // Simplified for v1
        published: v.boolean(),
      })
      - Get userId from ctx.auth
      - Insert template with version: 1, createdAt: Date.now(), updatedAt: Date.now(), createdBy, publishedAt: published ? Date.now() : undefined
      - Return inserted template id

    - updateTemplate: mutation({
        id: v.id('formTemplates'),
        name: v.optional(v.string()),
        fields: v.optional(v.array(v.any())),
        published: v.optional(v.boolean()),
      })
      - Get existing template
      - Check orgId matches auth token (AUTH-03)
      - Update with new values, updatedAt: Date.now()
      - If published changed from false to true, set publishedAt, increment version
      - Return updated template

    - publishTemplate: mutation({ id: v.id('formTemplates') })
      - Get existing template
      - Check orgId matches auth token
      - Set published: true, publishedAt: Date.now(), increment version
      - Return updated template

    - unpublishTemplate: mutation({ id: v.id('formTemplates') })
      - Get existing template
      - Check orgId matches auth token
      - Set published: false, publishedAt: undefined
      - Return updated template

    - deleteTemplate: mutation({ id: v.id('formTemplates') })
      - Get existing template
      - Check orgId matches auth token
      - Delete template
      - Return success

    Pattern note: Use ctx.auth.getUserIdentity() to get Clerk user ID for orgId lookup.
  </action>
  <verify>
    <automated>cd /Users/dennyleonardo/Code/nexus && npx convex dev 2>&1 | head -30</automated>
  </verify>
  <done>Convex dev starts successfully, schema validates without errors</done>
</task>

<task type="auto">
  <name>Extend Dexie schema and create persistence hook</name>
  <files>src/db/dexie.ts, src/features/formBuilder/hooks/useTemplatePersistence.ts</files>
  <action>
    Extend the Dexie schema for form templates and create a hook for saving/loading templates.

    **Update src/db/dexie.ts**:
    1. The templates table already exists from Phase 1
    2. Update the Template type in types.ts to match FormTemplate from formBuilder/types.ts
    3. Ensure templates table has index: 'id, name, version, orgId, published, updatedAt'
    4. No schema version increment needed (Template type is compatible)

    **Create src/features/formBuilder/hooks/useTemplatePersistence.ts**:
    1. Import { useMutation, useQuery } from 'convex/react'
    2. Import { api } from '@/lib/convex'
    3. Import { db } from '@/db/dexie'
    4. Import { useFormBuilderStore } from '@/features/formBuilder/store/formBuilderStore'
    5. Import type { FormTemplate } from '@/features/formBuilder/types'

    Define hook returning:
    - saveTemplate: async () => Promise<string>
      - Gets current state from useFormBuilderStore
      - Calls createTemplate or updateTemplate mutation
      - Saves result to Dexie templates table for offline
      - Returns template id

    - loadTemplate: async (id: string) => Promise<void>
      - Tries Dexie first (offline)
      - Falls back to Convex query if online
      - Loads into useFormBuilderStore via loadTemplate action
      - Saves to Dexie if loaded from Convex

    - publishTemplate: async (id: string) => Promise<void>
      - Calls publishTemplate mutation
      - Updates local store and Dexie entry

    - unpublishTemplate: async (id: string) => Promise<void>
      - Calls unpublishTemplate mutation
      - Updates local store and Dexie entry

    - listTemplates: () => UseQueryResult<FormTemplate[]>
      - Queries Convex for templates by orgId
      - Caches results in Dexie for offline access

    Use api.functions.{listTemplates, getTemplate, createTemplate, updateTemplate, publishTemplate} to call Convex functions.

    Pattern note: Always cache to Dexie after successful Convex operations for offline access (OFFL-01).
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>useTemplatePersistence hook compiles with Convex and Dexie integration</done>
</task>

<task type="auto">
  <name>Create templates list and update builder route</name>
  <files>
    src/features/formBuilder/components/FormTemplatesList.tsx
    src/routes/admin/builder.tsx
  </files>
  <action>
    Create the templates list component and wire up persistence in the builder route.

    **FormTemplatesList.tsx**:
    1. Import useTemplatePersistence, useAuth
    2. Use listTemplates() query to get templates
    3. Render: Card with "Saved Templates" header
    4. Table or list of templates with columns:
       - Name
       - Version
       - Status (Published/Draft badge)
       - Updated (relative time)
       - Actions: Load, Delete buttons
    5. Load button: Calls loadTemplate(template.id)
    6. Delete button: Confirm dialog, then deleteTemplate mutation
    7. Empty state: "No templates yet. Create your first form."
    8. Classes: max-h-96 overflow-y-auto

    **Update builder.tsx**:
    1. Import useTemplatePersistence
    2. Import FormTemplatesList
    3. Add template list panel (collapsible or separate tab)
    4. Wire up Save button:
       - If template.id exists: updateTemplate
       - Else: createTemplate
       - Show success/error toast
    5. Wire up Publish button:
       - Toggle published status
       - Call publishTemplate or unpublishTemplate
       - Show version number: "v{template.version}"
    6. Wire up Load button in templates list
    7. Add isNew state for distinguishing create vs update

    Use lucide-react icons: Save, Upload, Download, Trash2, Eye, EyeOff.

    Pattern note: Use confirmation dialog (window.confirm or custom) before delete.
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>Templates list renders, Save/Publish buttons call persistence hook</done>
</task>

</tasks>

<verification>
After all tasks complete, verify:
1. Convex dev runs without schema errors
2. Templates can be saved to Convex and appear in templates list
3. Published templates show "Published" badge with version number
4. Loading a template populates the builder canvas
5. Templates are cached in Dexie for offline access
6. Version number increments on publish
7. Server-side validation rejects invalid field schemas
</verification>

<success_criteria>
- [ ] convex/schema.ts defines formTemplates table with version index
- [ ] convex/functions.ts exports createTemplate, updateTemplate, publishTemplate, unpublishTemplate, listTemplates, getTemplate
- [ ] useTemplatePersistence hook integrates Convex and Dexie
- [ ] FormTemplatesList shows templates with version and published status
- [ ] Save button creates/updates template in Convex
- [ ] Publish button increments version and sets published flag
- [ ] Templates are cached in Dexie for offline access
- [ ] TypeScript compilation succeeds
</success_criteria>

<output>
After completion, create `.planning/phases/02-form-builder/02-form-builder-11-SUMMARY.md`
</output>
