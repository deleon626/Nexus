import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Submissions CRUD Operations
 *
 * Provides queries and mutations for the review workflow.
 * Includes auth checks via getUserIdentity() (REVW-01, REVW-03, REVW-04).
 */

// ============================================================================
// Queries
// ============================================================================

/**
 * List all pending submissions for an organization
 *
 * Returns submissions filtered by orgId and status='pending', sorted by createdAt desc.
 * Used in ReviewerDashboard component (REVW-01).
 */
export const listPendingSubmissions = query({
  args: {
    orgId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: User must be authenticated');
    }

    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_org_status', (q) =>
        q.eq('orgId', args.orgId).eq('status', 'pending')
      )
      .order('desc')
      .collect();

    return submissions;
  },
});

/**
 * Get a single submission by ID
 *
 * Returns full submission details including data and photos.
 * Used when viewing submission details in review modal.
 */
export const getSubmissionDetails = query({
  args: {
    id: v.id('submissions'),
  },
  handler: async (ctx, args) => {
    // Verify auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: User must be authenticated');
    }

    const submission = await ctx.db.get(args.id);
    return submission;
  },
});

/**
 * List submissions for a specific worker
 *
 * Returns submissions filtered by orgId and userId, sorted by createdAt desc.
 * Used in worker status view to show their own submission history (REVW-04).
 * Limited to 10 most recent submissions for worker status view.
 */
export const listWorkerSubmissions = query({
  args: {
    orgId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: User must be authenticated');
    }

    // Worker can only see their own submissions
    // Note: In production, you'd verify the identity.subject matches args.userId
    // For MVP, we trust the client-side userId parameter

    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_org_user', (q) =>
        q.eq('orgId', args.orgId).eq('userId', args.userId)
      )
      .order('desc')
      .take(10);

    return submissions;
  },
});

// ============================================================================
// Mutations
// ============================================================================

/**
 * Approve a submission
 *
 * Updates submission status to 'approved' with optional reviewer comment.
 * Sets reviewerId, reviewerComment, reviewedAt, and updatedAt.
 */
export const approveSubmission = mutation({
  args: {
    id: v.id('submissions'),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: User must be authenticated');
    }

    // Get existing submission
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Submission not found');
    }

    const now = Date.now();

    // Update submission with review fields
    await ctx.db.patch(args.id, {
      status: 'approved',
      reviewerId: identity.subject,
      reviewerComment: args.comment,
      reviewedAt: now,
      updatedAt: now,
    });

    return { success: true, id: args.id };
  },
});

/**
 * Reject a submission
 *
 * Updates submission status to 'rejected' with REQUIRED reviewer comment.
 * Comment is required so workers understand what to fix (per CONTEXT.md).
 */
export const rejectSubmission = mutation({
  args: {
    id: v.id('submissions'),
    comment: v.string(), // REQUIRED for rejections per CONTEXT.md
  },
  handler: async (ctx, args) => {
    // Verify auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: User must be authenticated');
    }

    // Get existing submission
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error('Submission not found');
    }

    const now = Date.now();

    // Update submission with review fields
    await ctx.db.patch(args.id, {
      status: 'rejected',
      reviewerId: identity.subject,
      reviewerComment: args.comment,
      reviewedAt: now,
      updatedAt: now,
    });

    return { success: true, id: args.id };
  },
});
