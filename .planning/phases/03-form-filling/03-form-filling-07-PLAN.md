---
phase: 03-form-filling
plan: 07
type: execute
wave: 3
depends_on: [01, 02, 06]
files_modified:
  - src/features/formFilling/components/FormFiller.tsx
  - src/features/formFilling/components/ProgressBar.tsx
autonomous: true
requirements: [FILL-01, FILL-04]

must_haves:
  truths:
    - Worker can fill form on single scrolling page with all fields visible
    - Progress bar at top shows % complete or X/Y fields filled
    - Validation errors block submit with scroll to first error
    - Form uses React Hook Form with Zod validation and onBlur mode
    - Batch number was entered before showing form per flow
  artifacts:
    - path: "src/features/formFilling/components/FormFiller.tsx"
      provides: "Main form filling container with all fields"
      min_lines: 80
    - path: "src/features/formFilling/components/ProgressBar.tsx"
      provides: "Progress indicator showing completion %"
      min_lines: 20
  key_links:
    - from: "src/features/formFilling/components/FormFiller.tsx"
      to: "src/features/formFilling/hooks/useFormProgress.ts"
      via: "Calculate progress percentage from form values"
      pattern: "useFormProgress"
    - from: "src/features/formFilling/components/FormFiller.tsx"
      to: "src/features/formFilling/hooks/useFormDraft.ts"
      via: "Auto-save form data every 30 seconds"
      pattern: "useFormDraft"
    - from: "src/features/formFilling/components/FormFiller.tsx"
      to: "src/features/formFilling/components/fields/*.tsx"
      via: "Render all field types using field registry"
      pattern: "FieldRenderer|map.*fields|renderField"
    - from: "src/features/formFilling/components/ProgressBar.tsx"
      to: "src/features/formFilling/components/FormFiller.tsx"
      via: "Import and display at top of form"
      pattern: "ProgressBar"
---

<objective>

Create main form filling container with progress bar, field rendering, validation, and auto-save integration. This is the core component where workers fill out forms.

Purpose: Single page layout with all fields visible provides clear completion status. Progress bar motivates workers. Validation on blur prevents premature errors. Auto-save protects data.

Output: FormFiller component with React Hook Form integration, progress display, field rendering, and validation.
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
@.planning/phases/03-form-filling/03-form-filling-02-PLAN.md
@.planning/phases/03-form-filling/03-form-filling-06-PLAN.md
@src/features/formBuilder/types.ts
@src/features/formBuilder/schema/validationSchemas.ts
@src/features/formBuilder/hooks/useFieldRegistry.ts
---
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ProgressBar component</name>
  <files>src/features/formFilling/components/ProgressBar.tsx</files>
  <action>
    Create src/features/formFilling/components/ProgressBar.tsx with:

    1. Props:
       - completed: number (fields filled)
       - total: number (required fields)
       - percentage: number (0-100)

    2. Render:
       - Progress bar with filled width based on percentage
       - Text: "X/Y fields filled" or "X% complete" per CONTEXT.md
       - Visual bar with background (gray) and fill (blue/green)
       - Smooth transition for percentage changes

    3. Styling:
       - Fixed or sticky at top of form
       - Full width
       - Height ~4-8px for bar
       - Text above or below bar

    Reference: CONTEXT.md specifies "progress bar at top showing % complete or X/Y fields filled". Use CSS transition for smooth updates.
  </action>
  <verify>grep -q "ProgressBar" src/features/formFilling/components/ProgressBar.tsx && grep -q "percentage" src/features/formFilling/components/ProgressBar.tsx</verify>
  <done>ProgressBar component created with percentage display and visual bar</done>
</task>

<task type="auto">
  <name>Task 2: Create FormFiller component with React Hook Form</name>
  <files>src/features/formFilling/components/FormFiller.tsx</files>
  <action>
    Create src/features/formFilling/components/FormFiller.tsx with:

    1. Props:
       - template: FormTemplate (from formBuilder types)
       - batchNumber: string
       - draftId?: string (if resuming)
       - onSubmit: (data: Record<string, any>) => void

    2. React Hook Form setup:
       - useForm hook with resolver: zodResolver(validationSchema)
       - mode: 'onBlur' per CONTEXT.md
       - defaultValues: from draft data if resuming, else empty object
       - Get formState: { errors, touchedFields, isValid }

    3. Build Zod schema from template fields:
       - Map template.fields to Zod object schema
       - Required fields: z.string().min(1) or appropriate type
       - Optional fields: z.string().optional()
       - Use validation rules from field.validation

    4. Hooks integration:
       - useFormProgress(template, watch()) for progress calculation
       - useFormDraft(template.id, template.name, batchNumber, watch()) for auto-save

    5. Field rendering:
       - Use useFieldRegistry() to get component for each field type
       - Map template.fields to field components
       - Pass field, control (from useForm), key to each component

    6. Submit handling:
       - handleSubmit from React Hook Form
       - Validate all fields
       - If errors: scroll to first error, show summary per CONTEXT.md
       - If valid: call onSubmit with form data

    7. Render structure:
       - ProgressBar at top
       - Single scrolling page with all fields
       - Submit buttons at bottom (Submit + "Submit & Start New")

    Import from: react-hook-form, @hookform/resolvers/zod, zod, formBuilder types, formFilling hooks

    Reference: 03-RESEARCH.md Pattern 1 "React Hook Form with onBlur Validation" example. CONTEXT.md specifies validation errors block submit, scroll to first error.
  </action>
  <verify>grep -q "FormFiller" src/features/formFilling/components/FormFiller.tsx && grep -q "useForm" src/features/formFilling/components/FormFiller.tsx && grep -q "zodResolver" src/features/formFilling/components/FormFiller.tsx && grep -q "mode.*onBlur" src/features/formFilling/components/FormFiller.tsx</verify>
  <done>FormFiller component created with React Hook Form, Zod validation, and field rendering</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. ProgressBar component displays completion percentage and X/Y fields filled
2. FormFiller uses React Hook Form with mode: 'onBlur' for validation
3. Zod schema generated dynamically from template fields
4. useFieldRegistry used to map field types to components
5. useFormProgress calculates progress from required fields
6. useFormDraft auto-saves form data every 30 seconds
7. Submit handler validates and scrolls to first error if invalid
8. Single page layout with all fields visible (scrolling)
9. Submit buttons at bottom (Submit + Submit & Start New)
</verification>

<success_criteria>
1. Progress bar shows accurate completion percentage
2. All template fields render with proper input types
3. Validation errors appear on blur, not on every keystroke
4. Submit is blocked when validation fails
5. Errors scroll to first invalid field
6. Auto-save runs transparently without user action
7. Draft data loads when resuming
8. Form uses existing field registry from Phase 2
</success_criteria>

<output>
After completion, create `.planning/phases/03-form-filling/03-form-filling-07-SUMMARY.md`
</output>
