/**
 * SortableField Component
 *
 * Draggable field wrapper for the form builder canvas.
 * Uses @dnd-kit/sortable's useSortable hook for drag-and-drop functionality.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { FormField } from '../types';

interface SortableFieldProps {
  /** The field to render */
  field: FormField;
  /** Callback when field is clicked/selected */
  onSelect: (id: string) => void;
  /** Whether this field is currently selected */
  isSelected?: boolean;
}

export function SortableField({ field, onSelect, isSelected }: SortableFieldProps) {
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
      className={`
        border p-4 bg-white rounded cursor-move hover:shadow-md transition-shadow
        ${isSelected ? 'ring-2 ring-primary' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium">{field.label}</span>
        <span className="text-xs text-muted-foreground">({field.type})</span>
        {field.required && (
          <span className="text-xs text-red-500 ml-auto" aria-label="Required">
            *
          </span>
        )}
      </div>
    </div>
  );
}
