# Phase 2: Form Builder - Research

**Researched:** 2026-02-27
**Domain:** Drag-and-drop form builder, dynamic schema validation, form versioning
**Confidence:** HIGH

## Summary

Phase 2 requires building a drag-and-drop form builder UI with 10 core field types, validation rules, and automatic versioning for form templates. Research confirms that **@dnd-kit** is the industry standard for React drag-and-drop (replacing react-beautiful-dnd), **Zustand** is the recommended state management solution for complex UI state (lighter than Redux, more structured than Context), and **JSON Schema** combined with **Zod** provides the most robust validation architecture for dynamic forms.

The project already has Dexie.js for offline storage (Phase 1) and Convex for cloud sync. The form builder should use **Zustand** for builder UI state, **@dnd-kit/sortable** for drag-and-drop field reordering, and a **JSON Schema-based field definition** that can be validated both client-side (Zod) and server-side (Convex validators).

**Primary recommendation:** Build a custom form builder using @dnd-kit + Zustand + JSON Schema field definitions, NOT use react-jsonschema-form or similar form-generator libraries. This ensures full control over the drag-and-drop UX while maintaining type safety through the schema-driven approach.

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| **FORM-01** | Admin can create form templates via drag-and-drop UI | @dnd-kit/sortable with verticalListSortingStrategy provides proven drag-and-drop for form field lists |
| **FORM-02** | Admin can use 10 core field types (text, number, decimal, date, time, select, checkbox, passFail, textarea, photo) | JSON Schema field definitions with discriminated unions enable type-safe field rendering and validation |
| **FORM-03** | Admin can set field validation rules (required, min/max, options) | Zod discriminated unions per field type provide runtime validation; Convex v.* validators enable server-side validation |
| **FORM-04** | Form templates have version tracking for audit trail | Convex's built-in audit log events track all document mutations; version field on templates enables explicit versioning |

