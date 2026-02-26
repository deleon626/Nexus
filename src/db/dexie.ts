import Dexie, { Table } from 'dexie';
import type {
  Submission,
  Template,
  SyncQueueItem,
  OrganizationData,
} from './types';

/**
 * NexusDB - Dexie database for offline IndexedDB storage
 *
 * Schema design rationale:
 * - ++id provides auto-increment primary key for efficient indexing
 * - localId (UUID) enables client-side identification before server sync
 * - Multi-field indexes support common query patterns (by status, by orgId, by templateId)
 * - batchNumber indexed for OFFL-04 requirement (production batch queries)
 * - orgId in all tables for AUTH-03 multi-tenant isolation
 */
class NexusDB extends Dexie {
  submissions!: Table<Submission>;
  templates!: Table<Template>;
  syncQueue!: Table<SyncQueueItem>;
  organizations!: Table<OrganizationData>;

  constructor() {
    super('nexus-db');

    // Version 1: Initial schema
    this.version(1).stores({
      // Indexes for efficient queries
      // ++id = auto-increment primary key
      submissions: '++id, localId, batchNumber, templateId, orgId, userId, status, createdAt',
      templates: 'id, name, version, orgId, published, updatedAt',
      syncQueue: '++id, localId, operation, endpoint, recordId, recordType, status, createdAt',
      organizations: 'orgId, name, lastSyncAt',
    });
  }
}

// Export singleton instance
export const db = new NexusDB();

// Export types for use in components
export type { Submission, Template, SyncQueueItem, OrganizationData } from './types';
