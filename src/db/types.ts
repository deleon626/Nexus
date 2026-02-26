// Database type definitions for Dexie.js
// These types define the schema for offline IndexedDB storage

// Submission status matches sync flow
export type SubmissionStatus = 'draft' | 'pending' | 'synced' | 'failed'

// Sync queue operations
export type SyncOperation = 'create' | 'update' | 'delete'

// Sync queue item status
export type SyncStatus = 'pending' | 'in-flight' | 'completed' | 'failed'

/**
 * Submission represents a form submission from a factory worker.
 * Stored locally in IndexedDB, synced to Convex when online.
 */
export interface Submission {
  id?: number; // Auto-incremented by Dexie
  localId: string; // UUID for client-side identification
  batchNumber: string; // OFFL-04: Production batch association
  templateId: string; // Reference to form template
  orgId: string; // Organization for multi-tenant isolation
  userId: string; // Clerk user ID who created submission
  data: Record<string, any>; // Form field values
  photos: string[]; // Array of base64 or blob URLs (Phase 3)
  status: SubmissionStatus;
  serverId?: string; // Convex ID after sync (for deduplication)
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date; // Last successful sync timestamp
}

/**
 * Template represents a form template defined by admins.
 * Cached locally for offline form filling.
 *
 * Matches FormTemplate from features/formBuilder/types.ts for consistency.
 * Re-exported here to avoid circular dependencies between db and formBuilder features.
 */
export interface Template {
  id: string; // Template ID from server
  name: string;
  version: number; // FORM-04: Version tracking for audit trail
  orgId: string; // Organization for multi-tenant isolation
  fields: Array<{
    id: string;
    type: string;
    label: string;
    required: boolean;
    placeholder?: string;
    helpText?: string;
    validation?: Record<string, any>;
    options?: Array<{ value: string; label: string }>;
    passLabel?: string;
    failLabel?: string;
    rows?: number;
  }>; // Form fields array matching FormTemplate schema
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date; // When template was published
  createdBy: string; // Clerk user ID of creator
}

/**
 * SyncQueueItem represents an operation to be synced to the server.
 * Enables offline-to-online synchronization with retry logic.
 */
export interface SyncQueueItem {
  id?: number; // Auto-incremented by Dexie
  localId: string; // UUID for tracking
  operation: SyncOperation;
  endpoint: string; // API endpoint to call
  recordId: string; // Local record ID
  recordType: 'submission' | 'template';
  payload: Record<string, any>; // Request payload
  status: SyncStatus;
  attemptCount: number; // Retry counter
  lastAttemptAt?: Date;
  error?: string; // Last error message
  createdAt: Date;
}

/**
 * OrganizationData stores organization metadata for sync tracking.
 * Supports multi-tenant isolation (AUTH-03).
 */
export interface OrganizationData {
  orgId: string;
  name: string;
  lastSyncAt: Date;
}

/**
 * Draft represents an auto-saved form filling session.
 * Stores in-progress form data with 7-day expiration to prevent data loss.
 * Workers can resume drafts from the draft picker modal.
 */
export interface Draft {
  id?: number; // Auto-incremented by Dexie
  localId: string; // UUID for client-side identification
  formId: string; // Template ID reference
  formName: string; // Form name for display (denormalized for draft picker)
  batchNumber: string; // Production batch number
  formData: Record<string, any>; // Form field values
  orgId: string; // Organization for multi-tenant isolation
  userId: string; // Clerk user ID who created draft
  expiresAt: number; // Timestamp for 7-day expiry (auto-cleanup)
  createdAt: Date;
  updatedAt: Date;
}
