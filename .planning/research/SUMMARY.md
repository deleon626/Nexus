# Project Research Summary

**Project:** Nexus - Mobile QC Form Data Entry PWA
**Domain:** Offline-first mobile PWA with custom sync engine, form data entry, and voice input
**Researched:** 2026-02-26
**Confidence:** HIGH

## Executive Summary

Nexus is an offline-first Progressive Web App for factory floor quality control form data entry. Research shows this is a well-established category with mature competitors (SafetyCulture, GoAudits, Device Magic, NestForms, Axonator, Flowdit) who all offer offline mode, photo capture, form builders, and mobile apps. The research reveals a clear opportunity: **none of the major competitors offer voice-to-form-field filling**, and most use feature-bloated native apps. Nexus can differentiate through voice input (online-only for MVP), simplicity, and PWA delivery (no app store friction).

The recommended stack is Vite + React + TypeScript + Tailwind CSS + shadcn/ui for the frontend, Convex for backend, Clerk for auth, and Dexie.js for offline storage with a custom sync engine. This is a custom sync engine project—Convex has no built-in offline support, so we build the sync layer ourselves using Dexie.js for local IndexedDB storage and Workbox for service worker caching. Voice input uses Whisper API via OpenRouter for STT and Agno framework for LLM field extraction.

**Key risks and mitigations:** iOS Safari's aggressive 7-day cache eviction requires re-caching critical assets on every app launch. Custom sync engine complexity demands proper deduplication, idempotency, and conflict resolution from day one. IndexedDB transactions fail silently—Dexie.js helps but requires explicit error handling. Voice input is online-only for MVP; the UI must clearly indicate unavailability when offline. Photo storage quota exhaustion requires compression and cleanup strategies.

## Key Findings

### Recommended Stack

**Core technologies:**
- **Vite 5-6x** — Build tool with lightning-fast HMR, native PWA plugin ecosystem, optimized production builds
- **React 18-19x + TypeScript 5x** — UI framework with excellent type safety, hooks ecosystem for form libraries
- **Tailwind CSS 3.4+ + shadcn/ui** — Utility-first styling with accessible, copy-paste components (no npm bloat)
- **Convex** — Backend with real-time reactive queries, ACID transactions, built-in Clerk integration
- **Clerk** — Authentication with organization-aware multi-tenancy, role-based access control
- **Dexie.js 3.2+** — Offline storage (IndexedDB wrapper) with typed queries, React hooks, live queries
- **vite-plugin-pwa 0.20+** — PWA manifest and service worker with Workbox integration, auto-update strategies
- **TanStack Query 5x** — Server state management with offline-first network mode, mutation caching
- **React Hook Form 7x + Zod 3x** — Form state with uncontrolled components (fewer re-renders), TypeScript-first validation
- **Whisper API via OpenRouter + Agno** — Voice input: STT for accuracy, LLM for structured field extraction

### Expected Features

**Must have (table stakes):**
- **Offline Mode** — Factory floors have unreliable connectivity; users expect this universally
- **Photo Capture** — Visual evidence is fundamental for QC inspections
- **Form Builder (Admin)** — Companies need custom forms for specific QC processes
- **Draft Auto-Save** — Prevents data loss from accidental closure or battery issues
- **Real-Time Sync Status** — Users need to know when data will sync/has synced
- **Role-Based Access** — Different roles (Admin, Worker, Reviewer) need different permissions
- **Mobile App (iOS + Android)** — PWA delivery eliminates app store friction, instant updates
- **Form Validation** — Prevent invalid submissions at source
- **PDF Export** — External auditors, stakeholders expect PDF reports
- **Cloud Storage/Backup** — Data must be secure and retrievable for audits/compliance

**Should have (competitive):**
- **Voice Input (Online)** — 10x faster than typing; hands-free for workers wearing gloves; **genuine differentiator**—none of 6+ competitors offer this
- **Per-Batch Form Association** — Matches factory workflow (QC happens per production batch); most apps are form-centric
- **Review Workflow with Approvals** — Quality gate between worker and final record; some competitors have this
- **Multi-Language Voice (EN + ID)** — Addresses Indonesian manufacturing market; most competitors are English-first
- **Grid-Style Paper Form Emulation** — Direct 1:1 replacement for existing paper forms; factory-specific
- **PWA Delivery** — No app store approval, instant updates, lower friction; all major competitors use native apps
- **Simplicity/Single-Purpose** — Enterprise QC apps are bloated; focused app wins worker adoption

