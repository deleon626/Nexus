# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

PWA shell, Clerk authentication, role-based routing, offline infrastructure, and custom sync engine with status indicators. Form building, filling, and reviewing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Auth Flow & Sessions

**Sign-in experience:**
- Full-page redirect to Clerk sign-in widget with app logo
- Clean, simple presentation

**Post-sign-in routing:**
- Role-based dashboard — users land on the feature relevant to their role
- Admin → Builder, Worker → Forms, Reviewer → Dashboard

**Session persistence:**
- Persistent sessions (7+ days) for seamless experience
- No frequent re-authentication required

**Session expiry handling:**
- Graceful re-auth prompt when session expires while working
- Modal asking user to sign in again, preserves their place

**Multi-device support:**
- Allow concurrent sessions — same account on phone + tablet + desktop is fine

**Sign-out behavior:**
- Full redirect to sign-in page
- Clear all session data

**Organization handling:**
- Single org per user — no org switching needed for MVP
- Users only see their organization's data

**First-time user experience:**
- Skip onboarding — straight to role dashboard, learn by doing

### Offline Experience

**First load:**
- Online first load required, then app becomes cacheable
- User must be connected for initial setup

**Offline data availability:**
- Templates, user's draft submissions, and recent submitted forms
- Enough to continue working without connection

**Offline UI behavior:**
- Banner "You're offline" at top
- Let user continue working on available features

**Reconnection behavior:**
- Silent sync in background when connectivity returns
- Show sync status indicator

**Cache staleness:**
- No staleness limit — app works offline indefinitely with cached data

**Storage management:**
- Auto-clear oldest cached items when storage fills up
- Keep recent data prioritized

**Photo cache handling:**
- Store compressed versions of photos
- Clear from cache after successful sync

**Cache refresh:**
- Background refresh while app is open
- Silently update templates and data

**Conflict resolution:**
- Last write wins for same draft edited on multiple devices
- Show user which version was kept

**Pending submissions:**
- Unlimited pending submissions
- Warn user if queue exceeds 50 items

**Network detection:**
- Heartbeat ping for reliable offline/online detection
- Don't trust navigator.onLine alone (Safari false positives)

**Service worker updates:**
- Show "Update available" toast
- User taps to reload at their convenience

### Sync Status UI

**Indicator position:**
- Top header bar, always visible

**States shown:**
- 4 basic states: Offline, Syncing, Synced, Failed
- Simple and clear for users

**Detail level:**
- Icon + label
- Tap to expand: shows queue count and last sync time

**Retry behavior:**
- Auto-retry with exponential backoff
- Manual retry button also available

**Failure indication:**
- Red indicator
- Tap to see error message and retry button

**Success indication:**
- Brief green flash, then settle to synced state

**Queue view:**
- Expandable queue list when tapping indicator
- Shows pending items with individual status

**Sound:**
- Silent — no sounds for sync events
- Visual indicators only

### Claude's Discretion

- Exact loading skeleton design
- Error state copy and messaging
- Transition animations between sync states
- Exact retry backoff timing
- Photo compression quality level
- Heartbeat ping interval

</decisions>

<specifics>
## Specific Ideas

- Follow Clerk's recommended UX patterns for auth flows
- Sync indicator should feel native to the app, not intrusive
- Offline banner should be dismissible but reappear if still offline

</specifics>

<deferred>
## Deferred Ideas

- Role-based routing patterns — left unexplored, planner can determine based on tech stack
- Multi-organization support — future phase after anchor client
- Offline voice input — deferred to v1.1 (Whisper WASM memory concerns)

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-02-27*
