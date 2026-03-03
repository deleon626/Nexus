# Roadmap: Nexus

**Current Milestone:** v1.1 Fix & Polish QC Forms Builder
**Last Shipped:** v1.0 MVP (2026-03-03)

## Milestones

- ✅ **v1.0 MVP** — 9 phases, 36 plans (shipped 2026-03-03) — [Archive](./milestones/v1.0-ROADMAP.md)
- 📋 **v1.1** — 1 phase (planning complete, not started)

## v1.0 MVP Summary

<details>
<summary>✅ v1.0 MVP (Phases 01-07) — SHIPPED 2026-03-03</summary>

### Completed Phases

| Phase | Name | Plans | Status |
|-------|------|-------|--------|
| 01 | Foundation & Auth | 7/7 | ✅ Complete |
| 02 | Form Builder | 4/4 | ✅ Complete |
| 03 | Form Filling | 9/9 | ✅ Complete |
| 04 | Review Workflow | 5/5 | ✅ Complete |
| 04.1 | Navbar Navigation | 2/2 | ✅ Complete |
| 04.2 | Deploy Convex | 2/2 | ✅ Complete |
| 05 | PWA Polish & Production | 5/5 | ✅ Complete |
| 06 | Fix Submission Pipeline | 1/1 | ✅ Complete |
| 07 | Fix Voice/OrgID/Template Sync | 1/1 | ✅ Complete |

**Total:** 9 phases, 36 plans, 198 commits

### Key Deliverables

- PWA with offline support and sync engine
- Form builder with 10 field types and drag-and-drop
- Form filling with voice dictation (Whisper) and photo capture
- Review workflow with approve/reject and real-time status
- Production deployment to Coolify

See [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md) for full details.

</details>

---

## v1.1 Fix & Polish QC Forms Builder

**Goal:** Polish the form builder and app navigation to production-ready quality for the anchor client demo.

**Requirements covered:** BILD-01, BILD-02, BILD-03, NAV-01

### Phases

- [ ] **Phase 08: Form Builder & Nav Polish** - Inline field editing, auto-focus on add, quick delete, and visible sign-out on mobile

### Phase Details

### Phase 08: Form Builder & Nav Polish
**Goal**: The form builder canvas is fast and self-evident to use, and all users can sign out from mobile without hunting for it
**Depends on**: v1.0 complete (phases 01-07)
**Requirements**: BILD-01, BILD-02, BILD-03, NAV-01
**Success Criteria** (what must be TRUE):
  1. Admin can click any field label in the canvas to edit it inline without opening the sidebar
  2. After dragging a field type onto the canvas, the new field is selected and its label input is focused so the admin can type the name immediately
  3. Admin can delete a field directly from its canvas row using a visible trash/delete icon — no sidebar needed
  4. On mobile, a clearly labeled "Sign out" option is visible in the navigation without requiring the user to tap an avatar or discover a hidden menu
**Plans**: 2 (wave 1: parallel)

### Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 08. Form Builder & Nav Polish | 0/2 | Planned | - |

---
*Last updated: 2026-03-03*
