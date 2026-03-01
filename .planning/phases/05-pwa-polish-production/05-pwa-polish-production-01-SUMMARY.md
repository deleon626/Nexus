---
phase: 05-pwa-polish-production
plan: 01
subsystem: pwa
tags: [pwa, beforeinstallprompt, install-prompt, settings, vite-plugin-pwa]

# Dependency graph
requires:
  - phase: 04.1-navbar-navigation-between-sections
    provides: AppLayout, navigation structure
provides:
  - PWA install prompt hook (usePWAInstall) with beforeinstallprompt handling
  - PWA install banner component (InstallPrompt) with minimal UI
  - Settings page with manual install trigger button
affects: [05-pwa-polish-production-02, 05-pwa-polish-production-03, 05-pwa-polish-production-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PWA install hook pattern with beforeinstallprompt event"
    - "localStorage dismissal persistence"
    - "Manual trigger only (no auto-prompt)"
    - "Bottom banner placement for install prompts"

key-files:
  created:
    - src/features/pwa/hooks/usePWAInstall.ts
    - src/features/pwa/components/InstallPrompt.tsx
    - src/routes/settings.tsx
  modified:
    - src/App.tsx
    - src/routes/index.tsx
    - src/components/layout/NavItem.tsx

key-decisions:
  - "Install prompt only shows on manual trigger from Settings (per CONTEXT: never auto-prompt)"
  - "Dismissal stored in localStorage to prevent re-prompting (per CONTEXT: never re-prompt)"
  - "Settings page accessible to all roles (no role gating)"
  - "Install button triggers banner, banner triggers native browser prompt"

patterns-established:
  - "PWA hook pattern: usePWAInstall with deferredPrompt state and localStorage dismissal"
  - "Install banner pattern: fixed bottom-0 with minimal content (title + description + buttons)"
  - "Manual trigger flow: Settings button -> showInstallPrompt() -> InstallPrompt banner -> promptInstall()"

requirements-completed: []

# Metrics
duration: 133s
completed: 2026-03-01
---

# Phase 5 Plan 1: PWA Install Prompt Summary

**PWA install prompt with beforeinstallprompt handling, manual-only trigger, localStorage dismissal persistence, and Settings page integration**

## Performance

- **Duration:** 2 min 13 sec
- **Started:** 2026-03-01T13:20:20Z
- **Completed:** 2026-03-01T13:22:33Z
- **Tasks:** 3 (4th task was checkpoint auto-approved)
- **Files modified:** 6

## Accomplishments

- Created `usePWAInstall` hook that captures `beforeinstallprompt` event and stores it for manual trigger
- Built `InstallPrompt` bottom banner component with minimal content per CONTEXT.md
- Added Settings page with "Install App" button that triggers the install banner
- Integrated PWA components into App.tsx and navigation structure
- Implemented localStorage dismissal persistence to prevent re-prompting

## Task Commits

Each task was committed atomically:

1. **Task 1: Create usePWAInstall hook** - `cc2fc00` (feat)
2. **Task 2: Create InstallPrompt component** - `31555b0` (feat)
3. **Task 4: Settings page integration** - `9f59f20` (feat)

**Plan metadata:** (final commit in next step)

## Files Created/Modified

- `src/features/pwa/hooks/usePWAInstall.ts` - PWA install state hook with beforeinstallprompt handling, localStorage dismissal, and install detection
- `src/features/pwa/components/InstallPrompt.tsx` - Bottom banner install prompt with Install/Dismiss buttons and minimal content
- `src/routes/settings.tsx` - Settings page with PWA install section and manual trigger button
- `src/App.tsx` - Added InstallPrompt component to render globally
- `src/routes/index.tsx` - Added /settings route
- `src/components/layout/NavItem.tsx` - Added Settings to navigation config

## Decisions Made

- **Install trigger flow:** Settings button calls `showInstallPrompt()` which sets `showPrompt` state, causing `InstallPrompt` banner to appear
- **No auto-prompt:** Per CONTEXT.md, the hook never sets `showPrompt` to true automatically - user must manually click "Install App" in settings
- **Dismissal persistence:** `localStorage.setItem('pwa-install-dismissed', 'true')` prevents any future prompts
- **Installed detection:** Uses `window.matchMedia('(display-mode: standalone)')` to detect if app is already installed
- **All-role access:** Settings page accessible to all user roles (admin, worker, reviewer)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- File modification conflict during App.tsx edit due to linter changes - resolved by re-reading file before editing

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PWA install prompt infrastructure complete
- Ready for Plan 02: Service Worker Update Prompt (useRegisterSW hook)
- Settings page structure in place for Plan 04: Storage Management

---
*Phase: 05-pwa-polish-production*
*Plan: 01*
*Completed: 2026-03-01*
