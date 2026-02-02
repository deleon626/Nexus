import type { ExtractedSchemaStructure, SchemaField, SchemaSection } from '@/types/schema';

export const mockPerSampleField: SchemaField = {
  id: 'weight',
  label: 'Weight',
  label_id: 'field_weight',
  field_type: 'number',
  required: true,
  unit: 'g',
  validation_rules: {
    min: 0,
    max: 1000,
  },
};

export const mockTextField: SchemaField = {
  id: 'batch_code',
  label: 'Batch Code',
  label_id: 'field_batch_code',
  field_type: 'text',
  required: true,
  validation_rules: {
    pattern: '^[A-Z]{2}\\d{6}$',
    minLength: 8,
    maxLength: 8,
  },
};

export const mockChoiceField: SchemaField = {
  id: 'color',
  label: 'Color',
  label_id: 'field_color',
  field_type: 'choice',
  required: false,
  options: [
    { value: 1, label: 'Red' },
    { value: 2, label: 'Green' },
    { value: 3, label: 'Blue' },
  ],
};

export const mockGradedChoiceField: SchemaField = {
  id: 'appearance',
  label: 'Appearance',
  label_id: 'field_appearance',
  field_type: 'graded_choice',
  required: true,
  options: [
    { value: 1, label: 'Poor', label_id: 'grade_poor' },
    { value: 2, label: 'Fair', label_id: 'grade_fair' },
    { value: 3, label: 'Good', label_id: 'grade_good' },
    { value: 4, label: 'Excellent', label_id: 'grade_excellent' },
  ],
};

export const mockDateField: SchemaField = {
  id: 'production_date',
  label: 'Production Date',
  label_id: 'field_production_date',
  field_type: 'date',
  required: true,
};

export const mockBooleanField: SchemaField = {
  id: 'certified',
  label: 'Certified',
  label_id: 'field_certified',
  field_type: 'boolean',
  required: false,
  default_value: 'false',
};

export const mockSection: SchemaSection = {
  id: 'visual_inspection',
  label: 'Visual Inspection',
  label_id: 'section_visual_inspection',
  criteria: [
    {
      id: 'clarity',
      label: 'Clarity',
      label_id: 'criterion_clarity',
      grades: [
        { value: 1, label: 'Cloudy', label_id: 'grade_cloudy' },
        { value: 2, label: 'Slightly Clear', label_id: 'grade_slightly_clear' },
        { value: 3, label: 'Clear', label_id: 'grade_clear' },
      ],
    },
    {
      id: 'color_consistency',
      label: 'Color Consistency',
      label_id: 'criterion_color_consistency',
      grades: [
        { value: 1, label: 'Uneven', label_id: 'grade_uneven' },
        { value: 2, label: 'Mostly Even', label_id: 'grade_mostly_even' },
        { value: 3, label: 'Perfectly Even', label_id: 'grade_perfectly_even' },
      ],
    },
  ],
};

export const mockMinimalSchema: ExtractedSchemaStructure = {
  per_sample_fields: [mockPerSampleField],
  sections: [],
  batch_metadata_fields: [],
};

export const mockEmptySchema: ExtractedSchemaStructure = {
  per_sample_fields: [],
  sections: [],
  batch_metadata_fields: [],
};

export const mockFullSchema: ExtractedSchemaStructure = {
  per_sample_fields: [
    mockPerSampleField,
    mockGradedChoiceField,
    mockChoiceField,
  ],
  sections: [mockSection],
  batch_metadata_fields: [
    mockTextField,
    mockDateField,
    mockBooleanField,
  ],
  validation_rules: {
    custom_rule: 'some_value',
  },
};

export const mockAllFieldTypesSchema: ExtractedSchemaStructure = {
  per_sample_fields: [
    mockTextField,
    mockPerSampleField,
    mockDateField,
    mockBooleanField,
    mockChoiceField,
    mockGradedChoiceField,
  ],
  sections: [],
  batch_metadata_fields: [],
};
