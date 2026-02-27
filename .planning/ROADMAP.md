# Roadmap: Nexus

**Created:** 2026-02-27
**Depth:** Standard (5 phases)
**Coverage:** 18/18 v1 requirements mapped

## Phases

- [x] **Phase 1: Foundation & Auth** - PWA shell, authentication, offline infrastructure, custom sync engine
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

**Plans:** 7/7 plans complete

| Wave | Plans | Description |
|------|-------|-------------|
| 1 | 7/7 | Complete    | 2026-02-26 | 1 | 01-foundation-auth-02-PLAN.md | PWA manifest + service worker configuration with Workbox strategies |
| 1 | 01-foundation-auth-03-PLAN.md | Dexie.js local database schema (submissions, templates, syncQueue) |
| 2 | 01-foundation-auth-04-PLAN.md | Clerk + Convex auth integration (providers, clients) |
| 3 | 8/9 | In Progress|  | 3 | 01-foundation-auth-06-PLAN.md | Offline sync engine (queue, worker, conflict resolution) |
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

**Plans:** 3/4 plans complete

| Wave | Plans | Description | Status |
|------|-------|-------------|--------|
| 1 | 02-form-builder-08-PLAN.md | Form schema and type definitions (JSON Schema + Zod) | COMPLETE |
| 1 | 02-form-builder-09-PLAN.md | Zustand store and field registry | COMPLETE |
| 2 | 02-form-builder-10-PLAN.md | @dnd-kit drag-and-drop builder UI (has checkpoint) | COMPLETE |
| 3 | 02-form-builder-11-PLAN.md | Field validation and template versioning | PENDING |

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

**Plans:** 8/9 plans executed

| Wave | Plans | Description | Status |
|------|-------|-------------|--------|
| 1 | 03-form-filling-01-PLAN.md | Draft persistence layer (Dexie schema, types, constants) | COMPLETE |
| 1 | 03-form-filling-02-PLAN.md | Auto-save and progress hooks | PENDING |
| 1 | 03-form-filling-03-PLAN.md | Photo capture hook with compression | COMPLETE |
| 2 | 03-form-filling-04-PLAN.md | Convex Whisper API transcription |
| 2 | 03-form-filling-05-PLAN.md | Voice input hook with MediaRecorder |
| 2 | 03-form-filling-06-PLAN.md | Form field components (10 types with voice/photo) |
| 3 | 03-form-filling-07-PLAN.md | FormFiller container with validation |
| 3 | 03-form-filling-08-PLAN.md | Form selection UX (list, batch prompt, drafts) |
| 4 | 03-form-filling-09-PLAN.md | Main page orchestrating complete flow |

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

**Plans:** 5/5 plans complete

| Wave | Plan | Description | Status |
|------|------|-------------|--------|
| 1 | 04-review-workflow-01-PLAN.md | Convex backend: submissions schema, queries, mutations | COMPLETE |
| 2 | 04-review-workflow-02-PLAN.md | UI primitives: Table, Dialog, Badge, @tanstack/react-table | COMPLETE |
| 3 | 04-review-workflow-03-PLAN.md | ReviewerDashboard with SubmissionTable | COMPLETE |
| 3 | 04-review-workflow-05-PLAN.md | WorkerStatusList for real-time status | COMPLETE |
| 4 | 04-review-workflow-04-PLAN.md | ReviewDialog with approve/reject actions | COMPLETE |

---

### Phase 04.1: navbar navigation between sections (INSERTED)

**Goal:** Users can navigate between app sections (Builder, Fill Forms, Reviews) via a persistent responsive navbar — desktop sidebar + mobile bottom tabs — filtered to their role.

**Depends on:** Phase 4
**Plans:** 2 plans

Plans:
- [x] 04.1-01-PLAN.md — Layout shell components (AppLayout, Sidebar, BottomTabBar, MobileTopBar, NavItem) | COMPLETE
- [ ] 04.1-02-PLAN.md — Route refactor with nested Outlet + human verify checkpoint | PENDING

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

**Plans:** 5/5 plans

| Wave | Plans | Description | Status |
|------|-------|-------------|--------|
| 1 | 05-pwa-polish-production-01-PLAN.md | PWA install prompt (beforeinstallprompt event) | PENDING |
| 2 | 05-pwa-polish-production-02-PLAN.md | Service worker update prompt (useRegisterSW) | PENDING |
| 2 | 05-pwa-polish-production-03-PLAN.md | Storage monitoring and auto-cleanup | PENDING |
| 3 | 05-pwa-polish-production-04-PLAN.md | Settings page with storage indicator | PENDING |
| 4 | 05-pwa-polish-production-05-PLAN.md | Production deployment on Coolify | PENDING |

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 7/7 | Complete | 2026-02-27 |
| 2. Form Builder | 9/9 | Complete | 2026-02-27 |
| 3. Form Filling | 9/9 | Complete | 2026-02-27 |
| 4. Review Workflow | 5/5 | Complete | 2026-02-27 |
| 4.1. Navbar Navigation | 1/2 | In Progress | 2026-02-27 |
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
*Last updated: 2026-02-27T09:30:00Z*
