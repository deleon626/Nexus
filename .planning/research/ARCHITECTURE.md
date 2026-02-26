# Architecture Research

**Domain:** Offline-first mobile PWA with voice input and multi-tenant SaaS
**Researched:** 2026-02-26
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (PWA)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   Auth   │  │  Forms   │  │  Voice   │  │ Review   │          │
│  │ (Clerk)  │  │ Builder  │  │  Input   │  │ Dashboard│          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │             │             │                   │
│       └─────────────┴─────────────┴─────────────┘                   │
│                             │                                       │
├─────────────────────────────┼───────────────────────────────────────┤
│                      STATE MANAGEMENT                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐    │
│  │  Dexie.js   │  │ Sync Engine │  │    React State          │    │
│  │ (IndexedDB) │  │   (Custom)  │  │  (useState/useQuery)    │    │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘    │
│         │                │                                          │
├─────────┴────────────────┴──────────────────────────────────────────┤
│                      SERVICE WORKER                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Offline Cache Strategy (Vite PWA + Workbox)                 │  │
│  │  - App Shell: Precache                                       │  │
│  │  - API: NetworkFirst                                         │  │
│  │  - Assets: StaleWhileRevalidate                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                         NETWORK LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐    │
│  │   Convex    │  │   Clerk     │  │    Voice API            │    │
│  │   Backend   │  │   Auth      │  │  (OpenRouter/Agno)      │    │
│  │  (Realtime) │  │  Provider   │  │                         │    │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| **Clerk Auth** | User authentication, session management, role claims | Convex backend (JWT), React components |
| **Form Builder** | Admin UI for creating templates with field types | Dexie (local cache), Convex (persist) |
| **Form Filling** | Worker UI for per-batch data entry | Dexie (draft storage), Voice API, Camera |
| **Voice Input** | Capture audio, send to STT, parse with LLM | OpenRouter/Whisper API, Agno framework |
| **Review Dashboard** | Approve/reject submissions, real-time updates | Convex (live queries), Dexie (local cache) |
| **Dexie.js** | Local IndexedDB for offline data storage | All local components, Sync Engine |
| **Sync Engine** | Queue pending mutations, sync when online, resolve conflicts | Dexie (local), Convex (remote), Service Worker (network events) |
| **Service Worker** | Cache app shell, intercept network requests, detect connectivity | Vite PWA configuration, browser APIs |
| **Convex Backend** | Serverless functions, real-time database, file storage | Sync Engine, Clerk (auth validation) |
| **Voice API** | Whisper STT via OpenRouter, Agno LLM for field extraction | Form Filling component |

## Recommended Project Structure

```
src/
├── components/           # React UI components
│   ├── auth/            # Login/logout, protected routes
│   ├── forms/           # Form builder, form filler, field components
│   ├── voice/           # Voice input button, recording UI
│   ├── review/          # Review dashboard, submission details
│   └── shared/          # Buttons, inputs, layout components
├── lib/
│   ├── convex/          # Generated Convex client
│   │   └── _generated/  # Auto-generated from convex/ folder
│   ├── db/              # Dexie.js database setup
│   │   ├── schema.ts    # IndexedDB schema definition
│   │   ├── index.ts     # Dexie instance export
│   │   └── sync.ts      # Custom sync engine
│   ├── auth.ts          # Clerk configuration
│   └── voice/           # Voice input integration
│       ├── whisper.ts   # OpenRouter Whisper API client
│       └── agno.ts      # Agno framework LLM client
├── hooks/               # Custom React hooks
│   ├── useSync.ts       # Sync status and manual sync trigger
│   ├── useOnline.ts     # Network connectivity detection
│   └── useFormDraft.ts  # Auto-save form drafts to Dexie
├── convex/              # Convex backend functions
│   ├── schema.ts        # Database schema definition
│   ├── auth.config.ts   # Clerk integration
│   ├── forms/           # Form template CRUD
│   ├── submissions/     # Submission CRUD + review workflow
│   ├── files.ts         # Photo upload/storage
│   └── sync/            # Sync mutations (push/pull)
├── service-worker/      # Service worker logic
│   ├── sw.ts            # Custom service worker (injectManifest)
│   └── cache-strategies.ts
└── App.tsx              # Root component with providers
```

