/**
 * ID Generation API client for Nexus QC system
 * T063: API client for ID rule management
 */

import type {
  EntityType,
  IDRuleParseRequest,
  IDRuleParseResponse,
  IDRuleCreateRequest,
  IDRuleResponse,
  IDRuleListResponse,
  IDGenerateRequest,
  IDGenerateResponse,
  IDTestGenerateRequest,
  IDTestGenerateResponse,
} from '../types/idGeneration';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * API Error type
 */
export interface IDApiError {
  detail: string;
}

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: IDApiError = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.detail || 'API request failed');
  }
  return response.json();
}

/**
 * Parse natural language ID rule into structured format
 *
 * @param request - Parse request with natural language rule
 * @returns Parsed rule with pattern, components, and confidence
 */
export async function parseIDRule(
  request: IDRuleParseRequest
): Promise<IDRuleParseResponse> {
  const response = await fetch(`${API_BASE_URL}/api/id-rules/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return handleResponse<IDRuleParseResponse>(response);
}

/**
 * Save ID rule to database
 *
 * @param request - Create request with rule definition
 * @returns Created rule with ID
 */
export async function saveIDRule(
  request: IDRuleCreateRequest
): Promise<IDRuleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/id-rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return handleResponse<IDRuleResponse>(response);
}

/**
 * List ID rules with optional filtering
 *
 * @param entityType - Optional entity type filter
 * @param includeInactive - Whether to include inactive rules
 * @returns List of ID rules
 */
export async function listIDRules(
  entityType?: EntityType,
  includeInactive = false
): Promise<IDRuleListResponse> {
  const params = new URLSearchParams();

  if (entityType) {
    params.append('entity_type', entityType);
  }

  if (includeInactive) {
    params.append('include_inactive', 'true');
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/id-rules${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  return handleResponse<IDRuleListResponse>(response);
}

/**
 * Get ID rule by ID
 *
 * @param ruleId - Rule ID
 * @returns Rule details
 */
export async function getIDRule(ruleId: string): Promise<IDRuleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/id-rules/${ruleId}`);
  return handleResponse<IDRuleResponse>(response);
}

/**
 * Delete (deactivate) ID rule
 *
 * @param ruleId - Rule ID to delete
 */
export async function deleteIDRule(ruleId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/id-rules/${ruleId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: IDApiError = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.detail || 'Failed to delete ID rule');
  }
}

/**
 * Generate a new unique ID for an entity type
 *
 * @param request - Generate request with entity type and optional facility
 * @returns Generated ID with sequence number and rule info
 */
export async function generateID(
  request: IDGenerateRequest
): Promise<IDGenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ids/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return handleResponse<IDGenerateResponse>(response);
}

/**
 * Test generate an ID preview without persisting the sequence
 *
 * Unlike generateID, this:
 * - Does NOT increment the sequence counter
 * - Returns is_preview: true
 * - Can be called repeatedly to preview what the next ID would be
 *
 * @param request - Test generate request with entity type and optional facility
 * @returns Preview ID with is_preview=true
 */
export async function testGenerateID(
  request: IDTestGenerateRequest
): Promise<IDTestGenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ids/test-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return handleResponse<IDTestGenerateResponse>(response);
}
