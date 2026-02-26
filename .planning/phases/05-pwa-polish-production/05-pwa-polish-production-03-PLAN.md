---
phase: 05-pwa-polish-production
plan: 03
type: execute
wave: 1
depends_on: []
files_modified: [src/features/pwa/hooks/useStorageMonitor.ts, src/features/pwa/utils/storageCleanup.ts, src/features/pwa/constants.ts, src/db/db.ts]
autonomous: true
requirements: []
user_setup: []

must_haves:
  truths:
    - "Storage usage estimated via navigator.storage.estimate() API"
    - "Warning state triggered at 80% quota usage (not blocking)"
    - "Blocking state triggered at 95% quota usage (prevents new operations)"
    - "Auto-cleanup: synced submissions deleted after 7 days, drafts after 14 days"
    - "Cleanup runs at retention thresholds automatically"
  artifacts:
    - path: "src/features/pwa/hooks/useStorageMonitor.ts"
      provides: "React hook for storage quota monitoring with polling"
      exports: ["useStorageMonitor"]
    - path: "src/features/pwa/utils/storageCleanup.ts"
      provides: "Utility functions for automatic data cleanup at retention thresholds"
      exports: ["cleanupSyncedSubmissions", "cleanupExpiredDrafts", "runAutoCleanup"]
    - path: "src/features/pwa/constants.ts"
      provides: "PWA storage thresholds and retention period constants"
      contains: "STORAGE_WARNING_PERCENT, STORAGE_BLOCKING_PERCENT"
  key_links:
    - from: "src/features/pwa/hooks/useStorageMonitor.ts"
      to: "navigator.storage.estimate()"
      via: "Browser Storage API for quota estimation"
      pattern: "navigator\\.storage\\.estimate"
    - from: "src/features/pwa/utils/storageCleanup.ts"
      to: "src/db/db.ts"
      via: "Dexie database operations for cleanup"
      pattern: "db\\.(submissions|drafts)\\.where.*delete"
---

<objective>
Create storage monitoring and automatic cleanup system. Monitor IndexedDB quota usage via navigator.storage.estimate(), warn at 80%, block at 95%, auto-cleanup old data at retention thresholds.

Purpose: Prevent storage quota exhaustion that would break app functionality. Per CONTEXT.md: warn at 80%, block at 95%, auto-cleanup synced submissions after 7 days and drafts after 14 days, hands-off automatic cleanup.

Output: useStorageMonitor hook, storageCleanup utilities, PWA constants
</objective>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/05-pwa-polish-production/05-CONTEXT.md
@.planning/phases/05-pwa-polish-production/05-RESEARCH.md

# Existing database schema
@src/db/db.ts — Dexie database with submissions, drafts, templates tables
@src/features/formFilling/utils/cleanupExpiredDrafts.ts — Existing draft cleanup utility
</context>

<tasks>

<task type="auto">
  <name>Create PWA constants for storage thresholds and retention periods</name>
  <files>src/features/pwa/constants.ts</files>
  <action>
Create src/features/pwa/constants.ts:

1. Storage threshold constants (per CONTEXT.md):
   - STORAGE_WARNING_PERCENT = 80 (warn user at 80% usage)
   - STORAGE_BLOCKING_PERCENT = 95 (block operations at 95% usage)

2. Retention period constants (per CONTEXT.md):
   - SYNCED_SUBMISSION_RETENTION_DAYS = 7 (days after sync to delete)
   - DRAFT_RETENTION_DAYS = 14 (days after expiration to delete)

3. Storage monitoring constants:
   - STORAGE_CHECK_INTERVAL_MS = 60000 (check every 60 seconds per RESEARCH)

4. Export all constants as named exports

These constants will be used by useStorageMonitor and storageCleanup utilities.
  </action>
  <verify>grep -q "STORAGE_WARNING_PERCENT.*80" src/features/pwa/constants.ts && grep -q "STORAGE_BLOCKING_PERCENT.*95" src/features/pwa/constants.ts</verify>
  <done>Constants file with storage thresholds (80/95), retention periods (7/14 days), and check interval</done>
</task>

<task type="auto">
  <name>Create useStorageMonitor hook with quota estimation</name>
  <files>src/features/pwa/hooks/useStorageMonitor.ts</files>
  <action>
Create src/features/pwa/hooks/useStorageMonitor.ts:

1. Import db from '@/db/db' and constants from '@/features/pwa/constants'

2. State management:
   - usage: object with { percent: number, used: string, total: string } | null
   - status: 'idle' | 'ok' | 'warning' | 'blocking'
   - lastChecked: timestamp for debugging

3. formatBytes utility function (per RESEARCH.md):
   - Input: bytes number
   - Output: human-readable string (e.g., "125.5 MB")
   - Handle zero case: return "0 Bytes"
   - Use 1024 as base (not 1000)

