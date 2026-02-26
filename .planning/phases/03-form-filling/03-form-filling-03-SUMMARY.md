---
phase: 03-form-filling
plan: 03
title: "Photo Capture Hook with Camera Access and Compression"
one-liner: "Browser-based camera capture with Compressor.js for ~500KB JPEG compression, base64 output for offline storage"
subsystem: form-filling
tags: [photo-capture, offline, compression, hooks, camera]
completed: 2026-02-26T19:34:30Z

dependency_graph:
  requires:
    - id: "compressorjs"
      provided_by: "npm"
      reason: "Photo compression to prevent IndexedDB quota issues"
    - id: "getUserMedia API"
      provided_by: "browser"
      reason: "Direct camera access without native app switch"
  provides:
    - id: "usePhotoCapture hook"
      used_by: "PhotoFieldFill component (Plan 06)"
      reason: "Camera capture and compression for photo fields"
  affects:
    - "Form filling UX - enables photo attachment to form fields"

tech_stack:
  added:
    - package: "compressorjs"
      version: "^1.2.1"
      purpose: "Photo compression to ~500KB target"
      types_included: true
    - package: "getUserMedia API"
      provided_by: "browser"
      purpose: "Camera access with rear camera preference"
  patterns:
    - "React hooks pattern for reusable stateful logic"
    - "Promise-based API for async operations"
    - "TypeScript generics and discriminated unions"
    - "Cleanup refs for resource management (MediaStream)"

key_files:
  created:
    - path: "src/features/formFilling/hooks/usePhotoCapture.ts"
      lines: 314
      exports: ["usePhotoCapture", "formatBytes", "base64ToPure", "getMimeTypeFromBase64"]
      description: "Camera capture hook with compression, error handling, and base64 output"
    - path: "src/features/formFilling/types.ts"
      description: "Updated to re-export FormField and PhotoCapture types"
  modified:
    - path: "package.json"
      lines_added: 1
      description: "Added compressorjs dependency"

decisions:
  - id: "photo-compression-library"
    context: "Plan 03 requires photo compression to ~500KB for offline storage"
    decision: "Use Compressor.js library instead of browser-image-compression"
    rationale: "Simpler API, smaller bundle size, handles EXIF and cross-browser issues automatically. Research confirmed Compressor.js is the pragmatic choice over hand-rolled canvas compression."
    alternatives_considered:
      - "browser-image-compression: More complex, has web worker support but overkill for this use case"
      - "Hand-rolled canvas compression: Prone to browser-specific bugs (iOS canvas limits, EXIF rotation)"

  - id: "rear-camera-default"
    context: "Factory floor workers use mobile devices for QC photos"
    decision: "Use facingMode: 'environment' for rear camera by default"
    rationale: "QC photos require capturing product/equipment, not selfies. Rear camera has better quality on most devices."

  - id: "compression-settings"
    context: "Target ~500KB per photo to prevent IndexedDB quota issues"
    decision: "quality: 0.6, maxWidth: 1920, maxHeight: 1920"
    rationale: "Research (03-RESEARCH.md) recommends these settings. 1920px prevents iOS canvas crashes (Pitfall 1). Quality 0.6 balances file size and visual quality for QC records."

metrics:
  duration_seconds: 67
  tasks_completed: 2
  files_created: 1
  files_modified: 2
  commits: 2
  lines_added: 426
  lines_deleted: 21
---

# Phase 03 - Plan 03: Photo Capture Hook Summary

## One-Liner
Browser-based camera capture with Compressor.js for ~500KB JPEG compression, base64 output for offline storage in form state.

## Overview
Implemented `usePhotoCapture` hook to enable workers to capture photos directly within the app using the device camera. The hook uses the browser's `getUserMedia` API for camera access and Compressor.js for file size optimization. Photos are returned as base64 strings for offline storage in IndexedDB.

## What Was Built

### 1. Dependency Installation
- Added `compressorjs@^1.2.1` to `package.json`
- Package includes built-in TypeScript types (no separate @types package needed)
- Committed: `406e85d`

### 2. usePhotoCapture Hook
Created `src/features/formFilling/hooks/usePhotoCapture.ts` (314 lines):

