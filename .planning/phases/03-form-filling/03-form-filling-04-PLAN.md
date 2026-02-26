---
phase: 03-form-filling
plan: 04
type: execute
wave: 2
depends_on: [01, 02, 03]
files_modified:
  - src/convex/functions.ts
  - src/lib/convex.ts
  - .env.example
autonomous: true
requirements: [FILL-03]

user_setup:
  - service: openai
    why: "Whisper API for voice transcription (Indonesian and English)"
    env_vars:
      - name: OPENAI_API_KEY
        source: "OpenAI Platform Dashboard -> API Keys"

must_haves:
  truths:
    - Worker can tap mic icon to start voice recording
    - Voice transcription works when online (Indonesian and English)
    - Clear offline message shown when offline per CONTEXT.md
    - Transcription goes directly to field value (no confirmation step)
    - Transcription errors show toast notification
  artifacts:
    - path: "src/convex/functions.ts"
      provides: "Convex mutation for Whisper API transcription"
      exports: ["transcribeAudio"]
    - path: "src/lib/convex.ts"
      provides: "Convex client initialization"
      exports: ["convex"]
    - path: ".env.example"
      provides: "OpenAI API key template"
      contains: "OPENAI_API_KEY"
  key_links:
    - from: "src/features/formFilling/hooks/useVoiceInput.ts" (Plan 05)
      to: "src/convex/functions.ts"
      via: "convex.mutations.voice.transcribeAudio()"
      pattern: "convex\\.mutations\\.voice\\.transcribe|api\\.voice\\.transcribe"
    - from: "src/convex/functions.ts"
      to: "OpenAI Whisper API"
      via: "openai.audio.transcriptions.create()"
      pattern: "openai\\.audio\\.transcriptions\\.create"
---

<objective>

Create Convex backend function for OpenAI Whisper API transcription. Enables online-only voice input for text and number fields with Indonesian and English language support.

Purpose: Factory workers may wear gloves or work in dim lighting. Voice input accelerates data entry. Indonesian language support is critical for Jakarta market.

Output: Convex mutation calling Whisper API with base64 audio input, returning transcribed text.
</objective>

---
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
@src/lib/convex.ts
@.env.example
---
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add OpenAI dependency and env var</name>
  <files>package.json, .env.example, .env.local</files>
  <action>
    1. Run: npm install openai

    2. In .env.example, add:
       OPENAI_API_KEY=your_openai_api_key_here

    3. In .env.local, add placeholder (user will fill actual key):
       OPENAI_API_KEY=sk-placeholder

    Reference: 03-RESEARCH.md specifies openai library for Whisper API.
  </action>
  <verify>grep -q "openai" package.json && grep -q "OPENAI_API_KEY" .env.example</verify>
  <done>OpenAI SDK installed, OPENAI_API_KEY env var template added</done>
</task>

<task type="auto">
  <name>Task 2: Create Whisper transcription mutation</name>
  <files>src/convex/functions.ts</files>
  <action>
    Create or update src/convex/functions.ts with:

    1. Import OpenAI and Convex types:
       import { v } from 'convex/values';
       import { mutation, query } from './_generated/server';
       import OpenAI from 'openai';

    2. Define voice mutation schema:
       export const transcribeAudio = mutation({
         args: {
           audioData: v.string(), // base64-encoded audio
           language: v.string(), // 'id' for Indonesian, 'en' for English
         },
         handler: async (_, { audioData, language }) => {
           // Initialize OpenAI client
           const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

           // Convert base64 to File object
           const base64Data = audioData.split(',')[1]; // Remove data:audio/... prefix
           const buffer = Buffer.from(base64Data, 'base64');
           const file = new File([buffer], 'audio.webm', { type: 'audio/webm' });

           // Call Whisper API
           const response = await openai.audio.transcriptions.create({
             file: file,
             model: 'whisper-1',
             language: language === 'id' ? 'indonesian' : 'english',
           });

           return { text: response.text };
         },
       });

    Reference: 03-RESEARCH.md Pattern 4 "Voice Input with Whisper API" example. Use whisper-1 model, language parameter for Indonesian/English.

    Note: Convex processes mutations on server side where process.env is available. OPENAI_API_KEY must be set in Convex deployment environment.
  </action>
  <verify>grep -q "transcribeAudio" src/convex/functions.ts && grep -q "whisper-1" src/convex/functions.ts && grep -q "openai" src/convex/functions.ts</verify>
  <done>Convex mutation created for Whisper API transcription with Indonesian/English support</done>
</task>

<task type="auto">
  <name>Task 3: Verify Convex client exports</name>
  <files>src/lib/convex.ts</files>
  <action>
    Verify src/lib/convex.ts exports:
    - convex client instance (already exists from Phase 1)
    - Any type exports needed for voice mutations

    If convex.ts doesn't exist or is incomplete, add:
       import { ConvexReactClient } from 'convex/react';
       import convexConfig from './convex.config';
       export const convex = new ConvexReactClient(convexConfig.convexUrl);

    Reference: Phase 1 Plan 04 created Convex client initialization.
  </action>
  <verify>grep -q "export.*convex" src/lib/convex.ts || grep -q "ConvexReactClient" src/lib/convex.ts</verify>
  <done>Convex client verified and exported for use in voice input hook</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. OpenAI dependency installed in package.json
2. OPENAI_API_KEY template in .env.example
3. transcribeAudio mutation exists in src/convex/functions.ts
4. Mutation accepts base64 audio data and language parameter
5. Whisper API call uses whisper-1 model with Indonesian/English language support
6. Mutation returns transcribed text string
</verification>

<success_criteria>
1. Convex mutation callable from client with audio base64 and language
2. Whisper API integration follows OpenAI SDK patterns
3. Indonesian language support via language: 'indonesian' parameter
4. English language support via language: 'english' parameter
5. Server-side execution keeps API key secure
6. Environment variable documented for deployment configuration
</success_criteria>

<output>
After completion, create `.planning/phases/03-form-filling/03-form-filling-04-SUMMARY.md`
</output>
