/**
 * Hook for fetching and managing schema list with search and selection.
 *
 * Handles:
 * - Fetching schemas on mount with pagination
 * - Client-side search filtering by form_name and form_code
 * - Loading and error states
 * - Manual refresh capability
 * - Multi-select for bulk operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { listSchemas } from '../services/schemaService';
import type { SchemaListItem } from '../types/schema';

interface UseSchemaListOptions {
  pageSize?: number;
}

interface UseSchemaListReturn {
  schemas: SchemaListItem[];
  filteredSchemas: SchemaListItem[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refresh: () => Promise<void>;
  total: number;
  // Selection state
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isAllSelected: boolean;
  selectedCount: number;
}

export function useSchemaList(options: UseSchemaListOptions = {}): UseSchemaListReturn {
  const { pageSize = 50 } = options;

  const [schemas, setSchemas] = useState<SchemaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchSchemas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listSchemas(1, pageSize);
      setSchemas(response.schemas);
      setTotal(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schemas';
      setError(errorMessage);
      console.error('Error fetching schemas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  // Clear selection when schemas change (e.g., after refresh)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [schemas]);

  // Client-side search filtering (memoized for performance)
  const filteredSchemas = useMemo(() => {
    if (!searchTerm.trim()) {
      return schemas;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return schemas.filter(
      (schema) =>
        schema.form_name.toLowerCase().includes(lowerSearch) ||
        schema.form_code.toLowerCase().includes(lowerSearch)
    );
  }, [schemas, searchTerm]);

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredSchemas.map((s) => s.id)));
  }, [filteredSchemas]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useMemo(() => {
    return filteredSchemas.length > 0 && filteredSchemas.every((s) => selectedIds.has(s.id));
  }, [filteredSchemas, selectedIds]);

  const selectedCount = selectedIds.size;

  return {
    schemas,
    filteredSchemas,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    refresh: fetchSchemas,
    total,
    // Selection state
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected,
    selectedCount,
  };
}
