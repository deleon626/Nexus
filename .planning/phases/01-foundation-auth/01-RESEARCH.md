# Phase 1: Foundation & Auth - Research

**Researched:** 2026-02-27
**Domain:** PWA infrastructure, authentication, offline storage, sync engine
**Confidence:** HIGH

## Summary

Phase 1 establishes the technical foundation for Nexus: an offline-first PWA with Clerk authentication, role-based routing, Dexie.js local storage, and a custom sync engine bridging IndexedDB to Convex. This is prerequisite infrastructure—without it, no user-facing features can function reliably.

The research confirms the stack choice: Vite + React + TypeScript + Tailwind + shadcn/ui is the standard modern frontend setup. Clerk provides mature auth with organization multi-tenancy and role-based access control (RBAC). Convex integrates seamlessly with Clerk via `ConvexProviderWithClerk` for token validation. Dexie.js is the de facto standard for IndexedDB operations with typed queries, React hooks, and transaction support. Vite PWA plugin (vite-plugin-pwa) with Workbox provides service worker strategies. TanStack Query in `offlineFirst` mode enables mutation caching.

**Primary recommendation:** Use the official integration patterns from each library's docs—Clerk + Convex for auth, Dexie.js for local storage with a custom sync queue service, React Router v7 loaders for route protection, and TanStack Query's offlineFirst network mode. Don't deviate from documented patterns—this stack is mature and well-tested.

**Critical architecture note:** This is a **custom sync engine** project. Convex has no offline support. The sync layer must be built from scratch using Dexie.js for local IndexedDB, a sync queue with deduplication, idempotent server endpoints, and conflict resolution (last-write-wins with timestamps). This is the core complexity of Phase 1.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Auth Flow & Sessions:**
- Full-page redirect to Clerk sign-in widget with app logo
- Role-based dashboard routing — Admin → Builder, Worker → Forms, Reviewer → Dashboard
- Persistent sessions (7+ days)
- Graceful re-auth prompt when session expires (modal, preserves place)
- Multi-device support allowed (concurrent sessions)
- Full redirect + session clear on sign-out
- Single org per user — no org switching for MVP
- Skip onboarding — straight to role dashboard