**Defer (v2+):**
- **Offline Voice Input** — Whisper WASM is 200-300MB, crashes low-end Android; defer for device capability improvements
- **Barcode/QR Scanning** — Adds camera complexity; many factories don't barcode; v1.1 deferral
- **Signature Capture** — Legal complexity; not required for QC workflow (approvals suffice)
- **Full Multi-Tenancy UI** — Single org for MVP; org switcher adds complexity
- **Advanced Analytics Dashboard** — Customers export to Excel/BI tools; building analytics is scope creep

### Architecture Approach

Nexus uses a **dual-layer storage pattern**: Dexie.js (IndexedDB) for local-first offline storage, Convex for cloud source of truth, connected by a **custom sync engine** (critical—Convex has no offline support). State flows from React components → TanStack Query (offlineFirst mode) → Dexie.js → Sync Engine → Convex. Service worker (via vite-plugin-pwa) handles caching strategies: precache app shell, NetworkFirst for API, StaleWhileRevalidate for assets. Auth flows through Clerk JWT → Convex auth validation → organization-scoped queries. Voice input flows through browser MediaRecorder → Whisper API (OpenRouter) → Agno LLM for field extraction.

**Major components:**
1. **Dexie.js + Custom Sync Engine** — Local IndexedDB storage, sync queue with deduplication, conflict resolution; core complexity of this project
2. **Service Worker (Vite PWA)** — Offline caching strategies, background sync (iOS unsupported), connectivity detection
3. **Form Builder + Form Filling** — Drag-and-drop admin UI, per-batch worker data entry with voice input, draft auto-save
4. **Review Dashboard** — Real-time subscriptions via Convex, approve/reject workflow, conflict resolution UI
5. **Voice Input Pipeline** — Browser mic capture, Whisper STT via OpenRouter, Agno LLM field extraction

### Critical Pitfalls

1. **iOS 7-Day Cache Eviction** — Safari clears all cached data after 7 days inactivity. **Avoid:** Re-cache critical assets on EVERY app launch, use `navigator.storage.estimate()` to monitor, store templates server-side for rapid reload. Test: Leave PWA unused for 8 days, verify offline works.

2. **Sync Queue Race Conditions** — Duplicate requests fire, wrong order processing. **Avoid:** Track in-flight requests with unique keys (`operation_endpoint_recordId`), exponential backoff (3 attempts max), sort by timestamp DESC, idempotent server endpoints. Test: Rapidly create/edit/delete offline, sync, verify no duplicates.

3. **IndexedDB Transaction Silent Failures** — Transactions abort without throwing, data loss. **Avoid:** Always use Dexie.js transactions for atomic multi-table writes, wrap in try-catch, check transaction completion, monitor storage quota before large operations. Test: Fill storage to quota, verify errors shown, no data loss.

4. **Safari navigator.onLine False Positives** — Browser reports online but no actual internet. **Avoid:** Ping lightweight endpoint with cache busting, debounce connectivity checks, show explicit sync states (Syncing/Offline/Connected/Connection issue). Test: Connect to WiFi without internet, verify app detects offline.

5. **Conflict Resolution on Multi-Device Edits** — Last-write-wins loses data. **Avoid:** Server-side timestamps, version vectors, server-side mutations for critical fields (approval status), show conflict UI when detected. Test: Edit same form on two devices offline, sync both, verify conflict UI.

6. **Photo Storage Quota Exhaustion** — 1-5MB photos fill IndexedDB quickly. **Avoid:** Compress images before storing (Canvas API), store thumbnails + queue full images separately, cleanup after sync, warn at 80% quota. Test: Capture 50 photos offline, verify warning before quota exceeded.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Auth
**Rationale:** Must build the offline-first foundation before any features can work. Custom sync engine, service worker, and auth are prerequisites for all user-facing functionality. Addressing iOS cache eviction, sync race conditions, and IndexedDB silent failures up front prevents architectural rework.

**Delivers:** Working PWA shell, Clerk authentication with org multi-tenancy, Dexie.js schema with custom sync engine, service worker with caching strategies, connectivity detection that actually works (not just navigator.onLine).

**Addresses:**
- Offline mode foundation
- Role-based access (Admin, Worker, Reviewer)
- Real-time sync status infrastructure

**Avoids:**
- iOS 7-day cache eviction (re-cache on launch)
- Sync queue race conditions (in-flight request tracking)
- IndexedDB silent failures (transaction error handling)
- Safari false positives (actual connectivity ping)

**Stack elements:** Vite, React, TypeScript, Tailwind, shadcn/ui, Clerk, Convex, Dexie.js, vite-plugin-pwa, TanStack Query

**Research flags:** None—standard patterns, well-documented.

---

### Phase 2: Form Builder & Form Filling
**Rationale:** Core product functionality. Forms are the reason users open the app. This phase delivers table stakes features (offline mode, photo capture, form filling) and the key differentiator (voice input). Draft auto-save prevents data loss.

