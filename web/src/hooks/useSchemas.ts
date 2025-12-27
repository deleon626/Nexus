/**
 * Hook for fetching and managing QC schemas.
 *
 * Handles:
 * - Fetching schemas on mount
 * - Loading and error states
 * - Manual refresh capability
 */

import { useState, useEffect, useCallback } from 'react';
import { listSchemas } from '../services/schemaService';
import type { SchemaListItem } from '../types/schema';

interface UseSchemasReturn {
  schemas: SchemaListItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSchemas(): UseSchemasReturn {
  const [schemas, setSchemas] = useState<SchemaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listSchemas();
      setSchemas(response.schemas);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schemas';
      setError(errorMessage);
      console.error('Error fetching schemas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch schemas on mount
  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  return {
    schemas,
    isLoading,
    error,
    refresh: fetchSchemas
  };
}
