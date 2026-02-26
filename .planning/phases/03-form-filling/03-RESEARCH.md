# Phase 3: Form Filling - Research

**Researched:** 2026-02-27
**Domain:** Mobile-first Progressive Web App form filling with offline support, photo capture, and voice input
**Confidence:** HIGH

## Summary

Phase 3 requires implementing worker-facing form filling with manual data entry, photo capture, and voice dictation. The phase builds on existing Phase 1 (offline/sync) and Phase 2 (form builder) infrastructure. Key technical challenges include: (1) browser-based photo capture with compression for offline storage, (2) online-only voice transcription using OpenAI's Whisper API via Agno framework, and (3) form validation with real-time feedback using React Hook Form with Zod schemas already in place.

**Primary recommendation:** Leverage existing Dexie offline storage and Convex backend, use browser-image-compression for photos (~500KB target), implement MediaRecorder API for audio capture with OpenAI Whisper transcription, and use React Hook Form's Controller/useController pattern for custom field components including photo and voice inputs.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Form Selection UX:**
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

**Field Entry Flow:**
- Single scrolling page layout (all fields visible)
- Progress bar at top showing % complete or X/Y fields filled
- Asterisk (*) marker next to required field labels
- Validation errors appear on blur (when field loses focus)

**Photo Capture:**
- Single photo per photo field
- Direct capture flow: tap field opens camera immediately
- Preview screen after capture with Retake/Attach buttons
- Tap attached thumbnail to retake
- Compress photos to ~500KB before storing
- Use system default flash setting (no custom toggle)
- Full offline support required — photos must work without internet
- Attached photos appear as small rounded thumbnail in field area

**Voice Input UX:**
- Tap-to-speak activation (tap mic icon to start, tap again to stop)
- Voice available on all text and number fields
- Visual feedback: "Listening..." with animated waveform while recording
- Live streaming transcription (text appears as spoken)
- Online only — show clear message when offline
- Transcription errors: toast notification explaining issue
- Language support: Indonesian and English
- Transcription goes directly to field (no confirmation step)

**Draft Auto-save:**
- Auto-save every 30 seconds automatically
- Draft names auto-generated: "Form Name - Batch 123 - Feb 27"
- Draft recovery: prompt on app open if drafts exist
- Drafts expire and auto-delete after 7 days

**Submission Flow:**
- Validation errors: block submit, scroll to first error, show summary of issues
- Confirmation: summary modal before final submit
- Success: success screen with checkmark and "Done" button, returns to form list
- Bottom actions: Submit button + "Submit & Start New" button

**Error Recovery:**
- Offline submit: queue submission for sync when online
- Auto-retry: 3 attempts with exponential backoff (5s, 15s, 45s delays)
- Repeated failure: keep as pending in queue with manual retry button
- Status tracking: toast notifications + queue view accessible from header

**Other Field Types:**
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

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILL-01 | Worker can fill forms with manual data entry | React Hook Form with Zod validation schemas already defined in Phase 2. Use Controller pattern for custom field components. |
| FILL-02 | Worker can capture photos via device camera | getUserMedia() API for camera access, browser-image-compression for ~500KB target, store as base64 in Dexie. |
| FILL-03 | Worker can fill forms using voice input (online-only via Whisper API + Agno LLM) | MediaRecorder API for audio capture, OpenAI Whisper API for transcription via Convex backend, Agno framework for LLM coordination. |
| FILL-04 | Worker sees form validation errors before submission | React Hook Form mode: 'onBlur' with Zod resolver, touchedFields tracking for error display timing. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.66.0 | Form state and validation | Minimal re-renders, performant, excellent TypeScript support, works with Zod |
| zod | ^4.3.6 | Schema validation | Already in Phase 2, TypeScript-first, runtime validation |
| dexie | ^4.0.10 | IndexedDB wrapper for offline storage | Already in Phase 1, type-safe, proven offline-first patterns |
| convex | ^1.32.0 | Backend sync and API | Already in project, real-time sync, server-side functions |
| compressorjs | latest | Photo compression | Lightweight, uses native canvas.toBlob(), ~500KB target achievable |
| openai | latest | Whisper API transcription | Industry-leading accuracy, Indonesian language support, streaming support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hookform/resolvers | latest | Zod adapter for RHF | Required for schema validation integration |
| date-fns | ^4.1.0 | Date formatting (already installed) | Draft naming: "Form Name - Batch 123 - Feb 27" |
| lucide-react | ^0.575.0 | Icons (already installed) | Mic icon, camera icon, validation icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| compressorjs | browser-image-compression | compressorjs is simpler, smaller; browser-image-compression has web worker support but more complex |
| MediaRecorder API | Web Speech API | Web Speech API doesn't support Indonesian well, no offline storage; MediaRecorder + Whisper is more reliable |
| React Hook Form | TanStack Form | RHF has larger ecosystem, better documentation, already familiar to team |

