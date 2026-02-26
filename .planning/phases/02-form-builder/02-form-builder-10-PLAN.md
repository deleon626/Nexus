---
phase: 02-form-builder
plan: 10
type: execute
wave: 2
depends_on: [08, 09]
files_modified:
  - src/features/formBuilder/components/FormBuilderCanvas.tsx
  - src/features/formBuilder/components/FieldSidebar.tsx
  - src/features/formBuilder/components/FieldEditor.tsx
  - src/features/formBuilder/components/SortableField.tsx
  - src/routes/admin/builder.tsx
  - src/components/ui/button.tsx
  - src/components/ui/label.tsx
  - src/components/ui/input.tsx
  - src/components/ui/textarea.tsx
  - src/components/ui/select.tsx
  - src/components/ui/checkbox.tsx
autonomous: false
requirements:
  - FORM-01
  - FORM-02
  - FORM-04

must_haves:
  truths:
    - "Admin can drag fields from sidebar to canvas"
    - "Admin can reorder fields by dragging within canvas"
    - "Admin can click field to edit its properties in editor panel"
    - "Admin can add fields by clicking sidebar items"
    - "Admin can remove fields from canvas"
    - "Admin can publish/unpublish forms"
    - "Admin sees form version number increment on publish"
  artifacts:
    - path: "src/features/formBuilder/components/FormBuilderCanvas.tsx"
      provides: "Drag-and-drop builder canvas with SortableContext"
      min_lines: 80
    - path: "src/features/formBuilder/components/FieldSidebar.tsx"
      provides: "Field palette with 10 draggable field types"
    - path: "src/features/formBuilder/components/FieldEditor.tsx"
      provides: "Field properties editor panel"
    - path: "src/features/formBuilder/components/SortableField.tsx"
      provides: "Sortable wrapper with drag handle"
    - path: "src/routes/admin/builder.tsx"
      provides: "Complete form builder page layout"
  key_links:
    - from: "src/features/formBuilder/components/FormBuilderCanvas.tsx"
      to: "@dnd-kit/core"
      via: "DndContext, DragOverlay imports"
      pattern: "import.*DndContext.*from '@dnd-kit/core'"
    - from: "src/features/formBuilder/components/FormBuilderCanvas.tsx"
      to: "src/features/formBuilder/store/formBuilderStore.ts"
      via: "useFormBuilderStore hook"
      pattern: "useFormBuilderStore\\(\\)"

---

<objective>
Build the complete drag-and-drop form builder UI with @dnd-kit, including sidebar, canvas, and field editor panels.

**Purpose:** FORM-01 requires drag-and-drop form builder. @dnd-kit/sortable provides the drag-and-drop primitives. Three-panel layout (sidebar, canvas, editor) gives admins full control over form creation. Publishing mechanism implements FORM-04 version tracking.

**Output:**
- FormBuilderCanvas with DndContext, SortableContext, DragOverlay
- FieldSidebar with 10 draggable field types
- FieldEditor for editing field properties
- SortableField wrapper with drag handle
- Updated admin/builder route with complete builder layout
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
@src/features/formBuilder/store/formBuilderStore.ts
@src/features/formBuilder/hooks/useFieldRegistry.ts
@src/features/formBuilder/types.ts
@src/lib/utils.ts

