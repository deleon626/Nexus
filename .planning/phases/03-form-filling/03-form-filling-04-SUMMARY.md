---
phase: 03-form-filling
plan: 04
title: "OpenAI Whisper Transcription Backend"
summary: "Convex mutation for Whisper API voice transcription with Indonesian and English language support"
tags: [convex, openai, whisper, voice-transcription, backend-api]
one-liner: "Server-side Whisper API transcription via Convex mutations for Indonesian and English voice input"

dependency_graph:
  requires:
    - "01-form-filling: Draft persistence layer (Dexie, offline storage)"
    - "01-form-filling: Convex backend infrastructure from Phase 1"
    - "02-form-builder: Form templates with field definitions"
  provides:
    - "05-form-filling: useVoiceInput hook will call this mutation"
    - "06-form-filling: Voice input UI components for text/number fields"
  affects:
    - "Phase 4: Form Review - transcriptions included in submission data"

tech_stack:
  added:
    - library: "openai"
      version: "^4.x"
      purpose: "Whisper API for speech-to-text transcription"
    - env_var: "OPENAI_API_KEY"
      purpose: "OpenAI API authentication (Convex deployment env)"
  patterns:
    - "Convex mutation for server-side API calls"
    - "Base64 audio data transmission from client"
    - "Dynamic import for OpenAI SDK (Convex edge compatibility)"
    - "Language code mapping (id->indonesian, en->english)"

key_files:
  created:
    - path: "convex/voice.ts"
      description: "transcribeAudio mutation for Whisper API integration"
  modified:
    - path: "package.json"
      description: "Added openai dependency"
    - path: ".env.example"
      description: "Added OPENAI_API_KEY template"
    - path: ".env.local"
      description: "Added OPENAI_API_KEY placeholder"

decisions:
  - date: "2026-02-27"
    title: "Server-side Whisper API via Convex mutations"
    rationale: "Keeps OPENAI_API_KEY secure on backend. Convex mutations have secure process.env access. Client sends base64 audio, server handles API call."
    alternatives_considered:
      - "Client-side OpenAI SDK: Exposes API key, rejected for security"
      - "Separate backend service: Added complexity, Convex already handles this"
  - date: "2026-02-27"
    title: "Base64 audio data transmission"
    rationale: "Simple format that works across browsers. No multipart form handling needed in Convex. Audio blobs from MediaRecorder API convert easily to base64."
    alternatives_considered:
      - "Direct File upload: More complex Convex configuration"
      - "Binary buffer: Less compatible with older browsers"
  - date: "2026-02-27"
    title: "Whisper model choice: whisper-1"
    rationale: "Recommended model in OpenAI docs. Balances accuracy and cost. Supports Indonesian language well."
  - date: "2026-02-27"
    title: "Dynamic import for OpenAI SDK"
    rationale: "Convex edge functions have specific module loading patterns. Dynamic import prevents bundle issues."

metrics:
  duration: "5 minutes"
  completed_date: "2026-02-27"
  tasks_completed: 3
  files_created: 1
  files_modified: 3
  commits: 2
  lines_added: 117
  lines_removed: 3
  deviations: 0
  auth_gates: 0

---

# Phase 03 Plan 04: OpenAI Whisper Transcription Backend - Summary

## Overview

Implemented Convex backend function for OpenAI Whisper API transcription. Enables online-only voice input for text and number fields with Indonesian and English language support.

**Purpose:** Factory workers may wear gloves or work in dim lighting. Voice input accelerates data entry. Indonesian language support is critical for Jakarta market.

**Output:** Convex mutation `transcribeAudio` that accepts base64 audio input and returns transcribed text using OpenAI's Whisper API.

---

## Tasks Completed

### Task 1: Add OpenAI Dependency and Environment Variable

**Files Modified:** `package.json`, `.env.example`, `.env.local`

- Installed `openai` npm package (v4.x) for Whisper API integration
- Added `OPENAI_API_KEY=your_openai_api_key_here` to `.env.example`
- Added placeholder `OPENAI_API_KEY=sk-placeholder` to `.env.local`

**Commit:** `d16cdd0` - feat(03-form-filling-04): add OpenAI SDK and environment variable template

---

### Task 2: Create Whisper Transcription Mutation

**Files Created:** `convex/voice.ts`

Created `transcribeAudio` mutation with the following features:

- **Input:**
  - `audioData: string` - Base64-encoded audio data (with or without data URL prefix)
  - `language: string` - Language code: 'id' for Indonesian, 'en' for English

