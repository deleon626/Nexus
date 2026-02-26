---
phase: 03-form-filling
plan: 06
type: execute
wave: 2
depends_on: [01, 02, 03, 05]
files_modified:
  - src/features/formFilling/components/fields/TextFieldFill.tsx
  - src/features/formFilling/components/fields/NumberFieldFill.tsx
  - src/features/formFilling/components/fields/DecimalFieldFill.tsx
  - src/features/formFilling/components/fields/SelectFieldFill.tsx
  - src/features/formFilling/components/fields/CheckboxFieldFill.tsx
  - src/features/formFilling/components/fields/PassFailFieldFill.tsx
  - src/features/formFilling/components/fields/DateFieldFill.tsx
  - src/features/formFilling/components/fields/TimeFieldFill.tsx
  - src/features/formFilling/components/fields/TextareaFieldFill.tsx
  - src/features/formFilling/components/fields/PhotoFieldFill.tsx
  - src/features/formFilling/components/fields/VoiceInputButton.tsx
  - src/features/formFilling/components/fields/FormFieldWrapper.tsx
autonomous: true
requirements: [FILL-01, FILL-02, FILL-03, FILL-04]

must_haves:
  truths:
    - All field types render with proper validation errors on blur
    - Voice input button shown on text, number, textarea fields (online only)
    - Photo field opens camera on tap, shows thumbnail after capture
    - Pass/Fail shows two large side-by-side buttons (PASS green / FAIL red)
    - Select field shows bottom sheet picker on mobile
    - Textarea auto-grows up to 5 visible lines
    - Required fields show asterisk (*) next to label
  artifacts:
    - path: "src/features/formFilling/components/fields/TextFieldFill.tsx"
      provides: "Text input with voice button"
      min_lines: 30
    - path: "src/features/formFilling/components/fields/NumberFieldFill.tsx"
      provides: "Number input with voice button"
      min_lines: 30
    - path: "src/features/formFilling/components/fields/PhotoFieldFill.tsx"
      provides: "Photo capture with thumbnail display"
      min_lines: 40
    - path: "src/features/formFilling/components/fields/PassFailFieldFill.tsx"
      provides: "Side-by-side pass/fail buttons"
      min_lines: 30
    - path: "src/features/formFilling/components/fields/VoiceInputButton.tsx"
      provides: "Mic button with recording state"
      min_lines: 20
    - path: "src/features/formFilling/components/fields/FormFieldWrapper.tsx"
      provides: "Field wrapper with label, asterisk, error display"
      min_lines: 40
  key_links:
    - from: "src/features/formFilling/components/fields/*.tsx"
      to: "src/features/formFilling/hooks/useVoiceInput.ts"
      via: "Import useVoiceInput for text/number/textarea fields"
      pattern: "useVoiceInput"
    - from: "src/features/formFilling/components/fields/PhotoFieldFill.tsx"
      to: "src/features/formFilling/hooks/usePhotoCapture.ts"
      via: "Import usePhotoCapture for camera capture"
      pattern: "usePhotoCapture|capturePhoto"
    - from: "src/features/formFilling/components/fields/FormFieldWrapper.tsx"
      to: "react-hook-form"
      via: "Use Controller pattern for custom field integration"
      pattern: "useController|Controller"
    - from: "All field components"
      to: "src/features/formBuilder/schema/validationSchemas.ts"
      via: "Import validateFieldValue for runtime validation"
      pattern: "validateFieldValue"
---

<objective>

Create form field components for all 10 field types with voice input, photo capture, and React Hook Form integration. Enables workers to fill forms with manual input, photos, and voice dictation.

Purpose: Field components are the core form filling interface. Each field type requires specific UX (voice for text, camera for photos, bottom sheet for selects). Validation errors appear on blur per CONTEXT.md.

Output: 10 field components (text, number, decimal, date, time, select, checkbox, passFail, textarea, photo) with voice/photo support and FormFieldWrapper.
</objective>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-form-filling/03-CONTEXT.md
@.planning/phases/03-form-filling/03-RESEARCH.md
@.planning/phases/03-form-filling/03-form-filling-01-PLAN.md
@.planning/phases/03-form-filling/03-form-filling-02-PLAN.md
@.planning/phases/03-form-filling/03-form-filling-03-PLAN.md
@.planning/phases/03-form-filling/03-form-filling-05-PLAN.md
@src/features/formBuilder/types.ts
@src/features/formBuilder/schema/validationSchemas.ts
---
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create FormFieldWrapper component</name>
  <files>src/features/formFilling/components/fields/FormFieldWrapper.tsx</files>
  <action>
    Create src/features/formFilling/components/fields/FormFieldWrapper.tsx with:

    1. Props:
       - field: FormField (from formBuilder types)
       - children: React.ReactNode (field input component)
       - error?: string (validation error message)
       - required: boolean

    2. Render:
       - Label with asterisk (*) if required: {field.label} {required && <span className="text-red-500">*</span>}
       - Help text if field.helpText exists
       - Children (input component)
       - Error message in red if error exists

    3. Styling:
       - Use Tailwind classes for spacing, text colors
       - Error text: text-sm text-red-500 mt-1
       - Help text: text-sm text-gray-500 mt-1
       - Label: text-sm font-medium text-gray-700 mb-1

    Reference: Follow existing field component patterns from Phase 2 (TextField, NumberField) for consistency.
  </action>
  <verify>grep -q "FormFieldWrapper" src/features/formFilling/components/fields/FormFieldWrapper.tsx && grep -q "text-red-500" src/features/formFilling/components/fields/FormFieldWrapper.tsx</verify>
  <done>FormFieldWrapper component created with label, asterisk, help text, and error display</done>
