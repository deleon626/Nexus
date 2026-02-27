---
phase: 04-review-workflow
plan: 02
type: execute
wave: 2
depends_on:
  - 04-review-workflow-01
files_modified:
  - src/components/ui/table.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/badge.tsx
  - package.json
autonomous: true
requirements: []  # UI primitives only - actual components in Plans 03-05
user_setup: []

must_haves:
  truths:
    - "Developer can use shadcn/ui Table component"
    - "Developer can use shadcn/ui Dialog component"
    - "Developer can use shadcn/ui Badge component"
  artifacts:
    - path: "src/components/ui/table.tsx"
      provides: "Table component for data display"
      exports: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell"]
    - path: "src/components/ui/dialog.tsx"
      provides: "Dialog modal component"
      exports: ["Dialog", "DialogContent", "DialogHeader", "DialogTitle", "DialogFooter"]
    - path: "src/components/ui/badge.tsx"
      provides: "Badge component for status display"
      exports: ["Badge", "badgeVariants"]
    - path: "package.json"
      provides: "@tanstack/react-table dependency"
  key_links:
    - from: "package.json"
      to: "@tanstack/react-table"
      via: "npm install"
      pattern: "@tanstack/react-table"
---

<objective>
Install required shadcn/ui components (Table, Dialog, Badge) and @tanstack/react-table dependency for the reviewer dashboard.

Purpose: Provide UI primitives for the review dashboard data table and modal dialogs.
Output: Three new shadcn/ui components and one npm dependency.
</objective>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/04-review-workflow/04-CONTEXT.md
@.planning/phases/04-review-workflow/04-RESEARCH.md
@src/components/ui/button.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install @tanstack/react-table and add shadcn/ui components</name>
  <files>package.json, src/components/ui/table.tsx, src/components/ui/dialog.tsx, src/components/ui/badge.tsx</files>
  <action>
Install the @tanstack/react-table dependency and create the three required shadcn/ui components.

**Step 1: Install npm dependency**
```bash
npm install @tanstack/react-table
```

**Step 2: Create src/components/ui/table.tsx**
Create a shadcn/ui-style Table component. Use the standard shadcn/ui v4 Table pattern:
- Export Table, TableHeader, TableBody, TableRow, TableHead, TableCell components
- Use cn() utility from '@/lib/utils' for class merging
- Apply Tailwind classes for borders, padding, alignment
- Table container: `w-full caption-bottom text-sm`
- TableHeader: `[&_tr]:border-b`
- TableBody: `[&_tr:last-child]:border-0`
- TableRow: `border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted`
- TableHead: `h-12 px-4 text-left align-middle font-medium text-muted-foreground`
- TableCell: `p-4 align-middle [&:has([role=checkbox])]:pr-0`

**Step 3: Install @radix-ui/react-dialog and create src/components/ui/dialog.tsx**
```bash
npm install @radix-ui/react-dialog
```

Create a shadcn/ui-style Dialog component using @radix-ui/react-dialog:
- Export Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
- DialogContent should have:
  - `max-w-lg` default width (overrideable via className)
  - Fixed padding, rounded corners, shadow
  - Close button (X icon from lucide-react)
- DialogOverlay for backdrop with `bg-black/80`

**Step 4: Create src/components/ui/badge.tsx**
Create a shadcn/ui-style Badge component using class-variance-authority:
- Import cva from 'class-variance-authority' and cn from '@/lib/utils'
- Define variants: default, secondary, destructive, outline
- Define colors for status: yellow/gray for pending, green for approved, red for rejected (per CONTEXT.md)
- Export Badge component and badgeVariants

Reference the existing src/components/ui/button.tsx for the project's shadcn/ui style patterns.
  </action>
  <verify>
    <automated>test -f src/components/ui/table.tsx && test -f src/components/ui/dialog.tsx && test -f src/components/ui/badge.tsx && grep -q "@tanstack/react-table" package.json</automated>
    <manual>Import each component in a test file to verify TypeScript compiles</manual>
  </verify>
  <done>All three components created and @tanstack/react-table installed</done>
</task>

</tasks>

<verification>
After task completes:
1. Verify package.json contains @tanstack/react-table
2. Verify all three component files exist and export correctly
3. Run `npm run check-types` to verify TypeScript compilation
</verification>

<success_criteria>
- [ ] @tanstack/react-table added to package.json dependencies
- [ ] @radix-ui/react-dialog added to package.json dependencies
- [ ] src/components/ui/table.tsx exists with Table, TableHeader, TableBody, TableRow, TableHead, TableCell exports
- [ ] src/components/ui/dialog.tsx exists with Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle exports
- [ ] src/components/ui/badge.tsx exists with Badge export and variants
- [ ] TypeScript compilation passes with `npm run check-types`
</success_criteria>

<output>
After completion, create `.planning/phases/04-review-workflow/04-review-workflow-02-SUMMARY.md`
</output>
