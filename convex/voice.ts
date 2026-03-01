import { action } from './_generated/server';
import { v } from 'convex/values';

/**
 * Voice Transcription Operations
 *
 * Provides OpenAI Whisper API integration for voice input.
 * Supports Indonesian (id) and English (en) languages.
 * Online-only functionality - requires OPENAI_API_KEY in Convex environment.
 *
 * @see 03-RESEARCH.md Pattern 4 "Voice Input with Whisper API"
 * @see 03-CONTEXT.md "Voice Input UX" section
 */

/**
 * Transcribe audio using OpenAI Whisper API
 *
 * Accepts base64-encoded audio data and returns transcribed text.
 * Language parameter controls Whisper language model (indonesian/english).
 *
 * @param audioData - Base64-encoded audio webm file
 * @param language - 'id' for Indonesian, 'en' for English
 * @returns Object with transcribed text
 *
 * @example
 * ```typescript
 * const result = await convex.mutations.voice.transcribeAudio({
 *   audioData: 'data:audio/webm;base64,...',
 *   language: 'id'
 * });
 * console.log(result.text); // "Hasil transkripsi"
 * ```
 */
export const transcribeAudio = action({
  args: {
    audioData: v.string(), // base64-encoded audio with data URL prefix
    language: v.string(), // 'id' for Indonesian, 'en' for English
  },
  handler: async (_, { audioData, language }) => {
    // Validate language parameter
    if (language !== 'id' && language !== 'en') {
      throw new Error(`Invalid language: ${language}. Must be 'id' or 'en'.`);
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured in Convex environment');
    }

    try {
      // Parse base64 data
      // Expected format: "data:audio/webm;base64,GkXfo..." or just base64
      let base64Data = audioData;
      let mimeType = 'audio/webm'; // default from MediaRecorder

      if (audioData.includes(',')) {
        const [prefix, data] = audioData.split(',', 2);
        base64Data = data;

        // Extract MIME type from data URL prefix if available
        const mimeMatch = prefix.match(/data:([^;]+);base64/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Validate buffer size (Whisper has 25MB limit)
      const maxSizeBytes = 25 * 1024 * 1024; // 25MB
      if (buffer.length > maxSizeBytes) {
        throw new Error(`Audio file too large: ${buffer.length} bytes. Maximum is ${maxSizeBytes} bytes.`);
      }

      // Create File object for OpenAI API
      const file = new File([buffer], `audio.${mimeType.split('/')[1] || 'webm'}`, {
        type: mimeType,
      });

      // Initialize OpenAI client
      // Note: In Convex server environment, we use dynamic import
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey });

      // Map language codes to Whisper API format
      const whisperLanguage = language === 'id' ? 'indonesian' : 'english';

      // Call Whisper API
      const response = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: whisperLanguage,
      });

      // Return transcribed text
      return { text: response.text };
    } catch (error) {
      // Log error for debugging
      console.error('[voice.transcribeAudio] Transcription failed:', error);

      // Re-throw with user-friendly message
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Voice transcription service unavailable');
        }
        if (error.message.includes('too large')) {
          throw new Error('Recording too long. Please speak for less than 30 seconds.');
        }
        throw error;
      }

      throw new Error('Transcription failed. Please try again.');
    }
  },
});
