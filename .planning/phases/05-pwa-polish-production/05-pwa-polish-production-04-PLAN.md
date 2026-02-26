---
phase: 05-pwa-polish-production
plan: 04
type: execute
wave: 3
depends_on: ["05-pwa-polish-production-01", "05-pwa-polish-production-03"]
files_modified: [src/routes/settings.tsx, src/features/pwa/components/StorageIndicator.tsx]
autonomous: true
requirements: []
user_setup: []

must_haves:
  truths:
    - "Storage indicator shows usage percent, used/total bytes on Settings page"
    - "Warning state shows yellow/orange indicator at 80%+"
    - "Blocking state shows red indicator at 95%+ with message that operations are blocked"
    - "Storage status only visible on Settings page (not always-visible indicator per CONTEXT)"
  artifacts:
    - path: "src/features/pwa/components/StorageIndicator.tsx"
      provides: "Visual storage usage indicator with percent, used/total, and status color"
      min_lines: 50
    - path: "src/routes/settings.tsx"
      provides: "Settings page with install button and storage indicator sections"
      contains: "StorageIndicator"
  key_links:
    - from: "src/features/pwa/components/StorageIndicator.tsx"
      to: "src/features/pwa/hooks/useStorageMonitor.ts"
      via: "useStorageMonitor hook for storage state"
      pattern: "useStorageMonitor"
    - from: "src/routes/settings.tsx"
      to: "src/features/pwa/components/StorageIndicator.tsx"
      via: "Component render in settings layout"
      pattern: "<StorageIndicator"
---

<objective>
Create Settings page with storage indicator showing usage percent, used/total bytes, and color-coded status. Storage status visible only on Settings page per CONTEXT decision.

Purpose: Provide users visibility into storage usage with warnings before quota exhaustion. Per CONTEXT.md: storage status visible in settings page only, not always-visible indicator.

Output: StorageIndicator component, Settings page with install and storage sections
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
@.planning/phases/05-pwa-polish-production/05-pwa-polish-production-01-SUMMARY.md
@.planning/phases/05-pwa-polish-production/05-pwa-polish-production-03-SUMMARY.md

# Existing components
@src/features/pwa/hooks/useStorageMonitor.ts — Storage monitoring hook
@src/features/pwa/hooks/usePWAInstall.ts — Install state hook
@src/features/pwa/components/InstallPrompt.tsx — Install prompt banner
</context>

<tasks>

<task type="auto">
  <name>Create StorageIndicator component with visual progress bar</name>
  <files>src/features/pwa/components/StorageIndicator.tsx</files>
  <action>
Create src/features/pwa/components/StorageIndicator.tsx:

1. Import useStorageMonitor hook and cn utility

2. Destructure from useStorageMonitor:
   - usage: { percent, used, total } or null
   - status: 'idle' | 'ok' | 'warning' | 'blocking'

3. Status color mapping:
   - idle: gray (muted-foreground)
   - ok: green (text-green-600, bg-green-500)
   - warning: yellow/orange (text-yellow-600, bg-yellow-500)
   - blocking: red (text-red-600, bg-red-500)

4. Component structure:
   - Card-based layout: border rounded p-4
   - Header: "Storage" heading with status badge
   - Progress bar: visual indicator with percentage
   - Details: used/total text display

5. Progress bar implementation:
   - Background div: bg-muted h-2 rounded-full overflow-hidden
   - Fill div: bg-[status-color] h-full transition-all duration-300
   - Width: based on usage.percent (0-100)

6. Status badge:
   - Small pill badge with status color
   - Text: "OK", "Warning", "Full" based on status
   - Icon optional: checkmark, alert, x icons

7. Details section:
   - Show used and total formatted bytes
   - Example: "125.5 MB / 5 GB"
   - Show percentage: "75% used"

8. Blocking state message:
   - When status === 'blocking', show warning message
   - "Storage nearly full. Some features may be limited."

9. Loading state:
   - When usage === null, show skeleton or "Checking..." text

Use existing UI components and patterns (card, badge, progress styles).
  </action>
  <verify>grep -q "useStorageMonitor" src/features/pwa/components/StorageIndicator.tsx && grep -q "progress\|percent" src/features/pwa/components/StorageIndicator.tsx</verify>
  <done>StorageIndicator component with progress bar, color-coded status, used/total display</done>
</task>

<task type="auto">
  <name>Create Settings page with install and storage sections</name>
  <files>src/routes/settings.tsx</files>
  <action>
Create or modify src/routes/settings.tsx (expanded from Plan 01):

1. Import InstallPrompt and StorageIndicator components

2. Page structure:
   - Page header: "Settings" (h1, text-2xl font-bold)
   - Container: max-w-2xl mx-auto p-4 space-y-6

3. Section 1: App Installation
   - Card with border rounded p-4
   - Heading: "App" (h2, text-lg font-semibold)
   - Description: "Install app to home screen for offline access" (p, text-sm text-muted-foreground)
   - Install button (from Plan 01 integration)
   - Show installation status if already installed

4. Section 2: Storage
   - Card with border rounded p-4
   - Heading: "Storage" (h2, text-lg font-semibold)
   - Render StorageIndicator component
   - Description: "Automatic cleanup keeps storage optimized" (p, text-sm text-muted-foreground)

5. Section 3: About (optional)
   - Card with app version info
   - App name, version number
   - Links to support or privacy policy if applicable

6. Layout pattern:
   - Each section in its own card
   - Consistent spacing between sections
   - Mobile-first responsive design

If settings.tsx already exists from Plan 01, add the Storage section and reorganize into cards.
  </action>
  <verify>grep -q "StorageIndicator\|Storage.*section" src/routes/settings.tsx && grep -q "Settings.*heading" src/routes/settings.tsx</verify>
  <done>Settings page with App (install) and Storage sections in card layout</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Settings page with install button and storage indicator showing usage percent</what-built>
  <how-to-verify>
1. Start dev server: npm run dev
2. Navigate to /settings route (or add Settings link to navigation)
3. Verify Settings page loads with card layout
4. Verify App section shows install button (if not installed)
5. Verify Storage section shows:
   - Storage usage percentage
   - Used/total bytes (e.g., "125.5 MB / 5 GB")
   - Color-coded progress bar (green/yellow/red)
   - Status badge (OK/Warning/Full)
6. Open Chrome DevTools > Application > Storage
7. Add some data to IndexedDB to test different states
8. Verify indicator updates when storage changes
9. Verify blocking state shows warning message at 95%+
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues with Settings page or storage indicator</resume-signal>
</task>

</tasks>

<verification>
Overall verification:
1. StorageIndicator uses useStorageMonitor hook for real-time data
2. Progress bar visually represents storage usage percentage
3. Color coding matches status: green (ok), yellow (warning), red (blocking)
4. Used/total display shows human-readable bytes
5. Settings page has App (install) and Storage sections
6. Storage status only visible on Settings page (not global indicator)
7. Blocking state shows appropriate warning message
</verification>

<success_criteria>
1. Users can view storage usage on Settings page
2. Visual indicator clearly shows usage percent
3. Color coding provides immediate status feedback
4. Used/total values give context for absolute storage
5. Install button and storage indicator coexist on same page
6. No always-visible storage indicator in header/nav
</success_criteria>

<output>
After completion, create .planning/phases/05-pwa-polish-production/05-pwa-polish-production-04-SUMMARY.md
</output>
