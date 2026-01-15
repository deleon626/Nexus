/**
 * SchemaInfoCard - Compact preview of a schema for selection contexts.
 * Shows field counts and structure overview without extraction metadata.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Hash, List, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExtractedSchemaStructure, SchemaField } from '@/types/schema';

interface SchemaInfoCardProps {
  formName: string;
  formCode: string;
  version: string;
  schema: ExtractedSchemaStructure;
  /** Show in collapsed mode initially */
  defaultCollapsed?: boolean;
}

function FieldSummary({ fields, label }: { fields: SchemaField[]; label: string }) {
  const [expanded, setExpanded] = useState(false);

  if (fields.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {label}
        <Badge variant="secondary" className="ml-auto">{fields.length}</Badge>
      </button>
      {expanded && (
        <div className="ml-6 space-y-1">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="truncate">{field.label}</span>
              <Badge variant="outline" className="text-xs shrink-0">{field.field_type}</Badge>
              {field.required && <Badge variant="secondary" className="text-xs shrink-0">Required</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SchemaInfoCard({
  formName,
  formCode,
  version,
  schema,
  defaultCollapsed = false
}: SchemaInfoCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const perSampleCount = schema.per_sample_fields?.length ?? 0;
  const batchCount = schema.batch_metadata_fields?.length ?? 0;
  const sectionCount = schema.sections?.length ?? 0;
  const totalFields = perSampleCount + batchCount;

  return (
    <Card className="w-full">
      <CardHeader className="py-3 px-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-base">{formName}</CardTitle>
              <div className="text-xs text-muted-foreground">
                {formCode} • v{version}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {totalFields} fields
              </span>
              {sectionCount > 0 && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {sectionCount} sections
                </span>
              )}
            </div>
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0 pb-3 px-4 space-y-3">
          {/* Per-Sample Fields */}
          <FieldSummary
            fields={schema.per_sample_fields ?? []}
            label="Per-Sample Fields"
          />

          {/* Batch Metadata Fields */}
          <FieldSummary
            fields={schema.batch_metadata_fields ?? []}
            label="Batch Metadata"
          />

          {/* Sections */}
          {sectionCount > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <List className="h-4 w-4" />
                Graded Sections
                <Badge variant="secondary" className="ml-auto">{sectionCount}</Badge>
              </div>
              <div className="ml-6 space-y-1">
                {schema.sections?.map((section) => (
                  <div key={section.id} className="text-sm text-gray-600">
                    {section.label}
                    {section.criteria?.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({section.criteria.length} criteria)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalFields === 0 && sectionCount === 0 && (
            <div className="text-sm text-muted-foreground text-center py-2">
              No fields defined in this schema
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