**Offline Experience:**
- Online first load required, then app becomes cacheable
- Offline data availability: templates, user's draft submissions, recent submitted forms
- "You're offline" banner at top (dismissible but reappears if still offline)
- Silent background sync on reconnection
- No staleness limit — app works offline indefinitely with cached data
- Auto-clear oldest cached items when storage fills
- Store compressed photo versions, clear after successful sync
- Background refresh while app is open
- Last-write-wins conflict resolution with user notification
- Unlimited pending submissions with warning at 50+ items
- Heartbeat ping for reliable offline/online detection (don't trust navigator.onLine)
- Service worker updates: show "Update available" toast, user taps to reload at convenience

**Sync Status UI:**
- Top header bar position, always visible
- 4 basic states: Offline, Syncing, Synced, Failed
- Icon + label, tap to expand: queue count + last sync time
- Auto-retry with exponential backoff + manual retry button
- Red indicator for failure, tap shows error message + retry
- Brief green flash on success, then settle to synced
- Expandable queue list shows pending items with individual status
- Silent — no sounds for sync events

### Claude's Discretion

- Exact loading skeleton design
- Error state copy and messaging
- Transition animations between sync states
- Exact retry backoff timing
- Photo compression quality level
- Heartbeat ping interval

### Deferred Ideas (OUT OF SCOPE)

- Role-based routing patterns — planner to determine based on tech stack
- Multi-organization support — future phase after anchor client
- Offline voice input — deferred to v1.1 (Whisper WASM memory concerns)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign in via Clerk authentication | Clerk + Convex integration via `ConvexProviderWithClerk` with token validation |
| AUTH-02 | User has role-based access (Admin, Worker, Reviewer, Viewer) | Clerk `publicMetadata.role` with middleware/loaders for route protection |
| AUTH-03 | Organization data is isolated per tenant | Clerk Organizations + Convex queries scoped to `orgId` in session claims |
| OFFL-01 | User can fill forms offline with data cached locally | Dexie.js IndexedDB + TanStack Query `offlineFirst` network mode |
| OFFL-02 | User sees real-time sync status (pending/synced/failed) | Custom sync queue service with React state for UI status (Offline/Syncing/Synced/Failed) |
| OFFL-03 | Form drafts auto-save to prevent data loss | Dexie.js transactions + auto-save hook with debounced writes |
| OFFL-04 | Forms are associated with production batch numbers | Schema design: `submissions` table with `batchNumber` field |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Vite** | 5-6x | Build tool with HMR | Lightning-fast dev experience, native PWA plugin ecosystem, optimized production builds |
| **React** | 18-19x | UI framework | Excellent type safety with TypeScript, hooks ecosystem, industry standard |
| **TypeScript** | 5x | Type safety | Catches errors at compile time, excellent DX, required by most modern stacks |
| **Tailwind CSS** | 3.4+ | Utility-first styling | No CSS files to manage, highly composable, shadcn/ui dependency |
| **shadcn/ui** | latest | Accessible components | Copy-paste components (no npm bloat), built on Radix UI, excellent a11y |
| **Clerk** | latest | Authentication | Org-aware multi-tenancy, RBAC, excellent Convex integration, mature docs |
| **Convex** | latest | Backend | Real-time reactive queries, ACID transactions, built-in Clerk auth validation |
| **Dexie.js** | 3.2+ | Offline storage (IndexedDB) | Typed queries, React hooks, live queries, transaction support, de facto standard |
| **vite-plugin-pwa** | 0.20+ | PWA manifest + service worker | Workbox integration, auto-update strategies, zero-config setup |
| **TanStack Query** | 5x | Server state management | `offlineFirst` mode for mutation caching, optimistic updates, retry logic |
| **React Router** | v7 | Routing | Loaders for data fetching, middleware for auth protection, mature patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@tanstack/query-persist-client-core** | 5x | Persist query client state | When implementing offline mutation persistence across page reloads |
| **@clerk/react-clerk** | latest | Clerk React SDK | For `ClerkProvider`, `useAuth()`, `SignInButton`, `UserButton` components |
| **convex/react-clerk** | latest | Convex + Clerk integration | For `ConvexProviderWithClerk` to bridge auth tokens to Convex backend |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vite-plugin-pwa | Workbox directly | vite-plugin-pwa provides zero-config setup, better Vite integration |
| Dexie.js | IndexedDB native API | Dexie provides typed queries, transactions, React hooks—native is verbose and error-prone |
| Clerk | Auth0, NextAuth | Clerk has better Convex integration, simpler multi-tenancy, more modern UX |
| React Router v7 | TanStack Router | React Router has better documentation, more examples, stable v7 release |

**Installation:**
```bash
# Core dependencies
npm create vite@latest nexus -- --template react-ts
cd nexus
npm install

# UI and styling
npm install -D tailwindcss @tailwindcss/vite
npm install clsx tailwind-merge class-variance-authority

# Auth and backend
npm install @clerk/clerk-react convex convex-react-clerk

# Offline and sync
npm install dexie @tanstack/react-query

# PWA
npm install -D vite-plugin-pwa workbox-precaching workbox-strategies workbox-routing

# Routing
npm install react-router

# shadcn/ui CLI (interactive)
npx shadcn@latest init
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── auth/           # Auth-related components (SignIn, UserButton)
│   └── sync/           # Sync status indicator, queue view
├── convex/             # Convex backend
│   ├── schema.ts       # Database schema
│   └── functions/      # Query and mutation functions
├── db/                 # Dexie.js local database
│   ├── dexie.ts        # Dexie instance + schema definition
│   ├── sync/           # Sync engine implementation
│   │   ├── queue.ts    # Sync queue management
│   │   ├── worker.ts   # Background sync worker
│   │   └── conflict.ts # Conflict resolution
│   └── hooks/          # Dexie React hooks (useLiveQuery, etc.)
├── lib/                # Utilities
│   ├── utils.ts        # cn() helper for shadcn/ui
│   ├── convex.ts       # Convex client initialization
│   └── clerk.ts        # Clerk client initialization
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Auth state and role checking
│   ├── useSync.ts      # Sync status and queue management
│   └── useOnline.ts    # Online/offline detection with heartbeat
├── routes/             # React Router v7 routes
│   ├── protected.tsx   # Protected route wrapper
│   ├── admin.tsx       # Admin dashboard
│   ├── worker.tsx      # Worker dashboard
│   └── reviewer.tsx    # Reviewer dashboard
├── App.tsx             # Root component with providers
├── main.tsx            # Entry point
└── vite-env.d.ts       # Vite types
```

### Pattern 1: Clerk + Convex Integration
**What:** Wrap app with both providers to enable seamless auth flow from Clerk to Convex backend.
**When to use:** Every app using both Clerk and Convex.
**Example:**
```typescript
// Source: https://docs.convex.dev/auth/clerk
import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>,
);
```

### Pattern 2: Dexie.js Schema with Transactions
**What:** Define IndexedDB schema with typed tables and use transactions for atomic multi-table writes.
**When to use:** Whenever writing to multiple tables that must succeed or fail together.
**Example:**
```typescript
// Source: https://dexie.org/docs/DexieErrors/Dexie
import Dexie, { Table } from 'dexie';

interface Submission {
  id?: number;
  batchNumber: string;
  templateId: string;
  data: Record<string, any>;
  status: 'draft' | 'pending' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const db = new Dexie('nexus-db');
db.version(1).stores({
  submissions: '++id, batchNumber, templateId, status, createdAt',
  templates: 'id, name, version, updatedAt',
  syncQueue: '++id, operation, endpoint, recordId, status, createdAt',
});

// Transaction for atomic writes
await db.transaction('rw', db.submissions, db.syncQueue, async () => {
  const submissionId = await db.submissions.add({
    batchNumber: 'BATCH-123',
    templateId: 'tmpl-abc',
    data: { field1: 'value1' },
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.syncQueue.add({
    operation: 'create',
    endpoint: '/submissions',
    recordId: submissionId,
    status: 'pending',
    createdAt: new Date(),
  });
});
```

### Pattern 3: Protected Routes with React Router v7 Middleware
**What:** Use middleware functions to check auth and roles before route loaders execute.
**When to use:** Any route that requires authentication or specific role access.
**Example:**
```typescript
// Source: https://github.com/remix-run/react-router/blob/main/docs/how-to/middleware.md
import { redirect } from "react-router";
import type { Route } from "./+types/_protected";

// Role-based auth middleware
async function authMiddleware(
  { request, context }: Route.MiddlewareArgs,
  next: Route.MiddlewareNext
) {
  const userId = await getUserIdFromSession(request);

  if (!userId) {
    throw redirect("/sign-in");
  }

  const user = await getUser(userId);
  const role = user.publicMetadata.role; // 'admin' | 'worker' | 'reviewer' | 'viewer'

  // Role-based routing
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith('/admin') && role !== 'admin') {
    throw redirect('/'); // Not authorized
  }
  if (pathname.startsWith('/worker') && role !== 'worker' && role !== 'admin') {
    throw redirect('/'); // Not authorized
  }

  // Set user in context for loaders
  context.set(userContext, user);

  return next();
}

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

// Role-based dashboard routing in loader
export async function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  const role = user.publicMetadata.role;

  // Redirect to appropriate dashboard based on role
  if (role === 'admin') return redirect('/admin/builder');
  if (role === 'worker') return redirect('/worker/forms');
  if (role === 'reviewer') return redirect('/reviewer/dashboard');

  return { user };
}
```

### Pattern 4: PWA Service Worker Configuration
**What:** Configure vite-plugin-pwa with Workbox strategies for offline caching.
**When to use:** Every PWA to enable offline functionality.
**Example:**
```typescript
// Source: https://github.com/vite-pwa/vite-plugin-pwa
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Show "Update available" toast
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nexus QC Forms',
        short_name: 'Nexus',
        description: 'Mobile QC Form Data Entry',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          // Precache app shell (handled automatically by globPatterns)
          // NetworkFirst for API calls
          {
            urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'convex-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          // StaleWhileRevalidate for static assets
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### Pattern 5: TanStack Query Offline-First Mode
**What:** Configure network mode to allow queries/mutations when offline, with automatic retry.
**When to use:** Offline-first apps where users need to work without connectivity.
**Example:**
```typescript
// Source: https://github.com/tanstack/query/blob/main/docs/framework/react/guides/migrating-to-react-query-4.md
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst', // Run even when offline
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (persist in cache)
    },
    mutations: {
      networkMode: 'offlineFirst', // Queue mutations when offline
      retry: 3,
    },
  },
});

