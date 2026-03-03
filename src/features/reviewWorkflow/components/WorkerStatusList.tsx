/**
 * WorkerStatusList Component
 *
 * Shows workers their recent submissions with real-time status updates.
 * Per CONTEXT.md: Section at top of /worker/forms, shows last 5-10 submissions.
 * Uses Convex useQuery for real-time reactivity - no manual refresh needed.
 */

import { useRef, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@convex/_generated/api';
import { StatusBadge, SubmissionStatus } from './StatusBadge';

interface WorkerStatusListProps {
  orgId: string;
  userId: string;
}

interface Submission {
  _id: string;
  _creationTime: number;
  batchNumber: string;
  templateId: string;
  templateName?: string;
  status: string; // Accept string from Convex, cast when used
  reviewerComment?: string;
  createdAt: number;
  reviewedAt?: number;
}

/**
 * WorkerStatusList displays the worker's recent submission history.
 * Features:
 * - Real-time updates via Convex reactivity
 * - Status badges with icons
 * - Rejection reason display
 * - Relative time formatting
 * - Pulse animation on status change
 */
export function WorkerStatusList({ orgId, userId }: WorkerStatusListProps) {
  // Track previous submissions for change detection
  const prevSubmissionsRef = useRef<Submission[] | undefined>(undefined);
  const animationTriggerRef = useRef<string | null>(null);

  // Query worker's submissions - skip if missing args
  const submissions = useQuery(
    api.submissions.listWorkerSubmissions,
    (orgId && userId) ? { orgId, userId } : 'skip'
  );

  // Detect status changes and trigger animation
  useEffect(() => {
    if (!submissions || !prevSubmissionsRef.current) {
      prevSubmissionsRef.current = submissions;
      return;
    }

    // Find submissions whose status changed
    for (const sub of submissions) {
      const prev = prevSubmissionsRef.current.find((p) => p._id === sub._id);
      if (prev && prev.status !== sub.status) {
        // Trigger animation for this submission
        animationTriggerRef.current = sub._id;
        // Clear animation trigger after animation completes
        setTimeout(() => {
          animationTriggerRef.current = null;
        }, 1000);
        break;
      }
    }

    prevSubmissionsRef.current = submissions;
  }, [submissions]);

  // Loading state
  if (submissions === undefined) {
    return (
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">My Recent Submissions</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-muted animate-pulse rounded-md"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">My Recent Submissions</h2>
        <p className="text-muted-foreground text-sm">
          No submissions yet. Fill out a form to see your submission history here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">My Recent Submissions</h2>
        <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          View all
        </span>
      </div>

      <div className="space-y-2">
        {submissions.map((submission) => {
          const isAnimating = animationTriggerRef.current === submission._id;

          return (
            <div
              key={submission._id}
              className={`flex items-start justify-between p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors ${
                isAnimating ? 'animate-pulse ring-2 ring-primary/50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    Batch {submission.batchNumber}
                  </span>
                  <span className="text-muted-foreground text-sm truncate">
                    {submission.templateName || 'Form'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(submission.createdAt, { addSuffix: true })}
                </div>

                {/* Show rejection reason if rejected */}
                {submission.status === 'rejected' && submission.reviewerComment && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1">
                    <span className="font-medium">Reason: </span>
                    {submission.reviewerComment}
                  </div>
                )}
              </div>

              <StatusBadge status={submission.status as SubmissionStatus} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
