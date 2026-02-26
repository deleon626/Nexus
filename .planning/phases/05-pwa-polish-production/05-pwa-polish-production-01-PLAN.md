---
phase: 05-pwa-polish-production
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/features/pwa/hooks/usePWAInstall.ts, src/features/pwa/components/InstallPrompt.tsx, src/routes/settings.tsx]
autonomous: false
requirements: []
user_setup: []

must_haves:
  truths:
    - "Install prompt shows only when user manually triggers (not auto-prompt on load)"
    - "Install prompt never re-appears after user dismisses it (localStorage)"
    - "Install button triggers browser's native install prompt via beforeinstallprompt event"
    - "Prompt appears as bottom banner with minimal content"
  artifacts:
    - path: "src/features/pwa/hooks/usePWAInstall.ts"
      provides: "PWA install state management with beforeinstallprompt event handling"
      exports: ["usePWAInstall"]
    - path: "src/features/pwa/components/InstallPrompt.tsx"
      provides: "Bottom banner install prompt with Install/Dismiss buttons"
      min_lines: 40
  key_links:
    - from: "src/features/pwa/hooks/usePWAInstall.ts"
      to: "window.beforeinstallprompt event"
      via: "addEventListener for beforeinstallprompt"
      pattern: "addEventListener.*beforeinstallprompt"
    - from: "src/features/pwa/components/InstallPrompt.tsx"
      to: "usePWAInstall hook"
      via: "React hook for install state"
      pattern: "usePWAInstall"
---

<objective>
Create PWA install prompt UI that appears when user manually triggers it, respects dismissal state, and triggers browser's native install prompt via beforeinstallprompt event.

Purpose: Enable users to install the app to their home screen without annoying auto-prompts. Per CONTEXT.md decision: never auto-prompt, never re-prompt after dismissal, bottom banner placement, minimal content.

Output: usePWAInstall hook, InstallPrompt component, settings page integration
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

# PWA configuration already exists
@vite.config.ts — vite-plugin-pwa configured with manifest and workbox
</context>

<tasks>

<task type="auto">
  <name>Create usePWAInstall hook with beforeinstallprompt event handling</name>
  <files>src/features/pwa/hooks/usePWAInstall.ts</files>
  <action>
Create src/features/pwa/hooks directory and usePWAInstall.ts file:

1. State management:
   - deferredPrompt: stores the beforeinstallprompt event
   - showPrompt: boolean for banner visibility (default false, never auto-show)
   - isInstalled: boolean derived from window.matchMedia('(display-mode: standalone)')

2. useEffect for beforeinstallprompt event:
   - Prevent default browser prompt with e.preventDefault()
   - Store event in deferredPrompt state
   - DO NOT set showPrompt to true (per CONTEXT: never auto-prompt)
   - Check localStorage for 'pwa-install-dismissed' key
   - Only allow manual trigger via promptInstall() if not dismissed

3. promptInstall() function:
   - Call deferredPrompt.prompt() to show native browser prompt
   - Wait for deferredPrompt.userChoice promise
   - Clear deferredPrompt if outcome === 'accepted'
   - Return boolean indicating acceptance

4. dismissInstall() function:
   - Set showPrompt to false
   - Set localStorage.setItem('pwa-install-dismissed', 'true')

5. Return: { showPrompt, isInstalled, promptInstall, dismissInstall, canPrompt }

Per RESEARCH.md Pattern 2 for beforeinstallprompt handling.
  </action>
  <verify>grep -q "beforeinstallprompt" src/features/pwa/hooks/usePWAInstall.ts && grep -q "localStorage.*pwa-install-dismissed" src/features/pwa/hooks/usePWAInstall.ts</verify>
  <done>Hook exports usePWAInstall with beforeinstallprompt event handling, localStorage dismissal tracking, and promptInstall function</done>
</task>

<task type="auto">
  <name>Create InstallPrompt bottom banner component</name>
  <files>src/features/pwa/components/InstallPrompt.tsx</files>
  <action>
