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
 */
export interface Template {
  id: string; // Template ID from server
  name: string;
  version: number;
  orgId: string; // Organization for multi-tenant isolation
  schema: {
    fields: Array<{
      id: string;
      type: string;
      label: string;
      required?: boolean;
      validation?: Record<string, any>;
      options?: string[]; // For select/checkbox fields
    }>;
  };
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
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
