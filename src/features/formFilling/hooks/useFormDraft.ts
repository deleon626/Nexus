/**
 * useFormDraft Hook
 *
 * Auto-save draft persistence hook for form filling sessions.
 * Automatically saves form data to IndexedDB every 30 seconds.
 *
 * Key features:
 * - 30-second auto-save interval (configurable via AUTOSAVE_INTERVAL_MS)
 * - Auto-generated draft names: "Form Name - Batch 123 - Feb 27"
 * - Draft expiration after 7 days (via DRAFT_EXPIRY_MS)
 * - Manual save, delete, and query functions
 * - Uses crypto.randomUUID() for localId generation
 *
 * @see 03-RESEARCH.md Pattern 2 "Draft Auto-Save with Dexie"
 * @see 03-CONTEXT.md "Auto-Save" section
 */

import { useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { db } from '@/db/dexie';
import type { Draft } from '@/db/types';
import { DRAFT_EXPIRY_MS, AUTOSAVE_INTERVAL_MS, DRAFT_DATE_FORMAT } from '../constants';
import { useAuth } from '@/context/AuthContext';

// ============================================================================
// Types
// ============================================================================

/**
 * Draft metadata for display in draft picker
 */
export interface DraftMetadata {
  localId: string;
  formName: string;
  batchNumber: string;
  createdAt: Date;
  expiresAt: number;
}

/**
 * Options for useFormDraft hook
 */
export interface UseFormDraftOptions {
  /** Form template ID */
  formId: string;
  /** Form name for draft display */
  formName: string;
  /** Production batch number */
  batchNumber: string;
}

/**
 * Return value for useFormDraft hook
 */
export interface UseFormDraftReturn {
  /** Current draft local ID (undefined until first save) */
  draftId: string | undefined;
  /** Manually trigger draft save */
  saveDraft: () => Promise<string | null>;
  /** Delete current draft from IndexedDB */
  deleteDraft: () => Promise<void>;
  /** Get all drafts for this form (for resume modal) */
  getDraftsByForm: () => Promise<DraftMetadata[]>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Auto-save draft persistence hook
 *
 * Automatically saves form data every 30 seconds to IndexedDB.
 * Generates draft names in format: "Form Name - Batch 123 - Feb 27"
 *
 * @param options - Form identification and metadata
 * @param formData - Current form field values (reactive)
 * @returns Draft management functions
 *
 * @example
 * ```tsx
 * const { draftId, saveDraft, deleteDraft, getDraftsByForm } = useFormDraft(
 *   { formId: 'tmpl-123', formName: 'Quality Check', batchNumber: 'BATCH-456' },
 *   formData
 * );
 * ```
 */
export function useFormDraft(
  options: UseFormDraftOptions,
  formData: Record<string, any>
): UseFormDraftReturn {
  const { formId, formName, batchNumber } = options;
  const { userId, orgId } = useAuth();

  // Track current draft local ID
  const draftIdRef = useRef<string | undefined>(undefined);

  /**
   * Generate auto-generated draft name
   * Format: "Form Name - Batch 123 - Feb 27"
   */
  const generateDraftName = useCallback((): string => {
    const dateStr = format(new Date(), DRAFT_DATE_FORMAT);
    return `${formName} - Batch ${batchNumber} - ${dateStr}`;
  }, [formName, batchNumber]);

  /**
   * Save draft to IndexedDB
   * Creates new draft or updates existing one
   */
  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (!userId || !orgId) {
      console.warn('[useFormDraft] User not authenticated, skipping save');
      return null;
    }

    try {
      // Generate or reuse localId
      const localId = draftIdRef.current || crypto.randomUUID();

      // Calculate expiration (7 days from now)
      const expiresAt = Date.now() + DRAFT_EXPIRY_MS;

      // Create draft record
      const draft: Draft = {
        localId,
        formId,
        formName: generateDraftName(),
        batchNumber,
        formData: { ...formData }, // Clone to avoid reference issues
        orgId,
        userId,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to IndexedDB (upserts based on localId)
      await db.drafts.put(draft);

      // Store draft ID for subsequent saves
      if (!draftIdRef.current) {
        draftIdRef.current = localId;
      }

      console.log(`[useFormDraft] Draft saved: ${localId}`);
      return localId;
    } catch (error) {
      console.error('[useFormDraft] Failed to save draft:', error);
      return null;
    }
  }, [formData, formId, formName, batchNumber, userId, orgId, generateDraftName]);

  /**
   * Delete current draft from IndexedDB
   */
  const deleteDraft = useCallback(async () => {
    if (!draftIdRef.current) {
      console.warn('[useFormDraft] No draft to delete');
      return;
    }

    try {
      await db.drafts.delete(draftIdRef.current);
      draftIdRef.current = undefined;
      console.log(`[useFormDraft] Draft deleted`);
    } catch (error) {
      console.error('[useFormDraft] Failed to delete draft:', error);
    }
  }, []);

  /**
   * Get all drafts for this form (for resume modal)
   * Returns drafts that haven't expired, sorted by creation date (newest first)
   */
  const getDraftsByForm = useCallback(async (): Promise<DraftMetadata[]> => {
    if (!orgId) {
      console.warn('[useFormDraft] No orgId, cannot query drafts');
      return [];
    }

    try {
      const now = Date.now();

      // Query drafts by formId and filter by expiration
      const drafts = await db.drafts
        .where('formId')
        .equals(formId)
        .and((draft) => draft.orgId === orgId && draft.expiresAt > now)
        .toArray();

      // Sort by creation date (newest first)
      const sorted = drafts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((draft) => ({
          localId: draft.localId,
          formName: draft.formName,
          batchNumber: draft.batchNumber,
          createdAt: draft.createdAt,
          expiresAt: draft.expiresAt,
        }));

      return sorted;
    } catch (error) {
      console.error('[useFormDraft] Failed to query drafts:', error);
      return [];
    }
  }, [formId, orgId]);

  /**
   * Auto-save effect
   * Runs every 30 seconds to save form data
   */
  useEffect(() => {
    if (!userId || !orgId) {
      return;
    }

    // Initial save after 1 second (don't save empty form immediately)
    const initialSaveTimeout = setTimeout(() => {
      saveDraft();
    }, 1000);

    // Set up interval for auto-save
    const intervalId = setInterval(() => {
      saveDraft();
    }, AUTOSAVE_INTERVAL_MS);

    // Cleanup: Clear interval and timeout
    return () => {
      clearTimeout(initialSaveTimeout);
      clearInterval(intervalId);
    };
  }, [formData, userId, orgId, saveDraft]);

  return {
    draftId: draftIdRef.current,
    saveDraft,
    deleteDraft,
    getDraftsByForm,
  };
}
