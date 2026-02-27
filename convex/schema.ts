import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Nexus Convex Schema
 *
 * Defines the database schema for form templates and related entities.
 * Form templates support version tracking for audit trail (FORM-04).
 * Server-side validation using Convex v.* validators (FORM-03).
 *
 * Phase 2: Form Builder - adds formTemplates table
 * Phase 4: Review Workflow - adds submissions table
 */
export default defineSchema({
  /**
   * Form Templates Table
   *
   * Stores form template definitions created by admins.
   * Templates have version tracking for audit trail (FORM-04).
   *
   * Indexes:
   * - by_org: Query all templates in an organization
   * - by_org_published: Query published templates for worker use
   */
  formTemplates: defineTable({
    // Template metadata
    name: v.string(),
    version: v.number(),
    orgId: v.string(), // Organization ID for multi-tenant isolation (AUTH-03)
    published: v.boolean(),

    // Form fields array with server-side validation
    fields: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        label: v.string(),
        required: v.boolean(),
        placeholder: v.optional(v.string()),
        helpText: v.optional(v.string()),
        // Field-specific validation (any type for flexibility)
        validation: v.optional(v.any()),
        // Options for select/checkbox fields
        options: v.optional(
          v.array(
            v.object({
              value: v.string(),
              label: v.string(),
            })
          )
        ),
        // Pass/fail field labels
        passLabel: v.optional(v.string()),
        failLabel: v.optional(v.string()),
        // Textarea rows
        rows: v.optional(v.number()),
      })
    ),

    // Audit fields
    createdBy: v.string(), // Clerk user ID
    publishedAt: v.optional(v.number()), // Unix timestamp, set when published
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index('by_org', ['orgId'])
    .index('by_org_published', ['orgId', 'published']),

  /**
   * Submissions Table
   *
   * Stores form submissions from workers for review workflow (Phase 4).
   * Tracks submission data, photos, and review status.
   *
   * Indexes:
   * - by_org_status: Query pending submissions for reviewer dashboard (REVW-01)
   * - by_org_user: Query worker's own submissions for status view (REVW-04)
   * - by_org: General org queries
   */
  submissions: defineTable({
    // Submission metadata
    batchNumber: v.string(), // Production batch association (OFFL-04)
    templateId: v.string(), // Reference to form template
    templateName: v.string(), // Denormalized for display
    orgId: v.string(), // Organization for multi-tenant isolation
    userId: v.string(), // Clerk user ID of worker who submitted
    workerName: v.string(), // Denormalized for display

    // Form data
    data: v.any(), // Form field values (JSON)
    photos: v.array(v.string()), // Array of base64 image strings (Phase 3 stores base64, not storage IDs)

    // Review status
    status: v.string(), // 'pending' | 'approved' | 'rejected'

    // Review fields (populated after review action)
    reviewerId: v.optional(v.string()), // Clerk user ID of reviewer
    reviewerComment: v.optional(v.string()), // Comment from review action
    reviewedAt: v.optional(v.number()), // Unix timestamp of review

    // Audit fields
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index('by_org_status', ['orgId', 'status'])
    .index('by_org_user', ['orgId', 'userId'])
    .index('by_org', ['orgId']),
});
