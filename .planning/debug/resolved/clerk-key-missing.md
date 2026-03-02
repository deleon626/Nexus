---
status: resolved
trigger: "Error: @clerk/clerk-react: Missing publishableKey"
created: 2026-03-02T12:00:00Z
updated: 2026-03-02T12:20:00Z
---

## Current Focus

hypothesis: CONFIRMED - VITE_CLERK_PUBLISHABLE_KEY missing from Coolify build environment
test: Analyzed Dockerfile and Vite build process
expecting: Need to add ARG/ENV for VITE_* variables in Dockerfile
next_action: Fix Dockerfile to support build-time environment variables

## Symptoms

expected: App loads and shows login page
actual: Clerk error - Missing publishableKey
errors: Error: @clerk/clerk-react: Missing publishableKey
reproduction: Open http://217.15.164.63:3010 in browser
started: Issue since first deployment

## Eliminated

(Nothing yet)

## Evidence

- timestamp: 2026-03-02T12:01:00Z
  checked: src/App.tsx authentication flow
  found: App checks `forceDevMode || isDevModeWithoutCredentials` to decide between mock auth and Clerk
  implication: In production (import.meta.env.DEV = false), it should use Clerk

- timestamp: 2026-03-02T12:02:00Z
  checked: src/lib/clerk.ts
  found: `publishableKey = clerkPubKey || (import.meta.env.DEV ? "pk_test_placeholder" : "")`
  implication: In production without VITE_CLERK_PUBLISHABLE_KEY, publishableKey is empty string ""

- timestamp: 2026-03-02T12:03:00Z
  checked: .env.production
  found: Only contains VITE_CONVEX_URL, missing VITE_CLERK_PUBLISHABLE_KEY
  implication: Production .env file is incomplete - Clerk key is missing

- timestamp: 2026-03-02T12:04:00Z
  checked: .env.local
  found: Has VITE_CLERK_PUBLISHABLE_KEY=pk_test_d2l0dHktY29icmEtNDUuY2xlcmsuYWNjb3VudHMuZGV2JA
  implication: Local development works because .env.local has the key

- timestamp: 2026-03-02T12:05:00Z
  checked: src/context/AuthContext.tsx
  found: `isDevModeWithoutCredentials = import.meta.env.DEV && (!VITE_CLERK_PUBLISHABLE_KEY || !VITE_CONVEX_URL)`
  implication: This only triggers in DEV mode. In production, missing key causes ClerkProvider to fail

## Resolution

root_cause: VITE_CLERK_PUBLISHABLE_KEY is not configured in Coolify production environment. The .env.production file only contains VITE_CONVEX_URL but is missing the Clerk key. Additionally, Vite embeds VITE_* environment variables at BUILD time, so Coolify must expose these variables during Docker build (via ARG/ENV), not just at runtime.
fix: Added VITE_CLERK_PUBLISHABLE_KEY to .env.production and updated Dockerfile to accept VITE_* variables as build ARGs
verification: Local build successful - Clerk key confirmed embedded in dist/assets/index-*.js. Ready for Coolify redeploy.
files_changed: [.env.production, Dockerfile]
