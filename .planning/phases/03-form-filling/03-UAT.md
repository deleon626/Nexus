---
status: testing
phase: 03-form-filling
source: 03-form-filling-01-SUMMARY.md, 03-form-filling-02-SUMMARY.md, 03-form-filling-03-SUMMARY.md, 03-form-filling-04-SUMMARY.md, 03-form-filling-05-SUMMARY.md, 03-form-filling-06-SUMMARY.md, 03-form-filling-07-SUMMARY.md, 03-form-filling-08-SUMMARY.md, 03-form-filling-09-SUMMARY.md
started: 2025-03-03T00:00:00Z
updated: 2025-03-03T00:01:00Z
---

## Current Test

number: 2
name: Batch Number Prompt
expected: |
  Click on any form. A modal should appear prompting for batch number.
  - Batch number is required to proceed
  - Enter key submits the batch number
  - Modal closes after entering valid batch number
awaiting: user response

## Tests

### 1. Form List Access and Display
expected: Navigate to /worker/forms. Search bar at top filters forms in real-time. List shows available forms. Recent forms (up to 3) appear at top with "Recent" indicator. Draft badge shows count of existing drafts per form. Offline indicator appears for forms cached locally.
result: pass

### 2. Batch Number Prompt
expected: Click on any form. A modal appears prompting for batch number. Batch number is required to proceed. Enter key submits the batch number. Modal closes after entering valid batch number.
result: [pending]

### 3. Draft Recovery Flow
expected: Select a form that has existing drafts. DraftPickerModal appears showing list of drafts with relative timestamps (e.g., "5 minutes ago", "2 hours ago"). Can click "Resume" on a draft to load it, or "Start New" to create fresh entry.
result: [pending]

### 4. Progress Bar Display
expected: While filling form, progress bar visible at top showing "X/Y fields filled" (counts required fields only). Bar updates visually as fields are completed. Smooth transitions when progress changes.
result: [pending]

### 5. Required Field Indicators
expected: Required fields show red asterisk (*) next to label. Optional fields have no asterisk. Visual distinction is clear.
result: [pending]

### 6. Text Field with Voice Input
expected: Text field has microphone icon button next to it. When online, clicking mic button starts recording - button pulses and shows "Listening...". Recording auto-stops after 30 seconds. Transcription populates the field directly (no confirmation step).
result: [pending]

### 7. Number Field with Voice Input
expected: Number field has microphone button. Voice recognition handles Indonesian and English number words (e.g., "satu", "dua", "one", "two"). Transcribed number appears in the field.
result: [pending]

### 8. Voice Input Offline Gating
expected: When device is offline, microphone button is disabled. Hovering or tapping shows "Voice input requires internet connection" message. Button appears grayed out or with disabled state.
result: [pending]

### 9. Photo Field Capture
expected: Photo field has camera button. Clicking opens camera (rear camera default on mobile). Captured photo shows as 64x64 pixel thumbnail. Clicking X on thumbnail allows retake. Photo compressed to ~500KB for offline storage.
result: [pending]

### 10. Pass/Fail Field
expected: Pass/Fail field shows two side-by-side buttons. Left button is green with Check icon (Pass). Right button is red with X icon (Fail). Buttons have custom labels if configured (e.g., "OK/NG"). Selecting one highlights it.
result: [pending]

### 11. Select Field (Native Picker)
expected: Select field shows dropdown. On mobile, opens native bottom sheet picker. Shows all configured options. Selected option appears in field.
result: [pending]

### 12. Checkbox Field (Multiple Selection)
expected: Checkbox field shows all options as vertically stacked checkboxes. Can select multiple options. All selected values are stored.
result: [pending]

### 13. Date and Time Fields
expected: Date field opens native date picker. Time field opens native time picker. Selected values appear in field. Min/max validation enforced if configured.
result: [pending]

### 14. Field Validation on Blur
expected: Tab out of a required field without filling. Validation error appears below field in red. Error message describes what's wrong (e.g., "This field is required"). Page scrolls to first error if errors exist.
result: [pending]

### 15. Draft Auto-Save
expected: Fill some fields and wait 30 seconds. Draft auto-saves to IndexedDB. Close page and reopen. Draft is available for recovery in DraftPickerModal. Draft name includes date (e.g., "Draft - Mar 03").
result: [pending]

### 16. Submission Confirmation Summary
expected: Click "Submit" button. SubmissionSummary modal appears showing all field values in review format. Shows batch number entered at start. Can click "Edit" to return to form, or "Confirm" to finalize submission.
result: [pending]

### 17. Success Screen
expected: After confirming submission, success screen appears with animated checkmark icon. "Done" button returns to form list. Submission is saved locally and queued for sync.
result: [pending]

### 18. Submit and Start New Flow
expected: In confirmation modal, click "Submit & Start New" instead of just "Submit". Submission saves immediately. Form clears. Batch number prompt appears for next batch (same form template).
result: [pending]

### 19. Complete End-to-End Flow
expected: Full flow works: Select form → Enter batch → Fill all fields → Submit → Confirm → Success → Back to list. Data persists correctly throughout. No errors in flow.
result: [pending]

## Summary

total: 19
passed: 1
issues: 0
pending: 18
skipped: 0

## Gaps

[none yet]