**Delivers:** Admin form builder (10 field types), worker form filling UI with per-batch association, photo capture with compression, voice input (online-only via Whisper API + Agno), draft auto-save to Dexie, form validation with Zod.

**Addresses:**
- Form Builder (Admin)
- Form Filling (manual input)
- Photo Capture
- Draft Auto-Save
- Voice Input (online-only)
- Real-Time Sync Status (in practice)
- Form Validation
- Per-Batch Form Association

**Uses:**
- React Hook Form + Zod for validation
- Dexie.js for draft storage
- Whisper API via OpenRouter + Agno for voice
- Camera API with compression

**Implements:**
- Form Builder component (drag-and-drop)
- Form Filling component with voice button
- Draft auto-save hook (useFormDraft)
- Voice input pipeline (Mic → Whisper → Agno → fields)

**Avoids:**
- Voice input without offline fallback (disable when offline, show explanation)
- Photo storage quota exhaustion (compress, warn at 80%)

**Research flags:**
- **Voice input integration:** OpenRouter Whisper API + Agno LLM field extraction—needs research during planning for API specifics, error handling, latency strategies.
- **Photo compression:** Canvas API patterns, target file sizes—validate during implementation.

---

### Phase 3: Review Workflow & PDF Export
**Rationale:** Quality gate between worker and final record. Completes the QC loop. Real-time subscriptions show reviewers pending submissions immediately. PDF export satisfies auditor/stakeholder requirements.

**Delivers:** Review dashboard with real-time Convex subscriptions, approve/reject workflow with comments, conflict resolution UI for multi-device edits, PDF generation for submissions, submission history with audit trail.

**Addresses:**
- Review Workflow with Approvals
- PDF Export
- Template Versioning with Audit Trail (basic)
- Real-Time Subscriptions

**Uses:**
- Convex real-time queries for dashboard
- PDF generation library (jsPDF or similar)
- Conflict resolution patterns

**Implements:**
- Review Dashboard component
- Approve/reject mutations with comments
- Conflict detection and resolution UI
- PDF export functionality

**Avoids:**
- Multi-device conflict resolution (server-side timestamps, version vectors, conflict UI)

**Research flags:**
- **PDF library:** jsPDF vs alternatives—needs decision during planning.
- **Conflict resolution UI patterns:** Review other apps' approaches, or design custom.

---

### Phase 4: Polish & PWA Enhancements
**Rationale:** PWA-specific features that make the app installable and production-ready. Background sync (where supported), periodic sync, update prompts, and service worker update handling. Also storage monitoring and cleanup.

**Delivers:** PWA install prompts, background sync for queued mutations (Android/iOS limitations handled), periodic sync on app open, service worker update prompts, storage monitoring with warnings, sync queue cleanup, form template precaching strategy.

**Addresses:**
- PWA delivery features
- Storage quota management
- Sync queue maintenance

**Implements:**
- PWA install prompt handling
- Periodic sync triggers
- Service worker update prompt UI
- Storage monitoring hooks
- Cleanup jobs for old data

**Research flags:** None—PWA patterns are well-documented via Vite PWA and Workbox docs.

---

### Phase 5: v1.1 Features (Optional)
**Rationale:** Features deferred from MVP that users may request. Barcode scanning for faster batch ID entry, signature capture if regulations require, HACCP/FDA audit trails for certified industries, template versioning UI.

**Delivers:** Barcode/QR scanner for batch IDs, signature capture pad, HACCP/FDA audit trail logging, template versioning with migration UI.

**Addresses:**
- Barcode/QR Scanning (v1.1)
- Signature Capture (v1.1)
- HACCP/FDA Audit Trails (v1.1)
- Template Versioning (v1.1)

**Research flags:**
- **Barcode scanning library:** QuaggaJS vs alternatives—needs decision.
- **Signature capture library:** Signature Pad vs alternatives—needs decision.

---

### Phase Ordering Rationale

**Why this order:**
- Foundation first—cannot build features without offline infrastructure, auth, and sync engine
- Forms next—core product value, table stakes + differentiator together
- Review third—completes the QC workflow, depends on Phase 2 submissions existing
- Polish fourth—PWA-specific features enhance but don't block core functionality
- v1.1 fifth—validated user feedback drives which of these to build first

**Why this grouping:**
- Phase 1 groups all infrastructure (auth, storage, sync, service worker) — single architectural foundation
- Phase 2 groups all form-related features (builder, filling, voice, photos) — cohesive user workflow
- Phase 3 groups review and export features — completes the QC loop
- Phase 4 groups PWA enhancements — platform-specific polish
- Phase 5 groups post-MVP features — driven by user demand

