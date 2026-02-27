/**
 * ReviewDialog Component
 *
 * Modal for viewing submission details and approving/rejecting.
 * Displays form data, photos, and provides approve/reject actions.
 * Reject button is disabled until comment is entered.
 */

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { format } from 'date-fns';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, SubmissionStatus } from './StatusBadge';

interface ReviewDialogProps {
  submission: Submission | null;
  onClose: () => void;
}

/**
 * Full submission type with all fields from Convex schema
 */
export interface Submission {
  _id: string;
  batchNumber: string;
  templateName: string;
  workerName: string;
  createdAt: number;
  status: SubmissionStatus;
  data: Record<string, FormDataValue>;
}

/**
 * Form field value type (from Phase 3 form filling)
 */
type FormDataValue = string | number | boolean | null;

export function ReviewDialog({ submission, onClose }: ReviewDialogProps) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Mutations for approve/reject
  const approveMutation = useMutation(api.submissions.approveSubmission);
  const rejectMutation = useMutation(api.submissions.rejectSubmission);

  // Loading states
  const isApproving = approveMutation.status === 'loading';
  const isRejecting = rejectMutation.status === 'loading';
  const isLoading = isApproving || isRejecting;

  // Check if reject should be disabled
  const isRejectDisabled = comment.trim() === '' || isLoading;

  // Handle approve action
  const handleApprove = async () => {
    if (!submission) return;

    setError(null);
    try {
      await approveMutation({
        id: submission._id as Id<'submissions'>,
        comment: comment.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve submission');
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!submission || comment.trim() === '') return;

    setError(null);
    try {
      await rejectMutation({
        id: submission._id as Id<'submissions'>,
        comment: comment.trim(),
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject submission');
    }
  };

  // Close and reset state
  const handleClose = () => {
    setComment('');
    setError(null);
    onClose();
  };

  // Extract photos from form data (base64 strings)
  const getPhotosFromData = (): string[] => {
    if (!submission?.data) return [];

    const photos: string[] = [];
    Object.values(submission.data).forEach((value) => {
      // Photo fields are base64 strings starting with data:image
      if (typeof value === 'string' && value.startsWith('data:image')) {
        photos.push(value);
      }
    });
    return photos;
  };

  // Check if value is a photo
  const isPhoto = (value: FormDataValue): boolean => {
    return typeof value === 'string' && value.startsWith('data:image');
  };

  // Format value for display
  const formatValue = (value: FormDataValue): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Don't render if no submission
  if (!submission) return null;

  const photos = getPhotosFromData();

  return (
    <Dialog open={!!submission} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Submission - Batch {submission.batchNumber}</DialogTitle>
          <DialogDescription>
            {submission.templateName} by {submission.workerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Submission Metadata */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">
              Submission Details
            </h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Batch Number</dt>
                <dd className="font-medium">{submission.batchNumber}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Form Type</dt>
                <dd className="font-medium">{submission.templateName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Worker</dt>
                <dd className="font-medium">{submission.workerName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium">
                  {format(submission.createdAt, 'PPp')}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={submission.status} />
                </dd>
              </div>
            </dl>
          </div>

          {/* Form Data Section */}
          {submission.data && Object.keys(submission.data).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                Form Data
              </h3>
              <dl className="space-y-2 text-sm">
                {Object.entries(submission.data).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <dt className="text-muted-foreground min-w-[120px]">{key}:</dt>
                    <dd className="font-medium">
                      {isPhoto(value) ? (
                        <span className="text-muted-foreground italic">
                          (see photos below)
                        </span>
                      ) : (
                        formatValue(value)
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Photo Gallery Section */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                Attached Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <a
                    key={index}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border hover:opacity-80 transition-opacity cursor-zoom-in"
                    />
                  </a>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click a photo to view full size
              </p>
            </div>
          )}

          {/* Comment Section */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">
              Review Comment
            </h3>
            <Textarea
              placeholder="Add a comment (required for rejection)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Optional for approval, required for rejection
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isRejectDisabled}
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </Button>
          <Button onClick={handleApprove} disabled={isLoading}>
            {isApproving ? 'Approving...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
