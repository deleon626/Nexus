---
phase: 02-form-builder
plan: 09
type: execute
wave: 1
depends_on: [08]
files_modified:
  - src/features/formBuilder/store/formBuilderStore.ts
  - src/features/formBuilder/hooks/useFieldRegistry.ts
  - src/features/formBuilder/components/fields/TextField.tsx
  - src/features/formBuilder/components/fields/NumberField.tsx
  - src/features/formBuilder/components/fields/DecimalField.tsx
  - src/features/formBuilder/components/fields/DateField.tsx
  - src/features/formBuilder/components/fields/TimeField.tsx
  - src/features/formBuilder/components/fields/SelectField.tsx
  - src/features/formBuilder/components/fields/CheckboxField.tsx
  - src/features/formBuilder/components/fields/PassFailField.tsx
  - src/features/formBuilder/components/fields/TextareaField.tsx
  - src/features/formBuilder/components/fields/PhotoField.tsx
  - src/features/formBuilder/components/FormPreview.tsx
  - src/features/formBuilder/types.ts
autonomous: true
requirements:
  - FORM-01
  - FORM-02

must_haves:
  truths:
    - "Admin can add fields to form builder via Zustand store"
    - "Admin can remove, update, reorder fields in builder"
    - "Form builder state persists to sessionStorage for draft auto-save"
    - "Field registry maps field types to React components for rendering"
    - "Form preview renders all 10 field types correctly"
  artifacts:
    - path: "src/features/formBuilder/store/formBuilderStore.ts"
      provides: "Zustand store with persist middleware"
      exports: ["useFormBuilderStore"]
      min_lines: 60
    - path: "src/features/formBuilder/hooks/useFieldRegistry.ts"
      provides: "Field component registry"
      exports: ["useFieldRegistry"]
    - path: "src/features/formBuilder/components/fields/*.tsx"
      provides: "10 field renderer components"
      count: 10
    - path: "src/features/formBuilder/components/FormPreview.tsx"
      provides: "Live form preview component"
  key_links:
    - from: "src/features/formBuilder/store/formBuilderStore.ts"
      to: "src/features/formBuilder/types.ts"
      via: "FormField type import"
      pattern: "import.*FormField.*from.*types"
    - from: "src/features/formBuilder/components/FormPreview.tsx"
      to: "src/features/formBuilder/hooks/useFieldRegistry.ts"
      via: "useFieldRegistry hook"
      pattern: "useFieldRegistry\\(\\)"

---

<objective>
Build the form builder state management layer with Zustand store and field component registry for rendering field types.

**Purpose:** FORM-01 requires drag-and-drop builder state. Zustand with persist middleware provides complex UI state management with draft auto-save. Field registry enables type-safe field rendering for preview and future Phase 3 form filling.

**Output:**
- Zustand store with persist middleware (sessionStorage)
- Field registry hook mapping field types to components
- 10 field renderer components (text, number, decimal, date, time, select, checkbox, passFail, textarea, photo)
- FormPreview component using field registry
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
@src/features/formBuilder/types.ts
@src/lib/utils.ts

# Phase 1 patterns
@.planning/phases/01-foundation-auth/01-foundation-auth-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Create Zustand store with persist</name>
  <files>src/features/formBuilder/store/formBuilderStore.ts</files>
  <action>
    Create the Zustand store for form builder state. Follow the research pattern from 02-RESEARCH.md Pattern 3.

    Create directory:
    ```bash
    mkdir -p /Users/dennyleonardo/Code/nexus/src/features/formBuilder/store
    ```

    In `src/features/formBuilder/store/formBuilderStore.ts`:

    1. Import from 'zustand', 'zustand/middleware', uuid, and FormField/FormTemplate types
    2. Define FormBuilderState interface:
       - State: fields: FormField[], selectedFieldId: string | null, templateName: string, isDirty: boolean
       - Actions: addField, removeField, updateField, selectField, reorderFields, setTemplateName, reset, loadTemplate, saveTemplate

    3. Implement actions:
       - addField(type): Creates new field with uuidv4(), default label "New {type} field", required: false, appends to fields array, sets isDirty: true
       - removeField(id): Filters field from array, clears selectedFieldId if removed, sets isDirty: true
       - updateField(id, updates): Maps over fields, spreads updates into matching field, sets isDirty: true
       - selectField(id): Sets selectedFieldId
       - reorderFields(oldIndex, newIndex): Splices array to reorder, sets isDirty: true
       - setTemplateName(name): Sets templateName, sets isDirty: true
       - reset(): Clears all state to initial values
       - loadTemplate(template): Loads template fields and name, sets isDirty: false
       - saveTemplate(): Returns FormTemplate object with uuidv4(), current state, version: 1, empty orgId/createdBy (populated later)

    4. Apply persist middleware:
       - name: 'form-builder-draft'
       - storage: createJSONStorage(() => sessionStorage) - Use sessionStorage, NOT localStorage (per research recommendation)
       - partialize: Persist only fields and templateName, NOT selectedFieldId or isDirty

    5. Export useFormBuilderStore

    Pattern note: Use create<FormBuilderState>()().persist(...) pattern for proper TypeScript typing.
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>Zustand store compiles with persist middleware configured</done>
</task>

