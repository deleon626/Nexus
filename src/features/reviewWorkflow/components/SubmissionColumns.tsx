/**
 * SubmissionColumns
 *
 * Column definitions for @tanstack/react-table in the ReviewerDashboard.
 */

import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { StatusBadge, SubmissionStatus } from './StatusBadge';

/**
 * Form field value type (from Phase 3 form filling)
 */
type FormDataValue = string | number | boolean | null;

/**
 * Submission type matching Convex schema
 */
export interface Submission {
  _id: string;
  batchNumber: string;
  templateName: string;
  workerName: string;
  createdAt: number;
  status: SubmissionStatus;
  data?: Record<string, FormDataValue>; // Form field values (full details for review dialog)
}

interface ColumnOptions {
  onReview: (submission: Submission) => void;
}

/**
 * Create column definitions for submission table
 */
export function createSubmissionColumns({
  onReview,
}: ColumnOptions): ColumnDef<Submission>[] {
  return [
    {
      accessorKey: 'batchNumber',
      header: 'Batch',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.batchNumber}</span>
      ),
    },
    {
      accessorKey: 'templateName',
      header: 'Form',
      cell: ({ row }) => row.original.templateName,
    },
    {
      accessorKey: 'workerName',
      header: 'Worker',
      cell: ({ row }) => row.original.workerName,
    },
    {
      accessorKey: 'createdAt',
      header: 'Submitted',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDistanceToNow(row.original.createdAt, { addSuffix: true })}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReview(row.original)}
        >
          Review
        </Button>
      ),
    },
  ];
}
