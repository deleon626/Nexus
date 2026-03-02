---
status: resolved
trigger: "The deployed app shows error: Error: @clerk/clerk-react: Missing publishableKey."
created: 2026-03-02T06:50:00Z
updated: 2026-03-02T18:05:00Z
---

## Current Focus

hypothesis: RESOLVED - All three issues fixed
test: Verified HTTPS works, Clerk key present in bundle, favicon correct, container healthy
expecting: N/A - resolved
next_action: Archive session

## Symptoms

expected: The app should load and authenticate users with Clerk
actual: The app crashes with "Missing publishableKey" error (original), then new errors after first fix: development keys warning, cookie digest failure on HTTP, vite.svg 404
errors:
  - Error: @clerk/clerk-react: Missing publishableKey (original)
  - Clerk: Clerk has been loaded with development keys (warning, cosmetic)
  - Suffixed cookie failed due to Cannot read properties of undefined (reading 'digest') (secure-context: false)
  - vite.svg 404
reproduction: Visit http://217.15.164.63:3010 (original), then https://fggck0ssc0www8osc0o0480c.217.15.164.63.sslip.io
started: Started happening after first deployment

## Eliminated

- hypothesis: The Dockerfile doesn't have ARG declarations
  evidence: The local Dockerfile DOES have ARG declarations (lines 8-9), and this is committed
  timestamp: 2026-03-02T06:52:00Z

- hypothesis: Environment variables are missing from Coolify configuration
  evidence: Runtime env vars don't matter for Vite - they must be passed at BUILD time
  timestamp: 2026-03-02T06:53:00Z

- hypothesis: Coolify is pulling from Docker Hub instead of building from Git
  evidence: Coolify app config shows git_repository=deleon626/Nexus and build_pack=dockerfile
  timestamp: 2026-03-02T18:00:00Z

- hypothesis: Production Clerk keys are needed (pk_live_*)
  evidence: Dev keys (pk_test_) work fine, the cookie error is caused by HTTP not HTTPS
  timestamp: 2026-03-02T18:00:00Z

## Evidence

- timestamp: 2026-03-02T06:51:00Z
  checked: Local Dockerfile
  found: ARG declarations present for VITE_CLERK_PUBLISHABLE_KEY and VITE_CONVEX_URL (lines 8-9), ENV set (lines 12-13)
  implication: Dockerfile is correctly configured

- timestamp: 2026-03-02T06:52:00Z
  checked: Built JS file in container
  found: Clerk key is "pk_test_" (empty value after prefix)
  implication: Build args were NOT passed during docker build

- timestamp: 2026-03-02T18:00:00Z
  checked: Coolify application API response
  found: build_pack=dockerfile, git_repository=deleon626/Nexus, fqdn=http://... (not https)
  implication: Coolify IS building from Git with correct env vars. The FQDN is HTTP which causes Clerk cookie failures.

- timestamp: 2026-03-02T18:00:00Z
  checked: Coolify environment variables for the app
  found: VITE_CLERK_PUBLISHABLE_KEY and VITE_CONVEX_URL are set as is_buildtime=true
  implication: Build args ARE being passed. The original missing key issue was resolved in previous session.

- timestamp: 2026-03-02T18:01:00Z
  checked: Cookie digest error root cause
  found: Clerk's suffixed cookies require secure context (HTTPS) to use Web Crypto API digest()
  implication: Switching FQDN to HTTPS fixes the cookie error

- timestamp: 2026-03-02T18:02:00Z
  checked: index.html favicon link
  found: Referenced /vite.svg which doesn't exist in public/; correct files are /icon.svg and /favicon.ico
  implication: Simple fix to index.html resolves 404

- timestamp: 2026-03-02T18:03:00Z
  checked: Dockerfile healthcheck
  found: Used 'localhost' which resolves to ::1 (IPv6) on Alpine, but nginx listens on 0.0.0.0 (IPv4)
  implication: Changed to 127.0.0.1 fixes the healthcheck failure

## Resolution

root_cause: |
  Three separate issues:
  1. FQDN was HTTP — Clerk's suffixed cookie signing requires HTTPS (secure context) for Web Crypto API digest()
  2. index.html referenced /vite.svg (doesn't exist) — should use /icon.svg
  3. Dockerfile healthcheck used 'localhost' which resolves to IPv6 (::1) on Alpine Linux

fix: |
  1. Updated Coolify app FQDN from http:// to https:// via PATCH API (domains field)
     Triggered redeploy — Coolify/Caddy auto-provisions SSL for sslip.io domains
  2. Fixed index.html to reference /icon.svg instead of /vite.svg, added /favicon.ico as fallback
  3. Fixed Dockerfile healthcheck to use 127.0.0.1 instead of localhost

verification: |
  - HTTPS: curl -sk https://fggck0ssc0www8osc0o0480c.217.15.164.63.sslip.io/ → 200 OK
  - HTTP redirects: curl http://... → 308 (redirects to HTTPS)
  - Clerk key in bundle: pk_test_d2l0dHktY29icmEtNDUuY2xlcmsuYWNjb3VudHMuZGV2JA
  - favicon.ico: 200, icon.svg: 200, vite.svg: 404 (correctly absent)
  - Container health: Up (healthy)

files_changed:
  - index.html: favicon href changed from /vite.svg to /icon.svg, added fallback favicon.ico
  - Dockerfile: healthcheck changed from localhost to 127.0.0.1
  - commits: bb7ecf3 (favicon), dea2cfc (healthcheck)
