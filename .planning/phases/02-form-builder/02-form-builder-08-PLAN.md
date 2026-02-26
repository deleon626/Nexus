---
phase: 02-form-builder
plan: 08
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/formBuilder/types.ts
  - src/features/formBuilder/schema/fieldTypes.ts
  - src/features/formBuilder/schema/validationSchemas.ts
  - src/features/formBuilder/schema/templateSchema.ts
  - package.json
autonomous: true
requirements:
  - FORM-02
  - FORM-03

must_haves:
  truths:
    - "Admin can select from 10 core field types when building forms"
    - "Each field type has type-safe configuration (text has min/pattern, number has min/max, select has options)"
    - "Form templates are JSON Schema compatible for client/server validation"
    - "Zod schemas provide runtime validation with TypeScript type inference"
  artifacts:
    - path: "src/features/formBuilder/types.ts"
      provides: "Form field discriminated union types"
      exports: ["FieldType", "FormField", "FormTemplate"]
    - path: "src/features/formBuilder/schema/fieldTypes.ts"
      provides: "10 core field type definitions"
      contains: "TextField, NumberField, DecimalField, DateField, TimeField, SelectField, CheckboxField, PassFailField, TextareaField, PhotoField"
    - path: "src/features/formBuilder/schema/validationSchemas.ts"
      provides: "Zod schemas for runtime validation"
      exports: ["formFieldSchema", "formTemplateSchema"]
    - path: "package.json"
      provides: "Dependencies for form builder"
      contains: "zustand, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, zod"
  key_links:
    - from: "src/features/formBuilder/schema/validationSchemas.ts"
      to: "src/features/formBuilder/types.ts"
      via: "z.infer<typeof formTemplateSchema>"
      pattern: "type FormTemplate = z\\.infer<"

---

<objective>
Define the type-safe form schema foundation using discriminated unions for 10 core field types with Zod validation.

**Purpose:** FORM-02 requires 10 field types, FORM-03 requires validation rules. JSON Schema + Zod discriminated unions provide type-safe field definitions that work both client-side (rendering) and server-side (Convex validation).

**Output:**
- Form field discriminated union types (text, number, decimal, date, time, select, checkbox, passFail, textarea, photo)
- Zod validation schemas for each field type
- Complete FormTemplate type with version tracking
- Installed dependencies (@dnd-kit, zustand, zod)
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
@src/db/types.ts
@src/lib/utils.ts

# Pattern from Phase 1
@.planning/phases/01-foundation-auth/01-foundation-auth-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Install form builder dependencies</name>
  <files>package.json</files>
  <action>
    Install required packages for drag-and-drop, state management, and validation:

    ```bash
    npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand zod
    ```

    This installs:
    - @dnd-kit/core ^6.x - Drag-and-drop primitives
    - @dnd-kit/sortable ^8.x - Sortable list functionality
    - @dnd-kit/utilities ^3.x - CSS transform utilities
    - zustand ^5.x - Form builder state management
    - zod ^3.x - Schema validation runtime

    Do NOT install react-beautiful-dnd (deprecated) or Yup (inferior TypeScript inference).
  </action>
  <verify>grep -E '"@dnd-kit/(core|sortable|utilities)"|"zustand"|"zod"' /Users/dennyleonardo/Code/nexus/package.json</verify>
  <done>All required dependencies are present in package.json dependencies</done>
</task>

<task type="auto">
  <name>Create discriminated union field types</name>
  <files>src/features/formBuilder/types.ts</files>
  <action>
    Create the field type definitions using discriminated unions. Follow the research pattern from 02-RESEARCH.md Pattern 2.

    Create directory structure first:
    ```bash
    mkdir -p /Users/dennyleonardo/Code/nexus/src/features/formBuilder/schema
    ```

    In `src/features/formBuilder/types.ts`, define:

    1. **FieldType union type** - 10 literal types:
       - 'text', 'number', 'decimal', 'date', 'time', 'select', 'checkbox', 'passFail', 'textarea', 'photo'

    2. **BaseField interface** - shared properties:
       - id: string
       - type: FieldType
       - label: string
       - required: boolean
       - placeholder?: string
       - helpText?: string

    3. **Field-specific interfaces** - each extends BaseField with type-specific config:
       - TextField: validation.minLength, validation.maxLength, validation.pattern
       - NumberField: validation.min, validation.max
       - DecimalField: validation.min, validation.max, validation.precision
       - DateField: validation.min (ISO date), validation.max (ISO date)
       - TimeField: validation.min (HH:mm), validation.max (HH:mm)
       - SelectField: options array, validation.minSelections, validation.maxSelections
       - CheckboxField: options array
       - PassFailField: passLabel (default "Pass"), failLabel (default "Fail")
       - TextareaField: validation.minLength, validation.maxLength, rows
       - PhotoField: validation.maxFileSize, validation.maxCount, validation.acceptedTypes

    4. **FormField discriminated union** - union of all 10 field types

    5. **FormTemplate interface** - complete template:
       - id: string
       - name: string
       - version: number
       - orgId: string
       - fields: FormField[]
       - published: boolean
       - createdAt: Date
       - updatedAt: Date
       - publishedAt?: Date
       - createdBy: string (Clerk user ID)

    Use `type: 'text' as const` pattern to ensure TypeScript discriminates correctly on the `type` field.
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>TypeScript compiles without errors, FormField is a discriminated union of 10 field types</done>
</task>

