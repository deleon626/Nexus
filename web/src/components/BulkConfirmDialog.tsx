/**
 * Bulk Confirm Dialog for destructive bulk operations.
 *
 * Requires explicit user confirmation before proceeding
 * with bulk archive/delete actions.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface BulkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
  isLoading: boolean;
}

export function BulkConfirmDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isLoading,
}: BulkConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive {selectedCount} Schema{selectedCount !== 1 ? 's' : ''}?</DialogTitle>
          <DialogDescription>
            This will archive {selectedCount} schema{selectedCount !== 1 ? 's' : ''}.
            Archived schemas will no longer appear in the active list and cannot be
            used for new QC submissions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Archiving...' : 'Archive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
