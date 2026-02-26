---
phase: 01-foundation-auth
plan: 03
title: Dexie.js Local Database Schema
subsystem: Database (IndexedDB)
tags: [offline, dexie, typescript, indexeddb]
one-liner: Dexie.js database with typed schema for submissions, templates, and sync queue with multi-tenant isolation
requires:
  provides:
    - OFFL-01: Offline data storage foundation
    - OFFL-02: Form templates local caching
    - OFFL-03: Draft submission queue
    - OFFL-04: Batch number indexing
  affects:
    - Plan 04: Auth integration (uses orgId for multi-tenant isolation)
    - Plan 05: Form builder (stores templates locally)
    - Plan 06: Form filling (stores submissions locally)
    - Plan 07: Sync engine (uses syncQueue)
---

# Phase 1 Plan 3: Dexie.js Local Database Schema Summary

## Overview

Implemented Dexie.js database schema establishing the IndexedDB foundation for offline functionality. All offline data (form templates, draft submissions, sync queue) will be stored through this schema.

**Duration:** 29 seconds
**Completed:** 2026-02-27

---

## Files Created

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/db/types.ts` | TypeScript type definitions | Submission, Template, SyncQueueItem, OrganizationData |
| `src/db/dexie.ts` | Dexie database instance | db (singleton), NexusDB class |

---

## Schema Design

### Tables Defined

#### 1. `submissions`
Stores form submissions from factory workers with offline-first support.

**Indexes:** `++id, localId, batchNumber, templateId, orgId, userId, status, createdAt`

**Key fields:**
- `localId`: UUID for client-side identification before sync
- `batchNumber`: Production batch association (OFFL-04)
- `orgId`: Multi-tenant isolation (AUTH-03)
- `status`: Draft lifecycle tracking (draft → pending → synced/failed)
- `serverId`: Convex ID after sync for deduplication

#### 2. `templates`
Cached form templates for offline form filling.

**Indexes:** `id, name, version, orgId, published, updatedAt`

**Key fields:**
- `schema.fields`: Array of field definitions with validation rules
- `version`: Template versioning for audit trail

#### 3. `syncQueue`
Offline-to-online sync operations with retry logic.

**Indexes:** `++id, localId, operation, endpoint, recordId, recordType, status, createdAt`

**Key fields:**
- `operation`: CRUD operation type (create/update/delete)
- `attemptCount`: Retry counter for failed syncs
- `status`: Pending → in-flight → completed/failed

#### 4. `organizations`
Organization metadata for sync tracking.

**Indexes:** `orgId, name, lastSyncAt`

---

## Index Design Rationale

| Index Pattern | Use Case |
|---------------|----------|
| `++id` | Auto-increment primary key for efficient insertion and querying |
| `localId` | Client-side UUID identification before server sync |
| `batchNumber` | OFFL-04: Query submissions by production batch |
| `orgId` | AUTH-03: Multi-tenant data isolation |
| `status` | Query draft/pending/synced submissions for sync engine |
| `templateId` | Query all submissions for a specific template |

---

## Type Safety Approach

- **Separate types file** (`src/db/types.ts`) for reusability across components
- **Union types** for status fields prevent invalid states
- **Exported from dexie.ts** for single import point: `import { db, Submission } from './db/dexie'`
- **Optional fields** marked with `?` (id, serverId, syncedAt, lastAttemptAt, error)

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Requirements Satisfied

| Requirement | Description | Status |
|-------------|-------------|--------|
| OFFL-01 | Offline data storage foundation | Complete - Dexie schema provides IndexedDB structure |
| OFFL-02 | Form templates local caching | Complete - templates table with versioning |
| OFFL-03 | Draft submission queue | Complete - submissions table with status tracking |
| OFFL-04 | Batch number indexing | Complete - batchNumber indexed in submissions |

---

## Commits

| Hash | Message |
|------|---------|
| `0e9ea5e` | feat(01-foundation-auth-03): define TypeScript types for database models |
| `e7f9afa` | feat(01-foundation-auth-03): create Dexie database instance with schema |

---

## Self-Check: PASSED

- [x] `src/db/types.ts` exists with all required interfaces
- [x] `src/db/dexie.ts` exists with NexusDB class and db export
- [x] All tables have appropriate indexes
- [x] TypeScript compiles without errors (`npx tsc --noEmit`)
- [x] Multi-tenant isolation supported via orgId
- [x] Batch number indexing present (OFFL-04)

---

## Next Steps

**Plan 04: Auth Integration** - Clerk authentication setup with role-based access control using the `orgId` field for multi-tenant isolation.
