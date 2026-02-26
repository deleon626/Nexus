import { mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Voice Transcription Operations
 *
 * Provides Whisper API integration for voice-to-text transcription.
 * Supports Indonesian and English languages for form filling.
 * Online-only feature - requires OPENAI_API_KEY in Convex environment.
 *
 * Requirement: FILL-03 - Worker can fill forms using voice input
 */

/**
 * Transcribe audio using OpenAI Whisper API
 *
 * Accepts base64-encoded audio data and returns transcribed text.
 * Supports Indonesian ('id') and English ('en') languages.
 *
 * @param audioData - Base64-encoded audio data (e.g., "data:audio/webm;base64,...")
 * @param language - Language code: 'id' for Indonesian, 'en' for English
 * @returns Transcribed text string
 */
export const transcribeAudio = mutation({
  args: {
    audioData: v.string(), // base64-encoded audio
    language: v.string(), // 'id' for Indonesian, 'en' for English
  },
  handler: async (_, { audioData, language }) => {
    // Validate environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured in Convex environment');
    }

    // Dynamic import for OpenAI (server-side only)
    const OpenAI = (await import('openai')).default;

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Convert base64 to buffer
    // Handle both with and without data URL prefix
    let base64Data = audioData;
    if (audioData.includes(',')) {
      base64Data = audioData.split(',')[1];
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Create File object for Whisper API
    const file = new File([buffer], 'audio.webm', { type: 'audio/webm' });

    // Map language codes to Whisper API format
    const languageMap: Record<string, string> = {
      id: 'indonesian',
      en: 'english',
    };

    const whisperLanguage = languageMap[language] || 'english';

    // Call Whisper API
    try {
      const response = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: whisperLanguage,
      });

      return { text: response.text };
    } catch (error) {
      // Log error for debugging but return user-friendly message
      console.error('Whisper API error:', error);

      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Invalid OpenAI API key');
        }
        if (error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again.');
        }
        if (error.message.includes('file_too_large')) {
          throw new Error('Audio file too large. Please record a shorter message.');
        }
      }

      throw new Error('Failed to transcribe audio. Please try again.');
    }
  },
});