**Key Features:**
- Direct camera capture via `getUserMedia({ video: { facingMode: 'environment' } })`
- Rear camera default on mobile devices
- Canvas-based frame capture from video stream
- Compressor.js integration with configurable settings:
  - `quality: 0.6` (compression quality)
  - `maxWidth: 1920` (prevents iOS crashes)
  - `maxHeight: 1920`
- Base64 output via FileReader
- Comprehensive error handling:
  - `NotAllowedError` → "Camera permission denied"
  - `NotFoundError` → "No camera found"
  - `NotReadableError` → "Camera already in use"
- Proper cleanup: MediaStream tracks stopped after capture or on error

**Exports:**
- `usePhotoCapture(options)` - Main hook
- `formatBytes(bytes)` - Utility to format file sizes
- `base64ToPure(base64)` - Strip data URI prefix
- `getMimeTypeFromBase64(base64)` - Extract MIME type

**Hook Return Value:**
```typescript
{
  isCapturing: boolean;
  error: string | null;
  previewStream: MediaStream | null;
  capturePhoto: () => Promise<CapturePhotoResult>;
  cleanup: () => void;
}
```

**CapturePhotoResult:**
```typescript
{
  base64: string;           // data:image/jpeg;base64,...
  originalSize: number;     // bytes before compression
  compressedSize: number;   // bytes after compression
  compressionRatio: number; // 0-1
}
```

### 3. Types Update
Updated `src/features/formFilling/types.ts` to re-export:
- `FormField` and all field types from `formBuilder/types.ts`
- `PhotoCaptureState`, `CapturePhotoOptions`, `CapturePhotoResult` from `usePhotoCapture`

Committed: `717b187`

## Deviations from Plan

### Auto-fixed Issues

None. Plan executed exactly as written.

## Technical Details

### Camera Access Flow
1. User triggers `capturePhoto()`
2. Hook requests camera stream with `facingMode: 'environment'`
3. Stream attached to hidden `<video>` element
4. When video plays, current frame drawn to `<canvas>`
5. Canvas converted to Blob via `toBlob('image/jpeg', 0.8)`
6. Blob compressed via Compressor.js
7. Compressed blob converted to base64 via FileReader
8. MediaStream tracks stopped (camera released)
9. Base64 string returned to caller

### Compression Targets
- Settings: `quality: 0.6`, `maxWidth: 1920`, `maxHeight: 1920`
- Expected output: ~500KB for typical 12MP phone photos
- Purpose: Prevent IndexedDB quota errors, enable offline storage

### Error Handling
| Error Type | User Message | Recovery |
|------------|--------------|----------|
| NotAllowedError | "Camera permission denied. Please allow camera access." | User grants permission |
| NotFoundError | "No camera found on this device." | Use device with camera |
| NotReadableError | "Camera is already in use by another application." | Close other apps |

## Success Criteria Met

- [x] compressorjs dependency installed in package.json
- [x] usePhotoCapture hook exports capturePhoto function
- [x] Camera uses facingMode: 'environment' for rear camera
- [x] Compression settings: quality 0.6, maxWidth 1920, maxHeight 1920
- [x] Output is base64 string for offline storage
- [x] Error handling covers permission denied and no camera scenarios

## Next Steps

This hook will be used by:
- **Plan 06**: `PhotoFieldFill.tsx` component will consume `usePhotoCapture` to render photo field UI with capture button, thumbnail preview, and retake functionality.

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 406e85d | chore(03-form-filling-03): install compressorjs dependency | package.json, package-lock.json |
| 717b187 | feat(03-form-filling-03): create usePhotoCapture hook with camera access and compression | usePhotoCapture.ts, types.ts |

## Self-Check: PASSED

**Created files:**
- FOUND: src/features/formFilling/hooks/usePhotoCapture.ts
- FOUND: .planning/phases/03-form-filling/03-form-filling-03-SUMMARY.md

**Commits:**
- FOUND: 406e85d
- FOUND: 717b187

**Verification:**
- compressorjs installed: YES
- usePhotoCapture exported: YES
- Rear camera default: YES
- Compression settings correct: YES
- Error handling covers permission/no camera: YES

---

*Phase: 03-form-filling | Plan: 03 | Completed: 2026-02-26*
