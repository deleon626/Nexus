---
phase: 03-form-filling
plan: 05
title: "Voice Input Hook with MediaRecorder and Whisper Transcription"
summary: "Tap-to-speak voice input hook using MediaRecorder API for audio capture and OpenAI Whisper API for transcription with online-only gating"
completed: 2026-02-27
duration: 116 seconds
tags: [voice-input, media-recorder, whisper, transcription, online-only]
---

# Phase 03 Plan 05: Voice Input Hook Summary

## One-Liner

Tap-to-speak voice input hook using MediaRecorder API for audio capture, OpenAI Whisper API for Indonesian/English transcription, with online-only gating and direct field population.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ----- | ------ | ----- |
| 1 | Verify useOnline hook exists | N/A (pre-existing) | src/hooks/useOnline.ts |
| 2 | Create useVoiceInput hook | 261587b | src/features/formFilling/hooks/useVoiceInput.ts |
| - | Convex voice transcription mutation (plan 04 dependency) | 480684a | convex/voice.ts, convex/_generated/api.ts |

## Key Files Created/Modified

### Created

- `convex/voice.ts` - Convex mutation for OpenAI Whisper API transcription
- `src/features/formFilling/hooks/useVoiceInput.ts` - Voice input hook with recording and transcription

### Modified

- `convex/_generated/api.ts` - Added voice API types

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] Plan 04 dependency not completed**
- **Found during:** Task 2 execution
- **Issue:** Plan 05 depends on plan 04's Convex voice transcription mutation, which had not been executed
- **Fix:** Created convex/voice.ts with transcribeAudio mutation and updated API types as part of plan 05
- **Files modified:** convex/voice.ts (created), convex/_generated/api.ts (modified)
- **Commit:** 480684a

**Rationale:** The voice transcription mutation is a blocking dependency. Rather than stopping and requiring manual intervention to execute plan 04 separately, the mutation was implemented as part of plan 05 to maintain execution flow.

### Auth Gates

None encountered.

## Technical Decisions

### 1. useOnline Hook Integration
- **Decision:** Import and call useOnline() hook internally rather than accepting isOnline as a prop
- **Rationale:** Simplifies API, ensures online status is always current, reduces prop drilling
- **Impact:** Hook signature is simpler - only language and onTranscript options needed

### 2. onTranscript Callback Pattern
- **Decision:** Provide optional onTranscript callback for direct field population
- **Rationale:** CONTEXT.md specifies "Transcription goes directly to field (no confirmation step)"
- **Impact:** Field components can pass setValue or onChange to get automatic field population

### 3. Auto-stop at 30 Seconds
- **Decision:** Default maxDuration of 30 seconds with auto-stop
- **Rationale:** Whisper API has 25MB file size limit; prevents excessively long recordings
- **Impact:** Better UX, prevents API errors from large files

### 4. Base64 Data URL Format
- **Decision:** Send full data URL (data:audio/webm;base64,...) to Convex mutation
- **Rationale:** Convex mutation can handle both formats; data URL preserves MIME type information
- **Impact:** More robust audio format handling

## Implementation Highlights

### MediaRecorder Integration
```typescript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: MediaRecorder.isTypeSupported('audio/webm')
    ? 'audio/webm'
    : 'audio/mp4',
});
```

### Online-Only Gating
```typescript
if (!isOnline) {
  setState((prev) => ({
    ...prev,
    error: 'Voice input requires internet connection'
  }));
  return;
}
```

### Convex Transcription Call
```typescript
const result = await convex.api.voice.transcribeAudio(audioBase64, language);
if (onTranscript && result.text) {
  onTranscript(result.text); // Direct field population
}
```

### Cleanup on Unmount
```typescript
useEffect(() => {
  return () => {
    cleanup(); // Stops recording and clears timeouts
  };
}, [cleanup]);
```

## Success Criteria Met

- [x] Tap-to-speak activation via startRecording/stopRecording
- [x] Online detection with clear offline error message
- [x] Indonesian (id) and English (en) language support
- [x] Visual feedback state (isRecording, isTranscribing) for UI
- [x] Transcription text returned for direct field population
- [x] Error handling for transcription failures
- [x] Microphone cleanup on unmount

## Dependencies Handled

### Plan 04 (Convex Voice Transcription) - Resolved
- Created convex/voice.ts with transcribeAudio mutation
- Integrated OpenAI Whisper API with Indonesian/English language support
- Added error handling for API key, file size, and transcription failures
- Updated Convex API types to include voice module

## Next Steps

Plan 06 should create the VoiceInputButton component that:
1. Uses useVoiceInput hook for recording state
2. Displays mic icon with "Listening..." animated waveform
3. Shows toast notification on transcription errors
4. Integrates with TextFieldFill and TextareaFieldFill components

## Performance Considerations

- Audio blob size limited by 30-second max duration (~3MB at 128kbps)
- Base64 encoding increases size by ~33% but stays under Whisper's 25MB limit
- Cleanup effect prevents memory leaks from unreleased MediaRecorder instances
- Online check happens synchronously before async microphone request

## Self-Check: PASSED

**Created files:**
- [x] convex/voice.ts exists
- [x] convex/_generated/api.ts updated
- [x] src/features/formFilling/hooks/useVoiceInput.ts exists

**Commits:**
- [x] 480684a: feat(03-form-filling-05): add Convex voice transcription mutation
- [x] 261587b: feat(03-form-filling-05): implement useVoiceInput hook

**Verification:**
- [x] useOnline hook verified
- [x] useVoiceInput hook with MediaRecorder
- [x] transcribeAudio mutation exists
- [x] Online gating implemented
- [x] Error handling complete
- [x] Cleanup on unmount