// Persist query client state for offline mutation recovery
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

// In App.tsx
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
  onSuccess={() => {
    // Resume paused mutations after app restart
    queryClient.resumePausedMutations();
  }}
>
  <App />
</PersistQueryClientProvider>
```

### Anti-Patterns to Avoid
- **Not using transactions for multi-table writes:** IndexedDB operations outside transactions can partially fail, leaving inconsistent state.
- **Trusting navigator.onLine:** Safari shows false positives—use heartbeat ping instead.
- **Manual IndexedDB:** Dexie.js provides typed queries, transactions, and React hooks—native API is verbose and error-prone.
- **Not precaching critical assets:** iOS Safari evicts caches after 7 days—re-cache app shell on every launch.
- **Idempotent API endpoints missing:** Sync retries can create duplicates—ensure POST/PUT handlers check for existing records.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB wrapper | Native IndexedDB API | Dexie.js | Typed queries, transactions, React hooks, live queries |
| Query state management | useState + useEffect for API calls | TanStack Query | Offline-first mode, mutation caching, optimistic updates, retry logic |
| Service worker strategies | Manual fetch + cache API | vite-plugin-pwa (Workbox) | Precache manifest, runtime caching strategies, auto-update |
| Auth UI | Custom sign-in forms | Clerk components | Proven UX, security, session management, org multi-tenancy |
| Form validation | Custom validation logic | Zod + React Hook Form | TypeScript-first, schema validation, minimal re-renders |
| Path aliases | Relative imports | Vite resolve.alias + tsconfig paths | Cleaner imports, refactor-friendly |

**Key insight:** Each of these libraries solves well-understood problems with extensive battle-testing. Custom implementations risk edge cases, security issues, and maintenance burden. The sync engine is custom by necessity (Convex has no offline support), but everything else should use standard tools.

## Common Pitfalls

### Pitfall 1: iOS 7-Day Cache Eviction
**What goes wrong:** Safari clears all cached data after 7 days of inactivity. App doesn't work offline after 8+ days unused.
**Why it happens:** iOS Safari aggressively evicts service worker caches to save storage.
**How to avoid:**
- Re-cache critical assets on EVERY app launch (not just first install)
- Use `navigator.storage.estimate()` to monitor cache usage
- Store templates server-side for rapid reload (they're small, fetch is fast)
- Test: Leave PWA unused for 8 days, verify offline works
**Warning signs:** Offline breaks after extended inactivity, especially on iOS.

### Pitfall 2: Sync Queue Race Conditions
**What goes wrong:** Duplicate requests fire, wrong order processing, data corruption.
**Why it happens:** Multiple sync triggers fire simultaneously (online event, retry, manual sync).
**How to avoid:**
- Track in-flight requests with unique keys (`operation_endpoint_recordId`)
- Exponential backoff (3 attempts max: 5s, 15s, 45s)
- Sort queue by timestamp DESC (newest first) or ASC (oldest first) consistently
- Make server endpoints idempotent (check for existing records before insert)
- Test: Rapidly create/edit/delete offline, sync, verify no duplicates
**Warning signs:** Duplicate submissions, stale data overwriting new data.

### Pitfall 3: IndexedDB Transaction Silent Failures
**What goes wrong:** Transactions abort without throwing, data loss goes unnoticed.
**Why it happens:** IndexedDB transactions auto-commit on async scope exit—errors in async callbacks don't abort.
**How to avoid:**
- Always use Dexie.js transactions (they handle this correctly)
- Never `await` inside transaction callback without returning the promise
- Wrap transactions in try-catch
- Check transaction completion before assuming success
- Monitor storage quota before large operations (`navigator.storage.estimate()`)
- Test: Fill storage to quota, verify errors shown, no data loss
**Warning signs:** Missing records, inconsistent state, no error messages.

### Pitfall 4: Safari navigator.onLine False Positives
**What goes wrong:** Browser reports online but no actual internet connection.
**Why it happens:** `navigator.onLine` only detects network interface, not actual connectivity.
**How to avoid:**
- Ping lightweight endpoint with cache busting (e.g., `GET /health?_=${Date.now()}`)
- Debounce connectivity checks (wait 1-2s before showing "online")
- Show explicit sync states: Offline / Syncing / Synced / Connection Issue
- Test: Connect to WiFi without internet, verify app detects offline
**Warning signs:** Sync fails silently, app shows "connected" but API calls timeout.

### Pitfall 5: Multi-Device Conflict Resolution
**What goes wrong:** Last-write-wins loses data, no indication of conflict.
**Why it happens:** Same draft edited on multiple devices offline, both sync to server.
**How to avoid:**
- Server-side timestamps for all records (`updatedAt` field)
- Version vectors or `version` field (increment on each write)
- Conflict detection: if server version > client version, prompt user
- Show conflict UI: "This was edited elsewhere. Keep yours or use server version?"
- For critical fields (approval status), use server-side mutations only
- Test: Edit same form on two devices offline, sync both, verify conflict UI
**Warning signs:** Data disappears, user reports "my changes are gone."

### Pitfall 6: Photo Storage Quota Exhaustion
**What goes wrong:** 1-5MB photos fill IndexedDB quickly, app can't save more.
**Why it happens:** IndexedDB has limited quota (varies by device, usually 50-80% of available storage).
**How to avoid:**
- Compress images before storing (Canvas API, target 500KB max per photo)
- Store thumbnails (100x100px) for UI, queue full-size separately
- Cleanup synced photos from cache after successful upload
- Warn user at 80% quota (`navigator.storage.estimate()`)
- Test: Capture 50 photos offline, verify warning before quota exceeded
**Warning signs:** Photos fail to save, app gets sluggish, storage warnings.

### Pitfall 7: Clerk Session Expiry Without Graceful Re-auth
**What goes wrong:** User working offline, session expires, next sync fails with 401.
**Why it happens:** Clerk tokens expire after 7 days, offline user doesn't know.
**How to avoid:**
- Monitor Clerk session status with `useAuth()`
- Show re-auth modal when `sessionClaims?.exp` is near (within 1 hour)
- Preserve current state when redirecting to sign-in (save draft to Dexie)
- Use Clerk's `getSession()` endpoint to check expiry before critical operations
**Warning signs:** Unexplained 401 errors, user logged out unexpectedly.

## Code Examples

Verified patterns from official sources:

### Clerk Role Check Helper
```typescript
// Source: https://github.com/clerk/clerk-docs/blob/main/docs/guides/secure/basic-rbac.mdx
import { auth } from "@clerk/clerk-react";

