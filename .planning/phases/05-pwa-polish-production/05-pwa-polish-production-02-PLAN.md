---
phase: 05-pwa-polish-production
plan: 02
type: execute
wave: 1
depends_on: []
files_modified: [src/features/pwa/components/ReloadPrompt.tsx, src/App.tsx]
autonomous: false
requirements: []
user_setup: []

must_haves:
  truths:
    - "Service worker updates detected on page load via onRegistered callback"
    - "Update prompt appears as toast notification (not modal, not forced)"
    - "User controls when to reload (never auto-reload on update)"
    - "Only prompt when tab is active and user is present"
  artifacts:
    - path: "src/features/pwa/components/ReloadPrompt.tsx"
      provides: "Toast notification for service worker updates with reload/close actions"
      min_lines: 50
    - path: "src/App.tsx"
      provides: "App wrapper with ReloadPrompt component"
      contains: "ReloadPrompt"
  key_links:
    - from: "src/features/pwa/components/ReloadPrompt.tsx"
      to: "virtual:pwa-register/react"
      via: "useRegisterSW hook import"
      pattern: "useRegisterSW.*from.*virtual:pwa-register"
    - from: "src/App.tsx"
      to: "ReloadPrompt component"
      via: "Component render in app layout"
      pattern: "<ReloadPrompt"
---

<objective>
Create service worker update prompt UI using vite-plugin-pwa's useRegisterSW hook. Show toast notification when update is available, let user control when to reload.

Purpose: Handle PWA updates gracefully without interrupting user workflows. Per CONTEXT.md: prompt with toast notification, only prompt when tab is active, never force updates, check for updates on page load.

Output: ReloadPrompt component, App.tsx integration
</objective>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/05-pwa-polish-production/05-CONTEXT.md
@.planning/phases/05-pwa-polish-production/05-RESEARCH.md

# PWA configuration
@vite.config.ts — vite-plugin-pwa configured with registerType: 'autoUpdate'
</context>

<tasks>

<task type="auto">
  <name>Create ReloadPrompt component with useRegisterSW hook</name>
  <files>src/features/pwa/components/ReloadPrompt.tsx</files>
  <action>
Create src/features/pwa/components/ReloadPrompt.tsx:

1. Import useRegisterSW from 'virtual:pwa-register/react'

2. Hook configuration:
   - onNeedRefresh(): set needRefresh state to true
   - onRegistered(registration):
     - Call registration.update() immediately to check for updates on page load (per CONTEXT)
     - Set up interval check every hour (optional, for long-running sessions)
   - onRegisterError(error): console.error for debugging

3. Destructure from useRegisterSW:
   - needRefresh: [needRefresh, setNeedRefresh]
   - updateServiceWorker: function to trigger reload

4. Component structure (toast notification):
   - Fixed position: fixed bottom-4 right-4 (not center, not modal)
   - Toast styling: bg-background border rounded shadow-lg p-4
   - Max width: max-w-sm for readability
   - Animation: enter/exit transitions optional (use existing toast patterns)

5. Content:
   - Title: "Update Available" (h3, font-semibold)
   - Description: "A new version is ready. Reload to update." (p, text-sm text-muted-foreground)
   - Actions: Reload (primary) and Close (ghost/secondary) buttons

6. Reload button:
   - onClick calls updateServiceWorker(true) — true parameter skips waiting
   - This triggers page reload with new service worker active

7. Close button:
   - onClick sets needRefresh to false
   - Prompt will re-appear on next page load if update still pending

8. Conditional render: only show when needRefresh === true

9. Page visibility detection (per CONTEXT "only prompt when tab is active"):
   - Use document.visibilityState === 'visible' check
   - Only show toast when tab is active

Per RESEARCH.md Pattern 1 for useRegisterSW hook usage.
  </action>
  <verify>grep -q "useRegisterSW.*virtual:pwa-register" src/features/pwa/components/ReloadPrompt.tsx && grep -q "updateServiceWorker" src/features/pwa/components/ReloadPrompt.tsx</verify>
  <done>ReloadPrompt component with toast notification, reload/close actions, page visibility check</done>
</task>

<task type="auto">
  <name>Integrate ReloadPrompt into App.tsx</name>
  <files>src/App.tsx</files>
  <action>
Modify src/App.tsx:

1. Import ReloadPrompt component from features/pwa/components

2. Add ReloadPrompt as last child in app layout:
   - Place outside routing but inside Clerk/Convex providers
   - This ensures update prompt works on all pages
   - Fixed positioning ensures it doesn't affect layout

3. Verify app structure:
   - ClerkProvider outermost
   - ConvexProviderWithClerk
   - Router/Outlet
   - ReloadPrompt (after Router, at bottom)

The ReloadPrompt component handles its own visibility based on needRefresh state.

If App.tsx doesn't exist, create it with this structure.
  </action>
  <verify>grep -q "ReloadPrompt" src/App.tsx</verify>
  <done>App.tsx includes ReloadPrompt component for global update notification</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Service worker update prompt with useRegisterSW hook and toast notification</what-built>
  <how-to-verify>
1. Build app with current version: npm run build
2. Serve dist folder: npx serve dist
3. Open app in Chrome DevTools
4. Open Application tab > Service Workers
5. Make a code change (modify App.tsx text) and rebuild: npm run build
6. Refresh the app page
7. Verify toast notification appears: "Update Available" message
8. Verify toast appears in bottom-right corner
9. Verify page has background refresh indicator in DevTools
10. Close toast with "Close" button
11. Refresh page - verify toast re-appears (update still pending)
12. Click "Reload" button - verify page reloads with new version
13. Open DevTools console - verify no errors, service worker updated successfully
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues with update prompt behavior</resume-signal>
</task>

</tasks>

<verification>
Overall verification:
1. useRegisterSW hook configured with onNeedRefresh, onRegistered callbacks
2. ReloadPrompt toast appears when service worker update is available
3. Toast positioned in bottom-right corner (not modal)
4. Reload button triggers page reload with new service worker
5. Close button dismisses toast without reloading
6. Update check runs on page load via onRegistered callback
7. No forced reloads — user controls when to update
</verification>

<success_criteria>
1. Service worker updates detected immediately on page load
2. Toast notification appears when update is available
3. User can dismiss toast without updating
4. User can trigger reload when ready
5. No auto-reload or forced updates
</success_criteria>

<output>
After completion, create .planning/phases/05-pwa-polish-production/05-pwa-polish-production-02-SUMMARY.md
</output>
