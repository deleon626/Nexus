/**
 * Form Builder Store
 *
 * Zustand store with persist middleware for form builder state management.
 * Provides actions for adding, removing, updating, and reordering fields.
 * Draft state is auto-saved to sessionStorage (not localStorage) to avoid stale drafts.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { FormField, FormTemplate } from '../types';

// State interface
interface FormBuilderState {
  // State
  fields: FormField[];
  selectedFieldId: string | null;
  templateName: string;
  isDirty: boolean;

  // Actions
  addField: (type: FormField['type']) => string;
  removeField: (id: string) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  selectField: (id: string | null) => void;
  reorderFields: (oldIndex: number, newIndex: number) => void;
  setTemplateName: (name: string) => void;
  reset: () => void;
  loadTemplate: (template: FormTemplate) => void;
  saveTemplate: () => Omit<FormTemplate, 'orgId' | 'createdBy'>;
}

// Create store with persist middleware
export const useFormBuilderStore = create<FormBuilderState>()(
  persist(
    (set, get) => ({
      // Initial state
      fields: [],
      selectedFieldId: null,
      templateName: '',
      isDirty: false,

      // Add a new field of the specified type; returns the new field ID
      addField: (type) => {
        const id = uuidv4();
        const baseField = {
          id,
          type,
          label: `New ${type} field`,
          required: false,
        };

        let newField: FormField;

        switch (type) {
          case 'select':
          case 'checkbox':
            newField = {
              ...baseField,
              type,
              options: [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
              ],
            };
            break;
          case 'passFail':
            newField = {
              ...baseField,
              type,
              passLabel: 'Pass',
              failLabel: 'Fail',
            };
            break;
          case 'textarea':
            newField = {
              ...baseField,
              type,
              rows: 3,
            };
            break;
          case 'decimal':
            newField = {
              ...baseField,
              type,
              validation: { precision: 2 },
            };
            break;
          case 'photo':
            newField = {
              ...baseField,
              type,
              validation: {
                maxFileSize: 5 * 1024 * 1024, // 5MB
                maxCount: 1,
                acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
              },
            };
            break;
          default:
            newField = baseField;
        }

        set((state) => ({
          fields: [...state.fields, newField],
          selectedFieldId: id,
          isDirty: true,
        }));

        return id;
      },

      // Remove a field by ID
      removeField: (id) => set((state) => ({
        fields: state.fields.filter((f) => f.id !== id),
        selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
        isDirty: true,
      })),

      // Update a field's properties
      updateField: (id, updates) => set((state) => ({
        fields: state.fields.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
        isDirty: true,
      })),

      // Select a field for editing
      selectField: (id) => set({ selectedFieldId: id }),

      // Reorder fields by moving from oldIndex to newIndex
      reorderFields: (oldIndex, newIndex) => set((state) => {
        const newFields = [...state.fields];
        const [moved] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, moved);
        return { fields: newFields, isDirty: true };
      }),

      // Set the template name
      setTemplateName: (name) => set({ templateName: name, isDirty: true }),

      // Reset all state to initial values
      reset: () => set({
        fields: [],
        selectedFieldId: null,
        templateName: '',
        isDirty: false,
      }),

      // Load an existing template into the builder
      loadTemplate: (template) => set({
        fields: template.fields,
        templateName: template.name,
        isDirty: false,
      }),

      // Save current state as a template (returns template without org/user IDs)
      saveTemplate: () => {
        const state = get();
        return {
          id: uuidv4(),
          name: state.templateName,
          version: 1,
          orgId: '', // populated by caller
          fields: state.fields,
          published: false,
          createdAt: new Date(),
          updatedAt: new Date(),
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
