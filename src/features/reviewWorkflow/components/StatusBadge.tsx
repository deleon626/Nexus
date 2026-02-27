/**
 * StatusBadge Component
 *
 * Status badge with traffic light colors for submission status.
 * Used in ReviewerDashboard and WorkerStatusView.
 */

import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

interface StatusBadgeProps {
  status: SubmissionStatus;
}

const statusConfig = {
  pending: {
    variant: 'pending' as const,
    icon: Clock,
    label: 'Pending',
  },
  approved: {
    variant: 'approved' as const,
    icon: CheckCircle,
    label: 'Approved',
  },
  rejected: {
    variant: 'rejected' as const,
    icon: XCircle,
    label: 'Rejected',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