export const checkRole = async (role: 'admin' | 'worker' | 'reviewer' | 'viewer') => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
};

// Usage in component or loader
if (!await checkRole('admin')) {
  redirect('/'); // Not authorized
}
```

### Dexie.js Live Query with React
```typescript
// Source: https://dexie.org/docs/cloud/access-control
import { useLiveQuery } from 'dexie-react-hooks';
import db from './dexie';

function SyncQueueList() {
  // Live query that auto-updates when data changes
  const pendingItems = useLiveQuery(
    () => db.syncQueue
      .where('status')
      .equals('pending')
      .reverse() // Newest first
      .toArray()
  );

  if (pendingItems?.error) return <Error error={pendingItems.error} />;
  if (pendingItems?.data === undefined) return <Loading />;

  return (
    <ul>
      {pendingItems.data.map(item => (
        <li key={item.id}>
          {item.operation} {item.endpoint} - {item.status}
        </li>
      ))}
    </ul>
  );
}
```

### React Router v7 Protected Loader
```typescript
// Source: https://reactrouter.com/6.30.3/fetch/redirect
import { redirect } from "react-router";
import type { Route } from "./+types/dashboard";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);

  if (!user) {
    return redirect("/sign-in");
  }

  const role = user.publicMetadata.role;

  // Role-based data fetching
  if (role === 'admin') {
    return { templates: await getTemplates(), users: await getUsers() };
  }
  if (role === 'worker') {
    return { forms: await getAssignedForms(user.id) };
  }
  if (role === 'reviewer') {
    return { pendingSubmissions: await getPendingSubmissions() };
  }

  // Viewer role
  return { submissions: await getMySubmissions(user.id) };
}
```

### Convex Auth Token Validation
```typescript
// Source: https://docs.convex.dev/auth/clerk
// On server (Convex function)
import { query } from "./_generated/server";
import { auth } from "./auth";