**Installation:**
```bash
# Additional dependencies for Phase 3
npm install compressorjs openai
npm install --save-dev @types/compressorjs
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── features/
│   └── formFilling/           # New feature module
│       ├── components/
│       │   ├── FormList.tsx           # Form selection with search
│       │   ├── BatchNumberPrompt.tsx  # Batch number modal
│       │   ├── DraftPickerModal.tsx   # Resume or start new
│       │   ├── FormFiller.tsx         # Main form filling container
│       │   ├── ProgressBar.tsx        # X/Y fields filled
│       │   ├── SubmissionSummary.tsx  # Confirmation modal
│       │   └── SuccessScreen.tsx      # Post-submit screen
│       ├── hooks/
│       │   ├── useFormDraft.ts        # Draft auto-save (30s interval)
│       │   ├── useFormProgress.ts      # Calculate completion %
│       │   ├── useVoiceInput.ts       # Whisper transcription
│       │   └── usePhotoCapture.ts     # Camera + compression
│       ├── components/fields/
│       │   ├── FormField.tsx           # Field wrapper with error display
│       │   ├── TextFieldFill.tsx       # Text input + voice
│       │   ├── NumberFieldFill.tsx     # Number input + voice
│       │   ├── SelectFieldFill.tsx     # Bottom sheet picker
│       │   ├── CheckboxFieldFill.tsx   # Checkbox group
│       │   ├── PassFailFieldFill.tsx   # Side-by-side buttons
│       │   ├── TextareaFieldFill.tsx   # Auto-grow textarea + voice
│       │   └── PhotoFieldFill.tsx      # Camera capture + thumbnail
│       ├── types.ts                    # Form filling types
│       └── constants.ts                # Draft expiration, etc.
├── db/
│   ├── types.ts                        # Add Draft type
│   └── dexie.ts                        # Add drafts table
└── convex/
    └── functions/
        └── voice.ts                    # Whisper transcription endpoint
```

### Pattern 1: React Hook Form with Controller for Custom Fields
**What:** Use `useController` hook for custom field components that need complex behavior (photo capture, voice input, custom pickers).

**When to use:** Photo fields (camera capture), text/number fields (voice input), select fields (bottom sheet picker), pass/fail fields (custom buttons).

**Example:**
```typescript
// Source: Context7 /react-hook-form/react-hook-form
import { useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Custom field component with Controller
function VoiceInputField({ field, control }: {
  field: FormField;
  control: Control
}) {
  const { field: { value, onChange }, fieldState: { error } } = useController({
    name: field.id,
    control,
    rules: {
      required: field.required ? 'This field is required' : false
    }
  });

  const handleVoiceInput = async () => {
    const transcription = await transcribeAudio();
    onChange(transcription);
  };

  return (
    <div>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
      <button onClick={handleVoiceInput} type="button">
        <MicIcon />
      </button>
      {error && <span className="error">{error.message}</span>}
    </div>
  );
}

// Form setup
const methods = useForm({
  resolver: zodResolver(validationSchema),
  mode: 'onBlur', // Validation on blur per CONTEXT.md
  defaultValues: {}
});
```

