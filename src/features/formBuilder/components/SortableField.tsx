/**
 * SortableField Component
 *
 * Draggable field wrapper for the form builder canvas.
 * Uses @dnd-kit/sortable's useSortable hook for drag-and-drop functionality.
 * Supports inline label editing and a delete button.
 */

import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { FormField } from '../types';

interface SortableFieldProps {
  /** The field to render */
  field: FormField;
  /** Callback when field is clicked/selected */
  onSelect: (id: string) => void;
  /** Whether this field is currently selected */
  isSelected?: boolean;
  /** Whether this field is in inline-edit mode */
  isEditing?: boolean;
  /** Called on double-click to enter edit mode */
  onStartEdit: (id: string) => void;
  /** Called on Escape to exit edit mode without saving */
  onCancelEdit: () => void;
  /** Called when inline edit saves a new label */
  onLabelChange: (id: string, label: string) => void;
  /** Called when delete icon is clicked */
  onDelete: (id: string) => void;
  /** Ref forwarding so parent can scroll to this element */
  fieldRef?: (node: HTMLDivElement | null) => void;
}

export function SortableField({
  field,
  onSelect,
  isSelected,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onLabelChange,
  onDelete,
  fieldRef,
}: SortableFieldProps) {
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

  const [editValue, setEditValue] = useState(field.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditValue(field.label);
      // Select all text after mount
      requestAnimationFrame(() => {
        inputRef.current?.select();
      });
    }
  }, [isEditing, field.label]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onLabelChange(field.id, trimmed);
    } else {
      onCancelEdit();
    }
  };

  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    fieldRef?.(node);
  };

  return (
    <div
      ref={combinedRef}
      style={style}
      {...attributes}
      onClick={() => onSelect(field.id)}
      className={`
        border p-4 bg-white rounded hover:shadow-md transition-shadow
        ${isSelected ? 'ring-2 ring-primary' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle — only this activates drag */}
        <div {...listeners} className="cursor-move touch-none flex-shrink-0">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Label or inline edit input */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancelEdit();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="font-medium bg-transparent border-b border-primary outline-none w-full"
          />
        ) : (
          <span
            className="font-medium cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              onStartEdit(field.id);
            }}
          >
            {field.label}
          </span>
        )}

        <span className="text-xs text-muted-foreground">({field.type})</span>

        {field.required && (
          <span className="text-xs text-red-500" aria-label="Required">
            *
          </span>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(field.id);
          }}
          className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Delete field"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
