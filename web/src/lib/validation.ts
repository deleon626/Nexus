/**
 * Zod validation schemas for frontend forms and data
 */

import { z } from 'zod';

/**
 * Message schema for chat messages
 */
export const messageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message cannot be empty'),
  created_at: z.string().datetime(),
});

export type Message = z.infer<typeof messageSchema>;

/**
 * Session schema
 */
export const sessionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active', 'completed']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export type Session = z.infer<typeof sessionSchema>;

/**
 * Extracted data field schema
 */
export const extractedFieldSchema = z.object({
  name: z.string(),
  value: z.any(),
  type: z.enum(['string', 'number', 'boolean', 'date']).optional(),
  unit: z.string().optional(),
});

export type ExtractedField = z.infer<typeof extractedFieldSchema>;

/**
 * Confirmation modal schema
 */
export const confirmationModalSchema = z.object({
  confirmation_id: z.string().uuid(),
  session_id: z.string().uuid(),
  schema_id: z.string().uuid().optional(),
  extracted_data: z.record(z.string(), z.any()),
  created_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }),
});

export type ConfirmationModal = z.infer<typeof confirmationModalSchema>;

/**
 * Confirmation form schema (for editing extracted data)
 */
export const confirmationFormSchema = z.object({
  data: z.record(z.string(), z.any()),
});

export type ConfirmationForm = z.infer<typeof confirmationFormSchema>;

/**
 * Transcription request schema
 */
export const transcriptionRequestSchema = z.object({
  audioFile: z.instanceof(File).refine(
    (file) => file.type.startsWith('audio/'),
    'File must be an audio file'
  ),
  language: z.string().length(2).optional(), // ISO 639-1 code
});

export type TranscriptionRequest = z.infer<typeof transcriptionRequestSchema>;

/**
 * Chat input schema
 */
export const chatInputSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
});

export type ChatInput = z.infer<typeof chatInputSchema>;

/**
 * Report schema
 */
export const reportSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  confirmation_id: z.string().uuid().optional(),
  data: z.record(z.string(), z.any()),
  status: z.enum(['pending_approval', 'approved', 'rejected']),
  created_at: z.string().datetime({ offset: true }),
  created_by: z.string().optional(),
});

export type Report = z.infer<typeof reportSchema>;
