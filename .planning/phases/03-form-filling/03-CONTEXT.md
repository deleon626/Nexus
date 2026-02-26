# Phase 3: Form Filling - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Workers filling quality control forms on factory floor — mobile-first data entry with manual input, photos, and voice dictation. Form creation (Phase 2) and review (Phase 4) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Form Selection UX
- Flat list display with form name, version number, and last updated date
- Recent forms (3 most recent) shown at top, sorted by last filled
- Search bar always visible at top, filters as you type
- Tap form to fill directly
- Batch number prompt appears immediately after form selection (before showing fields)
- Draft indicator badge on forms that have in-progress drafts
- When tapping form with existing drafts: show draft picker modal (resume or start new)
- Unlimited drafts per form allowed
- Offline: show only cached forms with clear indicator
- Empty state: informative message "No forms published yet" with contact suggestion

### Field Entry Flow
- Single scrolling page layout (all fields visible)
- Progress bar at top showing % complete or X/Y fields filled
- Asterisk (*) marker next to required field labels
- Validation errors appear on blur (when field loses focus)

### Photo Capture
- Single photo per photo field
- Direct capture flow: tap field opens camera immediately
- Preview screen after capture with Retake/Attach buttons
- Tap attached thumbnail to retake
- Compress photos to ~500KB before storing
- Use system default flash setting (no custom toggle)
- Full offline support required — photos must work without internet
- Attached photos appear as small rounded thumbnail in field area

### Voice Input UX
- Tap-to-speak activation (tap mic icon to start, tap again to stop)
- Voice available on all text and number fields
- Visual feedback: "Listening..." with animated waveform while recording
- Live streaming transcription (text appears as spoken)
- Online only — show clear message when offline
- Transcription errors: toast notification explaining issue
- Language support: Indonesian and English
- Transcription goes directly to field (no confirmation step)

### Draft Auto-save
- Auto-save every 30 seconds automatically
- Draft names auto-generated: "Form Name - Batch 123 - Feb 27"
- Draft recovery: prompt on app open if drafts exist
- Drafts expire and auto-delete after 7 days

### Submission Flow
- Validation errors: block submit, scroll to first error, show summary of issues
- Confirmation: summary modal before final submit
- Success: success screen with checkmark and "Done" button, returns to form list
- Bottom actions: Submit button + "Submit & Start New" button

### Error Recovery
- Offline submit: queue submission for sync when online
- Auto-retry: 3 attempts with exponential backoff (5s, 15s, 45s delays)
- Repeated failure: keep as pending in queue with manual retry button
- Status tracking: toast notifications + queue view accessible from header

### Other Field Types
- Select/Dropdown: bottom sheet picker with options
- Checkbox: standard checkbox with label
- Pass/Fail: two large side-by-side buttons (PASS green / FAIL red)
- Textarea: auto-grow up to 5 visible lines

### Claude's Discretion
- Exact spacing and typography throughout
- Loading skeleton designs
- Error state visual styling
- Transition animations between screens
- Exact progress bar styling

</decisions>

<specifics>
## Specific Ideas

- Mobile-first PWA for factory floor workers
- Indonesian and English language support required
- Must work fully offline (factory may have poor connectivity)
- Factory floor context: may have dim lighting, workers wearing gloves
- Simple and direct interactions preferred over complex flows

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-form-filling*
*Context gathered: 2026-02-27*