4. checkStorage function:
   - Call navigator.storage.estimate()
   - Calculate usagePercent = (usage / quota) * 100
   - Determine status: 'ok' if <80%, 'warning' if >=80%, 'blocking' if >=95%
   - Update state with formatted bytes

5. useEffect for polling:
   - Run checkStorage() immediately on mount
   - Set interval to check every STORAGE_CHECK_INTERVAL_MS (60 seconds)
   - Cleanup interval on unmount

6. Return: { usage, status, lastChecked }

Per RESEARCH.md Pattern 3 for navigator.storage.estimate() usage.
  </action>
  <verify>grep -q "navigator.storage.estimate" src/features/pwa/hooks/useStorageMonitor.ts && grep -q "formatBytes" src/features/pwa/hooks/useStorageMonitor.ts</verify>
  <done>Hook returns storage usage with percent, status (ok/warning/blocking), and human-readable bytes</done>
</task>

<task type="auto">
  <name>Create storage cleanup utilities</name>
  <files>src/features/pwa/utils/storageCleanup.ts</files>
  <action>
Create src/features/pwa/utils/storageCleanup.ts:

1. Import db from '@/db/db' and constants from '@/features/pwa/constants'

2. cleanupSyncedSubmissions function:
   - Calculate cutoff timestamp = Date.now() - (7 days * ms per day)
   - Delete from db.submissions where syncedAt < cutoff
   - Return count of deleted records

3. cleanupExpiredDrafts function:
   - Note: src/features/formFilling/utils/cleanupExpiredDrafts.ts already exists
   - Import and re-export existing function
   - This maintains DRY principle

4. runAutoCleanup function:
   - Call cleanupSyncedSubmissions()
   - Call cleanupExpiredDrafts()
   - Log cleanup results for debugging
   - Return total count of cleaned records

5. Export all cleanup functions

The existing cleanupExpiredDrafts utility uses the draft's expiresAt field which is already calculated during draft creation.

Auto-cleanup runs automatically (not manually triggered) per CONTEXT.md: "cleanup runs automatically at retention thresholds".
  </action>
  <verify>grep -q "cleanupSyncedSubmissions\|runAutoCleanup" src/features/pwa/utils/storageCleanup.ts && grep -q "submissions.*where.*below.*delete" src/features/pwa/utils/storageCleanup.ts</verify>
  <done>Storage cleanup utilities: cleanupSyncedSubmissions, re-exported cleanupExpiredDrafts, runAutoCleanup orchestrator</done>
</task>

<task type="auto">
  <name>Integrate auto-cleanup with storage monitor</name>
  <files>src/features/pwa/hooks/useStorageMonitor.ts</files>
  <action>
Modify src/features/pwa/hooks/useStorageMonitor.ts:

1. Import runAutoCleanup from '@/features/pwa/utils/storageCleanup'

2. Add cleanup trigger logic:
   - When status changes to 'warning' (80% threshold), trigger runAutoCleanup()
   - Only run cleanup once per warning state (use ref to track if cleanup ran)
   - After cleanup, re-check storage to see if usage dropped

3. Add cleanup state:
   - cleanupRan: ref<boolean> to track if cleanup executed for current warning
   - Reset cleanupRan when status returns to 'ok'

4. In checkStorage function:
   - After calculating new status
   - If status === 'warning' && !cleanupRan.current:
     - Call runAutoCleanup()
     - Set cleanupRan.current = true
     - Re-check storage after 1 second delay
   - If status === 'ok':
     - Reset cleanupRan.current = false

This ensures automatic cleanup hands-off per CONTEXT.md while avoiding redundant cleanup calls.
  </action>
  <verify>grep -q "runAutoCleanup" src/features/pwa/hooks/useStorageMonitor.ts</verify>
  <done>Auto-cleanup triggers when storage reaches warning threshold (80%)</done>
</task>

</tasks>

<verification>
Overall verification:
1. Constants define storage thresholds (80/95) and retention periods (7/14 days)
2. useStorageMonitor hook calls navigator.storage.estimate() and returns usage percent
3. Status changes based on thresholds: ok (<80%), warning (80-95%), blocking (>=95%)
4. Auto-cleanup runs at warning threshold (80%)
5. Synced submissions cleanup deletes records older than 7 days
6. Drafts cleanup uses existing utility
7. Storage check runs every 60 seconds via polling
</verification>

<success_criteria>
1. Storage usage is monitored and reported with percentage
2. Warning state triggers at 80% usage with auto-cleanup
3. Blocking state triggers at 95% usage
4. Old synced submissions are deleted after 7 days
5. Expired drafts are deleted after 14 days
6. Cleanup runs automatically without user intervention
</success_criteria>

<output>
After completion, create .planning/phases/05-pwa-polish-production/05-pwa-polish-production-03-SUMMARY.md
</output>