Create src/features/pwa/components directory and InstallPrompt.tsx file:

1. Import usePWAInstall hook and cn utility

2. Component structure:
   - Fixed bottom banner: fixed bottom-0 left-0 right-0
   - Background: bg-background with border-t
   - Padding: p-4 for comfortable touch target
   - Flex layout: flex items-center justify-between gap-4
   - Minimal content per CONTEXT.md

3. Content (minimal per CONTEXT):
   - Title: "Install App" (h3, font-semibold)
   - Description: "Add to home screen for offline access" (p, text-sm text-muted-foreground)
   - Buttons: Install (primary) and Dismiss (ghost/secondary)

4. Install button:
   - onClick calls promptInstall()
   - If accepted, banner closes automatically

5. Dismiss button:
   - onClick calls dismissInstall()
   - Stores dismissal in localStorage per CONTEXT: "never re-prompt if user dismisses"

6. Conditional render: only show when showPrompt === true and !isInstalled

Use shadcn/ui Button component with existing button variants.
  </action>
  <verify>grep -q "fixed.*bottom-0" src/features/pwa/components/InstallPrompt.tsx && grep -q "Install.*App" src/features/pwa/components/InstallPrompt.tsx</verify>
  <done>Bottom banner with "Install App" title, minimal description, Install and Dismiss buttons</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>PWA install prompt UI with usePWAInstall hook and InstallPrompt component</what-built>
  <how-to-verify>
1. Start dev server: npm run dev
2. Open app in Chrome (desktop) or Chrome Android (mobile)
3. Go to Settings page - verify "Install App" button exists
4. Click "Install App" - verify bottom banner appears
5. Click "Dismiss" - verify banner closes and doesn't re-appear
6. Refresh page - verify banner doesn't auto-show (no auto-prompt)
7. Check localStorage - verify 'pwa-install-dismissed' key exists
8. Clear localStorage and refresh - verify "Install App" button works again
9. Click "Install" on banner - verify browser's native install prompt appears
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues with install prompt behavior</resume-signal>
</task>

<task type="auto">
  <name>Integrate InstallPrompt into Settings page</name>
  <files>src/routes/settings.tsx</files>
  <action>
Create or modify src/routes/settings.tsx:

1. Import InstallPrompt component (it will handle its own visibility)

2. Settings page structure:
   - Page title: "Settings" (h1, text-2xl font-bold)
   - Section: "App" (section with space-y-4)
   - Install button in settings: only show when !isInstalled and !dismissed
   - Use usePWAInstall hook to check canPrompt state

3. Manual install trigger button:
   - "Install App" button in settings (not banner, just button)
   - onClick calls a function that sets showPrompt to true
   - This triggers the InstallPrompt bottom banner

4. Layout pattern:
   - Card-based layout using existing UI components
   - Each section in a card with title and content

The InstallPrompt banner is separate from the settings button - button triggers banner, banner shows actual prompt.

Note: Settings page will be expanded in Plan 04 (storage indicator). This task just adds the install button.
  </action>
  <verify>grep -q "InstallPrompt\|Install.*App" src/routes/settings.tsx</verify>
  <done>Settings page has "Install App" button that triggers InstallPrompt banner</done>
</task>

</tasks>

<verification>
Overall verification:
1. usePWAInstall hook handles beforeinstallprompt event correctly
2. InstallPrompt banner appears only on manual trigger (not auto-prompt)
3. Dismissal is stored in localStorage and persists across sessions
4. Install button triggers browser's native install prompt
5. Settings page has manual install trigger button
</verification>

<success_criteria>
1. Users can manually trigger install prompt from Settings page
2. Install prompt appears as bottom banner with minimal content
3. Dismissed prompts never re-appear (localStorage persistence)
4. Browser's native install prompt appears when Install button clicked
5. No auto-prompt on page load
</success_criteria>

<output>
After completion, create .planning/phases/05-pwa-polish-production/05-pwa-polish-production-01-SUMMARY.md
</output>