<task type="auto">
  <name>Create field renderer components</name>
  <files>
    src/features/formBuilder/components/fields/TextField.tsx
    src/features/formBuilder/components/fields/NumberField.tsx
    src/features/formBuilder/components/fields/DecimalField.tsx
    src/features/formBuilder/components/fields/DateField.tsx
    src/features/formBuilder/components/fields/TimeField.tsx
    src/features/formBuilder/components/fields/SelectField.tsx
    src/features/formBuilder/components/fields/CheckboxField.tsx
    src/features/formBuilder/components/fields/PassFailField.tsx
    src/features/formBuilder/components/fields/TextareaField.tsx
    src/features/formBuilder/components/fields/PhotoField.tsx
  </files>
  <action>
    Create the 10 field renderer components. These components will be used in FormPreview (Plan 09) and form filling (Phase 3).

    Create directory:
    ```bash
    mkdir -p /Users/dennyleonardo/Code/nexus/src/features/formBuilder/components/fields
    ```

    For each field component:

    **TextField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: <input type="text"> with label, placeholder, helpText
    - Validation: Shows error if present, marks required fields
    - Use cn() from utils for conditional classes

    **NumberField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: <input type="number"> with label, min, max from validation
    - Step attribute: "1" for integer numbers

    **DecimalField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: <input type="number"> with label, min, max
    - Step attribute: calculated from validation.precision (default "0.01")

    **DateField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: <input type="date"> with label
    - Min/max attributes from validation (ISO date strings)

    **TimeField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: <input type="time"> with label
    - Min/max attributes from validation (HH:mm format)

    **SelectField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: <select> with label, options from field.options array
    - Each option: value and label from options array

    **CheckboxField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: Checkboxes for each option in field.options
    - Value is array of selected option values
    - Label for each checkbox: option.label

    **PassFailField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: Two radio buttons or buttons
    - Labels: field.passLabel (default "Pass"), field.failLabel (default "Fail")
    - Value: "pass" | "fail"

    **TextareaField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: <textarea> with label, placeholder, helpText
    - Rows attribute: field.rows || 3

    **PhotoField.tsx**:
    - Props: { field, value, onChange, error }
    - Renders: <input type="file" accept="image/*"> with label
    - For Phase 2, show placeholder: "Photo capture in Phase 3"
    - Display: "Photo field placeholder" text, no actual upload

    All components should:
    - Use Tailwind classes for styling (border, p-2, rounded, etc.)
    - Mark required fields with asterisk (*)
    - Show helpText if present
    - Show error message if error prop is present
    - Use field.id for input id/name attributes
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>All 10 field components compile with correct props</done>
</task>

<task type="auto">
  <name>Create field registry and preview component</name>
  <files>
    src/features/formBuilder/hooks/useFieldRegistry.ts
    src/features/formBuilder/components/FormPreview.tsx
  </files>
  <action>
    Create the field registry hook and FormPreview component. Follow the research pattern from 02-RESEARCH.md Pattern 4.

    Create directory:
    ```bash
    mkdir -p /Users/dennyleonardo/Code/nexus/src/features/formBuilder/hooks
    ```

    **useFieldRegistry.ts**:
    1. Import all 10 field components
    2. Create const fieldRegistry mapping field type literals to components:
       - text: TextField
       - number: NumberField
       - decimal: DecimalField
       - date: DateField
       - time: TimeField
       - select: SelectField
       - checkbox: CheckboxField
       - passFail: PassFailField
       - textarea: TextareaField
       - photo: PhotoField
    3. Export useFieldRegistry hook returning { getComponent, getAllTypes }
    4. getComponent(type) returns component from registry
    5. getAllTypes() returns Object.keys(fieldRegistry) as FieldType[]

    **FormPreview.tsx**:
    1. Import useFieldRegistry, FormField type
    2. Props: { fields: FormField[], values: Record<string, any>, onChange: (fieldId: string, value: any) => void, errors: Record<string, string> }
    3. Use getComponent from useFieldRegistry
    4. Render <form> element
    5. Map over fields array:
       - Get Component = getComponent(field.type)
       - Render <Component key={field.id} field={field} value={values[field.id]} onChange={(v) => onChange(field.id, v)} error={errors[field.id]} />
    6. Show empty state if fields.length === 0: "No fields added yet. Add fields from the sidebar."

    The FormPreview component is used in:
    - Plan 10: Form builder canvas (right panel preview)
    - Phase 3: Form filling for workers

    Note: In Phase 2, FormPreview is read-only for builder. In Phase 3, it will be interactive for data entry.
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>Field registry maps all 10 types, FormPreview renders fields correctly</done>
</task>

</tasks>

<verification>
After all tasks complete, verify:
1. TypeScript compilation passes: `npm run check-types`
2. Zustand store persists to sessionStorage (test by adding field, reloading page)
3. Field registry returns correct component for each of 10 field types
4. FormPreview renders all field types with labels, placeholders, help text
5. Required fields show asterisk indicator
</verification>

<success_criteria>
- [ ] useFormBuilderStore exported with persist middleware using sessionStorage
- [ ] Store actions: addField, removeField, updateField, reorderFields work correctly
- [ ] 10 field components created in src/features/formBuilder/components/fields/
- [ ] useFieldRegistry hook maps field types to components
- [ ] FormPreview component renders fields using field registry
- [ ] TypeScript compilation succeeds
</success_criteria>

<output>
After completion, create `.planning/phases/02-form-builder/02-form-builder-09-SUMMARY.md`
</output>