# Phase 1 UI patterns
@.planning/phases/01-foundation-auth/01-foundation-auth-05-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Create sortable field wrapper and canvas component</name>
  <files>
    src/features/formBuilder/components/SortableField.tsx
    src/features/formBuilder/components/FormBuilderCanvas.tsx
  </files>
  <action>
    Create the drag-and-drop canvas component. Follow the research pattern from 02-RESEARCH.md Pattern 1.

    **SortableField.tsx**:
    1. Import from @dnd-kit/sortable: useSortable, attributes, listeners, setNodeRef, transform, transition, isDragging
    2. Import from @dnd-kit/utilities: CSS
    3. Props: { field, onSelect }
    4. Use useSortable({ id: field.id })
    5. Style: transform = CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1
    6. Render: div with ref, attributes, listeners, onClick -> onSelect(field.id)
    7. Classes: border, p-4, bg-white, rounded, cursor-move, hover:shadow-md
    8. Content: GripVertical icon (lucide-react), field.label, field.type in muted text

    **FormBuilderCanvas.tsx**:
    1. Import from @dnd-kit/core: DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, DragEndEvent, DragStartEvent
    2. Import from @dnd-kit/sortable: arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy
    3. Import useFormBuilderStore, SortableField, FormPreview
    4. Use sensors: useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    5. State: activeId (from onDragStart)
    6. onDragStart: setActiveId(event.active.id)
    7. onDragEnd: If over exists and active.id !== over.id, call reorderFields with arrayMove indices, then setActiveId(null)
    8. Render:
       - Wrap in DndContext with sensors, collisionDetection, onDragStart, onDragEnd
       - SortableContext with items={fields.map(f => f.id)}, strategy={verticalListSortingStrategy}
       - div.space-y-2 mapping fields -> SortableField
       - DragOverlay showing active field preview (opacity-50, shadow-lg)
       - Empty state: "Drag fields here or click sidebar to add"
    9. Use onFieldSelect from store or prop to handle field selection

    Pattern note: Ensure DragOverlay is OUTSIDE SortableContext but INSIDE DndContext for proper rendering (per research Pitfall 1).
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>Canvas compiles with @dnd-kit integration, SortableContext configured</done>
</task>

<task type="auto">
  <name>Create field sidebar and editor components</name>
  <files>
    src/features/formBuilder/components/FieldSidebar.tsx
    src/features/formBuilder/components/FieldEditor.tsx
  </files>
  <action>
    Create the sidebar (field palette) and editor (field properties) components.

    **FieldSidebar.tsx**:
    1. Props: { onAddField: (type: FieldType) => void }
    2. Define fieldTypes array with 10 types:
       - { type: 'text', icon: Type, label: 'Text', description: 'Single line text' }
       - { type: 'number', icon: Hash, label: 'Number', description: 'Whole number' }
       - { type: 'decimal', icon: Calculator, label: 'Decimal', description: 'Decimal number' }
       - { type: 'date', icon: Calendar, label: 'Date', description: 'Date picker' }
       - { type: 'time', icon: Clock, label: 'Time', description: 'Time picker' }
       - { type: 'select', icon: List, label: 'Select', description: 'Dropdown' }
       - { type: 'checkbox', icon: CheckSquare, label: 'Checkbox', description: 'Multiple choice' }
       - { type: 'passFail', icon: Shield, label: 'Pass/Fail', description: 'Pass or Fail' }
       - { type: 'textarea', icon: AlignLeft, label: 'Textarea', description: 'Multi-line text' }
       - { type: 'photo', icon: Camera, label: 'Photo', description: 'Photo upload' }
    3. Render: aside panel with header "Add Fields"
    4. Grid of clickable field type cards
    5. Each card: icon, label, description, onClick -> onAddField(type)
    6. Classes: gap-2, p-4, border, rounded, hover:bg-muted cursor-pointer

    **FieldEditor.tsx**:
    1. Props: { fieldId, onUpdate: (id: string, updates: Partial<FormField>) => void, onRemove: (id: string) => void }
    2. Import useFormBuilderStore to get selected field
    3. Find selectedField from fields array using fieldId
    4. If no field selected, show "Select a field to edit"
    5. Render form with field properties:
       - Label input (text)
       - Placeholder input (text, optional)
       - Help text input (textarea, optional)
       - Required checkbox
       - Type-specific validation:
         - Text: minLength, maxLength, pattern inputs
         - Number/Decimal: min, max inputs (Decimal: precision)
         - Date/Time: min, max inputs
         - Select: options array editor (add/remove option rows)
         - Checkbox: options array editor
         - PassFail: passLabel, failLabel inputs
         - Textarea: rows input, minLength, maxLength
         - Photo: maxFileSize, maxCount inputs
    6. "Remove Field" button at bottom (destructive variant)
    7. Use updateField from store on change

    For options array editor (Select/Checkbox):
    - Map over options array
    - Each row: value input, label input, remove button
    - "Add Option" button at bottom

    Note: Photo field shows "Photo capture in Phase 3" message in editor.
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>Sidebar and editor components compile with all field types supported</done>
</task>