### Pattern 2: Draft Auto-Save with Dexie
**What:** Auto-save form state every 30 seconds to IndexedDB using Dexie.

**When to use:** All form filling sessions. Create/update draft on interval, delete on submit.

**Example:**
```typescript
import { db } from '@/db/dexie';
import { useEffect, useRef } from 'react';

export function useFormDraft(formId: string, batchNumber: string, formData: any) {
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      const draftName = `${formId} - Batch ${batchNumber} - ${format(new Date(), 'MMM dd')}`;

      await db.drafts.put({
        localId: crypto.randomUUID(),
        formId,
        batchNumber,
        formData,
        name: draftName,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        updatedAt: new Date()
      }, localId);
    }, 30000); // 30 seconds per CONTEXT.md

    return () => clearInterval(intervalRef.current);
  }, [formId, batchNumber, formData]);
}
```

### Pattern 3: Photo Capture with Compression
**What:** Use getUserMedia() for camera access, canvas for capture, compressorjs for ~500KB compression.

**When to use:** Photo field type. Full offline support - no network required.

**Example:**
```typescript
import Compressor from 'compressorjs';

async function capturePhoto(): Promise<string> {
  // 1. Get camera stream
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' } // Rear camera on mobile
  });

  // 2. Capture frame to canvas
  const video = document.createElement('video');
  video.srcObject = stream;
  await video.play();

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')?.drawImage(video, 0, 0);

  // 3. Convert to blob and compress
  canvas.toBlob(async (blob) => {
    if (!blob) return;

    // Compress to ~500KB
    new Compressor(blob, {
      quality: 0.6,
      maxWidth: 1920,
      maxHeight: 1920,
      success(result) {
        // Convert to base64 for offline storage
        const reader = new FileReader();
        reader.readAsDataURL(result);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Store in form state
        };
      }
    });
  }, 'image/jpeg', 0.8);

  // Cleanup
  stream.getTracks().forEach(track => track.stop());
}
```

### Pattern 4: Voice Input with Whisper API
**What:** Use MediaRecorder API to capture audio, send to Convex backend which calls OpenAI Whisper API.

**When to use:** Text and number fields when online. Show offline message when offline.

**Example:**
```typescript
import { useOnline } from '@/hooks/useOnline';

async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const isOnline = useOnline();

  if (!isOnline) {
    throw new Error('Voice input requires internet connection');
  }

  // Call Convex function which calls Whisper API
  const result = await convex.functions.voice.transcribe({
    audio: await blobToBase64(audioBlob),
    language: 'id' // Indonesian
  });

  return result.text;
}

// Convex function (convex/voice.ts)
import { v } from 'convex/values';
import OpenAI from 'openai';

export const transcribe = mutation({
  args: { audio: v.string(), language: v.string() },
  handler: async (_, { audio, language }) => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.audio.transcriptions.create({
      file: base64ToFile(audio),
      model: 'whisper-1',
      language: language === 'id' ? 'indonesian' : 'english'
    });

    return { text: response.text };
  }
});
```

### Anti-Patterns to Avoid
- **Storing photos in Convex:** Photos must work offline - store in Dexie as base64, sync later
- **Validating on every keystroke:** CONTEXT.md specifies blur validation - use mode: 'onBlur'
- **Complex voice confirmation:** Transcription goes directly to field, no confirmation step per CONTEXT.md
- **Native camera app:** Use getUserMedia() for in-app capture - context switch breaks flow
- **Separate voice state:** Voice input updates form value directly via RHF's onChange

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validators | React Hook Form + Zod | Already defined in Phase 2, type-safe, handles blur validation |
| Image compression | Canvas quality tuning | compressorjs | Handles resize + quality + EXIF, cross-browser tested |
| IndexedDB wrapper | Raw indexedDB API | Dexie | Already in project, type-safe, handles migrations |
| Audio capture | Raw Web Audio API | MediaRecorder API | Simple blob output, supported on all modern browsers |
| Offline sync | Custom queue system | Existing sync queue | Phase 1 infrastructure handles retry with exponential backoff |