</task>

<task type="auto">
  <name>Task 2: Create VoiceInputButton component</name>
  <files>src/features/formFilling/components/fields/VoiceInputButton.tsx</files>
  <action>
    Create src/features/formFilling/components/fields/VoiceInputButton.tsx with:

    1. Props:
       - isRecording: boolean
       - isTranscribing: boolean
       - isOnline: boolean
       - onStart: () => void
       - onStop: () => void
       - disabled?: boolean

    2. Render:
       - Mic icon from lucide-react (Mic icon, MicOff when recording)
       - Button disabled when offline or disabled prop true
       - Visual feedback:
         - "Listening..." text when isRecording true
         - Animated waveform when recording (CSS pulse or simple dots animation)
         - Grayed out when offline with "Offline" tooltip

    3. Online gating:
       - If !isOnline, show tooltip: "Voice requires internet" per CONTEXT.md
       - Button disabled when offline

    4. Styling:
       - Rounded icon button
       - Recording state: red/pink color with pulse animation
       - Idle state: gray color
       - Absolute positioned inline with input (right side)

    Reference: CONTEXT.md specifies "tap mic icon to start, tap again to stop" with animated waveform.
  </action>
  <verify>grep -q "VoiceInputButton" src/features/formFilling/components/fields/VoiceInputButton.tsx && grep -q "isRecording" src/features/formFilling/components/fields/VoiceInputButton.tsx</verify>
  <done>VoiceInputButton component created with mic icon, recording state, and online gating</done>
</task>

<task type="auto">
  <name>Task 3: Create text, number, decimal field components with voice</name>
  <files>src/features/formFilling/components/fields/TextFieldFill.tsx, src/features/formFilling/components/fields/NumberFieldFill.tsx, src/features/formFilling/components/fields/DecimalFieldFill.tsx</files>
  <action>
    Create three field components with voice input integration:

    1. TextFieldFill.tsx:
       - Use useController from react-hook-form
       - Input type="text"
       - VoiceInputButton inline on right
       - useVoiceInput hook for recording
       - On transcription complete: onChange(transcribedText)

    2. NumberFieldFill.tsx:
       - Input type="number"
       - VoiceInputButton inline
       - Parse transcription to number (handle "five" -> 5 if needed, or just use raw text for user to correct)

    3. DecimalFieldFill.tsx:
       - Input type="number" with step calculated from field.validation?.precision
       - VoiceInputButton inline

    All three components:
       - Use FormFieldWrapper for label/error display
       - Pass field.required to wrapper
       - Show error from fieldState.error
       - Use mode: 'onBlur' for validation timing per CONTEXT.md

    Reference: 03-RESEARCH.md Pattern 1 "React Hook Form with Controller for Custom Fields" example.
  </action>
  <verify>grep -q "TextFieldFill" src/features/formFilling/components/fields/TextFieldFill.tsx && grep -q "useController" src/features/formFilling/components/fields/TextFieldFill.tsx && grep -q "VoiceInputButton" src/features/formFilling/components/fields/TextFieldFill.tsx</verify>
  <done>Text, number, decimal field components created with voice input integration</done>
</task>

<task type="auto">
  <name>Task 4: Create PhotoFieldFill component</name>
  <files>src/features/formFilling/components/fields/PhotoFieldFill.tsx</files>
  <action>
    Create src/features/formFilling/components/fields/PhotoFieldFill.tsx with:

    1. Use useController from react-hook-form

    2. Render states:
       - Empty: "Tap to capture photo" with camera icon
       - Has photo: Show rounded thumbnail (small, 60x60 or similar)
       - Tap thumbnail to retake per CONTEXT.md

    3. Capture flow:
       - On tap: call usePhotoCapture().capturePhoto()
       - On success: onChange(base64String)
       - Show loading state during capture

    4. Thumbnail display:
       - Small rounded image with object-cover
       - Border for visual separation
       - Replace icon when photo exists

    5. Use FormFieldWrapper for label/error

    Reference: CONTEXT.md specifies "single photo per photo field", "tap attached thumbnail to retake", "attached photos appear as small rounded thumbnail". Use usePhotoCapture from Plan 03.
  </action>
  <verify>grep -q "PhotoFieldFill" src/features/formFilling/components/fields/PhotoFieldFill.tsx && grep -q "usePhotoCapture" src/features/formFilling/components/fields/PhotoFieldFill.tsx && grep -q "capturePhoto" src/features/formFilling/components/fields/PhotoFieldFill.tsx</verify>
  <done>PhotoFieldFill component created with camera capture and thumbnail display</done>
