/**
 * FieldSidebar Component
 *
 * Field palette showing all 10 available field types.
 * Admin can click a field type to add it to the form canvas.
 */

import {
  Type,
  Hash,
  Calculator,
  Calendar,
  Clock,
  List,
  CheckSquare,
  Shield,
  AlignLeft,
  Camera,
} from 'lucide-react';
import type { FieldType } from '../types';

interface FieldSidebarProps {
  /** Callback when a field type is clicked to add */
  onAddField: (type: FieldType) => void;
}

// Field type definitions with icons and descriptions
const fieldTypes: Array<{
  type: FieldType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}> = [
  { type: 'text', icon: Type, label: 'Text', description: 'Single line text' },
  { type: 'number', icon: Hash, label: 'Number', description: 'Whole number' },
  { type: 'decimal', icon: Calculator, label: 'Decimal', description: 'Decimal number' },
  { type: 'date', icon: Calendar, label: 'Date', description: 'Date picker' },
  { type: 'time', icon: Clock, label: 'Time', description: 'Time picker' },
  { type: 'select', icon: List, label: 'Select', description: 'Dropdown' },
  { type: 'checkbox', icon: CheckSquare, label: 'Checkbox', description: 'Multiple choice' },
  { type: 'passFail', icon: Shield, label: 'Pass/Fail', description: 'Pass or Fail' },
  { type: 'textarea', icon: AlignLeft, label: 'Textarea', description: 'Multi-line text' },
  { type: 'photo', icon: Camera, label: 'Photo', description: 'Photo upload' },
];

export function FieldSidebar({ onAddField }: FieldSidebarProps) {
  return (
    <aside className="w-64 border-r bg-muted/10 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Add Fields</h2>
      <div className="grid gap-2">
        {fieldTypes.map(({ type, icon: Icon, label, description }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAddField(type)}
            className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors text-left"
          >
            <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
