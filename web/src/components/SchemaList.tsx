/**
 * SchemaList component - displays existing schemas in a searchable table.
 *
 * Features:
 * - Search by form name or code
 * - Loading skeleton state
 * - Error state with retry
 * - Edit and Archive actions
 */

import { useSchemaList } from '../hooks/useSchemaList';
import { Skeleton } from './ui/skeleton';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { deleteSchema } from '../services/schemaService';
import type { SchemaListItem } from '../types/schema';

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
  } = useSchemaList();

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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchemas.map((schema) => (
                <TableRow key={schema.id}>
                  <TableCell className="font-medium">{schema.form_name}</TableCell>
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
    </div>
  );
}
