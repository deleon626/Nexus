# Roadmap: Nexus

**Created:** 2026-02-27
**Depth:** Standard (5 phases)
**Coverage:** 18/18 v1 requirements mapped

## Phases

- [ ] **Phase 1: Foundation & Auth** - PWA shell, authentication, offline infrastructure, custom sync engine
- [ ] **Phase 2: Form Builder** - Admin form template creation with 10 field types and validation
- [ ] **Phase 3: Form Filling** - Worker data entry with manual input, photos, and voice dictation
- [ ] **Phase 4: Review Workflow** - Reviewer dashboard, approvals, and real-time status updates
- [ ] **Phase 5: PWA Polish & Production** - Install prompts, storage management, deployment readiness

## Phase Details

### Phase 1: Foundation & Auth

**Goal:** Users can sign in, access their organization data, and the app works offline with sync infrastructure ready.

**Depends on:** Nothing (first phase)

**Requirements:** AUTH-01, AUTH-02, AUTH-03, OFFL-01, OFFL-02, OFFL-03, OFFL-04

**Success Criteria** (what must be TRUE):
1. User can sign in via Clerk and sees their organization data isolated from other tenants
2. User has role-based access (Admin sees builder, Worker sees forms, Reviewer sees dashboard)
3. App loads and functions offline with cached templates and data
4. Pending submissions sync automatically when connectivity returns
5. User sees clear sync status indicators (offline/syncing/synced/failed)

**Plans:** 7 plans in 4 waves

| Wave | Plans | Description |
|------|-------|-------------|
| 1 | 01-foundation-auth-01-PLAN.md | Project initialization (Vite + React + TypeScript + dependencies + Tailwind + shadcn/ui) |
| 1 | 01-foundation-auth-02-PLAN.md | PWA manifest + service worker configuration with Workbox strategies |
| 1 | 01-foundation-auth-03-PLAN.md | Dexie.js local database schema (submissions, templates, syncQueue) |
| 2 | 01-foundation-auth-04-PLAN.md | Clerk + Convex auth integration (providers, clients) |
| 3 | 01-foundation-auth-05-PLAN.md | Protected routing with role-based redirects (sign-in, dashboards) |
| 3 | 01-foundation-auth-06-PLAN.md | Offline sync engine (queue, worker, conflict resolution) |
| 4 | 01-foundation-auth-07-PLAN.md | Sync status UI (indicator, offline banner, queue view) |

---

### Phase 2: Form Builder

**Goal:** Admins can create custom form templates with all required field types and validation rules.

**Depends on:** Phase 1 (auth + offline foundation)

**Requirements:** FORM-01, FORM-02, FORM-03, FORM-04

**Success Criteria** (what must be TRUE):
1. Admin can drag and drop fields to build form templates with 10 core field types
2. Admin can set validation rules per field (required, min/max values, option lists)
3. Form templates version automatically when published, creating audit trail
4. Admin can publish and unpublish forms, controlling worker visibility

**Plans:** TBD

---

### Phase 3: Form Filling

**Goal:** Workers can fill forms per production batch using manual input, photos, and voice dictation.

**Depends on:** Phase 2 (form templates must exist)

**Requirements:** FILL-01, FILL-02, FILL-03, FILL-04

**Success Criteria** (what must be TRUE):
1. Worker can select a published form, enter batch number, and fill all field types manually
2. Worker can capture and attach photos via device camera
3. Worker can fill form fields using voice input when online (Whisper API + Agno)
4. Form validation shows errors inline and prevents invalid submissions
5. Drafts auto-save to prevent data loss from app closure or battery issues

**Plans:** TBD

---

### Phase 4: Review Workflow

**Goal:** Reviewers can approve or reject submissions with comments, and workers see real-time status updates.

**Depends on:** Phase 3 (submissions must exist to review)

**Requirements:** REVW-01, REVW-02, REVW-03, REVW-04

**Success Criteria** (what must be TRUE):
1. Reviewer sees dashboard of pending submissions filtered by organization
2. Reviewer can view full submission details including all fields and attached photos
3. Reviewer can approve or reject submissions with optional comments
4. Worker sees real-time status updates on their submissions (pending/approved/rejected)

**Plans:** TBD

---

### Phase 5: PWA Polish & Production

**Goal:** App is installable, production-ready, and handles PWA-specific lifecycle events properly.

**Depends on:** Phase 4 (all features working)

**Requirements:** None (enhancement phase)

**Success Criteria** (what must be TRUE):
1. Users see install prompt and can add app to home screen
2. App handles service worker updates gracefully with user prompts
3. Storage quota is monitored with warnings before exhaustion
4. Sync queue cleanup runs periodically to prevent bloat
5. App is deployed on Coolify infrastructure with proper environment configuration

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 0/7 | Not started | - |
| 2. Form Builder | 0/4 | Not started | - |
| 3. Form Filling | 0/5 | Not started | - |
| 4. Review Workflow | 0/4 | Not started | - |
| 5. PWA Polish & Production | 0/5 | Not started | - |

---

## Phase Dependencies

```
Phase 1 (Foundation)
    ↓
Phase 2 (Form Builder)
    ↓
Phase 3 (Form Filling)
    ↓
Phase 4 (Review Workflow)
    ↓
Phase 5 (PWA Polish)
```

---

## Coverage Map

| Requirement | Phase | Description |
|-------------|-------|-------------|
| AUTH-01 | Phase 1 | Clerk authentication |
| AUTH-02 | Phase 1 | Role-based access |
| AUTH-03 | Phase 1 | Organization data isolation |
| OFFL-01 | Phase 1 | Offline form filling |
| OFFL-02 | Phase 1 | Real-time sync status |
| OFFL-03 | Phase 1 | Draft auto-save |
| OFFL-04 | Phase 1 | Batch number association |
| FORM-01 | Phase 2 | Drag-and-drop form builder |
| FORM-02 | Phase 2 | 10 core field types |
| FORM-03 | Phase 2 | Field validation rules |
| FORM-04 | Phase 2 | Template version tracking |
| FILL-01 | Phase 3 | Manual data entry |
| FILL-02 | Phase 3 | Photo capture |
| FILL-03 | Phase 3 | Voice input |
| FILL-04 | Phase 3 | Form validation |
| REVW-01 | Phase 4 | Pending submissions dashboard |
| REVW-02 | Phase 4 | Full submission details view |
| REVW-03 | Phase 4 | Approve/reject with comments |
| REVW-04 | Phase 4 | Real-time status updates |

**Total:** 18/18 requirements mapped ✓

---
*Last updated: 2026-02-27*