### Structure Rationale

- **components/**: Organized by feature domain (auth, forms, voice, review) for clear feature boundaries
- **lib/db/**: All local storage logic isolated — Dexie schema, instance, and custom sync engine
- **lib/voice/**: Voice integration isolated to support future expansion to offline WASM
- **hooks/**: Reusable sync, online status, and draft auto-save logic
- **convex/**: Backend functions mirror frontend structure (forms, submissions, sync)
- **service-worker/**: Custom SW for advanced offline patterns (queue management)

## Architectural Patterns

### Pattern 1: Dual-Layer Storage (Dexie + Convex)

**What:** Store data locally in Dexie.js (IndexedDB) for offline access, sync with Convex when online. Custom sync engine since Dexie Cloud is not being used.

**When to use:** Core pattern for all user-facing data (forms, submissions, templates).

**Trade-offs:**
- **Pros:** Works offline, fast local reads, survives network interruptions
- **Cons:** Custom sync engine complexity, conflict resolution needed, data duplication

**Example:**
```typescript
// lib/db/schema.ts - IndexedDB schema
import Dexie, { Table } from 'dexie';

export class NexusDB extends Dexie {
  formTemplates!: Table<FormTemplate>;
  submissions!: Table<Submission>;
  syncQueue!: Table<SyncOperation>;

  constructor() {
    super('NexusDB');
    this.version(1).stores({
      formTemplates: 'id, orgId, published, version',
      submissions: 'id, orgId, formId, batchId, status, createdAt',
      syncQueue: 'id, operation, table, timestamp, synced',
    });
  }
}

export const db = new NexusDB();

// lib/db/sync.ts - Custom sync engine
export class SyncEngine {
  private online: boolean = navigator.onLine;

  async enqueue<T>(operation: 'create' | 'update' | 'delete', table: string, data: T) {
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      operation,
      table,
      data,
      timestamp: Date.now(),
      synced: false,
    });

    if (this.online) {
      await this.processQueue();
    }
  }

  async processQueue() {
    const pending = await db.syncQueue.where('synced').equals(false).toArray();

    for (const op of pending) {
      try {
        await this.syncToConvex(op);
        await db.syncQueue.update(op.id, { synced: true });
      } catch (error) {
        console.error('Sync failed for:', op.id, error);
        // Keep in queue for retry
      }
    }

    // Clean up synced operations older than 7 days
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    await db.syncQueue.where('synced').equals(true).and(op => op.timestamp < weekAgo).delete();
  }

  private async syncToConvex(op: SyncOperation) {
    // Map local operations to Convex mutations
    switch (op.table) {
      case 'submissions':
        if (op.operation === 'create') {
          await convex.mutations.sync.pushSubmission(op.data);
        }
        break;
      // ... other tables
    }
  }
}
```

### Pattern 2: Offline Queue with Background Sync

**What:** Capture all write operations (create, update, delete) in a local queue, replay when online using Background Sync API.

**When to use:** All user-generated mutations (form submissions, template changes).

**Trade-offs:**
- **Pros:** Works offline, automatic retry, user sees immediate feedback
- **Cons:** Requires service worker, iOS Background Sync not supported, queue size limits

**Example:**
```typescript
// service-worker/sw.ts
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Background sync for queued mutations
const bgSyncPlugin = new BackgroundSyncPlugin('nexus-sync-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        // Success - entry will be removed
      } catch (error) {
        console.error('Background sync failed:', error);
        await queue.unshiftRequest(entry); // Re-queue for next sync
        throw error; // Stop processing this batch
      }
    }
  },
});

// Intercept Convex mutations when offline
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/convex/'),
  new NetworkFirst({
    cacheName: 'convex-cache',
    plugins: [bgSyncPlugin],
  }),
);

// Cache form templates for offline use
registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({
    cacheName: 'html-cache',
  }),
);
```

### Pattern 3: Optimistic UI with Rollback

**What:** Update UI immediately when user acts, sync in background, rollback on failure.

**When to use:** Form submissions, status changes (approve/reject).

**Trade-offs:**
- **Pros:** Instant feedback, perceived performance
- **Cons:** UI inconsistencies if rollback needed, error handling complexity

**Example:**
```typescript
// hooks/useFormSubmission.ts
export function useFormSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);

    // Optimistic update to local store
    const tempId = crypto.randomUUID();
    await db.submissions.add({
      id: tempId,
      ...formData,
      status: 'pending_sync',
      createdAt: Date.now(),
    });

    try {
      // Enqueue for sync
      await syncEngine.enqueue('create', 'submissions', { id: tempId, ...formData });

      // Sync immediately if online
      if (navigator.onLine) {
        await syncEngine.processQueue();
      }

      return tempId;
    } catch (err) {
      // Rollback optimistic update
      await db.submissions.delete(tempId);
      setError(err instanceof Error ? err.message : 'Submission failed');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error };
}
```

### Pattern 4: Real-Time Subscriptions with Fallback

**What:** Use Convex real-time queries when online, fall back to Dexie live queries when offline.

**When to use:** Dashboard data, submission lists, template catalogs.

**Trade-offs:**
- **Pros:** Seamless UX across connectivity states, always shows latest data
- **Cons:** Dual query logic, potential state duplication

**Example:**
```typescript
// components/review/SubmissionList.tsx
import { useQuery } from '@/lib/convex/_generated/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useOnline } from '@/hooks/useOnline';

export function SubmissionList() {
  const isOnline = useOnline();

  // Real-time from Convex when online
  const convexSubmissions = useQuery(
    api.submissions.listPending,
    {},
    // Skip query when offline to prevent errors
    { skip: !isOnline }
  );

  // Live from local Dexie when offline
  const localSubmissions = useLiveQuery(() =>
    db.submissions
      .where('status')
      .equals('pending')
      .sortBy('createdAt')
  );

  const submissions = isOnline ? convexSubmissions : localSubmissions;

  if (!submissions) return <div>Loading...</div>;

  return (
    <ul>
      {submissions.map(sub => (
        <SubmissionItem key={sub._id || sub.id} submission={sub} />
      ))}
    </ul>
  );
}
```

## Data Flow

### Request Flow (Online)

```
[User Action: Fill Form]
    ↓
[Form Component] → Save draft to Dexie (auto-save)
    ↓
[User: Submit]
    ↓
[Form Component] → Validate → Add to Sync Queue (Dexie)
    ↓
[Sync Engine] → Process Queue → Convex Mutation
    ↓
[Convex Backend] → Validate auth + org → Save to database
    ↓
[Real-time Subscription] → Update Review Dashboard
```

### Request Flow (Offline)

```
[User Action: Fill Form]
    ↓
[Form Component] → Save draft to Dexie (auto-save)
    ↓
[User: Submit] (no network)
    ↓
[Form Component] → Validate → Add to Sync Queue (Dexie)
    ↓
[Show: "Will sync when online"]
    ↓
[Service Worker: Background Sync] triggered when online
    ↓
[Sync Engine] → Process Queue → Convex Mutation
    ↓
[Update: "Synced successfully"]
```

### Voice Input Flow

```
[User: Tap microphone]
    ↓
[Voice Component] → Request browser mic permission (first time)
    ↓
[MediaRecorder] → Capture audio → Stop on silence or manual
    ↓
[Voice API Client] → POST to OpenRouter Whisper API
    ↓
[OpenRouter] → STT → Return transcript
    ↓
[Agno Client] → POST with transcript + form schema
    ↓
[Agno LLM] → Extract structured field values
    ↓
[Form Component] → Populate fields → User confirms/edits
```

### Auth & Multi-Tenancy Flow

```
[User: Login]
    ↓
[Clerk] → Authenticate → Generate JWT with orgId + role claims
    ↓
[Convex Client] → Include JWT in requests
    ↓
[Convex Function] → ctx.auth.getUserIdentity() → Extract orgId, role
    ↓
[Row-Level Security] → Filter queries by orgId, check permissions
    ↓
[Response] → Return only org-scoped data
```

### State Management

```
┌──────────────────────────────────────────────────────────────┐
│                         React State                          │
│  - Component-level UI state (forms, modals, filters)        │
│  - ephemeral, resets on refresh                              │
└──────────────────────────────────────────────────────────────┘
                          ↓ persists to
┌──────────────────────────────────────────────────────────────┐
│                        Dexie.js                              │
│  - User drafts, cached templates, sync queue                 │
│  - persists across sessions, offline-accessible              │
└──────────────────────────────────────────────────────────────┘
                          ↓ syncs to
┌──────────────────────────────────────────────────────────────┐
│                         Convex                               │
│  - Source of truth, shared across users                      │
│  - real-time subscriptions, authz, file storage              │
└──────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Form Template Distribution:** Admin creates → Convex → sync to workers' Dexie → available offline
2. **Submission Pipeline:** Worker fills → Dexie draft → submit → sync queue → Convex → reviewer sees
3. **Voice Input:** Mic capture → Whisper API → transcript → Agno LLM → extracted values → form fields
4. **Review Workflow:** Approve/reject → Convex mutation → real-time update → worker dashboard reflects
5. **Photo Upload:** Camera → blob → Convex generateUploadUrl → upload → storageId → save with submission

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single Convex deployment, shared schema with orgId filtering |
| 1k-100k users | Consider Convex partitions, optimize queries with indexes, CDN for assets |
| 100k+ users | Isolate high-volume orgs, evaluate dedicated Convex deployments, cache strategy tuning |

### Scaling Priorities

1. **First bottleneck:** IndexedDB storage limits (50-100MB per origin)
   - **Mitigation:** Implement data pruning, archive old submissions, limit photo sizes
   - **Monitor:** Storage usage API, warn users at 80% capacity

2. **Second bottleneck:** Convex query performance with large org datasets
   - **Mitigation:** Strategic indexes (orgId + status, orgId + createdAt), pagination
   - **Monitor:** Query latency, slow query logs

3. **Third bottleneck:** Sync queue processing during reconnection
   - **Mitigation:** Batch operations, prioritize recent mutations, exponential backoff
   - **Monitor:** Queue depth, sync success rate

## Anti-Patterns

### Anti-Pattern 1: Synchronous Voice Input on Main Thread

**What people do:** Block UI while recording audio, waiting for STT response, waiting for LLM parsing.

**Why it's wrong:** UI freezes, poor UX on slow connections, no cancellation option.

**Do this instead:**
```typescript
// ✅ Async with loading states and cancellation
const [isRecording, setIsRecording] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
const abortController = useRef<AbortController>();

const startVoiceInput = async () => {
  setIsRecording(true);
  abortController.current = new AbortController();

  try {
    const audioBlob = await recordAudio(abortController.current.signal);
    setIsRecording(false);
    setIsProcessing(true);

    const transcript = await whisperClient.transcribe(audioBlob, abortController.current.signal);
    const extracted = await agnoClient.extractFields(transcript, formSchema);

    populateForm(extracted);
  } catch (error) {
    if (error.name !== 'AbortError') {
      showToast('Voice input failed', 'error');
    }
  } finally {
    setIsRecording(false);
    setIsProcessing(false);
  }
};
```

### Anti-Pattern 2: No Conflict Resolution

**What people do:** Last-write-wins sync, overwrites concurrent edits, data loss.

**Why it's wrong:** Two workers can submit the same batch independently, reviewer changes get overwritten.

**Do this instead:**
```typescript
// ✅ Timestamp-based conflict detection with user prompt
interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  localTimestamp: number;
  serverTimestamp?: number;
  version: number;
}

// On sync failure due to version mismatch:
const resolveConflict = async (local: SyncOperation, server: any) => {
  const resolution = await showDialog({
    title: 'Conflict Detected',
    message: 'This submission was modified by another user. Keep your changes or use server version?',
    actions: ['Keep Mine', 'Use Server', 'Open Both'],
  });

  if (resolution === 'Keep Mine') {
    // Force push with incremented version
    await convex.mutations.sync.forceUpdate({ ...local.data, version: server.version + 1 });
  } else if (resolution === 'Use Server') {
    // Discard local, pull server version
    await db.submissions.put(server);
  }
  // 'Open Both' → Show side-by-side diff UI
};
```

### Anti-Pattern 3: Silent Offline Failures

**What people do:** User submits form offline, no indication of pending sync, submission "disappears."

**Why it's wrong:** User confusion, duplicate submissions, loss of trust.

**Do this instead:**
```typescript
// ✅ Explicit sync status with action buttons
const SyncStatusBadge = ({ submissionId }: { submissionId: string }) => {
  const syncStatus = useLiveQuery(() =>
    db.syncQueue.where('data.submissionId').equals(submissionId).first()
  );

  if (!syncStatus) return null; // Already synced

  return (
    <Badge variant="warning">
      <WifiOff className="h-3 w-3" />
      Pending sync
      <Button size="sm" onClick={() => syncEngine.processQueue()}>
        Sync now
      </Button>
    </Badge>
  );
};
```

### Anti-Pattern 4:Ignoring iOS IndexedDB Eviction

**What people do:** Assume IndexedDB persists forever, no warning to user.

**Why it's wrong:** iOS evicts IndexedDB under storage pressure, data loss without user awareness.

**Do this instead:**
```typescript
// ✅ Monitor storage, warn users, implement survival strategies
const checkStoragePressure = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage, quota } = await navigator.storage.estimate();
    const usagePercent = (usage / quota) * 100;

    if (usagePercent > 80) {
      showToast('Storage nearly full. Some data may be removed by the browser.', 'warning');
    }
  }

  // Listen for storage events (other tabs/windows)
  window.addEventListener('storage', (e) => {
    if (e.key === 'nexus-storage-pressure') {
      // Another tab detected pressure, show warning
    }
  });
};

// Periodically check on app open
useEffect(() => {
  checkStoragePressure();
  const interval = setInterval(checkStoragePressure, 5 * 60 * 1000); // Every 5 min
  return () => clearInterval(interval);
}, []);
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Clerk Auth** | JWT-based, Convex auth.config.ts | Include orgId and role in custom claims for RLS |
| **Convex Backend** | Real-time queries, mutations, file storage | Use for source of truth, shared data, authz |
| **OpenRouter Whisper** | HTTP POST with audio blob, returns text | Online-only, handle timeouts/retries |
| **Agno Framework** | OpenAI-compatible API, LLM field extraction | Send transcript + form schema, get structured values |
| **Vite PWA** | Service worker with Workbox strategies | Use injectManifest for custom sync logic |
| **Browser Camera** | MediaDevices API, capture as blob | Store in Dexie temporarily, upload via Convex storage |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Components ↔ Dexie** | Direct via hooks (`useLiveQuery`, db methods) | No abstraction layer needed — Dexie is the API |
| **Components ↔ Convex** | Via generated client (`useQuery`, `useMutation`) | Type-safe, auto-generated from convex/ folder |
| **Components ↔ Sync Engine** | Via hooks (`useSync`, `useFormSubmission`) | Abstract complexity, provide optimistic UI |
| **Dexie ↔ Convex** | Via Sync Engine only | No direct reads/writes between them to avoid circular sync |
| **Service Worker ↔ App** | PostMessage for connectivity events, sync triggers | Service worker owns network, app owns UI |

## Sources

**Context7 (HIGH confidence):**
- Dexie.js documentation - https://dexie.org (IndexedDB wrapper, live queries, transactions)
- Convex documentation - https://get-convex.github.io/convex-backend (auth, file storage, real-time queries)
- Vite PWA - https://vite-pwa-org.netlify.app (service worker, caching strategies)

**Official Documentation (HIGH confidence):**
- MDN Offline and Background Operation - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
- Microsoft Background Sync - https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs

**Web Search Verified (MEDIUM confidence):**
- Offline-first frontend apps in 2025 - LogRocket Blog (IndexedDB patterns, sync strategies)
- 7 JS PWAs at Scale: Offline Sync Without Race Conditions - Medium (queue patterns, idempotency)
- Queued Requests with Background Sync - Cursa (offline queue implementation)

**Web Search Unverified (LOW confidence - treat as patterns, not facts):**
- Multi-tenant SaaS Architecture: A Deep Dive into Database Patterns - Medium (data isolation models)
- Building Local-First Apps with Vue and Dexie.js - alexop.dev (Dexie patterns)

---
*Architecture research for: Offline-first mobile PWA with voice input and multi-tenant SaaS*
*Researched: 2026-02-26*
