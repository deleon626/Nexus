/**
 * TypeScript types for Schema Generator feature.
 * Mirrors backend/app/models/schema.py
 */

export type FieldType = 'text' | 'number' | 'date' | 'choice' | 'graded_choice' | 'boolean';

export interface GradeOption {
  value: number;
  label: string;
  label_id?: string;
}

export interface SchemaField {
  id: string;
  label: string;
  label_id?: string;
  field_type: FieldType;
  required: boolean;
  default_value?: string;
  validation_rules?: Record<string, unknown>;
  options?: GradeOption[];
  unit?: string;
}

export interface SchemaCriterion {
  id: string;
  label: string;
  label_id?: string;
  grades: GradeOption[];
}

export interface SchemaSection {
  id: string;
  label: string;
  label_id?: string;
  criteria: SchemaCriterion[];
}

export interface ExtractedSchemaStructure {
  per_sample_fields: SchemaField[];
  sections: SchemaSection[];
  batch_metadata_fields: SchemaField[];
  validation_rules?: Record<string, unknown>;
}

export interface ExtractionMetadata {
  source_file: string;
  source_file_size: number;
  model_used: string;
  confidence_score: number;
  extraction_timestamp: string;
  processing_time_ms?: number;
}

export interface FilePreviewInfo {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
  page_count?: number;
}

// API Request/Response Types

export interface SchemaExtractionRequest {
  schema_name: string;
}

export interface SchemaExtractionResponse {
  extracted_schema: ExtractedSchemaStructure;
  confidence_score: number;
  extraction_metadata: ExtractionMetadata;
  warnings: string[];
  file_preview?: FilePreviewInfo | null;
}

export interface SchemaCreateRequest {
  form_code: string;
  form_name: string;
  category?: string;
  schema_definition: ExtractedSchemaStructure;
  extraction_metadata?: ExtractionMetadata;
}

export interface SchemaUpdateRequest {
  schema_definition: ExtractedSchemaStructure;
  update_reason?: string;
}

export interface SchemaResponse {
  id: string;
  form_code: string;
  form_name: string;
  category?: string;
  version: string;
  version_number: number;
  schema_definition: ExtractedSchemaStructure;
  status: string;
  extraction_metadata?: ExtractionMetadata;
  created_at: string;
  updated_at: string;
}

export interface SchemaListItem {
  id: string;
  form_code: string;
  form_name: string;
  category?: string;
  version: string;
  version_number: number;
  status: string;
  created_at: string;
  has_source_document: boolean;
}

export interface SchemaListResponse {
  schemas: SchemaListItem[];
  total: number;
  page: number;
  page_size: number;
}

// Source Document Types

export interface SourceDocumentInfo {
  path: string;
  filename: string;
  size: number;
  mime_type: string;
  url: string;
}

// Bulk Operations Types

export interface BulkArchiveRequest {
  schema_ids: string[];
}

export interface BulkArchiveResponse {
  archived_count: number;
  failed_ids: string[];
  errors: string[];
}
