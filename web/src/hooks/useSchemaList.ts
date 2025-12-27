/**
 * Hook for fetching and managing schema list with search.
 *
 * Handles:
 * - Fetching schemas on mount with pagination
 * - Client-side search filtering by form_name and form_code
 * - Loading and error states
 * - Manual refresh capability
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
}

export function useSchemaList(options: UseSchemaListOptions = {}): UseSchemaListReturn {
  const { pageSize = 50 } = options;

  const [schemas, setSchemas] = useState<SchemaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);

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

  return {
    schemas,
    filteredSchemas,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    refresh: fetchSchemas,
    total,
  };
}
