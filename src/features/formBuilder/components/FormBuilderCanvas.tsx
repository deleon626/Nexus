/**
 * FormBuilderCanvas Component
 *
 * Drag-and-drop canvas for form fields.
 * Uses @dnd-kit DndContext and SortableContext for field reordering.
 *
 * Pattern note: DragOverlay is OUTSIDE SortableContext but INSIDE DndContext
 * for proper rendering (per research Pitfall 1).
 */

import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useFormBuilderStore } from '../store/formBuilderStore';
import { SortableField } from './SortableField';
import type { FormField } from '../types';

interface FormBuilderCanvasProps {
  /** Optional callback when a field is selected */
  onFieldSelect?: (id: string) => void;
}

export function FormBuilderCanvas({ onFieldSelect }: FormBuilderCanvasProps) {
  const { fields, reorderFields, selectField, selectedFieldId } = useFormBuilderStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get active field for drag overlay
  const activeField = useMemo(
    () => fields.find((f) => f.id === activeId) || null,
    [fields, activeId]
  );

  // Handle drag start - set active ID
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end - reorder fields if dropped on different position
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      reorderFields(oldIndex, newIndex);
    }

    setActiveId(null);
  };

  // Handle field selection
  const handleFieldSelect = (id: string) => {
    selectField(id);
    onFieldSelect?.(id);
  };

  // Empty state when no fields
  if (fields.length === 0) {
    return (
      <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg p-8">
        <p className="text-muted-foreground text-center">
          Drag fields here or click sidebar to add
        </p>
      </div>
    );
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
            <SortableField
              key={field.id}
              field={field}
              onSelect={handleFieldSelect}
              isSelected={selectedFieldId === field.id}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeField ? (
          <div className="border p-4 bg-white rounded opacity-50 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">{activeField.label}</span>
              <span className="text-xs text-muted-foreground">({activeField.type})</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