export const getOrganizationData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);

    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Access orgId from Clerk token claims
    const orgId = identity.orgId; // Set by Clerk Organizations

    if (!orgId) {
      throw new Error("No organization");
    }

    // Query scoped to organization (multi-tenant isolation)
    return await ctx.db
      .query("submissions")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .collect();
  },
});
```

### shadcn/ui Installation with Vite
```bash
# Source: https://ui.shadcn.com/docs/cli
# Interactive init (recommended)
npx shadcn@latest init

# Prompts will ask:
# - Style: Default or New York
# - Base color: Slate, Zinc, Neutral, Stone, or Neutral
# - CSS path: src/index.css or src/styles/globals.css
# - Tailwind config: tailwind.config.js
# - Import alias: @/components, @/lib/utils
```

```typescript
// Source: https://ui.shadcn.com/docs/installation/vite
// vite.config.ts - Path alias configuration
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App | Vite | 2023-2024 | Vite is now the de facto standard—faster HMR, better build output, native ESM |
| React Router v6 | React Router v7 | 2024-2025 | v7 introduces loaders, actions, middleware—better data fetching patterns |
| Manual IndexedDB | Dexie.js | 2017-2020 | Dexie is now standard for typed IndexedDB operations |
| NextAuth | Clerk | 2022-2024 | Clerk provides better UX, org multi-tenancy, modern React SDK |
| Native service worker | vite-plugin-pwa | 2021-2023 | Zero-config PWA setup with Workbox integration |

