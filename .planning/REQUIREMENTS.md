# Requirements: Nexus

**Defined:** 2026-02-27
**Core Value:** Eliminate the paper-to-digital data entry bottleneck

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Offline & Sync

- [ ] **OFFL-01**: User can fill forms offline with data cached locally
- [x] **OFFL-02**: User sees real-time sync status (pending/synced/failed)
- [x] **OFFL-03**: Form drafts auto-save to prevent data loss
- [x] **OFFL-04**: Forms are associated with production batch numbers

### Form Builder

- [x] **FORM-01**: Admin can create form templates via drag-and-drop UI
- [x] **FORM-02**: Admin can use 10 core field types (text, number, decimal, date, time, select, checkbox, passFail, textarea, photo)
- [x] **FORM-03**: Admin can set field validation rules (required, min/max, options)
- [x] **FORM-04**: Form templates have version tracking for audit trail

### Form Filling

- [x] **FILL-01**: Worker can fill forms with manual data entry
- [x] **FILL-02**: Worker can capture photos via device camera
- [ ] **FILL-03**: Worker can fill forms using voice input (online-only via Whisper API + Agno LLM)
- [x] **FILL-04**: Worker sees form validation errors before submission

### Review Workflow

- [ ] **REVW-01**: Reviewer can view dashboard of pending submissions
- [ ] **REVW-02**: Reviewer can view full submission details including photos
- [ ] **REVW-03**: Reviewer can approve or reject submissions with comments
- [ ] **REVW-04**: Worker sees real-time status updates on their submissions

### Auth & Multi-tenancy

- [x] **AUTH-01**: User can sign in via Clerk authentication
- [x] **AUTH-02**: User has role-based access (Admin, Worker, Reviewer, Viewer)
- [ ] **AUTH-03**: Organization data is isolated per tenant

### Navigation

- [x] **NAV-SHELL**: Persistent responsive navbar (desktop sidebar + mobile bottom tabs) filtered by role
- [x] **NAV-ROUTING**: Nested route structure with role-based section access

## v1.1 Requirements

Fix & Polish QC Forms Builder — anchor client readiness.

### Form Builder (BILD)

- [ ] **BILD-01**: Admin can edit a field label by clicking on it directly in the canvas (inline edit)
- [ ] **BILD-02**: When a field is added, it is auto-selected and the label input is focused for immediate naming
- [ ] **BILD-03**: Admin can delete a field from the canvas row via a visible icon (no need to open sidebar)

### Navigation (NAV)

- [ ] **NAV-01**: User can find a clearly labeled "Sign out" action on mobile (not hidden behind avatar tap)

## Traceability — v1.1

| Requirement | Phase | Status |
|-------------|-------|--------|
| BILD-01 | Phase 08 — Form Builder & Nav Polish | Pending |
| BILD-02 | Phase 08 — Form Builder & Nav Polish | Pending |
| BILD-03 | Phase 08 — Form Builder & Nav Polish | Pending |
| NAV-01 | Phase 08 — Form Builder & Nav Polish | Pending |

**Coverage:**
- v1.1 requirements: 4 total
- Mapped to phases: 4
- Unmapped: 0 ✓

---

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reports & Export

- **RPT-01**: Admin can export submissions as PDF reports
- **RPT-02**: Admin can export data to CSV/Excel

### Enhanced Fields

- **FLD-01**: Barcode/QR scanning for batch ID entry
- **FLD-02**: Electronic signature capture
- **FLD-03**: MultiSelect field type
- **FLD-04**: Rating field type
- **FLD-05**: Temperature and weight field types with units

### Voice Enhancements

- **VOIC-01**: Offline voice input via Whisper WASM

### Compliance

- **COMP-01**: HACCP/FDA audit trail with full edit history

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time collaboration | Async sync is sufficient for QC workflow |
| Multi-language UI | English UI + Bahasa voice covers target market |
| Push notifications | Workers check app when doing QC; in-app list sufficient |
| Advanced conditional logic | Simple forms work for v1; complexity not needed |
| Analytics dashboard | Customers export to existing BI tools |
| GPS location capture | Not required for batch-centric QC |
| Native mobile apps | PWA provides faster iteration, no app store friction |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| OFFL-01 | Phase 7 | Pending |
| OFFL-02 | Phase 1 | Complete |
| OFFL-03 | Phase 1 | Complete |
| OFFL-04 | Phase 1 | Complete |
| FORM-01 | Phase 2 | Complete |
| FORM-02 | Phase 2 | Complete |
| FORM-03 | Phase 2 | Complete |
| FORM-04 | Phase 2 | Complete |
| FILL-01 | Phase 3 | Complete |
| FILL-02 | Phase 3 | Complete |
| FILL-03 | Phase 7 | Pending |
| FILL-04 | Phase 3 | Complete |
| REVW-01 | Phase 6 | Pending |
| REVW-02 | Phase 6 | Pending |
| REVW-03 | Phase 6 | Pending |
| REVW-04 | Phase 6 | Pending |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 7 | Pending |
| NAV-SHELL | Phase 4.1 | Complete |
| NAV-ROUTING | Phase 4.1 | Complete |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Satisfied: 14
- Pending (gap closure): 6
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-03-03 after v1.1 roadmap created*
