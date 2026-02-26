# Stack Research

**Domain:** Mobile Offline-First PWA for Factory Floor QC Form Data Entry
**Researched:** 2026-02-26
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Vite** | 5.x - 6.x | Build tool and dev server | Lightning-fast HMR, optimized production builds, native ESM support, best PWA plugin ecosystem |
| **React** | 18.x - 19.x | UI framework | Component-based architecture, hooks ecosystem, largest ecosystem for form libraries, excellent TypeScript support |
| **TypeScript** | 5.x | Type safety | Catches bugs at compile time, excellent IDE support, self-documenting code, essential for multi-developer projects |
| **Tailwind CSS** | 3.4+ | Styling | Utility-first approach, highly customizable, minimal bundle size with JIT, perfect for mobile-first responsive design |
| **shadcn/ui** | Latest (v4 compatible) | Component library | Copy-paste components (not npm bloat), accessible by default, Tailwind-native, excellent form components with Field API |
| **Convex** | Latest | Backend database | Real-time reactive queries, ACID transactions, built-in auth integration, excellent TypeScript experience, no API boilerplate |
| **Clerk** | Latest | Authentication | Organization-aware multi-tenancy, role-based access control, prebuilt components, excellent React integration, native org switcher |
| **Dexie.js** | 3.2+ | Offline storage (IndexedDB wrapper) | Typed IndexedDB with live queries (`useLiveQuery`), React hooks, efficient change detection, proven offline-first patterns |

### PWA & Offline Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **vite-plugin-pwa** | 0.20+ | PWA manifest and service worker | Zero-config PWA setup, Workbox integration, auto-update strategies, dev mode PWA testing, handles precaching and runtime caching |
| **Workbox** | (via vite-plugin-pwa) | Service worker strategies | Cache-first, network-first, stale-while-revalidate strategies, background sync support, Google-maintained |
| **TanStack Query** | 5.x | Server state management | Network mode aware (`offlineFirst`), mutation caching, optimistic updates, retry logic, integrates with Dexie for offline mutations |

### Form & Validation Stack

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **React Hook Form** | 7.x | Form state management | Uncontrolled components (fewer re-renders), minimal bundle size, excellent performance, native Zod integration, accessibility-first |
| **Zod** | 3.x | Schema validation | TypeScript-first, inferred types, composable schemas, works with RHF via `zodResolver`, validates on client and server |
| **shadcn/ui Field API** | Latest | Form components | Accessible form primitives, error handling built-in, works with RHF Controller, responsive by default |

### Voice Input (Online Only)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Web Speech API** | Native | Speech recognition | Browser-native, no extra bundle cost, supports continuous input, works on mobile Chrome/Safari |
| **Whisper API via OpenRouter** | Latest | Speech-to-text fallback | Higher accuracy than Web Speech API, supports multiple languages (EN + ID), online-only for MVP |
| **Agno Framework** | Latest | LLM field extraction | OpenAI-compatible endpoints, flexible for future multi-agent features, structured output from voice |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **ESLint** | Linting | Use `@typescript-eslint` with recommended rules, add Convex ESLint plugins for best practices |
| **Prettier** | Code formatting | Consistent formatting, integrates with ESLint |
| **Vitest** | Unit testing | Vite-native, fast, same config as Vite |
| **Playwright** | E2E testing | Cross-browser PWA testing, service worker testing support |
| **pnpm** | Package manager | Fast, disk-space efficient, monorepo-ready |

## Installation

