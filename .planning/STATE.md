# State: Nexus

**Project:** Mobile QC Form Data Entry PWA
**Last Updated:** 2026-02-27T19:04:19Z

---

## Project Reference

**Core Value:** Eliminate the paper-to-digital data entry bottleneck for factory floor quality control.

**Current Focus:** Phase 2 (Form Builder) - Building drag-and-drop form builder UI with @dnd-kit.

**Tech Stack:**
- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui
- Backend: Convex (real-time, ACID transactions)
- Auth: Clerk (multi-tenant, role-based access)
- Offline: Dexie.js (IndexedDB) + custom sync engine
- Voice: Whisper API (OpenRouter) + Agno (LLM field extraction)
- PWA: vite-plugin-pwa (Workbox integration)
- Drag & Drop: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- State: Zustand with persist middleware
- Icons: lucide-react

---

## Current Position

**Phase:** Phase 2 - Form Builder
**Plan:** 11 (Convex Template Storage) - COMPLETE
**Status:** In progress

**Progress Bar:**
```
Phase 1: [█████████] 7/7 plans COMPLETE
Phase 2: [█████████] 4/4 plans COMPLETE
Phase 3: [░░░░░░░░░░] 0/5 plans
Phase 4: [░░░░░░░░░░] 0/4 plans
Phase 5: [░░░░░░░░░░] 0/5 plans
Overall:  [██████░░░░] 11/27 plans (41%)
```

---

## Performance Metrics

**Requirements:** 18 v1 requirements defined
**Phases:** 5 phases planned
**Coverage:** 100% (all requirements mapped)

**Timeline:** 8-10 weeks (solo dev)

---

## Accumulated Context

### Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Convex + Dexie.js for offline | Convex has no offline support; Dexie provides typed IndexedDB with custom sync engine |
| Whisper API via OpenRouter | Proven STT quality, avoid self-hosting voice service |
| Agno for LLM field extraction | Flexibility for future multi-agent features |
| Defer offline voice to v1.1 | Whisper WASM memory (200-300MB) risky on low-end Android |
| Single org active for MVP | Anchor client first, full multi-tenancy UI deferred |
| Manual file creation instead of npm create vite | Avoids interactive prompts that would block autonomous execution |
| Tailwind CSS v4 with @tailwindcss/vite plugin | Latest version with native Vite integration (no PostCSS config needed) |
| Deferred tailwindcss-animate plugin | Will add when actual Radix components are installed that need it |
| Provider nesting order | ClerkProvider (outer) -> ConvexProviderWithClerk (inner) for auth token bridging |
| Separate client config files | lib/convex.ts and lib/clerk.ts for testability and clean separation |
| Role-based routing on root | Admin → /admin/builder, Worker → /worker/forms, Reviewer → /reviewer/dashboard |
| Protected route wrapper pattern | ProtectedRoute handles auth checks and redirects, role-specific wrappers for granular control |
| UUID for localId generation | Enables client-side identification before server sync, critical for offline-first |
| Exponential backoff: 5s, 15s, 45s | Balances retry aggressiveness with user experience; 3 max attempts before manual retry |
| Last-write-wins with server tiebreaker | Simple conflict resolution for single-user-per-submission model |
| Immediate queue item deletion | No completed items table reduces storage overhead |
| 30-second heartbeat interval | Balances battery usage with responsiveness for offline detection |
| 5-second heartbeat timeout | Prevents hanging on slow networks during reachability checks |
| Yellow banner for offline state | Provides visibility without alarm |
| Queue warning threshold at 50 items | Prompts users to connect to stable internet |
| Zod discriminated unions for field types | Runtime validation with TypeScript type inference |
| FormTemplate version field | Enables audit trail for form changes (FORM-04) |
| @dnd-kit for drag-and-drop | Modern, accessible replacement for react-beautiful-dnd |
| lucide-react for icons | Consistent icon library for field types and UI elements |
| SessionStorage for draft state | Prevents stale drafts across browser sessions |
| Phase 02-form-builder P08 | 2min | 3 tasks | 4 files |
| Phase 02-form-builder P09 | 2min | 2 tasks | 11 files |
| Phase 02-form-builder P10 | 69s | 3 tasks | 10 files |
| Phase 02-form-builder P11 | 8min | 3 tasks | 11 files |
| Dual-layer storage pattern | Convex (cloud) + Dexie (offline) for template persistence |
| Version auto-increment on publish | Template version increments only when published, not on every save (FORM-04) |
| Server-side validation with Convex | Using v.* validators for field schema validation (FORM-03) |

### Known Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| iOS 7-day cache eviction | Re-cache critical assets on every app launch |
| Sync queue race conditions | Track in-flight requests with unique keys, idempotent endpoints |
| IndexedDB silent failures | Use Dexie.js transactions, wrap in try-catch, monitor storage quota |
| Safari navigator.onLine false positives | Ping lightweight endpoint with cache busting |
| Photo storage quota exhaustion | Compress images, warn at 80% quota |
| Multi-device edit conflicts | Server-side timestamps, version vectors, conflict UI |

### Research Findings

**Competitive Landscape:**
- 6+ major competitors (SafetyCulture, GoAudits, Device Magic, NestForms, Axonator, Flowdit)
- All offer offline mode, photo capture, form builders
- **None offer voice-to-form-field filling** - genuine differentiator
- Most use native apps (PWA is our advantage)

**Critical Architectural Patterns:**
- Dual-layer storage: Dexie.js (local) + Convex (cloud)
- Custom sync engine with deduplication and conflict resolution
- Service worker with precache (shell), NetworkFirst (API), StaleWhileRevalidate (assets)
- TanStack Query offlineFirst mode for mutation caching

---

## Session Continuity

### Last Action
- Completed Plan 11: Convex Template Storage with Version Tracking
- Created Convex schema with formTemplates table (version tracking, server-side validation)
- Created Convex functions for template CRUD (create, update, publish, unpublish, delete)
- Updated Dexie Template type to match FormTemplate interface
- Created useTemplatePersistence hook with dual-layer storage (Convex + Dexie)
- Created FormTemplatesList component with Load/Delete actions
- Integrated Save/Publish buttons in builder route with toast notifications
- Added date-fns for relative time formatting
- All requirements FORM-01, FORM-03, FORM-04 completed

### Next Steps
1. Phase 3: Form Filling (requires user planning)

### Blocked By
- User must set VITE_CLERK_PUBLISHABLE_KEY and VITE_CONVEX_URL in .env.local

---

## Quick Reference

**Files:**
- `.planning/PROJECT.md` - Project overview and constraints
- `.planning/REQUIREMENTS.md` - v1 requirements with traceability
- `.planning/ROADMAP.md` - This roadmap
- `.planning/STATE.md` - This file (project memory)
- `.planning/research/SUMMARY.md` - Research findings and implications

**Commands:**
- `/gsd:plan-phase [N]` - Create detailed plans for a phase
- `/gsd:insert-phase` - Insert urgent phase between integers
- `/gsd:status` - Show current project status

---
*State initialized: 2026-02-27*
