/**
 * SchemaPreview component to display extracted schema structure.
 * T028: Display extracted schema with sections, fields, and metadata
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExtractedSchemaStructure, ExtractionMetadata, SchemaField, SchemaSection } from '@/types/schema';

interface SchemaPreviewProps {
  schema: ExtractedSchemaStructure;
  metadata: ExtractionMetadata;
  confidenceScore: number;
}

function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const variant = score >= 0.8 ? 'default' : score >= 0.5 ? 'secondary' : 'destructive';

  return (
    <Badge variant={variant}>
      {percentage}% Confidence
    </Badge>
  );
}

function FieldCard({ field }: { field: SchemaField }) {
  return (
    <div className="border rounded-md p-3 bg-muted/30">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{field.label}</span>
        <Badge variant="outline" className="text-xs">
          {field.field_type}
        </Badge>
      </div>
      {field.label_id && (
        <div className="text-xs text-muted-foreground mb-1">
          ID: {field.label_id}
        </div>
      )}
      <div className="flex gap-2 text-xs">
        {field.required && (
          <Badge variant="secondary" className="text-xs">Required</Badge>
        )}
        {field.unit && (
          <Badge variant="outline" className="text-xs">Unit: {field.unit}</Badge>
        )}
      </div>
      {field.options && field.options.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Options: {field.options.map(o => o.label).join(', ')}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section }: { section: SchemaSection }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="font-medium">
        {section.label}
        {section.label_id && (
          <span className="text-sm text-muted-foreground ml-2">
            ({section.label_id})
          </span>
        )}
      </div>

      {section.criteria.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Criteria:</div>
          {section.criteria.map((criterion) => (
            <div key={criterion.id} className="pl-4 border-l-2 border-muted">
              <div className="text-sm">{criterion.label}</div>
              {criterion.grades && criterion.grades.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {criterion.grades.map((grade) => (
                    <Badge key={grade.value} variant="outline" className="text-xs">
                      {grade.value}: {grade.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SchemaPreview({ schema, metadata, confidenceScore }: SchemaPreviewProps) {
  const hasPerSampleFields = schema.per_sample_fields.length > 0;
  const hasSections = schema.sections.length > 0;
  const hasBatchFields = schema.batch_metadata_fields.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Extracted Schema</CardTitle>
            <CardDescription>
              From: {metadata.source_file}
            </CardDescription>
          </div>
          <ConfidenceBadge score={confidenceScore} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Extraction Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Model</div>
            <div className="font-medium">{metadata.model_used}</div>
          </div>
          <div>
            <div className="text-muted-foreground">File Size</div>
            <div className="font-medium">
              {(metadata.source_file_size / 1024).toFixed(1)} KB
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Processing Time</div>
            <div className="font-medium">
              {metadata.processing_time_ms ? `${metadata.processing_time_ms}ms` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Extracted</div>
            <div className="font-medium">
              {new Date(metadata.extraction_timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Per-Sample Fields */}
        {hasPerSampleFields && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Per-Sample Fields</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {schema.per_sample_fields.map((field) => (
                <FieldCard key={field.id} field={field} />
              ))}
            </div>
          </div>
        )}

        {/* Sections with Criteria */}
        {hasSections && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Graded Sections</h3>
            <div className="space-y-3">
              {schema.sections.map((section) => (
                <SectionCard key={section.id} section={section} />
              ))}
            </div>
          </div>
        )}

        {/* Batch Metadata Fields */}
        {hasBatchFields && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Batch Metadata</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {schema.batch_metadata_fields.map((field) => (
                <FieldCard key={field.id} field={field} />
              ))}
            </div>
          </div>
        )}

        {/* Validation Rules */}
        {schema.validation_rules && Object.keys(schema.validation_rules).length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Validation Rules</h3>
            <div className="bg-muted rounded-md p-3 text-sm font-mono">
              {JSON.stringify(schema.validation_rules, null, 2)}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasPerSampleFields && !hasSections && !hasBatchFields && (
          <div className="text-center py-8 text-muted-foreground">
            No fields or sections were extracted. Try uploading a clearer image.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