```bash
# Core framework
pnpm add react react-dom
pnpm add -D vite @vitejs/plugin-react typescript

# Styling
pnpm add tailwindcss postcss autoprefixer
pnpm add -D @tailwindcss/vite

# PWA
pnpm add -D vite-plugin-pwa

# Backend & Database
pnpm add convex

# Authentication
pnpm add @clerk/clerk-react

# Offline storage
pnpm add dexie dexie-react-hooks

# Forms & Validation
pnpm add react-hook-form @hookform/resolvers zod

# Server state
pnpm add @tanstack/react-query

# UI components (shadcn/ui - use CLI)
npx shadcn@latest init
npx shadcn@latest add button input textarea form field select checkbox radio-group switch card dialog sheet toast

# Dev dependencies
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier vitest @playwright/test
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| **Build Tool** | Vite | Next.js | If you need SSR/SSG, file-based routing, or server components. Not needed for PWA—adds unnecessary complexity |
| **Backend** | Convex | Supabase | If you need Postgres-specific features, direct SQL access, or already have Supabase expertise. Convex has better DX for real-time apps |
| **Offline Storage** | Dexie.js | PouchDB | If you need CouchDB sync out of the box. Dexie has better TypeScript, simpler API, more active development |
| **Forms** | React Hook Form | Formik | RHF has better performance (uncontrolled components), smaller bundle, more maintained. Formik is more opinionated |
| **Validation** | Zod | Yup | Zod has better TypeScript inference, composable schemas, smaller bundle. Yup is more mature but less type-safe |
| **State Management** | TanStack Query | Zustand | For simple client-only state. TanStack Query is better for server state + caching + offline |
| **Auth** | Clerk | Auth0 / Lucia | Clerk has better React DX, native org support, prebuilt UI. Auth0 is enterprise-heavy, Lucia is more manual |
| **UI Library** | shadcn/ui | Chakra UI | shadcn is copy-paste (less bundle), more customizable, closer to Tailwind. Chakra is more opinionated but heavier |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Create React App** | Deprecated, slow HMR, no PWA support | Vite |
| **Redux (plain)** | Overkill for form apps, tons of boilerplate, poor TypeScript | TanStack Query + Zustand (if needed) |
| **Formik** | Controlled components = more re-renders, larger bundle, less active | React Hook Form |
| **Yup** | Inferior TypeScript support, larger bundle, less composable | Zod |
| **localStorage for offline** | Synchronous (blocks UI), 5-10MB limit, no indexing, no relationships | Dexie.js (IndexedDB) |
| **IndexedDB (raw)** | Callback-based API, verbose, error-prone | Dexie.js |
| **Apollo Client** | Overkill, heavy bundle, GraphQL not needed | TanStack Query (REST with Convex) |
| **Material-UI** | Heavy bundle, hard to customize, not Tailwind-native | shadcn/ui |
| **Next.js for PWA** | SSR conflicts with service worker, file-based routing unnecessary for single-page apps | Vite + vite-plugin-pwa |
| **Service Workers (hand-written)** | Easy to get wrong, cache invalidation bugs, update race conditions | vite-plugin-pwa + Workbox strategies |
| **Whisper WASM** | 200-300MB memory, crashes on low-end Android, slow first load | Whisper API (online-only) for MVP |
| ** Ionic / Capacitor** | Native build unnecessary for PWA, adds complexity, store approval friction | Pure PWA (installable from browser) |

## Stack Patterns by Variant

**If targeting iOS Safari heavily:**
- Use `networkMode: 'offlineFirst'` in TanStack Query (iOS has aggressive cache eviction)
- Implement periodic sync to refresh data when app opens
- Test IndexedDB persistence—iOS may evict under storage pressure
- Because iOS Safari has different service worker lifecycle and storage policies

**If targeting low-end Android devices:**
- Limit Dexie indexed properties (3-4 per table max)
- Use pagination instead of large `.collect()` queries
- Avoid Whisper WASM—use API only
- Implement service worker update prompts (don't auto-update)
- Because limited memory (2-4GB) and CPU affect performance

**If voice input is critical:**
- Implement both Web Speech API (free, online) and Whisper API (paid, higher accuracy)
- Fall back to manual input if voice fails
- Add voice input indicator (recording state)
- Show transcript for editing before submission
- Because Web Speech API has variable accuracy, requires online connection

**If multi-tenancy is single-org for MVP:**
- Skip org switcher UI
- Hardcode single organization context
- Use Clerk Organizations backend anyway (easy to add UI later)
- Because full org switcher adds complexity, but org model enables data isolation

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 19 | Convex 1.x+, Dexie 3.2+, RHF 7.x+, TanStack Query 5.x | All support React 19 |
| Vite 6.x | vite-plugin-pwa 0.20+, @vitejs/plugin-react 4.x | Vite 6 uses Rollup 4 |
| Dexie 3.2+ | React 18+, React 19 | Live queries (`useLiveQuery`) require 3.2+ |
| Zod 3.x | React Hook Form 7.x via `@hookform/resolvers` | Use `zodResolver` from resolvers package |
| Clerk | Convex 1.x+ | Use `@clerk/convex-plugin` for auth integration |
| TypeScript 5.x | All packages | Use strict mode, `strictNullChecks: true` |

## Offline Sync Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          PWA Client                              │
├─────────────────────────────────────────────────────────────────┤
│  React Components → React Hook Form → Zod Validation           │
│         ↓                                                         │
│  TanStack Query (offlineFirst mode)                              │
│         ↓                                                         │
│  Dexie.js (IndexedDB) ← Local-first storage                     │
└─────────────────────────────────────────────────────────────────┘
         ↓ (online)                    ↓ (offline)
         ↓                              └── useLiveQuery reactivity
┌─────────────────────────────────────────────────────────────────┐
│                    Sync Engine (Custom)                          │
├─────────────────────────────────────────────────────────────────┤
│  • Read: Dexie → Convex (when online)                            │
│  • Write: Queue mutations → Background Sync → Convex             │
│  • Conflict: Last-write-wins per field                           │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Convex Backend                             │
├─────────────────────────────────────────────────────────────────┤
│  • Auth: Clerk JWT verification                                  │
│  • Data: Real-time queries, ACID transactions                    │
│  • Multi-tenancy: Organization-scoped queries                    │
└─────────────────────────────────────────────────────────────────┘
```

