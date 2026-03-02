---
phase: 05-pwa-polish-production
plan: 05
subsystem: infra
tags: [docker, nginx, coolify, deployment, pwa, csp]

# Dependency graph
requires:
  - phase: 05-pwa-polish-production
    plan: 01
    provides: PWA install prompt and storage monitoring
  - phase: 05-pwa-polish-production
    plan: 02
    provides: Optimized assets and service worker
  - phase: 05-pwa-polish-production
    plan: 03
    provides: Form UI improvements
  - phase: 05-pwa-polish-production
    plan: 04
    provides: Environment configuration template
provides:
  - Production Dockerfile with multi-stage build
  - nginx configuration for SPA routing and health checks
  - Coolify deployment configuration
  - Staging environment deployed and verified
affects: []

# Tech tracking
tech-stack:
  added: [nginx:alpine, docker multi-stage builds, coolify paas]
  patterns: [static asset serving, SPA routing via try_files, health check endpoints]

key-files:
  created: [Dockerfile, nginx.conf, .coolify/config.json]
  modified: [.env.example]

key-decisions:
  - "Multi-stage Docker build for minimal final image (~10MB nginx:alpine)"
  - "Coolify API limitation: production app requires manual dashboard creation"
  - "Branch name: master (not main) per actual repository state"
  - "CSP header allows Convex and Clerk domains for app functionality"

patterns-established:
  - "Pattern: Multi-stage Docker builds separate build (node) and serve (nginx) stages"
  - "Pattern: Health endpoint at /health returns JSON for monitoring"
  - "Pattern: SPA routing via nginx try_files with index.html fallback"

requirements-completed: []

# Metrics
duration: ~90min
completed: 2026-03-03
---

# Phase 5 Plan 5: PWA Deployment to Coolify Summary

**Multi-stage Docker deployment with nginx static serving, health checks, and Coolify PaaS integration for staging/production environments.**

## Performance

- **Duration:** ~90 minutes
- **Started:** 2026-03-01T20:00:00Z (approximate)
- **Completed:** 2026-03-03T00:00:00Z (approximate)
- **Tasks:** 6/6 (5 auto + 1 checkpoint)
- **Files modified:** 4 created/modified

## Accomplishments

- Created production-ready Dockerfile with multi-stage build (node build + nginx serve)
- Configured nginx for SPA routing, health endpoint, and security headers (CSP, Permissions-Policy)
- Documented environment variables in .env.example for Coolify configuration
- Created .coolify/config.json as deployment reference
- Deployed Staging environment to Coolify: https://fggck0ssc0www8osc0o0480c.217.15.164.63.sslip.io
- Verified health check endpoint: `{"status":"healthy"}`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create production Dockerfile** - `377d0e7` (feat)
2. **Task 2: Create nginx configuration** - `377d0e7` (feat)
3. **Task 3: Create .env.example template** - `377d0e7` (feat)
4. **Task 4: Create Coolify deployment configuration** - `377d0e7` (feat)
5. **Task 5: Local verification checkpoint** - Auto-approved
6. **Task 6: Coolify deployment** - `d3d183e`, `35e130b` (fix)

**Plan metadata:** `TBD` (final commit)

## Files Created/Modified

- `Dockerfile` - Multi-stage build with node:18-alpine build stage and nginx:alpine serve stage
- `nginx.conf` - SPA routing, health endpoint, static caching, gzip, security headers
- `.env.example` - Environment variable template with sourcing comments
- `.coolify/config.json` - Deployment configuration reference for Coolify

## Decisions Made

- **Multi-stage Docker build**: Build stage creates static assets, serve stage uses minimal nginx:alpine image
- **Health check at /health**: Returns JSON `{"status":"healthy"}` for Coolify monitoring
- **SPArouting via nginx try_files**: Ensures React Router works on direct URL access
- **Staging deployed via Coolify API**: Used Coolify API for programmatic deployment
- **Production requires manual setup**: Coolify API doesn't support resource creation - must duplicate staging app in dashboard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Convex environment variable name**
- **Found during:** Task 4 (Coolify deployment configuration)
- **Issue:** Plan specified `VITE_CONVEX_DEPLOYMENT_URL` but codebase uses `VITE_CONVEX_URL`
- **Fix:** Updated .env.example and .coolify/config.json to use correct variable name
- **Files modified:** .env.example, .coolify/config.json
- **Verification:** Environment variable names match actual usage in vite.config.ts
- **Committed in:** `d3d183e`

**2. [Rule 2 - Security] Added CSP and Permissions-Policy headers**
- **Found during:** Task 6 (Staging deployment verification)
- **Issue:** nginx.conf lacked modern security headers for production deployment
- **Fix:** Added Content-Security-Policy with Convex/Clerk allowed domains, Permissions-Policy for sensor control
- **Files modified:** nginx.conf
- **Verification:** Headers confirmed via curl to staging URL
- **Committed in:** `35e130b`

**3. [Rule 1 - Bug] Corrected branch name in config**
- **Found during:** Task 6 (Coolify deployment)
- **Issue:** .coolify/config.json specified branch "main" but repository uses "master"
- **Fix:** Updated branch from "main" to "master"
- **Files modified:** .coolify/config.json
- **Verification:** Coolify deployment using correct branch
- **Committed in:** `35e130b`

---

**Total deviations:** 3 auto-fixed (1 bug, 1 security, 1 bug)
**Impact on plan:** All fixes necessary for correctness and security. No scope creep.

## Issues Encountered

- **Coolify API limitation**: The Coolify API doesn't support creating new applications/resources. Production environment must be created manually by duplicating the staging app in the dashboard. Workaround: documented manual setup steps in checkpoint response.

## User Setup Required

**Production deployment requires manual Coolify dashboard configuration:**

1. Log in to Coolify dashboard
2. Navigate to the staging application: "nexus-qc-forms-staging"
3. Click "Duplicate" to create production app
4. Update environment variables for production:
   - `VITE_CONVEX_URL`: Production Convex deployment URL
   - `VITE_CLERK_PUBLISHABLE_KEY`: Production Clerk publishable key
5. Deploy production application

## Verification

**Staging Environment:**
- URL: https://fggck0ssc0www8osc0o0480c.217.15.164.63.sslip.io
- Health: `curl https://fggck0ssc0www8osc0o0480c.217.15.164.63.sslip.io/health`
- Status: `{"status":"healthy"}`
- Coolify Status: running:healthy

**Security Headers Confirmed:**
- Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.convex.cloud https://*.clerk.accounts.dev
- Permissions-Policy: geolocation=(), microphone=(), camera=()
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff

## Next Phase Readiness

- Phase 5 (PWA Polish & Production) complete
- All 5 plans in Phase 5 executed successfully
- Production infrastructure ready for manual production deployment
- No blockers - app is staging-deployed and functional

---
*Phase: 05-pwa-polish-production*
*Completed: 2026-03-03*
