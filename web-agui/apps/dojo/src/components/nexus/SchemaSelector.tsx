/**
 * SchemaSelector component for selecting QC schemas in Dojo.
 * Adapted from Nexus web UI for AG-UI integration.
 */

import { useState, useEffect } from 'react';
import type { SchemaListItem } from '@/types/nexus';

interface SchemaSelectorProps {
  selectedId: string | null;
  onSelect: (schemaId: string, schema: SchemaListItem) => void;
  disabled?: boolean;
  placeholder?: string;
  apiBaseUrl?: string;
}

export function SchemaSelector({
  selectedId,
  onSelect,
  disabled = false,
  placeholder = 'Select a schema...',
  apiBaseUrl = 'http://localhost:9001',
}: SchemaSelectorProps) {
  const [schemas, setSchemas] = useState<SchemaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch schemas on mount
  useEffect(() => {
    const fetchSchemas = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Note: This will need to be connected to Supabase directly
        // or via a backend endpoint. For now, return empty list.
        const response = await fetch(`${apiBaseUrl}/api/schemas`);
        if (!response.ok) {
          throw new Error('Failed to fetch schemas');
        }
        const data = await response.json();
        setSchemas(data.schemas || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schemas';
        setError(errorMessage);
        console.error('Error fetching schemas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchemas();
  }, [apiBaseUrl]);

  // Handle value change
  const handleValueChange = (value: string) => {
    if (value === 'default-schema') {
      const defaultSchema: SchemaListItem = {
        id: 'default-schema',
        form_code: 'DEFAULT',
        form_name: 'Default Schema',
        version: '1.0.0',
        version_number: 1,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      onSelect(value, defaultSchema);
    } else {
      const schema = schemas.find((s) => s.id === value);
      if (schema) {
        onSelect(value, schema);
      }
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  // Show error state with retry
  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 rounded-md">
          <span className="text-sm text-red-800 dark:text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <select
      value={selectedId || ''}
      onChange={(e) => e.target.value && handleValueChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-white"
    >
      <option value="">{placeholder}</option>
      
      {/* Default schema option */}
      <option value="default-schema">
        [DEFAULT] Default Schema (v1.0.0)
      </option>

      {/* Available schemas */}
      {schemas.map((schema) => (
        <option key={schema.id} value={schema.id}>
          [{schema.form_code}] {schema.form_name} (v{schema.version})
        </option>
      ))}

      {/* Empty state */}
      {schemas.length === 0 && (
        <option disabled>No schemas available</option>
      )}
    </select>
  );
}