<task type="auto">
  <name>Create Zod validation schemas</name>
  <files>src/features/formBuilder/schema/validationSchemas.ts, src/features/formBuilder/schema/templateSchema.ts</files>
  <action>
    Create Zod schemas for runtime validation with type inference. Follow the research pattern from 02-RESEARCH.md "Zod Discriminated Union for Field Validation".

    In `src/features/formBuilder/schema/validationSchemas.ts`:
    1. Import { z } from 'zod'
    2. Define base field schema with z.object({ id, type, label, required, placeholder, helpText })
    3. Define validation schema for each field type using z.discriminatedUnion('type', [...]):
       - textFieldSchema: z.literal('text') + validation object (minLength, maxLength, pattern optional)
       - numberFieldSchema: z.literal('number') + validation object (min, max optional)
       - decimalFieldSchema: z.literal('decimal') + validation object (min, max, precision optional)
       - dateFieldSchema: z.literal('date') + validation object (min, max as ISO date strings optional)
       - timeFieldSchema: z.literal('time') + validation object (min, max as HH:mm optional)
       - selectFieldSchema: z.literal('select') + options array + validation (minSelections, maxSelections optional)
       - checkboxFieldSchema: z.literal('checkbox') + options array
       - passFailFieldSchema: z.literal('passFail') + passLabel, failLabel optional
       - textareaFieldSchema: z.literal('textarea') + validation (minLength, maxLength optional) + rows optional
       - photoFieldSchema: z.literal('photo') + validation (maxFileSize, maxCount, acceptedTypes optional)
    4. Export formFieldSchema as discriminated union of all 10 field schemas
    5. Export type FormField = z.infer<typeof formFieldSchema>

    In `src/features/formBuilder/schema/templateSchema.ts`:
    1. Import { z } from 'zod' and formFieldSchema
    2. Define formTemplateSchema with:
       - id: z.string()
       - name: z.string().min(1)
       - version: z.number().int().positive()
       - orgId: z.string()
       - fields: z.array(formFieldSchema)
       - published: z.boolean()
       - createdAt: z.date()
       - updatedAt: z.date()
       - publishedAt: z.date().optional()
       - createdBy: z.string()
    3. Export type FormTemplate = z.infer<typeof formTemplateSchema>

    These schemas will be used in Plan 09 for Zustand store and Plan 11 for Convex server-side validation.
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>Zod schemas compile, FormTemplate type is inferred correctly</done>
</task>

</tasks>

<verification>
After all tasks complete, verify:
1. TypeScript compilation passes: `npm run check-types`
2. All 10 field types are defined in the discriminated union
3. Zod schemas exist for each field type with appropriate validation rules
4. FormTemplate type includes all required fields for version tracking (FORM-04 preparation)
</verification>

<success_criteria>
- [ ] package.json includes @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, zustand, zod
- [ ] src/features/formBuilder/types.ts exports FormField discriminated union with 10 types
- [ ] src/features/formBuilder/schema/validationSchemas.ts exports formFieldSchema (Zod)
- [ ] src/features/formBuilder/schema/templateSchema.ts exports formTemplateSchema (Zod)
- [ ] TypeScript compilation succeeds with no errors
- [ ] Type inference from Zod schemas matches manual type definitions
</success_criteria>

<output>
After completion, create `.planning/phases/02-form-builder/02-form-builder-08-SUMMARY.md`
</output>