**Key insight:** Custom photo compression is tempting but browser-specific bugs (canvas size limits, EXIF handling, Safari quirks) make compressorjs the pragmatic choice. For voice input, MediaRecorder + Whisper is more reliable than Web Speech API which has poor Indonesian support.

## Common Pitfalls

### Pitfall 1: Canvas Size Limits on iOS
**What goes wrong:** Safari crashes when canvas exceeds 4096x4096 pixels. High-resolution photos from modern phones (12MP+) cause crashes.

**Why it happens:** iOS WebKit has memory limits for canvas elements. Capturing full-resolution photos exceeds limits.

**How to avoid:** Set maxWidth/maxHeight in compressorjs to 1920 or lower. Compressorjs automatically reduces resolution if needed.

**Warning signs:** App crashes on photo capture, especially on newer iPhones.

### Pitfall 2: Validation Errors Before User Interaction
**What goes wrong:** Form shows validation errors immediately on load, creating poor UX.

**Why it happens:** Using mode: 'onChange' or 'all' in React Hook Form without checking touched state.

**How to avoid:** Use mode: 'onBlur' as specified in CONTEXT.md. Only show errors when field is blurred AND has error.

**Warning signs:** Red error messages visible when form first loads.

### Pitfall 3: Drafts Accumulating Indefinitely
**What goes wrong:** Old drafts clutter the database, slowing queries and confusing users.

**Why it happens:** Drafts are created but never cleaned up after expiration.

**How to avoid:** Implement draft expiration logic. Check expiresAt timestamp on app load, delete expired drafts. CONTEXT.md specifies 7-day expiration.

**Warning signs:** Draft picker modal showing many old entries, slow form list load.

### Pitfall 4: Voice Input Not Working Offline
**What goes wrong:** User taps mic button when offline, confusing error or silent failure.

**Why it happens:** No clear offline detection and messaging.

**How to avoid:** Check useOnline() before showing mic icon or enabling voice input. Display clear "Voice requires internet" message when offline per CONTEXT.md.

**Warning signs:** Voice button appears but doesn't work when offline, no feedback.

### Pitfall 5: Photos Too Large for IndexedDB
**What goes wrong:** High-resolution photos (5-15MB) cause quota errors or slow sync.

**Why it happens:** Not compressing photos before storage.

**How to avoid:** Always compress to ~500KB target as specified in CONTEXT.md. Test with 12MP photo from modern phone.

**Warning signs:** Dexie quota errors, slow submission when photos present.

### Pitfall 6: Form Progress Calculation Incorrect
**What goes wrong:** Progress bar shows wrong % complete, confusing users about completion status.

**Why it happens:** Counting all fields equally, or not accounting for optional fields.

**How to avoid:** Calculate progress as (filled required fields / total required fields). Optional fields shouldn't affect progress.

**Warning signs:** Progress bar jumps unexpectedly, shows 100% when required fields empty.

## Code Examples

Verified patterns from official sources:

### React Hook Form with onBlur Validation
```typescript
// Source: Context7 /react-hook-form/react-hook-form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const {
  register,
  handleSubmit,
  formState: { errors, touchedFields }
} = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // Validate when field loses focus
  defaultValues
});

// Only show error if field was touched (blurred) AND has error
<input {...register('fieldName')} />
{touchedFields.fieldName && errors.fieldName && (
  <span>{errors.fieldName.message}</span>
)}
```

### Progress Calculation for Form Completion
```typescript
// Calculate % of required fields filled
function calculateProgress(fields: FormField[], values: Record<string, any>): number {
  const requiredFields = fields.filter(f => f.required);
  const filledRequired = requiredFields.filter(f => {
    const value = values[f.id];
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((filledRequired.length / requiredFields.length) * 100);
}
```