</task>

<task type="auto">
  <name>Task 5: Create PassFailFieldFill component</name>
  <files>src/features/formFilling/components/fields/PassFailFieldFill.tsx</files>
  <action>
    Create src/features/formFilling/components/fields/PassFailFieldFill.tsx with:

    1. Use useController from react-hook-form

    2. Render two large side-by-side buttons:
       - PASS button: green background (bg-green-600), white text
       - FAIL button: red background (bg-red-600), white text
       - Use field.passLabel and field.failLabel if provided, else "Pass"/"Fail"
       - Selected state: darker shade or ring indicator

    3. Interaction:
       - Tap PASS: onChange('pass')
       - Tap FAIL: onChange('fail')
       - Radio button behavior (only one selected)

    4. Styling:
       - Large touch targets (min-height 48px per mobile guidelines)
       - Equal width buttons (flex-1)
       - Gap between buttons

    5. Use FormFieldWrapper for label/error

    Reference: CONTEXT.md specifies "two large side-by-side buttons (PASS green / FAIL red)".
  </action>
  <verify>grep -q "PassFailFieldFill" src/features/formFilling/components/fields/PassFailFieldFill.tsx && grep -q "bg-green-600" src/features/formFilling/components/fields/PassFailFieldFill.tsx && grep -q "bg-red-600" src/features/formFilling/components/fields/PassFailFieldFill.tsx</verify>
  <done>PassFailFieldFill component created with side-by-side green/red buttons</done>
</task>

<task type="auto">
  <name>Task 6: Create remaining field components</name>
  <files>src/features/formFilling/components/fields/SelectFieldFill.tsx, src/features/formFilling/components/fields/CheckboxFieldFill.tsx, src/features/formFilling/components/fields/DateFieldFill.tsx, src/features/formFilling/components/fields/TimeFieldFill.tsx, src/features/formFilling/components/fields/TextareaFieldFill.tsx</files>
  <action>
    Create five remaining field components:

    1. SelectFieldFill.tsx:
       - Bottom sheet picker for mobile
       - Use shadcn/ui Select component or native <select>
       - Map field.options to select options
       - Default: "Select an option..." placeholder

    2. CheckboxFieldFill.tsx:
       - Use shadcn/ui Checkbox component
       - Map field.options to checkboxes
       - Return array of selected values
       - Vertical stack layout

    3. DateFieldFill.tsx:
       - Input type="date"
       - Min/max from field.validation

    4. TimeFieldFill.tsx:
       - Input type="time"
       - Min/max from field.validation

    5. TextareaFieldFill.tsx:
       - Textarea element
       - Auto-grow up to 5 visible lines per CONTEXT.md
       - VoiceInputButton inline (same as TextFieldFill)
       - Rows attribute from field.rows or default 3

    All components:
       - Use useController from react-hook-form
       - Use FormFieldWrapper for label/error
       - Pass field.required to wrapper

    Reference: Follow existing Phase 2 field component patterns for consistency. CONTEXT.md specifies bottom sheet picker for select, auto-grow for textarea.
  </action>
  <verify>grep -q "SelectFieldFill" src/features/formFilling/components/fields/SelectFieldFill.tsx && grep -q "TextareaFieldFill" src/features/formFilling/components/fields/TextareaFieldFill.tsx && grep -q "CheckboxFieldFill" src/features/formFilling/components/fields/CheckboxFieldFill.tsx</verify>
  <done>Select, checkbox, date, time, textarea field components created with proper input types</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. FormFieldWrapper component renders label with asterisk for required fields
2. VoiceInputButton shows mic icon, recording state, online gating
3. TextFieldFill, NumberFieldFill, DecimalFieldFill have voice button
4. PhotoFieldFill has camera capture with thumbnail display
5. PassFailFieldFill has green/red side-by-side buttons
6. All components use useController for React Hook Form integration
7. Validation errors show on blur (mode: 'onBlur')
8. All 10 field types have corresponding Fill components
</verification>

<success_criteria>
1. All field components integrate with React Hook Form via Controller
2. Voice input available on text, number, textarea fields when online
3. Photo field opens camera, shows thumbnail, allows retake
4. Pass/Fail uses large colored buttons
5. Required fields show asterisk marker
6. Validation errors appear on blur
7. Components follow existing Phase 2 patterns for consistency
</success_criteria>

<output>
After completion, create `.planning/phases/03-form-filling/03-form-filling-06-SUMMARY.md`
</output>
