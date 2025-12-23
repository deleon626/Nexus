/**
 * Schema Generator API client for Nexus QC system
 * T026: API client for schema extraction
 */

import type {
  SchemaExtractionResponse,
  SchemaCreateRequest,
  SchemaUpdateRequest,
  SchemaResponse,
  SchemaListResponse,
} from '../types/schema';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * API Error type
 */
export interface SchemaApiError {
  detail: string;
}

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: SchemaApiError = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.detail || 'API request failed');
  }
  return response.json();
}

/**
 * Extract schema from uploaded PDF or image file
 *
 * @param file - PDF or image file to extract schema from
 * @param schemaName - Name to assign to the extracted schema
 * @returns Extracted schema structure with metadata
 */
export async function extractSchema(
  file: File,
  schemaName: string
): Promise<SchemaExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('schema_name', schemaName);

  const response = await fetch(`${API_BASE_URL}/api/schemas/extract`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<SchemaExtractionResponse>(response);
}

/**
 * Save extracted schema to database
 *
 * @param schema - Schema data to save
 * @returns Saved schema with ID and version
 */
export async function createSchema(
  schema: SchemaCreateRequest
): Promise<SchemaResponse> {
  const response = await fetch(`${API_BASE_URL}/api/schemas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(schema),
  });

  return handleResponse<SchemaResponse>(response);
}

/**
 * Get schema by ID
 *
 * @param schemaId - Schema ID
 * @returns Schema details
 */
export async function getSchema(schemaId: string): Promise<SchemaResponse> {
  const response = await fetch(`${API_BASE_URL}/api/schemas/${schemaId}`);
  return handleResponse<SchemaResponse>(response);
}

/**
 * List all schemas with pagination
 *
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @param category - Optional category filter
 * @returns Paginated list of schemas
 */
export async function listSchemas(
  page = 1,
  pageSize = 20,
  category?: string
): Promise<SchemaListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (category) {
    params.append('category', category);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/schemas?${params.toString()}`
  );
  return handleResponse<SchemaListResponse>(response);
}

/**
 * Update existing schema (creates new version)
 *
 * @param schemaId - Schema ID to update
 * @param update - Update data
 * @returns Updated schema with new version
 */
export async function updateSchema(
  schemaId: string,
  update: SchemaUpdateRequest
): Promise<SchemaResponse> {
  const response = await fetch(`${API_BASE_URL}/api/schemas/${schemaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  return handleResponse<SchemaResponse>(response);
}

/**
 * Delete schema by ID
 *
 * @param schemaId - Schema ID to delete
 */
export async function deleteSchema(schemaId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/schemas/${schemaId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: SchemaApiError = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.detail || 'Failed to delete schema');
  }
}
