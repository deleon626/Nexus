/**
 * TypeScript types for Nexus AG-UI integration.
 * Adapted from Nexus web UI types for Dojo environment.
 */

// Field and Schema Types
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

// API Response Types
export interface SchemaListItem {
  id: string;
  form_code: string;
  form_name: string;
  category?: string;
  version: string;
  version_number: number;
  status: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

// AG-UI Event Types
export interface ConfirmationEventData {
  session_id: string;
  schema_id: string;
  schema_name: string;
  schema_definition: ExtractedSchemaStructure;
  extracted_data: Record<string, unknown>;
  status: string;
}

export interface CommittedEventData {
  report_id: string;
  session_id: string;
  committed_data: Record<string, unknown>;
  status: string;
}

export interface ErrorEventData {
  error_type: string;
  message: string;
  session_id: string;
  status: string;
}

// Agent Session Types
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AgentSession {
  id: string;
  schema_id: string;
  status: 'active' | 'completed' | 'error';
  created_at: string;
  messages: AgentMessage[];
}

// Component Props Types
export interface NexusConfirmationModalProps {
  data: ConfirmationEventData;
  schema?: SchemaListItem | null;
  onConfirm: (modifications?: Record<string, unknown>) => Promise<void>;
  onReject: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
  maxSizeMB?: number;
}
