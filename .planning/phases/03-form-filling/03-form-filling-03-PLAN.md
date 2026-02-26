---
phase: 03-form-filling
plan: 03
type: execute
wave: 1
depends_on: [01, 02]
files_modified:
  - src/features/formFilling/hooks/usePhotoCapture.ts
  - package.json
autonomous: true
requirements: [FILL-02]

must_haves:
  truths:
    - Worker can tap photo field to open camera immediately (no native app switch)
    - Captured photo is compressed to ~500KB before storage
    - Photo works fully offline (no network required)
    - Compressed photo stored as base64 in form state
    - Rear camera used by default on mobile devices
  artifacts:
    - path: "src/features/formFilling/hooks/usePhotoCapture.ts"
      provides: "Camera capture with ~500KB compression"
      min_lines: 50
      exports: ["usePhotoCapture"]
    - path: "package.json"
      provides: "Photo compression dependency"
      contains: "compressorjs"
  key_links:
    - from: "src/features/formFilling/hooks/usePhotoCapture.ts"
      to: "package.json"
      via: "Import Compressor from compressorjs"
      pattern: "import.*Compressor.*from.*compressorjs"
    - from: "src/features/formFilling/hooks/usePhotoCapture.ts"
      to: "src/features/formFilling/components/fields/PhotoFieldFill.tsx" (Plan 06)
      via: "Export capturePhoto function for field component"
      pattern: "capturePhoto|capturePhotoPromise"
---

<objective>

Create photo capture hook with camera access and compression. Enables workers to attach photos to form fields with offline support and file size optimization.

Purpose: Photos are critical for QC records (visual evidence). Compression prevents IndexedDB quota issues. Offline support is required for factory floor use.

Output: usePhotoCapture hook with getUserMedia camera access, Compressor.js integration, base64 output.
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
@src/features/formFilling/types.ts
---
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install compressorjs dependency</name>
  <files>package.json</files>
  <action>
    1. Run: npm install compressorjs
    2. Run: npm install --save-dev @types/compressorjs

    Do NOT install browser-image-compression. Research recommends compressorjs for simplicity and cross-browser compatibility.

    Reference: 03-RESEARCH.md "Don't Hand-Roll" table - compressorjs handles EXIF, quality tuning, cross-browser issues.
  </action>
  <verify>grep -q "compressorjs" package.json && grep -q "@types/compressorjs" package.json</verify>
  <done>compressorjs and @types/compressorjs installed</done>
</task>

<task type="auto">
  <name>Task 2: Create usePhotoCapture hook</name>
  <files>src/features/formFilling/hooks/usePhotoCapture.ts</files>
  <action>
    Create src/features/formFilling/hooks/usePhotoCapture.ts with:

    1. Hook signature: usePhotoCapture()

    2. State:
       - isCapturing: boolean (camera active state)
       - error: string | null (capture error message)
       - previewStream: MediaStream | null (for preview if needed, but CONTEXT says direct capture)

    3. capturePhoto() function:
       - Call navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
       - Create video element, set srcObject to stream, await video.play()
       - Create canvas with video.videoWidth x video.videoHeight
       - Draw video frame to canvas: ctx.drawImage(video, 0, 0)
       - Convert to blob: canvas.toBlob(callback, 'image/jpeg', 0.8)
       - Cleanup: stream.getTracks().forEach(track => track.stop())

    4. Compression with Compressor.js:
       - new Compressor(blob, { quality: 0.6, maxWidth: 1920, maxHeight: 1920, success(result) {...} })
       - Convert result to base64: FileReader.readAsDataURL(result)
       - Return base64 string

    5. Error handling:
       - Wrap getUserMedia in try/catch
       - Handle permission denied, no camera errors
       - Set error state for display

    6. Import from: compressorjs (Compressor)

    Reference: 03-RESEARCH.md Pattern 3 "Photo Capture with Compression" example. Pitfall 1 warns about iOS canvas limits - maxWidth: 1920 prevents crashes.

    Note: CONTEXT.md specifies direct capture flow (tap field opens camera immediately), no preview screen. Preview with Retake/Attach is in Plan 04 field component.
  </action>
  <verify>grep -q "usePhotoCapture" src/features/formFilling/hooks/usePhotoCapture.ts && grep -q "getUserMedia" src/features/formFilling/hooks/usePhotoCapture.ts && grep -q "Compressor" src/features/formFilling/hooks/usePhotoCapture.ts</verify>
  <done>usePhotoCapture hook created with camera access and ~500KB compression</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. compressorjs dependency installed in package.json
2. usePhotoCapture hook exports capturePhoto function
3. Camera uses facingMode: 'environment' for rear camera
4. Compression settings: quality 0.6, maxWidth 1920, maxHeight 1920
5. Output is base64 string for offline storage
6. Error handling covers permission denied and no camera scenarios
</verification>

<success_criteria>
1. Photo capture works offline (no network calls in capture flow)
2. Compression targets ~500KB per 03-RESEARCH.md recommendation
3. Base64 output compatible with form state storage
4. Rear camera default on mobile devices
5. Error state set when camera unavailable
</success_criteria>

<output>
After completion, create `.planning/phases/03-form-filling/03-form-filling-03-SUMMARY.md`
</output>
