/**
 * FormFillingPage Component
 *
 * Main page orchestrating the entire form filling flow:
 * - Form list with search and recent forms
 * - Batch number prompt after form selection
 * - Draft picker for forms with existing drafts
 * - Form filling with progress tracking and auto-save
 * - Submission confirmation before final submit
 * - Success screen after submission
 * - "Submit & Start New" for rapid batch processing
 *
 * This page manages all state transitions between the different
 * stages of the form filling workflow.
 */

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/dexie';
import type { Draft, Template } from '@/db/types';
import { useAuth, isDevModeWithoutCredentials } from '@/context/AuthContext';
import { triggerSync } from '@/db/sync';
import type { FormTemplate, FormDataRecord } from '@/features/formBuilder/types';
import { FormList } from '../components/FormList';
import { BatchNumberPrompt } from '../components/BatchNumberPrompt';
import { DraftPickerModal } from '../components/DraftPickerModal';
import { FormFiller } from '../components/FormFiller';
import { SubmissionSummary } from '../components/SubmissionSummary';
import { SuccessScreen } from '../components/SuccessScreen';
import { WorkerStatusList } from '@/features/reviewWorkflow/components/WorkerStatusList';
import { useUserIdentity } from '@/components/layout/NavItem';

// ============================================================================
// Page State Enum
// ============================================================================

/**
 * All possible states of the form filling page.
 * Using a discriminated union pattern for type-safe state management.
 */
type PageState =
  | 'listing'        // Showing FormList
  | 'batchPrompt'    // Showing BatchNumberPrompt
  | 'draftPicker'    // Showing DraftPickerModal
  | 'filling'        // Showing FormFiller
  | 'confirming'     // Showing SubmissionSummary
  | 'success';       // Showing SuccessScreen

// ============================================================================
// Component
// ============================================================================

