/**
 * ReviewerDashboard Page
 *
 * Dashboard for reviewers to view and manage pending submissions.
 * Displays paginated table with batch, form, worker, submitted time, and status.
 */

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { SubmissionTable, Submission } from '@/features/reviewWorkflow/components/SubmissionTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReviewerDashboard() {
  const { orgId } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Use skip pattern to avoid auth race condition
  const submissions = useQuery(
    api.submissions.listPendingSubmissions,
    orgId ? { orgId } : 'skip'
  );

  // Loading state
  if (submissions === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading submissions...</p>
      </div>
    );
  }

  // Handle review button click
  const handleReview = (submission: Submission) => {
    setSelectedSubmission(submission);
    // TODO: Open review modal (Plan 04)
    console.log('Review submission:', submission._id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Review Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {submissions.length} pending submission{submissions.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Pending Submissions</CardTitle>
            <CardDescription>
              All submissions have been reviewed. Check back later for new submissions.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <SubmissionTable
          data={submissions as Submission[]}
          onReview={handleReview}
        />
      )}
    </div>
  );
}
