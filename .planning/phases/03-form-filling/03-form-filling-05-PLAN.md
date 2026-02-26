---
phase: 03-form-filling
plan: 05
type: execute
wave: 2
depends_on: [01, 02, 03, 04]
files_modified:
  - src/features/formFilling/hooks/useVoiceInput.ts
  - src/features/formFilling/hooks/useOnline.ts
autonomous: true
requirements: [FILL-03]

must_haves:
  truths:
    - Worker can tap mic icon to start/stop recording
    - Visual feedback shows "Listening..." with animated waveform
    - Transcription works online (Indonesian and English)
    - Offline state shows clear message per CONTEXT.md
    - Transcription populates field directly (no confirmation step)
    - Transcription errors show toast notification
  artifacts:
    - path: "src/features/formFilling/hooks/useVoiceInput.ts"
      provides: "Voice recording and transcription hook"
      min_lines: 60
      exports: ["useVoiceInput"]
    - path: "src/features/formFilling/hooks/useOnline.ts"
      provides: "Online status detection for voice input gating"
      exports: ["useOnline"]
  key_links:
    - from: "src/features/formFilling/hooks/useVoiceInput.ts"
      to: "src/convex/functions.ts"
      via: "convex.api.voice.transcribeAudio(audioBase64, language)"
      pattern: "convex\\.api\\.voice\\.transcribeAudio|transcribeAudio"
    - from: "src/features/formFilling/hooks/useVoiceInput.ts"
      to: "src/features/formFilling/hooks/useOnline.ts"
      via: "Import useOnline for online-only gating"
      pattern: "useOnline|isOnline"
    - from: "src/features/formFilling/components/fields/VoiceInputButton.tsx" (Plan 06)
      to: "src/features/formFilling/hooks/useVoiceInput.ts"
      via: "Use useVoiceInput for recording state and transcription"
      pattern: "useVoiceInput|isRecording|startRecording|stopRecording"
---

<objective>

Create voice input hook with MediaRecorder API, online detection, and Whisper transcription integration. Provides tap-to-speak functionality for text and number fields with visual feedback.

Purpose: Voice input accelerates data entry for workers wearing gloves or in dim lighting. Online-only requirement means offline detection is critical for UX.

Output: useVoiceInput hook with recording state, transcription callback, online gating.
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
@.planning/phases/03-form-filling/03-form-filling-04-PLAN.md
@src/hooks/useOnline.ts
@src/lib/convex.ts
---
</context>

<tasks>

<task type="auto">
  <name>Task 1: Verify useOnline hook exists</name>
  <files>src/hooks/useOnline.ts</files>
  <action>
    Verify src/hooks/useOnline.ts exists and exports:
    - useOnline() hook returning boolean isOnline state

    If not exists, create it:
       import { useEffect, useState } from 'react';
       export function useOnline(): boolean {
         const [isOnline, setIsOnline] = useState(navigator.onLine);
         useEffect(() => {
           const handleOnline = () => setIsOnline(true);
           const handleOffline = () => setIsOnline(false);
           window.addEventListener('online', handleOnline);
           window.addEventListener('offline', handleOffline);
           return () => {
             window.removeEventListener('online', handleOnline);
             window.removeEventListener('offline', handleOffline);
           };
         }, []);
         return isOnline;
       }

    Reference: Phase 1 SyncStatus components use online detection. Verify existing pattern matches CONTEXT.md requirement for clear offline message.
  </action>
  <verify>grep -q "useOnline" src/hooks/useOnline.ts && grep -q "isOnline" src/hooks/useOnline.ts</verify>
  <done>useOnline hook verified/created for online status detection</done>
</task>

<task type="auto">
  <name>Task 2: Create useVoiceInput hook</name>
  <files>src/features/formFilling/hooks/useVoiceInput.ts</files>
  <action>
    Create src/features/formFilling/hooks/useVoiceInput.ts with:

    1. Hook signature: useVoiceInput(language: 'id' | 'en' = 'id')

    2. State:
       - isRecording: boolean (currently capturing audio)
       - isTranscribing: boolean (calling Whisper API)
       - error: string | null (transcription error message)
       - audioBlob: Blob | null (recorded audio data)

    3. MediaRecorder setup:
       - startRecording() function:
         - Check isOnline from useOnline hook
         - If offline, set error "Voice input requires internet connection" per CONTEXT.md
         - Request microphone access: navigator.mediaDevices.getUserMedia({ audio: true })
         - Create MediaRecorder with stream
         - Collect chunks in array
         - Start recorder, set isRecording: true

       - stopRecording() function:
         - Call mediaRecorder.stop()
         - On stop event: create Blob from chunks, type 'audio/webm'
         - Set isRecording: false, set audioBlob

    4. Transcription:
       - useEffect watching audioBlob
       - When audioBlob exists:
         - Convert to base64: FileReader.readAsDataURL()
         - Call convex.api.voice.transcribeAudio(audioBase64, language)
         - On success: return text via onTranscript callback (passed from field component)
         - On error: set error state for toast display
         - Set isTranscribing: false

    5. Cleanup:
       - Stop MediaRecorder tracks on unmount
         - stream?.getTracks().forEach(track => track.stop())

    6. Import from: @/hooks/useOnline, @/lib/convex, standard React hooks

    Reference: 03-RESEARCH.md Pattern 4 "Voice Input with Whisper API" example. CONTEXT.md specifies tap-to-speak, visual feedback, online-only with clear message.

    Note: CONTEXT.md says "Live streaming transcription (text appears as spoken)" but Whisper API processes complete files. Research confirms file-based is sufficient for 2-3 second bursts.
  </action>
  <verify>grep -q "useVoiceInput" src/features/formFilling/hooks/useVoiceInput.ts && grep -q "MediaRecorder" src/features/formFilling/hooks/useVoiceInput.ts && grep -q "transcribeAudio" src/features/formFilling/hooks/useVoiceInput.ts</verify>
  <done>useVoiceInput hook created with MediaRecorder, online gating, and Whisper transcription</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. useOnline hook exists and returns boolean isOnline
2. useVoiceInput hook exports recording state and controls
3. startRecording checks isOnline before accessing microphone
4. Error message "Voice input requires internet connection" set when offline
5. MediaRecorder captures audio as webm blob
6. Audio converted to base64 for Convex mutation call
7. Transcription result returned for field population
8. Cleanup stops MediaRecorder tracks on unmount
</verification>

<success_criteria>
1. Tap-to-speak activation via startRecording/stopRecording
2. Online detection with clear offline error message
3. Indonesian (id) and English (en) language support
4. Visual feedback state (isRecording, isTranscribing) for UI
5. Transcription text returned for direct field population
6. Error handling for transcription failures
7. Microphone cleanup on unmount
</success_criteria>

<output>
After completion, create `.planning/phases/03-form-filling/03-form-filling-05-SUMMARY.md`
</output>
