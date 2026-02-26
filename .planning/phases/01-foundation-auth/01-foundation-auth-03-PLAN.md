---
phase: 01-foundation-auth
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - src/db/dexie.ts
  - src/db/types.ts
autonomous: true
requirements:
  - OFFL-01
  - OFFL-02
  - OFFL-03
  - OFFL-04
user_setup: []

must_haves:
  truths:
    - "Dexie database instance is created and exported"
    - "Database schema includes: submissions, templates, syncQueue tables"
    - "Table indexes support queries by status, templateId, orgId, batchNumber"
    - "TypeScript types are defined for all database models"
  artifacts:
    - path: "src/db/dexie.ts"
      provides: "Dexie database instance and schema"
      contains: "class NexusDB extends Dexie, db.version(1).stores"
      exports: ["db"]
    - path: "src/db/types.ts"
      provides: "TypeScript types for database models"
      contains: "interface Submission, interface Template, interface SyncQueueItem"
  key_links:
    - from: "src/db/dexie.ts"
      to: "src/db/types.ts"
      via: "Type import"
      pattern: "import.*types"

---

<objective>
Create Dexie.js local database schema with typed tables for submissions, templates, and sync queue. This establishes the IndexedDB structure for offline data storage.

Purpose: Dexie.js is the foundation for offline functionality. All offline data (form templates, draft submissions, sync queue) will be stored in IndexedDB via Dexie.js. This schema must be defined before any sync or offline features can be implemented.

Output: Dexie database instance, typed schema with submissions, templates, syncQueue tables, proper indexes for efficient queries.
</object>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-auth/01-RESEARCH.md

# Research patterns to follow:
# - Dexie.js class-based schema definition
# - Table indexes: ++id (auto-increment), followed by query fields
# - TypeScript interfaces for type safety
# - Transaction support for multi-table atomic writes
</context>

<tasks>

<task type="auto">
  <name>Define TypeScript types for database models</name>
  <files>src/db/types.ts</files>
  <action>
Create **src/db/types.ts** with TypeScript interfaces for all database models:

```typescript
// Submission status matches sync flow
export type SubmissionStatus = 'draft' | 'pending' | 'synced' | 'failed'

// Sync queue operations
export type SyncOperation = 'create' | 'update' | 'delete'

// Sync queue item status
export type SyncStatus = 'pending' | 'in-flight' | 'completed' | 'failed'

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

export interface OrganizationData {
  orgId: string;
  name: string;
  lastSyncAt: Date;
}
```

Create the **src/db/** directory if it doesn't exist.
  </action>
  <verify>grep -q "interface Submission" src/db/types.ts && grep -q "interface Template" src/db/types.ts && grep -q "interface SyncQueueItem" src/db/types.ts</verify>
  <done>TypeScript types defined for all database models</done>
</task>

<task type="auto">
  <name>Create Dexie database instance with schema</name>
  <files>src/db/dexie.ts</files>
  <action>
Create **src/db/dexie.ts** with Dexie database instance and schema definition:

```typescript
import Dexie, { Table } from 'dexie';
import type {
  Submission,
  Template,
  SyncQueueItem,
  OrganizationData,
} from './types';

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
```

Key schema design decisions:
- `++id` provides auto-increment primary key for efficient indexing
- `localId` (UUID) enables client-side identification before server sync
- Multi-field indexes support common query patterns (by status, by orgId, by templateId)
- `batchNumber` indexed for OFFL-04 requirement
- `orgId` in all tables for AUTH-03 multi-tenant isolation
  </action>
  <verify>grep -q "class NexusDB extends Dexie" src/db/dexie.ts && grep -q "export const db" src/db/dexie.ts && grep -q "submissions:" src/db/dexie.ts && grep -q "templates:" src/db/dexie.ts && grep -q "syncQueue:" src/db/dexie.ts</verify>
  <done>Dexie database instance created with complete schema</done>
</task>

</tasks>

<verification>
After completing all tasks:

1. Check TypeScript compilation: `npx tsc --noEmit`
2. Verify database schema is valid by importing in a test file:
   ```ts
   import { db } from './src/db/dexie'
   console.log('DB tables:', db.tables.map(t => t.name))
   ```
3. Test that database can be opened in browser console:
   ```ts
   // In browser after app loads
   import { db } from './src/db/dexie'
   await db.open()
   console.log('DB opened successfully')
   ```
</verification>

<success_criteria>
- Dexie database class defined with proper versioning
- All tables have appropriate indexes for query patterns
- TypeScript types are exported and match the schema
- Database instance exports as singleton
- Multi-tenant isolation supported via orgId indexes
- Batch number indexing present (OFFL-04)
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-auth/01-foundation-auth-03-SUMMARY.md` with:
- Schema definition details
- Index design rationale
- Type safety approach
- Next steps: Plan 04 (Auth integration)
</output>
