/**
 * Bulk Action Bar component for multi-select operations.
 *
 * Displays when items are selected, showing:
 * - Selected count
 * - Clear selection button
 * - Bulk action buttons (Archive, etc.)
 */

import { Button } from './ui/button';

interface BulkActionBarProps {
  selectedCount: number;
  onArchive: () => void;
  onClearSelection: () => void;
  isArchiving: boolean;
}

export function BulkActionBar({
  selectedCount,
  onArchive,
  onClearSelection,
  isArchiving,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-primary/20 rounded-t-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} schema{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={onArchive}
        disabled={isArchiving}
      >
        {isArchiving ? 'Archiving...' : 'Archive Selected'}
      </Button>
    </div>
  );
}