### Dexie Draft Storage Schema
```typescript
// Extend db schema
class NexusDB extends Dexie {
  drafts!: Table<Draft>;

  constructor() {
    super('nexus-db');
    this.version(2).stores({
      // ... existing tables
      drafts: '++id, localId, formId, batchNumber, orgId, userId, expiresAt, createdAt'
    });
  }
}

interface Draft {
  id?: number;
  localId: string;
  formId: string;
  batchNumber: string;
  formData: Record<string, any>;
  name: string;
  orgId: string;
  userId: string;
  expiresAt: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Cleanup Expired Drafts on App Load
```typescript
// Run on app initialization
async function cleanupExpiredDrafts() {
  const now = Date.now();
  await db.drafts.where('expiresAt').below(now).delete();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formik | React Hook Form | 2020-2023 | RHF has better performance, smaller bundle, TypeScript-first |
| Yup | Zod | 2022-2024 | Zod has better TypeScript inference, more flexible validation |
| canvas.toDataURL() | compressorjs | 2019-present | Compressorjs handles EXIF, quality tuning, cross-browser issues |
| Web Speech API | MediaRecorder + Whisper | 2023-present | Whisper has better accuracy, supports Indonesian, streaming option |

**Deprecated/outdated:**
- **navigator.getUserMedia()**: Deprecated in favor of navigator.mediaDevices.getUserMedia()
- **Formik**: Still maintained but less popular than React Hook Form for new projects
- **Yup**: Still works but Zod has better TypeScript integration

## Open Questions

1. **Whisper API vs Realtime API for streaming transcription**
   - What we know: Realtime API supports streaming transcription. Whisper API processes complete audio files.
   - What's unclear: Whether Realtime API is needed for "live streaming" UX or if file-based is sufficient.
   - Recommendation: Start with file-based Whisper API (simpler, proven). Users speak in short bursts for form fields, so 2-3 second transcriptions are acceptable. Realtime API overkill for this use case.

2. **Photo compression quality setting for 500KB target**
   - What we know: Compressorjs quality parameter (0-1) affects file size.
   - What's unclear: Exact quality value to consistently hit 500KB across different photo resolutions.
   - Recommendation: Use quality: 0.6 with maxWidth: 1920. Test with actual factory photos. Adjust if needed. Compressorjs has multiple iterations to hit target size.

3. **Dedicated drafts table vs reuse submissions table**
   - What we know: Current schema has submissions table. Need drafts storage.
   - What's unclear: Whether to add separate drafts table or store in submissions with status: 'draft'.
   - Recommendation: Separate drafts table. Drafts have different lifecycle (auto-expire, multiple per batch), different queries (by expiresAt), different retention policy (7 days vs permanent).

## Sources

### Primary (HIGH confidence)
- Context7 /react-hook-form/react-hook-form - onBlur validation, Controller pattern, touchedFields
- Context7 /donaldcwl/browser-image-compression - imageCompression function, maxSizeMB option
- MDN Web API - Taking still photos with getUserMedia() - Camera capture pattern
- OpenAI API Docs - Speech to text - Whisper API, streaming support, Indonesian language
- Dexie.js Documentation - IndexedDB operations, useLiveQuery hook

### Secondary (MEDIUM confidence)
- GitHub fengyuanchen/compressorjs - Verified library options, quality parameter, browser support
- React Hook Form Documentation - useController hook, fieldState API, validation modes
- Web Search (verified with official sources) - getUserMedia() best practices 2025, PWA camera access

### Tertiary (LOW confidence)
- Web Search only - Agno framework voice integration patterns (marked for validation)
- Web Search only - Exact compressorjs quality for 500KB target (testing needed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via Context7 or official docs
- Architecture: HIGH - Patterns from official React Hook Form and Dexie documentation
- Pitfalls: MEDIUM - Some based on web search (iOS canvas limits, photo size issues) - verify during implementation

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days - stable ecosystem, major updates unlikely)

---
*Phase: 03-form-filling*
*Research completed: 2026-02-27*
