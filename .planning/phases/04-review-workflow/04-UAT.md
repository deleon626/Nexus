---
status: testing
phase: 04-review-workflow
source: 04-review-workflow-01-SUMMARY.md, 04-review-workflow-02-SUMMARY.md, 04-review-workflow-03-SUMMARY.md, 04-review-workflow-04-SUMMARY.md, 04-review-workflow-05-SUMMARY.md
started: 2026-02-27T14:23:33Z
updated: 2026-02-27T14:23:33Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Reviewer Dashboard — Pending Submissions Table
expected: |
  Navigate to the reviewer dashboard. A table appears showing pending submissions with columns: Batch, Form, Worker, Submitted (relative time), Status, and an Actions column with a "Review" button per row. If no submissions exist yet, an empty state message shows.
awaiting: user response

## Tests

### 1. Reviewer Dashboard — Pending Submissions Table
expected: Navigate to the reviewer dashboard. A table appears showing pending submissions with columns: Batch, Form, Worker, Submitted (relative time), Status, and an Actions column with a "Review" button per row. If no submissions exist yet, an empty state message shows.
result: [pending]

### 2. Status Badge Colors
expected: Each submission row shows a colored badge for its status — yellow for Pending, green for Approved, red for Rejected — with matching icons (clock, checkmark, X).
result: [pending]

### 3. Open Review Dialog
expected: Clicking the "Review" button on any submission row opens a modal dialog showing the submission's metadata (batch name, form name, worker, submitted time) and all form field values as key-value pairs.
result: [pending]

### 4. Photo Viewing in Dialog
expected: If a submission contains photos, they appear as thumbnails in a grid inside the dialog. Clicking a photo opens it full-size in a new browser tab.
result: [pending]

### 5. Approve a Submission
expected: Inside the review dialog, clicking "Approve" (with or without an optional comment) triggers the approval. The dialog closes, the submission disappears from the pending table (Convex reactivity updates in real-time), and the dashboard refreshes automatically.
result: [pending]

### 6. Reject Requires a Comment
expected: Inside the review dialog, the "Reject" button is disabled until text is entered in the comment field. Once a comment is typed, "Reject" becomes enabled. Clicking it rejects the submission and the dashboard updates in real-time.
result: [pending]

### 7. Worker Status View — Recent Submissions
expected: On the worker's forms page (/worker/forms), a list of the worker's recent submissions appears above the form list showing batch name, form name, submitted time, and current status badge. If a reviewer approves/rejects a submission, the status badge updates automatically without page refresh.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
