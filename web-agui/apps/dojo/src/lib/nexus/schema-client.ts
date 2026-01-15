/**
 * Schema client for Nexus AG-UI integration.
 * Handles Supabase API calls for schema management.
 */

import type { SchemaListItem, SchemaResponse, ExtractedSchemaStructure } from '@/types/nexus';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.detail || 'API request failed');
  }
  return response.json();
}

/**
 * List all schemas from Supabase.
 * Note: This requires a Supabase backend endpoint or direct Supabase client access.
 */
export async function listSchemas(
  page = 1,
  pageSize = 20,
  category?: string
): Promise<{ schemas: SchemaListItem[]; total: number; page: number; page_size: number }> {
  // If Supabase credentials are available, use direct Supabase client
  // Otherwise, use backend proxy
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let query = supabase
      .from('schemas')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      schemas: data || [],
      total: count || 0,
      page,
      page_size: pageSize,
    };
  }

  // Fallback to backend proxy (if available)
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (category) {
    params.append('category', category);
  }

  const response = await fetch(`/api/schemas?${params.toString()}`);
  return handleResponse<{ schemas: SchemaListItem[]; total: number; page: number; page_size: number }>(response);
}

/**
 * Get schema by ID from Supabase.
 */
export async function getSchema(schemaId: string): Promise<SchemaResponse> {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('schemas')
      .select('*')
      .eq('id', schemaId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as SchemaResponse;
  }

  // Fallback to backend proxy
  const response = await fetch(`/api/schemas/${schemaId}`);
  return handleResponse<SchemaResponse>(response);
}

/**
 * Submit confirmation data to backend.
 * This is called after user confirms extracted QC data.
 */
export async function submitConfirmation(
  sessionId: string,
  approved: boolean,
  userModifications?: Record<string, unknown> | null
): Promise<{ success: boolean; report_id?: string }> {
  const response = await fetch('/api/confirmations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      approved,
      user_modifications: userModifications || null,
    }),
  });

  return handleResponse<{ success: boolean; report_id?: string }>(response);
}
