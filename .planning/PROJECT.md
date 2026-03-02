# Nexus

## What This Is

A mobile-first PWA that replaces paper-based QC forms with digital forms filled directly by factory workers on their phones. Workers fill forms per-batch using manual input or voice dictation. Admins create form templates, reviewers approve submissions. Works offline on the factory floor.

Multi-tenant SaaS — multiple companies share the same deployment with data isolation.

**Current State:** v1.0 MVP shipped (Mar 2026). 9 phases, 36 plans, 198 commits. Deployed to Coolify staging.

## Core Value

**Eliminate the paper-to-digital data entry bottleneck.** If everything else fails, workers must be able to fill forms on their phones and have that data sync to the system.

## Requirements

### Validated

**Form Builder (Admin) — v1.0**
- ✓ Admin can create form templates with 10 core field types — Phase 02
- ✓ Admin can reorder fields via drag-and-drop — Phase 02
- ✓ Admin can set field validation rules (required, min/max, options) — Phase 02
- ✓ Admin can publish/unpublish forms — Phase 02
- ✓ Template versioning for audit trail — Phase 02

**Form Filling (Worker) — v1.0**
- ✓ Worker can select a published form and fill per-batch — Phase 03
- ✓ Worker can enter data via manual input (10 field types) — Phase 03
- ✓ Worker can capture photos via camera — Phase 03
- ✓ Worker can use voice input to fill fields (online only) — Phase 03
- ✓ Form validation prevents invalid submissions — Phase 03
- ✓ Draft auto-save — Phase 03

**Offline Support — v1.0**
- ✓ App loads offline (PWA shell) — Phase 01
- ✓ Form templates cached locally — Phase 01
- ✓ Forms can be filled and queued offline — Phase 01
- ✓ Pending submissions sync when online — Phase 01, 06
- ✓ Sync status visible to user — Phase 01

**Review Workflow — v1.0**
- ✓ Reviewer sees pending submissions dashboard — Phase 04, 06
- ✓ Reviewer can view full submission details + photos — Phase 04
- ✓ Reviewer can approve/reject with comment — Phase 04
- ✓ Status updates in real-time — Phase 04

**Auth & Multi-tenancy — v1.0**
- ✓ User authentication via Clerk — Phase 01
- ✓ Role-based access (Admin, User, Reviewer, Viewer) — Phase 01
- ✓ Organization-scoped data isolation — Phase 01

**PWA & Deployment — v1.0**
- ✓ PWA install prompt with manual trigger — Phase 05
- ✓ Service worker update notification — Phase 05
- ✓ Storage monitoring with quota warnings — Phase 05
- ✓ Production deployment infrastructure — Phase 05

### Active

(None — all v1.0 requirements shipped)

### Out of Scope

- Offline voice input (Whisper WASM) — v1.1, memory concerns on low-end devices
- Signature capture — v1.1
- Barcode/QR scanning — v1.1
- MultiSelect, rating, temperature, weight, measurement field types — v1.1 (use decimal + unit config)
- HACCP/FDA audit trails — v1.1, nice-to-have for first deployment
- Full multi-tenancy UI (org switcher, invites) — v1.1, single org active for MVP
- Smart Assistant Agent (anomaly detection) — future
- Photo OCR (paper form → digital) — future

## Context

**Target users:** Factory workers in processing companies (seafood, F&B, manufacturing). Mix of personal Android and iOS phones.

**Current pain point:** Paper QC forms with grid-style sheets (e.g., 10 fields × 10 batch numbers) that require separate data entry person to type into system. Slow, error-prone, creates bottleneck.

**Deployment environment:** Factory floors with unreliable connectivity. Workers may be offline for 30min–2hrs at a time.

**Anchor client:** Lined up for first deployment.

**Voice processing:** Whisper API via OpenAI for STT. Online-only for MVP.

**Deployed:** Staging at https://fggck0ssc0www8osc0o0480c.217.15.164.63.sslip.io

## Constraints

- **Timeline:** 8-10 weeks solo dev (completed in ~30 days)
- **Tech stack:** Vite + React + TypeScript + Tailwind + shadcn/ui + Convex + Clerk + Dexie.js
- **Deployment:** Self-hosted on Coolify infrastructure
- **Connectivity:** Must work offline with later sync
- **Devices:** Mobile-first (375px viewport), Android + iOS
- **Languages:** English + Bahasa Indonesia (voice input)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Convex + Dexie.js for offline | Convex has no offline support; Dexie provides typed IndexedDB with custom sync engine | ✓ Working — sync engine operational |
| Whisper API via OpenAI | Proven STT quality, direct API integration | ✓ Working — voice input functional |
| Defer offline voice | Whisper WASM memory (200-300MB) risky on low-end Android | ✓ Accepted — online-only for v1.0 |
| Accept iOS IndexedDB eviction risk | Workers open app frequently enough; revisit if data loss occurs | — Pending user feedback |
| Single org active for MVP | Anchor client first, full multi-tenancy UI deferred | ✓ Delivered — org isolation works |
| Multi-stage Docker build | Minimal final image (nginx:alpine ~10MB) | ✓ Working — deployed to Coolify |
| CSP headers for Convex/Clerk | Security headers allow necessary domains | ✓ Working — staging verified |

---
*Last updated: 2026-03-03 after v1.0 milestone*