<task type="auto">
  <name>Create base UI components and update builder route</name>
  <files>
    src/components/ui/button.tsx
    src/components/ui/label.tsx
    src/components/ui/input.tsx
    src/components/ui/textarea.tsx
    src/components/ui/select.tsx
    src/components/ui/checkbox.tsx
    src/routes/admin/builder.tsx
  </files>
  <action>
    Create minimal shadcn-style UI components and update the builder route.

    **UI Components** (create if not exist):
    Create directory:
    ```bash
    mkdir -p /Users/dennyleonardo/Code/nexus/src/components/ui
    ```

    1. **button.tsx**:
       - Props: { variant?: 'default' | 'destructive' | 'outline', size?: 'default' | 'sm', children, className, ...props }
       - Variants: default (bg-primary text-primary-foreground), destructive (bg-destructive text-destructive-foreground), outline (border border-input)
       - Sizes: default (h-10 px-4), sm (h-9 px-3)
       - Use cva or cn() for variant classes

    2. **label.tsx**:
       - Props: { htmlFor, children, className }
       - Render: <label> with text-sm font-medium leading-none

    3. **input.tsx**:
       - Props: { type, className, ...props }
       - Render: <input> with flex h-10 w-full rounded-md border, px-3, py-2

    4. **textarea.tsx**:
       - Props: { className, ...props }
       - Render: <textarea> with flex min-h-[80px] w-full rounded-md border, px-3, py-2

    5. **select.tsx**:
       - Props: { children, className }
       - Render: <select> with flex h-10 w-full rounded-md border, px-3

    6. **checkbox.tsx**:
       - Props: { checked, onChange, className }
       - Render: <input type="checkbox"> with h-4 w-4 rounded border

    **Update builder.tsx**:
    1. Import useFormBuilderStore, FormBuilderCanvas, FieldSidebar, FieldEditor, FormPreview
    2. Layout: 3-column grid
       - Left: FieldSidebar (w-64)
       - Center: FormBuilderCanvas (flex-1)
       - Right: FieldEditor (w-80) + FormPreview toggle
    3. Top bar: Template name input, Save button, Publish button (toggle published status)
    4. State: showPreview (boolean) for toggling between editor and preview
    5. Use store methods: setTemplateName, saveTemplate, addField, updateField, removeField, reset
    6. Publish button: Calls publishTemplate (to be implemented in Plan 11), shows version number
    7. Classes: grid grid-cols-1 lg:grid-cols-[250px_1fr_320px] gap-4 h-[calc(100vh-4rem)]

    Note: Actual save/publish logic requires Convex functions (Plan 11). For now, console.log the template object.
  </action>
  <verify>
    <automated>npm run check-types 2>&1 | head -20</automated>
  </verify>
  <done>UI components created, builder route renders 3-panel layout</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Verify drag-and-drop form builder UI</name>
  <what-built>Complete drag-and-drop form builder UI with 3-panel layout</what-built>
  <how-to-verify>
    1. Start dev server: `npm run dev`
    2. Sign in as admin user
    3. Navigate to http://localhost:5173/admin/builder
    4. Verify:
       - Left sidebar shows 10 field type cards
       - Clicking a field type adds it to center canvas
       - Fields can be reordered by dragging (drag handle visible)
       - Clicking a field shows properties in right editor panel
       - Editor shows label, placeholder, help text, required checkbox
       - Type-specific validation fields appear based on field type
       - Remove button deletes the field
       - Publish button is visible (will not work until Plan 11)
    5. Test all 10 field types: text, number, decimal, date, time, select, checkbox, passFail, textarea, photo
    6. Test adding multiple fields and reordering them
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues with the drag-and-drop UI</resume-signal>
</task>

</tasks>

<verification>
After checkpoint approval, verify:
1. All 10 field types appear in sidebar with icons and descriptions
2. Drag-and-drop reordering works smoothly
3. Field editor shows correct properties for each field type
4. Required field indicator (asterisk) appears in preview
5. Builder layout is responsive on smaller screens
</verification>

<success_criteria>
- [ ] FormBuilderCanvas uses DndContext + SortableContext with verticalListSortingStrategy
- [ ] FieldSidebar shows all 10 field types as clickable cards
- [ ] FieldEditor shows type-specific properties (validation rules)
- [ ] SortableField has drag handle and is draggable
- [ ] DragOverlay shows field preview during drag
- [ ] Three-panel layout (sidebar, canvas, editor) renders correctly
- [ ] User verified drag-and-drop works smoothly
</success_criteria>

<output>
After completion, create `.planning/phases/02-form-builder/02-form-builder-10-SUMMARY.md`
</output>