- **Processing:**
  - Validates `OPENAI_API_KEY` environment variable
  - Converts base64 audio to buffer and File object
  - Maps language codes to Whisper API format (id->indonesian, en->english)
  - Calls OpenAI Whisper API with `whisper-1` model

- **Output:**
  - `{ text: string }` - Transcribed text

- **Error Handling:**
  - 401 Unauthorized: "Invalid OpenAI API key"
  - 429 Rate Limit: "Rate limit exceeded. Please try again."
  - File too large: "Audio file too large. Please record a shorter message."
  - Generic error: "Failed to transcribe audio. Please try again."

**Commit:** `f5ae2a2` - feat(03-form-filling-04): create Whisper transcription mutation

---

### Task 3: Verify Convex Client Exports

**Files Verified:** `src/lib/convex.ts`

Confirmed that the Convex client is already properly exported from Phase 1:
- `export const convex = new ConvexReactClient(url);`

No changes needed - existing infrastructure is complete.

---

## Verification Results

All verification criteria passed:

1. ✅ OpenAI dependency installed in package.json
2. ✅ OPENAI_API_KEY template in .env.example
3. ✅ transcribeAudio mutation exists in convex/voice.ts
4. ✅ Mutation accepts base64 audio data and language parameter
5. ✅ Whisper API call uses whisper-1 model with Indonesian/English language support
6. ✅ Mutation returns transcribed text string
7. ✅ Server-side execution keeps API key secure (process.env.OPENAI_API_KEY)
8. ✅ Convex client exported for use in voice input hook

---

## Success Criteria Met

1. ✅ Convex mutation callable from client with audio base64 and language
2. ✅ Whisper API integration follows OpenAI SDK patterns
3. ✅ Indonesian language support via language: 'indonesian' parameter
4. ✅ English language support via language: 'english' parameter
5. ✅ Server-side execution keeps API key secure
6. ✅ Environment variable documented for deployment configuration

---

## Deviations from Plan

**None - plan executed exactly as written.**

---

## Auth Gates

**None - no authentication gates encountered during execution.**

---

## Implementation Notes

### Key Design Decisions

1. **Server-side API calls:** Convex mutations handle OpenAI API calls on the server side, keeping the API key secure and never exposing it to the client.

2. **Base64 audio transmission:** Chose base64 encoding for audio data transmission because:
   - Simple to implement with MediaRecorder API
   - Works across all modern browsers
   - No multipart form complexity in Convex

3. **Dynamic import for OpenAI SDK:** Used dynamic import to prevent potential bundle issues with Convex edge function module loading.

4. **Language code mapping:** Implemented mapping from ISO codes ('id', 'en') to Whisper API language names ('indonesian', 'english') for consistency with frontend conventions.

### Usage Example (for next phase)

```typescript
// In useVoiceInput.ts hook (Plan 05)
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

function useVoiceInput(language: 'id' | 'en') {
  const transcribe = useMutation(api.voice.transcribeAudio);

  const handleVoiceInput = async (audioBlob: Blob) => {
    const base64 = await blobToBase64(audioBlob);
    const result = await transcribe({ audioData: base64, language });
    return result.text;
  };

  return { handleVoiceInput };
}
```

---

## Next Steps

This plan (04) provides the backend API for voice transcription. The next plan (05) will implement:

- `useVoiceInput.ts` hook that calls this mutation
- MediaRecorder API integration for audio capture
- Online/offline detection
- Integration with React Hook Form for field value updates

---

## User Setup Required

For the voice transcription to work in production, users need to:

1. **Get OpenAI API Key:**
   - Go to OpenAI Platform Dashboard -> API Keys
   - Create new API key
   - Set `OPENAI_API_KEY` environment variable in Convex deployment

2. **Convex Deployment Configuration:**
   - Set `OPENAI_API_KEY` in Convex project environment variables
   - Redeploy Convex functions after setting the key

---

## Files Modified

### Created
- `convex/voice.ts` (91 lines)

### Modified
- `package.json` - Added openai dependency
- `.env.example` - Added OPENAI_API_KEY template
- `.env.local` - Added OPENAI_API_KEY placeholder

---

## Commits

1. `d16cdd0` - feat(03-form-filling-04): add OpenAI SDK and environment variable template
2. `f5ae2a2` - feat(03-form-filling-04): create Whisper transcription mutation

---

*Plan completed: 2026-02-27*
*Total duration: 5 minutes*
*Status: COMPLETE*
