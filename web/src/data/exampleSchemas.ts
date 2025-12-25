/**
 * Example schema data for the Schema Generator page.
 * Displays when users first visit to show what extracted schemas look like.
 */

import type { ExtractedSchemaStructure, ExtractionMetadata } from '@/types/schema';

export const EXAMPLE_SCHEMA: ExtractedSchemaStructure = {
  per_sample_fields: [
    {
      id: 'temperature',
      label: 'Suhu (Temperature)',
      label_id: 'A.1',
      field_type: 'number',
      required: true,
      unit: '°C',
      validation_rules: { min: 0, max: 100 },
    },
    {
      id: 'ph_level',
      label: 'pH Level',
      label_id: 'A.2',
      field_type: 'number',
      required: false,
      validation_rules: { min: 0, max: 14 },
    },
    {
      id: 'warna',
      label: 'Warna (Color)',
      label_id: 'A.3',
      field_type: 'graded_choice',
      required: true,
      options: [
        { value: 3, label: 'Sangat Baik (Excellent)', label_id: 'A' },
        { value: 2, label: 'Baik (Good)', label_id: 'B' },
        { value: 1, label: 'Cukup (Fair)', label_id: 'C' },
        { value: 0, label: 'Kurang (Poor)', label_id: 'D' },
      ],
    },
  ],
  sections: [],
  batch_metadata_fields: [
    {
      id: 'tanggal',
      label: 'Tanggal Penerimaan',
      label_id: 'M.1',
      field_type: 'date',
      required: true,
    },
    {
      id: 'batch_number',
      label: 'Nomor Batch',
      label_id: 'M.2',
      field_type: 'text',
      required: true,
    },
    {
      id: 'supplier',
      label: 'Nama Supplier',
      label_id: 'M.3',
      field_type: 'text',
      required: false,
    },
  ],
};

export const EXAMPLE_METADATA: ExtractionMetadata = {
  source_file: 'form-penerimaan-bahan-baku.pdf',
  source_file_size: 245760, // ~240 KB
  model_used: 'example',
  confidence_score: 0.95,
  extraction_timestamp: new Date().toISOString(),
  processing_time_ms: 0,
};

export const EXAMPLE_SCHEMA_NAME = 'Penerimaan Bahan Baku';
