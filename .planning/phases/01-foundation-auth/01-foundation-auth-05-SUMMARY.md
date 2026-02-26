---
phase: 01-foundation-auth
plan: 05
subsystem: auth
tags: [react-router, clerk, role-based-routing, protected-routes, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-auth-04
    provides: ClerkProvider, ConvexProviderWithClerk, auth configuration
provides:
  - Protected routing with authentication checks
  - Role-based routing (Admin, Worker, Reviewer, Viewer)
  - Sign-in page with Clerk integration
  - useAuth and useRole hooks for auth state management
  - Role-specific route wrappers for future use
affects: [01-foundation-auth-06, 01-foundation-auth-07, 02-form-builder, 03-form-filling, 04-form-review]

# Tech tracking
tech-stack:
  added: [react-router v7]
  patterns: [Protected route wrapper, Role-based routing, Clerk sign-in flow]

key-files:
  created:
    - src/hooks/useAuth.ts
    - src/routes/sign-in.tsx
    - src/routes/protected.tsx
    - src/routes/index.tsx
    - src/routes/admin/builder.tsx
    - src/routes/worker/forms.tsx
    - src/routes/reviewer/dashboard.tsx
  modified:
    - src/main.tsx
    - src/App.tsx

key-decisions:
  - "Role-based routing on root path: Admin → /admin/builder, Worker → /worker/forms, Reviewer → /reviewer/dashboard"
  - "ProtectedRoute wrapper handles both auth checks and role-based redirects"
  - "Role-specific route wrappers (AdminRoute, WorkerRoute, ReviewerRoute) for granular protection"
  - "Admin role has elevated access to worker and reviewer routes"
  - "Full-page redirect to Clerk sign-in widget per user decision"

patterns-established:
  - "Pattern 1: useAuth hook provides auth state (isAuthenticated, isLoading, userId, role, orgId)"
  - "Pattern 2: useRole hook provides role checking utilities (isAdmin, isWorker, isReviewer, isViewer)"
  - "Pattern 3: ProtectedRoute wraps routes requiring authentication"
  - "Pattern 4: Role-specific routes use dedicated wrapper components (AdminRoute, WorkerRoute, ReviewerRoute)"
  - "Pattern 5: Sign-in page redirects to root for role-based routing after authentication"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 1 min
completed: 2026-02-27T00:58:00Z
---

# Phase 1 Plan 5: Protected Routing Summary

**Protected routing with Clerk sign-in flow, role-based dashboard routing, and auth state management hooks**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-26T17:57:00Z
- **Completed:** 2026-02-27T00:58:00Z
- **Tasks:** 5
- **Files modified:** 9

## Accomplishments

- Implemented protected routing with Clerk authentication checks
- Created role-based routing system (Admin → Builder, Worker → Forms, Reviewer → Dashboard)
- Built sign-in page with full-page Clerk redirect per user decision
- Added useAuth and useRole hooks for auth state and role checking
- Created placeholder dashboard routes for each role

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth hook with role checking** - `f81acc1` (feat)
2. **Task 2: Create sign-in page with Clerk integration** - `a368880` (feat)
3. **Task 3: Create protected route wrapper with role-based routing** - `4b9ec72` (feat)
4. **Task 4: Create role-based dashboard routes (placeholders)** - `35457ae` (feat)
5. **Task 5: Set up React Router and integrate protected routes** - `dd302b5` (feat)

**Plan metadata:** `f6d4e3d` (docs: complete plan)

## Self-Check: PASSED

All created files verified:
- src/hooks/useAuth.ts: FOUND
- src/routes/sign-in.tsx: FOUND
- src/routes/protected.tsx: FOUND
- src/routes/index.tsx: FOUND
- src/routes/admin/builder.tsx: FOUND
- src/routes/worker/forms.tsx: FOUND
- src/routes/reviewer/dashboard.tsx: FOUND
- .planning/phases/01-foundation-auth/01-foundation-auth-05-SUMMARY.md: FOUND

All task commits verified:
- f81acc1: Task 1 (useAuth hook)
- a368880: Task 2 (sign-in page)
- 4b9ec72: Task 3 (protected route wrapper)
- 35457ae: Task 4 (dashboard routes)
- dd302b5: Task 5 (React Router integration)

## Files Created/Modified

### Created
- `src/hooks/useAuth.ts` - Auth state and role checking hooks (useAuth, useRole)
- `src/routes/sign-in.tsx` - Clerk sign-in page with full-page redirect
- `src/routes/protected.tsx` - Protected route wrapper with role-based redirects
- `src/routes/index.tsx` - React Router route definitions
- `src/routes/admin/builder.tsx` - Admin dashboard placeholder
- `src/routes/worker/forms.tsx` - Worker dashboard placeholder
- `src/routes/reviewer/dashboard.tsx` - Reviewer dashboard placeholder

### Modified
- `src/main.tsx` - Added BrowserRouter wrapper
- `src/App.tsx` - Replaced placeholder content with AppRoutes component

## Decisions Made

- Role extraction from Clerk sessionClaims.metadata.role per AUTH-02 requirement
- orgId extracted from Clerk Organizations for future multi-tenant isolation
- Admin role has elevated access (can access worker and reviewer routes)
- Role-based routing on root path implemented in ProtectedRoute useEffect
- Full-page redirect to Clerk sign-in widget per CONTEXT.md user decision
- Loading state shown while auth state is being checked
- Redirect to /profile for viewer role (no role-specific dashboard in v1)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully with no errors.

## Authentication Gates

None - Clerk credentials were already configured in Plan 04 (VITE_CLERK_PUBLISHABLE_KEY).

## User Setup Required

None - no external service configuration required beyond what was set up in Plan 04.

## Next Phase Readiness

**Ready for Plan 06: User session context and auth hooks**
- Protected routing infrastructure in place
- useAuth and useRole hooks available for session context
- Role-based routing operational

**Ready for Plan 07: Role-based access control middleware**
- Role checking patterns established
- Protected route wrappers available for granular access control

**Requirements completed:**
- AUTH-01: User can sign in via Clerk authentication (sign-in page created)
- AUTH-02: User has role-based access (protected routes with role checking implemented)

**Note:** For testing, users need Clerk accounts with roles set in user.publicMetadata.role. The role field comes from Clerk's user metadata and will be used for access control in subsequent plans.

---
*Phase: 01-foundation-auth*
*Completed: 2026-02-27*