**How this avoids pitfalls:**
- Phase 1 addresses the 3 most critical pitfalls (iOS cache eviction, sync races, IndexedDB silent failures) before any user data exists
- Phase 2 addresses voice offline UX and photo quota before users rely on these features
- Phase 3 addresses multi-device conflicts before real-time collaboration creates them

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Voice input):** OpenRouter Whisper API specifics, Agno LLM field extraction prompts, error handling for network failures, latency strategies (show loading states).
- **Phase 2 (Photo compression):** Canvas API compression patterns, target file sizes, format tradeoffs (WebP vs JPEG).
- **Phase 3 (Conflict resolution UI):** Review other apps' conflict resolution patterns, or design custom approach for field-level vs document-level conflicts.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** All components have well-documented patterns (Clerk + Convex auth, Dexie.js offline, Vite PWA, TanStack Query). Official docs are comprehensive.
- **Phase 4:** PWA features are well-documented via Vite PWA and Workbox official guides.
- **Phase 5:** Libraries (barcode, signature) have standard choices—decision during planning is sufficient.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies chosen from official docs, HIGH-confidence sources (Context7, vendor docs). Vite, React, TypeScript, Tailwind, shadcn/ui, Convex, Clerk, Dexie.js are mature and well-documented. |
| Features | HIGH | Competitor analysis comprehensive (6+ major products reviewed), feature sets cross-verified. Voice input as differentiator confirmed by absence across all competitors. |
| Architecture | HIGH | Patterns sourced from Dexie.js docs, Convex best practices, MDN PWA guides, and 2025 offline-first articles. Dual-layer storage with custom sync is the standard approach. |
| Pitfalls | MEDIUM-HIGH | All pitfalls verified with HIGH-confidence sources (RxDB author, LogRocket 2025, official iOS docs). Mitigation strategies are concrete and codeable. |

**Overall confidence:** HIGH

### Gaps to Address

**Voice input latency:** Whisper API + Agno LLM round-trip may take 2-5 seconds. Need loading states and possibly partial results. **Handle during:** Phase 2 planning—define UX for async voice processing (waveform animation, progress indicators).

**Agno LLM prompts:** Field extraction from transcript requires well-designed prompts. **Handle during:** Phase 2 implementation—test with real QC form schemas, iterate on prompts.

**Conflict resolution granularity:** Field-level vs document-level conflicts? **Handle during:** Phase 3 planning—decide based on actual user patterns, or start with document-level and refine.

**Barcode scanner library choice:** QuaggaJS is unmaintained (last update 2021). **Handle during:** Phase 5 planning—evaluate alternatives or use native Barcode Detection API (Chrome-only, limited support).

**iOS Background Sync:** Unsupported on iOS. Android gets better experience. **Handle during:** Phase 4 implementation—document limitation, ensure sync triggers when app opens on iOS.

## Sources

### Primary (HIGH confidence)
- Dexie.js Context7 documentation — Live queries, React hooks, transactions, IndexedDB wrapper patterns
- Convex Best Practices — Auth integration, file storage, real-time queries, row-level security
- Vite PWA Official Guide — Service worker setup, caching strategies, update prompts, periodic sync
- Clerk Organizations Documentation — Multi-tenancy, role-based access, org switcher components
- shadcn/ui React Hook Form — Form validation with Zod, accessible components
- TanStack Query Network Mode — Offline-first mode, mutation caching, retry logic
- MDN Offline and Background Operation — Service worker patterns, background sync, cache strategies
- SafetyCulture Quality Control Apps — 10 QC apps feature comparison, competitor landscape
- GoAudits, Device Magic, NestForms, Axonator, Flowdit — Individual competitor feature sets, value propositions
- RxDB.info Downsides of Offline-First — Comprehensive offline pitfalls analysis, conflict resolution
- Magicbell iOS PWA Limitations — 7-day cache eviction, Safari-specific behaviors
- LogRocket Offline-First 2025 — IndexedDB vs SQLite, storage limits, sync patterns

### Secondary (MEDIUM confidence)
- Dev.to Custom Sync Engine Case Study — Real-world sync engine failures, deduplication patterns
- Medium 7 JS PWAs at Scale — Queue patterns, idempotency, race condition prevention
- Microsoft Background Sync Docs — Background Sync API, service worker integration
- Various Medium articles on local-first apps — Dexie patterns, offline strategies

### Tertiary (LOW confidence)
- Multi-tenant SaaS Architecture Deep Dive (Medium) — Data isolation models, database patterns
- Building Local-First Apps with Vue and Dexie.js — Dexie patterns, Vue-specific (non-React)

---
*Research completed: 2026-02-26*
*Ready for roadmap: yes*
