# State: Nexus

**Project:** Mobile QC Form Data Entry PWA
**Last Updated:** 2026-02-27

---

## Project Reference

**Core Value:** Eliminate the paper-to-digital data entry bottleneck for factory floor quality control.

**Current Focus:** Phase 1 (Foundation & Auth) - Setting up PWA infrastructure, authentication, and offline sync engine.

**Tech Stack:**
- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui
- Backend: Convex (real-time, ACID transactions)
- Auth: Clerk (multi-tenant, role-based access)
- Offline: Dexie.js (IndexedDB) + custom sync engine
- Voice: Whisper API (OpenRouter) + Agno (LLM field extraction)
- PWA: vite-plugin-pwa (Workbox integration)

---

## Current Position

**Phase:** Phase 1 - Foundation & Auth
**Plan:** 02 (PWA manifest + service worker)
**Status:** In progress

**Progress Bar:**
```
Phase 1: [█░░░░░░░░░] 1/7 plans
Phase 2: [░░░░░░░░░░] 0/4 plans
Phase 3: [░░░░░░░░░░] 0/5 plans
Phase 4: [░░░░░░░░░░] 0/4 plans
Phase 5: [░░░░░░░░░░] 0/5 plans
Overall:  [█░░░░░░░░░] 1/27 plans (4%)
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
| Phase 01-foundation-auth P02 | 1772128496 | 3 tasks | 10 files |

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
- Completed Plan 01: Project Foundation (Vite + React + TypeScript + Tailwind + shadcn/ui)
- All Phase 1 dependencies installed (Clerk, Convex, Dexie, TanStack Query, PWA plugin, React Router)
- Ready for Plan 02: PWA manifest + service worker configuration

### Next Steps
1. Execute Plan 02: PWA manifest + service worker with Workbox strategies
2. Plan 03: Dexie.js local database schema
3. Plan 04: Clerk + Convex auth integration

### Blocked By
- None - proceeding to Plan 02

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
