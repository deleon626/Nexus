/**
 * SchemaList component - displays existing schemas in a searchable table.
 *
 * Features:
 * - Search by form name or code
 * - Multi-select with checkboxes for bulk operations
 * - Bulk archive with confirmation dialog
 * - Loading skeleton state
 * - Error state with retry
 * - Edit, Archive, and View Document actions
 */

import { useState } from 'react';
import { useSchemaList } from '../hooks/useSchemaList';
import { Skeleton } from './ui/skeleton';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { BulkActionBar } from './BulkActionBar';
import { BulkConfirmDialog } from './BulkConfirmDialog';
import { deleteSchema, bulkArchiveSchemas, getSchemaDocumentUrl } from '../services/schemaService';
import type { SchemaListItem } from '../types/schema';
import { FileText } from 'lucide-react';

interface SchemaListProps {
  onEdit?: (schema: SchemaListItem) => void;
  onArchive?: (schemaId: string) => void;
}

export function SchemaList({ onEdit, onArchive }: SchemaListProps) {
  const {
    filteredSchemas,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    refresh,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected,
    selectedCount,
  } = useSchemaList();

  const [isBulkArchiving, setIsBulkArchiving] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const handleArchive = async (schemaId: string) => {
    if (!confirm('Archive this schema? It will no longer appear in the active list.')) {
      return;
    }

    try {
      await deleteSchema(schemaId);
      await refresh();
      onArchive?.(schemaId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive schema');
    }
  };

  const handleBulkArchive = async () => {
    if (selectedCount === 0) return;

    setIsBulkArchiving(true);
    try {
      const result = await bulkArchiveSchemas(Array.from(selectedIds));

      if (result.errors.length > 0) {
        console.error('Bulk archive errors:', result.errors);
        alert(`Archived ${result.archived_count} schemas. ${result.errors.length} failed.`);
      }

      await refresh();
      clearSelection();
      setShowBulkConfirm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive schemas');
    } finally {
      setIsBulkArchiving(false);
    }
  };

  const handleViewDocument = (schemaId: string) => {
    const url = getSchemaDocumentUrl(schemaId);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="border rounded-lg">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={refresh}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-4">
        <Input
          type="text"
          placeholder="Search schemas by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={refresh}>
          Refresh
        </Button>
      </div>

      {/* Schema Table */}
      {filteredSchemas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm
            ? 'No schemas match your search.'
            : 'No schemas found. Create your first schema!'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Bulk Action Bar */}
          <BulkActionBar
            selectedCount={selectedCount}
            onArchive={() => setShowBulkConfirm(true)}
            onClearSelection={clearSelection}
            isArchiving={isBulkArchiving}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAll();
                      } else {
                        clearSelection();
                      }
                    }}
                    aria-label="Select all schemas"
                    className="h-5 w-5"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchemas.map((schema) => (
                <TableRow
                  key={schema.id}
                  className={selectedIds.has(schema.id) ? 'bg-primary/5' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(schema.id)}
                      onCheckedChange={() => toggleSelection(schema.id)}
                      aria-label={`Select ${schema.form_name}`}
                      className="h-5 w-5"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {schema.form_name}
                      {schema.has_source_document && (
                        <FileText
                          className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary"
                          onClick={() => handleViewDocument(schema.id)}
                          aria-label="View source document"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {schema.form_code}
                  </TableCell>
                  <TableCell>v{schema.version}</TableCell>
                  <TableCell>
                    <Badge
                      variant={schema.status === 'active' ? 'default' : 'secondary'}
                    >
                      {schema.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {schema.has_source_document && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDocument(schema.id)}
                        aria-label="View source document"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(schema)}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleArchive(schema.id)}
                    >
                      Archive
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bulk Confirm Dialog */}
      <BulkConfirmDialog
        open={showBulkConfirm}
        onOpenChange={setShowBulkConfirm}
        selectedCount={selectedCount}
        onConfirm={handleBulkArchive}
        isLoading={isBulkArchiving}
      />
    </div>
  );
}