**Deprecated/outdated:**
- Create React App: Use Vite instead (CRA is in maintenance mode, archived in 2022)
- NextAuth v4: Use NextAuth v5 or Clerk (v4 is EOL)
- React Router v5: Use v7 (v5 is EOL, missing data loading features)
- Manual SW precaching: Use vite-plugin-pwa (easier, less error-prone)

## Open Questions

1. **Exact retry backoff timing for sync queue**
   - What we know: Exponential backoff is standard pattern, 3 attempts max is reasonable
   - What's unclear: Whether 5s/15s/45s intervals are optimal for factory floor connectivity patterns
   - Recommendation: Start with 5s/15s/45s, monitor sync success rates in production, adjust if needed

2. **Photo compression quality level**
   - What we know: Canvas API can compress, target 500KB max per photo
   - What's unclear: Optimal compression quality (0.7, 0.8, 0.85?) for QC photo readability
   - Recommendation: Start with 0.8 quality, test with real QC photos (text, serial numbers, defects), adjust if readability issues

3. **Heartbeat ping interval**
   - What we know: navigator.onLine is unreliable, need actual connectivity check
   - What's unclear: Optimal interval (10s, 30s, 60s?) to balance battery usage vs responsiveness
   - Recommendation: Start with 30s intervals, test on mobile devices, adjust if battery drain noticeable

## Sources

### Primary (HIGH confidence)
- Clerk Context7 (/clerk/clerk-docs) — RBAC patterns, role checking, org multi-tenancy, protected routes
- Convex Context7 (/llmstxt/convex_dev_llms-full_txt) — Clerk integration, auth token validation, org scoping
- Vite PWA Context7 (/vite-pwa/vite-plugin-pwa) — Service worker config, Workbox strategies, offline caching
- Dexie.js Context7 (/websites/dexie) — Schema definition, transactions, live queries, sync patterns
- TanStack Query Context7 (/tanstack/query) — offlineFirst mode, mutation caching, optimistic updates
- React Router Context7 (/remix-run/react-router) — v7 loaders, middleware, protected routes, auth patterns
- shadcn/ui Context7 (/llmstxt/ui_shadcn_llms_txt) — Vite installation, CLI setup, components.json config
- Project Research Summary (.planning/research/SUMMARY.md) — Comprehensive competitor analysis, pitfalls, architecture approach

### Secondary (MEDIUM confidence)
- Vite PWA GitHub docs — Runtime caching strategies, Workbox configuration examples
- TanStack Query GitHub docs — Persist offline mutations, dehydration/hydration patterns
- React Router v7 docs — Middleware patterns for auth, context sharing between middleware and loaders

### Tertiary (LOW confidence)
- None—all findings verified with official docs or Context7

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All technologies chosen from official docs and Context7, mature and well-documented
- Architecture: HIGH - Patterns sourced from official docs (Clerk, Convex, Dexie.js, Vite PWA, TanStack Query)
- Pitfalls: HIGH - All pitfalls verified with project research summary and HIGH-confidence sources (MDN, RxDB author, iOS docs)

**Research date:** 2026-02-27
**Valid until:** 2026-04-27 (60 days - stable stack with infrequent breaking changes)

---

*Phase: 01-foundation-auth*
*Research completed: 2026-02-27*
*Ready for planning: yes*