export function FormFillingPage() {
  const { userId, orgId } = useAuth();
  const userIdentity = useUserIdentity();
  const workerName = userIdentity.name || 'Worker';

  // Page state
  const [pageState, setPageState] = useState<PageState>('listing');

  // Form selection state
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [batchNumber, setBatchNumber] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [formData, setFormData] = useState<FormDataRecord>({});
  const [existingDrafts, setExistingDrafts] = useState<Draft[]>([]);

  // Load form template from Dexie
  const loadFormTemplate = useCallback(async (formId: string): Promise<FormTemplate | null> => {
    try {
      const template = await db.templates.get(formId);
      if (!template) {
        console.error('Template not found:', formId);
        return null;
      }

      // Convert Template to FormTemplate
      const formTemplate: FormTemplate = {
        id: template.id,
        name: template.name,
        version: template.version,
        orgId: template.orgId,
        fields: template.fields as any, // FormField[]
        published: template.published,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        publishedAt: template.publishedAt,
        createdBy: template.createdBy,
      };

      return formTemplate;
    } catch (error) {
      console.error('Failed to load form template:', error);
      return null;
    }
  }, []);

  // Load drafts for a specific form
  const loadFormDrafts = useCallback(async (formId: string): Promise<Draft[]> => {
    try {
      const drafts = await db.drafts
        .where('formId')
        .equals(formId)
        .and((draft) => draft.expiresAt > Date.now())
        .toArray();
      return drafts;
    } catch (error) {
      console.error('Failed to load drafts:', error);
      return [];
    }
  }, []);

  // ==========================================================================
  // Flow Handlers
  // ==========================================================================

  /**
   * Handle form selection from FormList
   * Check for existing drafts and show appropriate next step
   */
  const handleFormSelect = useCallback(async (formId: string, formName: string) => {
    const formTemplate = await loadFormTemplate(formId);
    if (!formTemplate) return;

    setSelectedForm(formTemplate);

    // Check for existing drafts
    const drafts = await loadFormDrafts(formId);
    setExistingDrafts(drafts);

    if (drafts.length > 0) {
      // Show draft picker if drafts exist
      setPageState('draftPicker');
    } else {
      // Show batch prompt if no drafts
      setPageState('batchPrompt');
    }
  }, [loadFormTemplate, loadFormDrafts]);

  /**
   * Handle batch number submission
   * Transition to filling state
   */
  const handleBatchNumberSubmit = useCallback((batch: string) => {
    setBatchNumber(batch);
    setPageState('filling');
  }, []);

  /**
   * Handle cancel from batch prompt or draft picker
   * Return to form list
   */
  const handleCancel = useCallback(() => {
    setPageState('listing');
    setSelectedForm(null);
    setBatchNumber(null);
    setSelectedDraft(null);
    setExistingDrafts([]);
  }, []);

  /**
   * Handle resume draft selection
   * Load draft data and transition to filling
   */
  const handleResumeDraft = useCallback((draft: Draft) => {
    setSelectedDraft(draft);
    setBatchNumber(draft.batchNumber);
    setFormData(draft.formData);
    setPageState('filling');
  }, []);

  /**
   * Handle "start new" from draft picker
   * Clear draft data and show batch prompt
   */
  const handleStartNew = useCallback(() => {
    setSelectedDraft(null);
    setBatchNumber(null);
    setPageState('batchPrompt');
  }, []);

  /**
   * Handle form submission from FormFiller
   * Transition to confirmation state
   */
  const handleFormSubmit = useCallback((data: FormDataRecord) => {
    setFormData(data);
    setPageState('confirming');
  }, []);

  /**
   * Handle edit from submission summary
   * Return to filling state
   */
  const handleEdit = useCallback(() => {
    setPageState('filling');
  }, []);

  /**
   * Handle final confirmation and submission
   * Save submission to db, delete draft, transition to success
   */
  const handleConfirmSubmit = useCallback(async () => {
    if (!selectedForm || !batchNumber || !userId || !orgId) {
      console.error('Missing required data for submission');
      return;
    }

    try {
      // Create submission object
      const localId = uuidv4();
      const now = new Date();

      const submission = {
        localId,
        batchNumber,
        templateId: selectedForm.id,
        orgId,
        userId,
        data: formData,
        photos: [], // Photos are embedded in formData as base64
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now,
      };

      // Save to db.submissions
      await db.submissions.add(submission);

      // Add to sync queue with templateName and workerName for Convex
      await db.syncQueue.add({
        localId: uuidv4(),
        operation: 'create' as const,
        endpoint: '/submissions',
        recordId: localId,
        recordType: 'submission',
        payload: {
          ...submission,
          templateName: selectedForm.name,
          workerName,
        },
        status: 'pending' as const,
        attemptCount: 0,
        createdAt: now,
      });

      // Delete draft if exists
      if (selectedDraft?.localId) {
        await db.drafts.delete(selectedDraft.localId);
      }

      // Trigger immediate sync (don't wait for 30s interval)
      triggerSync().catch(console.error);

      // Transition to success screen
      setPageState('success');
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  }, [selectedForm, batchNumber, userId, orgId, formData, selectedDraft, workerName]);

  /**
   * Handle "Submit & Start New"
   * Save submission, delete draft, return to batch prompt for new batch
   */
  const handleSubmitAndStartNew = useCallback(async (data: FormDataRecord) => {
    if (!selectedForm || !batchNumber || !userId || !orgId) {
      console.error('Missing required data for submission');
      return;
    }

    try {
      // Create submission object
      const localId = uuidv4();
      const now = new Date();

      const submission = {
        localId,
        batchNumber,
        templateId: selectedForm.id,
        orgId,
        userId,
        data: formData,
        photos: [], // Photos are embedded in formData as base64
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now,
      };

      // Save to db.submissions
      await db.submissions.add(submission);

      // Add to sync queue with templateName and workerName for Convex
      await db.syncQueue.add({
        localId: uuidv4(),
        operation: 'create' as const,
        endpoint: '/submissions',
        recordId: localId,
        recordType: 'submission',
        payload: {
          ...submission,
          templateName: selectedForm.name,
          workerName,
        },
        status: 'pending' as const,
        attemptCount: 0,
        createdAt: now,
      });

      // Delete draft if exists
      if (selectedDraft?.localId) {
        await db.drafts.delete(selectedDraft.localId);
      }

      // Trigger immediate sync (don't wait for 30s interval)
      triggerSync().catch(console.error);

      // Clear form state and show batch prompt for new batch
      setFormData({});
      setSelectedDraft(null);
      setBatchNumber(null);
      setPageState('batchPrompt');
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  }, [selectedForm, batchNumber, userId, orgId, formData, selectedDraft, workerName]);

  /**
   * Handle done from success screen
   * Return to form list
   */
  const handleDone = useCallback(() => {
    setPageState('listing');
    setSelectedForm(null);
    setBatchNumber(null);
    setSelectedDraft(null);
    setFormData({});
    setExistingDrafts([]);
  }, []);

  // ==========================================================================
  // Render
  // ==========================================================================

  // Show form list with worker status at top
  if (pageState === 'listing') {
    return (
      <div className="space-y-6">
        {userId && orgId && (
          <WorkerStatusList orgId={orgId} userId={userId} />
        )}
        <FormList onFormSelect={handleFormSelect} />
      </div>
    );
  }

  // Show batch number prompt
  if (pageState === 'batchPrompt' && selectedForm) {
    return (
      <BatchNumberPrompt
        formName={selectedForm.name}
        onSubmit={handleBatchNumberSubmit}
        onCancel={handleCancel}
      />
    );
  }

  // Show draft picker
  if (pageState === 'draftPicker' && selectedForm) {
    return (
      <DraftPickerModal
        formName={selectedForm.name}
        drafts={existingDrafts}
        onResumeDraft={handleResumeDraft}
        onStartNew={handleStartNew}
        onCancel={handleCancel}
      />
    );
  }

  // Show form filler
  if (pageState === 'filling' && selectedForm && batchNumber) {
    return (
      <FormFiller
        template={selectedForm}
        batchNumber={batchNumber}
        draftId={selectedDraft?.localId}
        initialData={selectedDraft?.formData}
        onSubmit={handleFormSubmit}
        onSubmitAndStartNew={handleSubmitAndStartNew}
      />
    );
  }

  // Show submission summary
  if (pageState === 'confirming' && selectedForm && batchNumber) {
    return (
      <SubmissionSummary
        template={selectedForm}
        formData={formData}
        batchNumber={batchNumber}
        onConfirm={handleConfirmSubmit}
        onEdit={handleEdit}
      />
    );
  }

  // Show success screen
  if (pageState === 'success') {
    return <SuccessScreen onDone={handleDone} />;
  }

  // Fallback (should not happen)
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}
