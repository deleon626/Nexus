# Nexus

## What This Is

A mobile-first PWA that replaces paper-based QC forms with digital forms filled directly by factory workers on their phones. Workers fill forms per-batch using manual input or voice dictation. Admins create form templates, reviewers approve submissions. Works offline on the factory floor.

Multi-tenant SaaS — multiple companies share the same deployment with data isolation.

## Core Value

**Eliminate the paper-to-digital data entry bottleneck.** If everything else fails, workers must be able to fill forms on their phones and have that data sync to the system.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Form Builder (Admin)**
- [ ] Admin can create form templates with 10 core field types
- [ ] Admin can reorder fields via drag-and-drop
- [ ] Admin can set field validation rules (required, min/max, options)
- [ ] Admin can publish/unpublish forms
- [ ] Template versioning for audit trail

**Form Filling (Worker)**
- [ ] Worker can select a published form and fill per-batch
- [ ] Worker can enter data via manual input (10 field types)
- [ ] Worker can capture photos via camera
- [ ] Worker can use voice input to fill fields (online only)
- [ ] Form validation prevents invalid submissions
- [ ] Draft auto-save

**Offline Support**
- [ ] App loads offline (PWA shell)
- [ ] Form templates cached locally
- [ ] Forms can be filled and queued offline
- [ ] Pending submissions sync when online
- [ ] Sync status visible to user

**Review Workflow**
- [ ] Reviewer sees pending submissions dashboard
- [ ] Reviewer can view full submission details + photos
- [ ] Reviewer can approve/reject with comment
- [ ] Status updates in real-time

**Auth & Multi-tenancy**
- [ ] User authentication via Clerk
- [ ] Role-based access (Admin, User, Reviewer, Viewer)
- [ ] Organization-scoped data isolation

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

**Voice processing:** Whisper API via OpenRouter for STT, Agno framework for LLM-based field extraction. Online-only for MVP.

## Constraints

- **Timeline:** 8-10 weeks solo dev
- **Tech stack:** Vite + React + TypeScript + Tailwind + shadcn/ui + Convex + Clerk + Dexie.js (fixed)
- **Deployment:** Self-hosted on Coolify infrastructure
- **Connectivity:** Must work offline with later sync
- **Devices:** Mobile-first (375px viewport), Android + iOS
- **Languages:** English + Bahasa Indonesia (voice input)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Convex + Dexie.js for offline | Convex has no offline support; Dexie provides typed IndexedDB with custom sync engine | — Pending |
| Whisper API via OpenRouter | Proven STT quality, avoid self-hosting voice service | — Pending |
| Agno for LLM field extraction | Flexibility for future multi-agent features, OpenAI-compatible endpoints | — Pending |
| Defer offline voice | Whisper WASM memory (200-300MB) risky on low-end Android | — Pending |
| Accept iOS IndexedDB eviction risk | Workers open app frequently enough; revisit if data loss occurs | — Pending |
| Single org active for MVP | Anchor client first, full multi-tenancy UI deferred | — Pending |

---
*Last updated: 2026-02-26 after initialization*
