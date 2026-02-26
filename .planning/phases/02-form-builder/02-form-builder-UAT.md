---
status: testing
phase: 02-form-builder
source: [02-form-builder-08-SUMMARY.md, 02-form-builder-09-SUMMARY.md, 02-form-builder-10-SUMMARY.md, 02-form-builder-11-SUMMARY.md]
started: 2026-02-27T04:00:00Z
updated: 2026-02-27T04:15:00Z
---

## Current Test

number: 1
name: View Form Builder Page
expected: |
  Navigate to /admin/builder. Page shows 3-panel layout: left sidebar with "Add Fields" header and field type cards, center canvas area, right panel with field editor.
awaiting: user response (retry after fix)

## Tests

### 1. View Form Builder Page
expected: Navigate to /admin/builder. Page shows 3-panel layout: left sidebar with "Add Fields" header and field type cards, center canvas area, right panel with field editor.
result: issue
reported: "Vite error: Failed to resolve import '@/lib/convex/_generated' from useTemplatePersistence.ts"
severity: blocker

### 2. Sidebar Shows 10 Field Types
expected: Left sidebar displays 10 clickable field type cards with icons: Text, Number, Decimal, Date, Time, Select, Checkbox, Pass/Fail, Textarea, Photo. Each shows icon, label, and brief description.
result: pending

### 3. Add Field to Canvas
expected: Click any field type card (e.g., "Text"). Field appears in center canvas with drag handle (grip icon), field label, and field type indicator. Field is selected (shows ring/border highlight).
result: pending

### 4. Drag to Reorder Fields
expected: Add 2-3 fields to canvas. Drag a field by its grip handle to a new position. Field moves to new position smoothly. Order persists.
result: pending

### 5. Field Selection Shows Editor
expected: Click on any field in the canvas. Right panel shows Field Editor with that field's properties: Label input, Placeholder input, Help Text input, Required checkbox.
result: pending

### 6. Type-Specific Validation Editor
expected: Select a Text field - see minLength, maxLength, pattern inputs. Select a Number field - see min, max inputs. Select a Select field - see Options array editor with Add/Remove buttons.
result: pending

### 7. Update Field Properties
expected: Change a field's label text. New label appears immediately in the canvas. Change Required checkbox. Asterisk (*) appears/disappears next to field label.
result: pending

### 8. Remove Field
expected: Click "Remove Field" button in editor panel. Field disappears from canvas. Selection clears.
result: pending

### 9. Template Name Input
expected: Top bar shows "Template name" input field. Type a name. "Unsaved changes" indicator appears.
result: pending

### 10. Save Template
expected: Click "Save" button. If Convex is configured, template saves and success message appears. If not configured, action logs to console without error.
result: pending

### 11. Publish Template
expected: Click "Publish" button. Button toggles to "Unpublish". Version number displays (e.g., "v1"). If Convex configured, template is published.
result: pending

### 12. Templates List Panel
expected: Toggle templates list panel. Shows list of saved templates (or empty state). Each template shows name, version, published status badge.
result: pending

## Summary

total: 12
passed: 0
issues: 1
pending: 11
skipped: 0

## Gaps

- truth: "Navigate to /admin/builder. Page shows 3-panel layout"
  status: failed
  reason: "User reported: Vite error: Failed to resolve import '@/lib/convex/_generated'"
  severity: blocker
  test: 1
  root_cause: "Wrong import path and missing API export in Convex generated files"
  artifacts:
    - path: "src/features/formBuilder/hooks/useTemplatePersistence.ts"
      issue: "Import used @/lib/convex/_generated instead of ../../../convex/_generated/api"
    - path: "convex/_generated/api.ts"
      issue: "Only had type declaration, no actual api object export"
    - path: "convex/functions.ts"
      issue: "Should be formTemplates.ts for Convex file-based routing"
  missing:
    - "Fix import path to ../../../convex/_generated/api"
    - "Add actual api object export"
    - "Rename functions.ts to formTemplates.ts"