### Sync Patterns

1. **Form Templates**: Cache on install, update on app open via periodic sync
2. **Draft Submissions**: Store in Dexie, sync when online via background sync
3. **Submitted Forms**: Optimistic update to Convex, rollback on error
4. **Photos**: Store as base64 in Dexie (limit 2MB), upload when online
5. **Voice Input**: Online-only—disable microphone when offline

## Multi-Tenancy Strategy

| Layer | Implementation |
|-------|----------------|
| **Auth** | Clerk Organizations with roles (Admin, User, Reviewer, Viewer) |
| **Database** | Convex queries filter by `orgId` (from Clerk context) |
| **Offline** | Dexie stores include `orgId` for all records |
| **API** | All Convex functions verify `ctx.auth` and org membership |
| **UI** | Clerk components (`OrganizationSwitcher`, `OrganizationProfile`) |

## Mobile-First Considerations

1. **Viewport**: Design for 375px width first, scale up
2. **Touch Targets**: Minimum 44x44px (iOS HIG)
3. **Inputs**: Use `<input inputmode="numeric">` for numbers
4. **Voice**: Native Web Speech API with mic button (prominent)
5. **Photos**: Camera capture via `<input type="file" accept="image/*" capture>`
6. **Offline Status**: Show sync indicator (green dot, pending count)
7. **Network Status**: Listen to `navigator.onLine`, show banner when offline

## Security Checklist

- [ ] Convex functions validate `ctx.auth.getUserIdentity()`
- [ ] All Convex functions have argument validators (`v.object({ ... })`)
- [ ] Row-level security: Filter queries by `orgId`
- [ ] Internal functions for privileged operations
- [ ] Clerk JWT verification on Convex backend
- [ ] HTTPS only (PWA requirement)
- [ ] CSP headers configured
- [ ] No sensitive data in Dexie (device may be shared)

## Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| First Contentful Paint | < 1.5s | Vite build optimization, code splitting |
| Time to Interactive | < 3s | Lazy load form components, prefetch templates |
| Bundle Size | < 250KB (gzipped) | Tree-shaking, dynamic imports for heavy features |
| Offline Load | < 500ms | Cache-first strategy, precached shell |
| Form Input Latency | < 50ms | React Hook Form (uncontrolled), Dexie live queries |

## Sources

- [Dexie.js React Tutorial](https://dexie.org/docs/Tutorial/React) — Live queries, React hooks (HIGH confidence)
- [Vite PWA Guide](https://vite-pwa-org.netlify.app/guide) — PWA setup, Workbox strategies (HIGH confidence)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices) — Query patterns, access control (HIGH confidence)
- [shadcn/ui React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form) — Form validation with Zod (HIGH confidence)
- [TanStack Query Network Mode](https://tanstack.com/query/v5/docs/react/guides/network-mode) — Offline-first mode (HIGH confidence)
- [MDN Offline and Background Operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation) — Service worker patterns, background sync (HIGH confidence)
- [Clerk Organizations Overview](https://clerk.com/docs/guides/organizations/overview) — Multi-tenancy implementation (HIGH confidence)
- [Offline-first frontend apps in 2025 (LogRocket)](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite) — IndexedDB vs SQLite patterns (MEDIUM confidence)
- [Building Offline-First React Apps (Medium)](https://medium.com/@sparklewebhelp/how-to-build-offline-first-react-apps-using-indexeddb-service-workers-b8380dbe86f5) — Service worker caching patterns (MEDIUM confidence)

---
*Stack research for: Mobile Offline-First PWA for Factory Floor QC Form Data Entry*
*Researched: 2026-02-26*