</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **@dnd-kit/core** | ^6.x | Drag-and-drop primitives | Modern, accessible, performant replacement for react-beautiful-dnd (now deprecated) |
| **@dnd-kit/sortable** | ^8.x | Sortable list functionality | Built-in verticalListSortingStrategy optimized for form field lists |
| **@dnd-kit/utilities** | ^3.x | CSS transform utilities | CSS.Transform.toString() for smooth drag animations |
| **zustand** | ^5.x | Form builder state management | Recommended 2026 state library: minimal boilerplate, excellent TypeScript support, persist middleware for draft saving |
| **zod** | ^3.x | Schema validation runtime | TypeScript-first, runtime validation with type inference; integrates with react-hook-form (future Phase 3) |
| **uuid** | ^11.x | Unique field IDs | Already in project; generates stable IDs for form fields |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@radix-ui/*** | ^1.x | Unstyled form primitives (Select, Checkbox, Dialog) | For field settings dialogs and form preview components |
| **tailwindcss-animate** | ^1.x | Animations for drag feedback | Already in devDependencies; use for smooth drag animations |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | react-dnd, react-beautiful-dnd | react-beautiful-dnd is deprecated; react-dnD has higher learning curve and is HTML5-backend dependent |
| Zustand | Jotai, Context API | Jotai better for atomic state; Context API insufficient for complex builder state (re-renders, prop drilling) |
| Custom JSON Schema | react-jsonschema-form | RJSF is opinionated and harder to customize for drag-and-drop UX; custom schema gives full control |
| Zod | Yup, Ajv | Zod has superior TypeScript inference; Yup is older with more legacy patterns; Ajv is JSON Schema spec-compliant but less ergonomic in TS |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand zod
# Note: uuid, @radix-ui components already available or can be added per component
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── features/
│   └── formBuilder/
│       ├── components/
│       │   ├── FormBuilderCanvas.tsx    # Drop zone with SortableContext
│       │   ├── FieldSidebar.tsx         # Draggable field palette
│       │   ├── FieldEditor.tsx          # Settings panel for selected field
│       │   ├── FormPreview.tsx          # Live preview of form
│       │   ├── fields/
│       │   │   ├── TextField.tsx        # Renders text input
│       │   │   ├── NumberField.tsx      # Renders number input
│       │   │   ├── SelectField.tsx      # Renders dropdown
│       │   │   └── ...                  # Other 7 field types
│       │   └── FormTemplatesList.tsx    # List of saved templates
│       ├── store/
│       │   └── formBuilderStore.ts      # Zustand store for builder state
│       ├── schema/
│       │   ├── fieldTypes.ts            # Field type definitions
│       │   ├── validationSchemas.ts     # Zod schemas for each field type
│       │   └── templateSchema.ts        # Complete template schema
│       ├── hooks/
│       │   ├── useFieldRegistry.ts      # Returns field components by type
│       │   └── useTemplatePersistence.ts # Save/load to Dexie/Convex
│       └── types.ts                     # TypeScript types
├── db/
│   └── dexie.ts                         # Extended with formTemplates store
└── convex/
    └── schema.ts                        # Extended with formTemplates table
```

### Pattern 1: @dnd-kit Sortable Context

**What:** Wrap form field list in SortableContext with verticalListSortingStrategy for drag-and-drop reordering.

**When to use:** When admin needs to reorder fields in the form builder canvas.

**Example:**
```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable field component
function SortableField({ field, onSelect }: { field: FormField; onSelect: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(field.id)}
      className="border p-4 bg-white rounded cursor-move hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span>{field.label}</span>
        <span className="text-xs text-muted-foreground">({field.type})</span>
      </div>
    </div>
  );
}

// Builder canvas with drag-and-drop
export function FormBuilderCanvas() {
  const { fields, setFields, activeId, setActiveId } = useFormBuilderStore();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((fields) => {
        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);
        return arrayMove(fields, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {fields.map((field) => (
            <SortableField key={field.id} field={field} onSelect={(id) => setSelectedField(id)} />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <div className="border p-4 bg-white rounded opacity-50 shadow-lg">
            {fields.find((f) => f.id === activeId)?.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

**Source:** [dnd-kit docs - SortableContext](https://docs.dndkit.com/presets/sortable/sortable-context)

### Pattern 2: JSON Schema Field Definitions

**What:** Define field types as JSON Schema with discriminated unions for type-safe rendering and validation.

**When to use:** For storing form template schemas that can be validated client-side and server-side.

**Example:**
```typescript
// Field type definitions using discriminated union
export type FieldType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'date'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'passFail'
  | 'textarea'
  | 'photo';

// Base field interface (shared across all types)
interface BaseField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

// Field-specific configurations
interface TextField extends BaseField {
  type: 'text';
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

interface NumberField extends BaseField {
  type: 'number';
  validation?: {
    min?: number;
    max?: number;
  };
}

interface DecimalField extends BaseField {
  type: 'decimal';
  validation?: {
    min?: number;
    max?: number;
    precision?: number; // decimal places
  };
}

interface SelectField extends BaseField {
  type: 'select';
  options: Array<{ value: string; label: string }>;
  validation?: {
    minSelections?: number;
    maxSelections?: number;
  };
}

interface DateField extends BaseField {
  type: 'date';
  validation?: {
    min?: string; // ISO date
    max?: string; // ISO date
  };
}

interface TimeField extends BaseField {
  type: 'time';
  validation?: {
    min?: string; // HH:mm
    max?: string; // HH:mm
  };
}

interface CheckboxField extends BaseField {
  type: 'checkbox';
  options: Array<{ value: string; label: string }>;
}

interface PassFailField extends BaseField {
  type: 'passFail';
  passLabel?: string; // default "Pass"
  failLabel?: string; // default "Fail"
}

interface TextareaField extends BaseField {
  type: 'textarea';
  validation?: {
    minLength?: number;
    maxLength?: number;
  };
  rows?: number;
}

interface PhotoField extends BaseField {
  type: 'photo';
  validation?: {
    maxFileSize?: number; // bytes
    maxCount?: number;
    acceptedTypes?: string[]; // mime types
  };
}

// Discriminated union type
export type FormField =
  | TextField
  | NumberField
  | DecimalField
  | DateField
  | TimeField
  | SelectField
  | CheckboxField
  | PassFailField
  | TextareaField
  | PhotoField;

// Complete form template
export interface FormTemplate {
  id: string;
  name: string;
  version: number;
  orgId: string;
  fields: FormField[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string; // Clerk user ID
}
```

### Pattern 3: Zustand Store with Persist

**What:** Zustand store for form builder state with persist middleware for draft auto-save.

**When to use:** Managing complex builder UI state (fields list, selected field, dirty state).

**Example:**
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FormField, FormTemplate } from '@/features/formBuilder/types';
import { v4 as uuidv4 } from 'uuid';

interface FormBuilderState {
  // Builder state
  fields: FormField[];
  selectedFieldId: string | null;
  templateName: string;
  isDirty: boolean;

  // Actions
  addField: (type: FormField['type']) => void;
  removeField: (id: string) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  selectField: (id: string | null) => void;
  reorderFields: (oldIndex: number, newIndex: number) => void;
  setTemplateName: (name: string) => void;
  reset: () => void;
  loadTemplate: (template: FormTemplate) => void;
  saveTemplate: () => FormTemplate;
}

export const useFormBuilderStore = create<FormBuilderState>()(
  persist(
    (set, get) => ({
      fields: [],
      selectedFieldId: null,
      templateName: '',
      isDirty: false,

      addField: (type) => set((state) => {
        const newField: FormField = {
          id: uuidv4(),
          type,
          label: `New ${type} field`,
          required: false,
        };
        return {
          fields: [...state.fields, newField],
          isDirty: true,
        };
      }),

      removeField: (id) => set((state) => ({
        fields: state.fields.filter((f) => f.id !== id),
        selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
        isDirty: true,
      })),

      updateField: (id, updates) => set((state) => ({
        fields: state.fields.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
        isDirty: true,
      })),

      selectField: (id) => set({ selectedFieldId: id }),

      reorderFields: (oldIndex, newIndex) => set((state) => {
        const newFields = [...state.fields];
        const [moved] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, moved);
        return { fields: newFields, isDirty: true };
      }),

      setTemplateName: (name) => set({ templateName: name, isDirty: true }),

      reset: () => set({
        fields: [],
        selectedFieldId: null,
        templateName: '',
        isDirty: false,
      }),

      loadTemplate: (template) => set({
        fields: template.fields,
        templateName: template.name,
        isDirty: false,
      }),

      saveTemplate: () => {
        const state = get();
        return {
          id: uuidv4(),
          name: state.templateName,
          version: 1,
          orgId: '', // populated from auth context
          fields: state.fields,
          published: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: '', // populated from auth context
        };
      },
    }),
    {
      name: 'form-builder-draft',
      storage: createJSONStorage(() => sessionStorage), // Session-only, not persistent
      partialize: (state) => ({
        fields: state.fields,
        templateName: state.templateName,
      }), // Don't persist selectedFieldId or isDirty
    }
  )
);
```

**Source:** [Zustand persist middleware](https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md)

### Pattern 4: Field Registry Pattern

**What:** Registry object mapping field types to React components for rendering.

**When to use:** Rendering fields in form preview and future Phase 3 form filling.

**Example:**
```typescript
import { TextFieldComponent } from './fields/TextField';
import { NumberFieldComponent } from './fields/NumberField';
import { SelectFieldComponent } from './fields/SelectField';
// ... import other field components

const fieldRegistry = {
  text: TextFieldComponent,
  number: NumberFieldComponent,
  decimal: NumberFieldComponent, // Can reuse number with decimal step
  date: DateFieldComponent,
  time: TimeFieldComponent,
  select: SelectFieldComponent,
  checkbox: CheckboxFieldComponent,
  passFail: PassFailFieldComponent,
  textarea: TextareaFieldComponent,
  photo: PhotoFieldComponent,
} as const;

export function useFieldRegistry() {
  return {
    getComponent: (type: FormField['type']) => fieldRegistry[type],
    getAllTypes: () => Object.keys(fieldRegistry) as FormField['type'][],
  };
}

// Usage in preview
export function FormPreview({ fields }: { fields: FormField[] }) {
  const { getComponent } = useFieldRegistry();

  return (
    <form>
      {fields.map((field) => {
        const Component = getComponent(field.type);
        return <Component key={field.id} field={field} />;
      })}
    </form>
  );
}
```

### Anti-Patterns to Avoid

- **Storing form templates as JSON strings in Convex:** Use Convex's object types with v.object() for type safety and queryability
- **Using react-jsonschema-form:** Too opinionated for custom drag-and-drop UX; build custom renderer instead
- **Context API for builder state:** Will cause unnecessary re-renders; use Zustand instead
- **Client-only validation:** Always duplicate validation on server-side with Convex validators
- **Versioning by copying entire template:** Use version field + audit log; Convex's history feature tracks changes

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reordering | Custom pointer events, collision detection | @dnd-kit/sortable | Handles touch, keyboard, screen readers, collision detection |
| Schema validation | Custom validation logic | Zod discriminated unions | Runtime validation + TypeScript inference |
| State persistence | Manual localStorage handling | Zustand persist middleware | Handles hydration, partialization, storage selection |
| Type-safe field configs | Manual type guards | Zod discriminated unions | Exhaustive type checking, compile-time safety |
| Form state in Phase 3 | Custom field value tracking | react-hook-form (future) | Handles dirty, touched, validation states |

**Key insight:** Building a custom drag-and-drop system from scratch is deceptively complex. @dnd-kit handles edge cases like multi-touch, keyboard navigation, and screen reader support that would take weeks to implement correctly.

---

## Common Pitfalls

### Pitfall 1: Drag-Overlay Not Showing
**What goes wrong:** DragOverlay appears empty or in wrong position during drag.

**Why it happens:** DragOverlay must be outside SortableContext but inside DndContext; activeId state must be tracked in onDragStart.

**How to avoid:** Follow the exact structure: DndContext > (SortableContext + DragOverlay). Set activeId in onDragStart, clear in onDragEnd.

**Warning signs:** Overlay never appears, or appears at wrong coordinates.

### Pitfall 2: Field Type Discrimination Not Working
**What goes wrong:** TypeScript doesn't narrow field types, IntelliSense shows all properties.

**Why it happens:** Discriminated union requires the discriminator field (`type`) to be a literal string, not a generic string type.

**How to avoid:** Define field types with `type: 'text' as const` or use Zod discriminated unions which enforce literal types.

**Warning signs:** Type checking shows `type` is `string` instead of `'text' | 'number' | ...`.

### Pitfall 3: Form Version Audit Trail Incomplete
**What goes wrong:** Can't trace who changed what and when in form templates.

**Why it happens:** Relying only on a version number without tracking individual changes.

**How to avoid:** Use Convex's built-in audit log events which automatically track all mutations with timestamps and user attribution. Additionally, maintain a version field for explicit versioning.

**Warning signs:** No way to see who modified a template or what changed between versions.

### Pitfall 4: Offline Draft Save Conflicts
**What goes wrong:** User loses form builder changes when browser closes or navigates away.

**Why it happens:** Relying only on in-memory state without persistence.

**How to avoid:** Use Zustand persist middleware with sessionStorage to save builder state automatically. Note: Use sessionStorage not localStorage to avoid stale drafts across sessions.

**Warning signs:** Reloading page loses all form builder changes.

### Pitfall 5: Field Validation Mismatch
**What goes wrong:** Client-side validation passes but server-side rejects data.

**Why it happens:** Validation rules defined only in UI, not in Convex schema.

**How to avoid:** Define validation rules in JSON Schema; use Zod to derive client validators and Convex v.* validators for server-side.

**Warning signs:** Form submits successfully but fails on sync.

---

## Code Examples

Verified patterns from official sources:

### Zod Discriminated Union for Field Validation

```typescript
import { z } from 'zod';

// Define validation schemas for each field type
const textFieldSchema = z.object({
  type: z.literal('text'),
  id: z.string(),
  label: z.string(),
  required: z.boolean(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

const numberFieldSchema = z.object({
  type: z.literal('number'),
  id: z.string(),
  label: z.string(),
  required: z.boolean(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
});

// Discriminated union for all field types
const formFieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  numberFieldSchema,
  // ... other field schemas
]);

// Template schema
const formTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  version: z.number().int().positive(),
  orgId: z.string(),
  fields: z.array(formFieldSchema),
  published: z.boolean(),
});

// Type inference from schema
type FormTemplate = z.infer<typeof formTemplateSchema>;
```

**Source:** [Zod discriminated unions](https://github.com/colinhacks/zod/blob/main/packages/docs/content/api.mdx)

### Convex Schema for Form Templates

```typescript
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ... existing tables

  formTemplates: defineTable({
    name: v.string(),
    version: v.number(),
    orgId: v.id('organizations'), // Reference to org table
    fields: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        label: v.string(),
        required: v.boolean(),
        // Field-specific config stored as object
        config: v.optional(v.any()),
      })
    ),
    published: v.boolean(),
    createdBy: v.id('users'), // Clerk user ID reference
    publishedAt: v.optional(v.number()), // Unix timestamp
  })
    .index('by_org', ['orgId'])
    .index('by_org_published', ['orgId', 'published']),
});
```

**Source:** [Convex schema definition](https://github.com/get-convex/convex-backend/blob/main/npm-packages/docs/docs/database.mdx)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2022-2023 | react-beautiful-dnd deprecated; @dnd-kit is actively maintained |
| Context API for complex state | Zustand | 2023-2025 | Zustand has less boilerplate, better TypeScript support, better perf |
| Yup validation | Zod | 2022-2024 | Zod has superior TypeScript inference and modern API |
| JSON Schema only | Zod + JSON Schema | 2023-2025 | Zod provides runtime validation while generating JSON Schema |

**Deprecated/outdated:**
- **react-beautiful-dnd:** No longer maintained; use @dnd-kit instead
- **react-hook-form v6:** v7+ has breaking changes; use current v7.x
- **Yup:** Older validation library; Zod is more TypeScript-ergonomic

---

## Open Questions

1. **Template versioning strategy:**
   - What we know: Convex has audit logs for tracking changes, templates need explicit version field
   - What's unclear: Should we auto-increment version on every publish, or allow admin to manually bump version?
   - Recommendation: Auto-increment on publish; store version history in separate table if full audit trail needed beyond Convex logs

2. **Photo field handling in Phase 2:**
   - What we know: Photo field type required (FORM-02), but actual photo capture is Phase 3
   - What's unclear: Should we include photo field in builder but disable in Phase 2, or wait until Phase 3?
   - Recommendation: Include photo field type in builder now; render placeholder in preview indicating "photo capture in Phase 3"

3. **Offline draft storage location:**
   - What we know: Zustand persist can use localStorage or sessionStorage
   - What's unclear: Should drafts survive browser close (localStorage) or be session-scoped (sessionStorage)?
   - Recommendation: Use sessionStorage to avoid stale drafts; admin can explicitly save to persist templates

---

## Sources

### Primary (HIGH confidence)
- **@dnd-kit** - Drag-and-drop primitives, SortableContext, verticalListSortingStrategy, DragOverlay
- **Zustand** - Persist middleware, TypeScript store definition
- **Zod** - Discriminated unions for field validation
- **Convex** - Schema definition, array/object validators, audit log events
- **Radix UI** - Select, Checkbox, Dialog primitives for field settings

### Secondary (MEDIUM confidence)
- Web search verified against official docs:
  - Form builder UI patterns 2026
  - React state management (Zustand vs alternatives)
  - JSON Schema validation approaches

### Tertiary (LOW confidence)
- None - all critical findings verified with Context7 or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with Context7 or official docs
- Architecture: HIGH - Patterns from official documentation sources
- Pitfalls: MEDIUM - Some edge cases based on common issues documented in GitHub discussions

**Research date:** 2026-02-27
**Valid until:** 2026-03-29 (30 days - stable ecosystem)
