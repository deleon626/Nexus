# Phase 5: PWA Polish & Production - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Making the app installable, handling PWA lifecycle events gracefully, monitoring storage, and deploying to production. Form filling, review, and core features are complete in previous phases.

</domain>

<decisions>
## Implementation Decisions

### Install Prompt UX
- Never auto-prompt — user discovers via settings or browser's built-in install UI
- Never re-prompt if user dismisses
- Bottom banner placement (standard PWA pattern) if manually triggered
- Minimal content: "Install app" with simple description

### Service Worker Updates
- Prompt to reload with toast notification when update available
- Only prompt when tab is active and user is present
- Never force updates — user always controls when to reload
- Check for updates on page load (immediate detection)

### Storage Management
- Warn at 80% quota usage, block operations at 95%
- Auto-cleanup: synced submissions deleted after 7 days, drafts after 14 days
- Storage status visible in settings page only (not always-visible indicator)
- Cleanup runs automatically at retention thresholds (not manual trigger)

### Production Deployment
- Two environments: Staging and Production on Coolify
- All configuration via Coolify environment variables (no config files)
- Basic monitoring: health checks + error logging
- Coolify subdomain (*.sslip.io) — no custom domain setup required

### Claude's Discretion
- Exact toast/notification styling
- Install banner visual design
- Settings page storage indicator design
- Error logging implementation details
- Health check endpoints

</decisions>

<specifics>
## Specific Ideas

- Factory floor workers may not want install prompts interrupting their workflow
- Simple and non-intrusive PWA behavior preferred
- Storage management should be hands-off (auto-cleanup) since workers won't manage it manually

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-pwa-polish-production*
*Context gathered: 2026-02-27*
