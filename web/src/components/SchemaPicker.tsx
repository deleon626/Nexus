/**
 * SchemaPicker component for selecting QC schemas.
 *
 * Features:
 * - Dropdown selection of available schemas
 * - Loading state with skeleton
 * - Error state with retry
 * - Default schema fallback option
 * - Displays form_code, form_name, and version
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Skeleton } from './ui/skeleton';
import { useSchemas } from '../hooks/useSchemas';
import type { SchemaListItem } from '../types/schema';

interface SchemaPickerProps {
  selectedId: string | null;
  onSelect: (schemaId: string, schema: SchemaListItem) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SchemaPicker({
  selectedId,
  onSelect,
  disabled = false,
  placeholder = 'Select a schema...'
}: SchemaPickerProps) {
  const { schemas, isLoading, error, refresh } = useSchemas();

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Show error state with retry
  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 border border-destructive bg-destructive/10 rounded-md">
          <span className="text-sm text-destructive">{error}</span>
          <button
            onClick={refresh}
            className="px-3 py-1 text-sm bg-destructive/20 hover:bg-destructive/30 text-destructive rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Find selected schema for callback
  const handleValueChange = (value: string) => {
    if (value === 'default-schema') {
      // Create a default schema item
      const defaultSchema: SchemaListItem = {
        id: 'default-schema',
        form_code: 'DEFAULT',
        form_name: 'Default Schema',
        version: '1.0.0',
        version_number: 1,
        status: 'active',
        created_at: new Date().toISOString(),
        has_source_document: false
      };
      onSelect(value, defaultSchema);
    } else {
      const schema = schemas.find(s => s.id === value);
      if (schema) {
        onSelect(value, schema);
      }
    }
  };

  return (
    <Select
      value={selectedId || undefined}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="item-aligned" className="max-h-[300px]">
        {/* Default schema option */}
        <SelectItem value="default-schema">
          [DEFAULT] Default Schema (v1.0.0)
        </SelectItem>

        {/* Available schemas */}
        {schemas.map((schema) => (
          <SelectItem key={schema.id} value={schema.id}>
            [{schema.form_code}] {schema.form_name} (v{schema.version})
          </SelectItem>
        ))}

        {/* Empty state */}
        {schemas.length === 0 && (
          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
            No schemas available
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
