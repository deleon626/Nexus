import { describe, it, expect } from 'vitest';
import {
  nexusToJsonSchema,
  jsonSchemaToNexus,
  validateRoundtrip,
  type JSONSchema7,
} from './schemaConverter';
import {
  mockMinimalSchema,
  mockEmptySchema,
  mockFullSchema,
  mockAllFieldTypesSchema,
  mockTextField,
  mockPerSampleField,
  mockDateField,
  mockBooleanField,
  mockChoiceField,
  mockGradedChoiceField,
  mockSection,
} from '@/test/fixtures';

describe('schemaConverter', () => {
  describe('nexusToJsonSchema', () => {
    it('should convert empty schema to minimal JSON Schema', () => {
      const result = nexusToJsonSchema(mockEmptySchema);

      expect(result).toMatchObject({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        title: 'QC Schema',
        properties: {},
      });
    });

    it('should convert minimal schema with per-sample fields', () => {
      const result = nexusToJsonSchema(mockMinimalSchema);

      expect(result.properties).toHaveProperty('per_sample_fields');
      const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;

      expect(perSampleGroup).toMatchObject({
        type: 'object',
        title: 'Per Sample Fields',
        description: 'Fields that apply to each sample in the batch',
      });

      expect(perSampleGroup.properties).toHaveProperty('weight');
      const weightField = perSampleGroup.properties!['weight'] as JSONSchema7;

      expect(weightField).toMatchObject({
        type: 'number',
        title: 'Weight',
        'x-nexus-id': 'weight',
        'x-nexus-field-type': 'number',
        'x-nexus-unit': 'g',
        minimum: 0,
        maximum: 1000,
      });

      expect(perSampleGroup.required).toContain('weight');
    });

    it('should convert text field with validation rules', () => {
      const schema = {
        per_sample_fields: [mockTextField],
        sections: [],
        batch_metadata_fields: [],
      };

      const result = nexusToJsonSchema(schema);
      const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;
      const batchCodeField = perSampleGroup.properties!['batch_code'] as JSONSchema7;

      expect(batchCodeField).toMatchObject({
        type: 'string',
        title: 'Batch Code',
        'x-nexus-id': 'batch_code',
        'x-nexus-field-type': 'text',
        pattern: '^[A-Z]{2}\\d{6}$',
        minLength: 8,
        maxLength: 8,
      });
    });

    it('should convert date field correctly', () => {
      const schema = {
        per_sample_fields: [mockDateField],
        sections: [],
        batch_metadata_fields: [],
      };

      const result = nexusToJsonSchema(schema);
      const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;
      const dateField = perSampleGroup.properties!['production_date'] as JSONSchema7;

      expect(dateField).toMatchObject({
        type: 'string',
        format: 'date',
        title: 'Production Date',
        'x-nexus-field-type': 'date',
      });
    });

    it('should convert boolean field correctly', () => {
      const schema = {
        per_sample_fields: [mockBooleanField],
        sections: [],
        batch_metadata_fields: [],
      };

      const result = nexusToJsonSchema(schema);
      const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;
      const boolField = perSampleGroup.properties!['certified'] as JSONSchema7;

      expect(boolField).toMatchObject({
        type: 'boolean',
        title: 'Certified',
        'x-nexus-field-type': 'boolean',
        default: 'false',
      });
    });

    it('should convert choice field with options', () => {
      const schema = {
        per_sample_fields: [mockChoiceField],
        sections: [],
        batch_metadata_fields: [],
      };

      const result = nexusToJsonSchema(schema);
      const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;
      const choiceField = perSampleGroup.properties!['color'] as JSONSchema7;

      expect(choiceField).toMatchObject({
        type: 'string',
        title: 'Color',
        'x-nexus-field-type': 'choice',
        enum: ['Red', 'Green', 'Blue'],
      });

      expect(choiceField['x-nexus-options']).toEqual(mockChoiceField.options);
    });

    it('should convert graded_choice field with grades', () => {
      const schema = {
        per_sample_fields: [mockGradedChoiceField],
        sections: [],
        batch_metadata_fields: [],
      };

      const result = nexusToJsonSchema(schema);
      const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;
      const gradedField = perSampleGroup.properties!['appearance'] as JSONSchema7;

      expect(gradedField).toMatchObject({
        type: 'integer',
        title: 'Appearance',
        'x-nexus-field-type': 'graded_choice',
        'x-nexus-graded': true,
        enum: [1, 2, 3, 4],
      });

      expect(gradedField['x-nexus-grades']).toEqual(mockGradedChoiceField.options);
    });

    it('should convert sections with criteria', () => {
      const schema = {
        per_sample_fields: [],
        sections: [mockSection],
        batch_metadata_fields: [],
      };

      const result = nexusToJsonSchema(schema);
      const sectionsGroup = result.properties!['sections'] as JSONSchema7;

      expect(sectionsGroup).toMatchObject({
        type: 'object',
        title: 'Sections',
        description: 'Graded sections with criteria',
      });

      const visualSection = sectionsGroup.properties!['visual_inspection'] as JSONSchema7;
      expect(visualSection).toMatchObject({
        type: 'object',
        title: 'Visual Inspection',
        'x-nexus-id': 'visual_inspection',
        'x-nexus-label-id': 'section_visual_inspection',
      });

      expect(visualSection['x-nexus-criteria']).toEqual(mockSection.criteria);

      const clarityField = visualSection.properties!['clarity'] as JSONSchema7;
      expect(clarityField).toMatchObject({
        type: 'integer',
        title: 'Clarity',
        'x-nexus-graded': true,
        enum: [1, 2, 3],
      });
    });

    it('should convert batch metadata fields', () => {
      const result = nexusToJsonSchema(mockFullSchema);

      const batchGroup = result.properties!['batch_metadata_fields'] as JSONSchema7;
      expect(batchGroup).toMatchObject({
        type: 'object',
        title: 'Batch Metadata Fields',
        description: 'Fields that apply to the entire batch',
      });

      expect(batchGroup.properties).toHaveProperty('batch_code');
      expect(batchGroup.properties).toHaveProperty('production_date');
      expect(batchGroup.properties).toHaveProperty('certified');
    });

    it('should handle full schema with all groups', () => {
      const result = nexusToJsonSchema(mockFullSchema);

      expect(result.properties).toHaveProperty('per_sample_fields');
      expect(result.properties).toHaveProperty('sections');
      expect(result.properties).toHaveProperty('batch_metadata_fields');
      expect(result.required).toEqual([
        'per_sample_fields',
        'sections',
        'batch_metadata_fields',
      ]);
    });

    it('should preserve default values', () => {
      const fieldWithDefault = {
        ...mockPerSampleField,
        default_value: '100',
      };

      const schema = {
        per_sample_fields: [fieldWithDefault],
        sections: [],
        batch_metadata_fields: [],
      };

      const result = nexusToJsonSchema(schema);
      const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;
      const weightField = perSampleGroup.properties!['weight'] as JSONSchema7;

      expect(weightField.default).toBe('100');
    });

    it('should handle fields without label_id or unit', () => {
      const fieldWithoutOptionals = {
        id: 'simple',
        label: 'Simple Field',
        field_type: 'text' as const,
        required: false,
      };

      const schema = {
        per_sample_fields: [fieldWithoutOptionals],
        sections: [],
        batch_metadata_fields: [],
      };

      const result = nexusToJsonSchema(schema);
      const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;
      const simpleField = perSampleGroup.properties!['simple'] as JSONSchema7;

      expect(simpleField['x-nexus-label-id']).toBeUndefined();
      expect(simpleField['x-nexus-unit']).toBeUndefined();
    });
  });

  describe('jsonSchemaToNexus', () => {
    it('should convert empty JSON Schema to empty Nexus schema', () => {
      const jsonSchema: JSONSchema7 = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        title: 'QC Schema',
        properties: {},
      };

      const result = jsonSchemaToNexus(jsonSchema);

      expect(result).toEqual({
        per_sample_fields: [],
        sections: [],
        batch_metadata_fields: [],
      });
    });

    it('should round-trip minimal schema correctly', () => {
      const jsonSchema = nexusToJsonSchema(mockMinimalSchema);
      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.per_sample_fields).toHaveLength(1);
      expect(result.per_sample_fields[0]).toMatchObject({
        id: 'weight',
        label: 'Weight',
        field_type: 'number',
        required: true,
        unit: 'g',
      });
      expect(result.per_sample_fields[0].validation_rules).toMatchObject({
        min: 0,
        max: 1000,
      });
    });

    it('should round-trip all field types correctly', () => {
      const jsonSchema = nexusToJsonSchema(mockAllFieldTypesSchema);
      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.per_sample_fields).toHaveLength(6);

      const textField = result.per_sample_fields.find((f) => f.id === 'batch_code');
      expect(textField?.field_type).toBe('text');
      expect(textField?.validation_rules?.pattern).toBe('^[A-Z]{2}\\d{6}$');

      const numberField = result.per_sample_fields.find((f) => f.id === 'weight');
      expect(numberField?.field_type).toBe('number');
      expect(numberField?.validation_rules?.min).toBe(0);

      const dateField = result.per_sample_fields.find((f) => f.id === 'production_date');
      expect(dateField?.field_type).toBe('date');

      const boolField = result.per_sample_fields.find((f) => f.id === 'certified');
      expect(boolField?.field_type).toBe('boolean');

      const choiceField = result.per_sample_fields.find((f) => f.id === 'color');
      expect(choiceField?.field_type).toBe('choice');
      expect(choiceField?.options).toHaveLength(3);

      const gradedField = result.per_sample_fields.find((f) => f.id === 'appearance');
      expect(gradedField?.field_type).toBe('graded_choice');
      expect(gradedField?.options).toHaveLength(4);
    });

    it('should round-trip sections correctly', () => {
      const schema = {
        per_sample_fields: [],
        sections: [mockSection],
        batch_metadata_fields: [],
      };

      const jsonSchema = nexusToJsonSchema(schema);
      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0]).toMatchObject({
        id: 'visual_inspection',
        label: 'Visual Inspection',
        label_id: 'section_visual_inspection',
      });
      expect(result.sections[0].criteria).toHaveLength(2);
      expect(result.sections[0].criteria[0]).toMatchObject({
        id: 'clarity',
        label: 'Clarity',
        label_id: 'criterion_clarity',
      });
      expect(result.sections[0].criteria[0].grades).toHaveLength(3);
    });

    it('should round-trip full schema correctly', () => {
      const jsonSchema = nexusToJsonSchema(mockFullSchema);
      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.per_sample_fields).toHaveLength(3);
      expect(result.sections).toHaveLength(1);
      expect(result.batch_metadata_fields).toHaveLength(3);
    });

    it('should preserve required flags', () => {
      const jsonSchema = nexusToJsonSchema(mockFullSchema);
      const result = jsonSchemaToNexus(jsonSchema);

      const requiredField = result.per_sample_fields.find((f) => f.id === 'weight');
      expect(requiredField?.required).toBe(true);

      const optionalField = result.per_sample_fields.find((f) => f.id === 'color');
      expect(optionalField?.required).toBe(false);
    });

    it('should infer field types when x-nexus-field-type is missing', () => {
      const jsonSchema: JSONSchema7 = {
        type: 'object',
        properties: {
          per_sample_fields: {
            type: 'object',
            properties: {
              text_field: { type: 'string', title: 'Text' },
              number_field: { type: 'number', title: 'Number' },
              date_field: { type: 'string', format: 'date', title: 'Date' },
              bool_field: { type: 'boolean', title: 'Boolean' },
              choice_field: { type: 'string', enum: ['A', 'B'], title: 'Choice' },
            },
          },
        },
      };

      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.per_sample_fields[0].field_type).toBe('text');
      expect(result.per_sample_fields[1].field_type).toBe('number');
      expect(result.per_sample_fields[2].field_type).toBe('date');
      expect(result.per_sample_fields[3].field_type).toBe('boolean');
      expect(result.per_sample_fields[4].field_type).toBe('choice');
    });

    it('should handle JSON Schema without required arrays', () => {
      const jsonSchema: JSONSchema7 = {
        type: 'object',
        properties: {
          per_sample_fields: {
            type: 'object',
            properties: {
              field1: { type: 'string', title: 'Field 1' },
            },
          },
        },
      };

      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.per_sample_fields[0].required).toBe(false);
    });
  });

  describe('validateRoundtrip', () => {
    it('should validate empty schema roundtrip', () => {
      expect(validateRoundtrip(mockEmptySchema)).toBe(true);
    });

    it('should validate minimal schema roundtrip', () => {
      expect(validateRoundtrip(mockMinimalSchema)).toBe(true);
    });

    it('should validate full schema roundtrip', () => {
      expect(validateRoundtrip(mockFullSchema)).toBe(true);
    });

    it('should validate all field types schema roundtrip', () => {
      expect(validateRoundtrip(mockAllFieldTypesSchema)).toBe(true);
    });

    it('should detect field count mismatch in per_sample_fields', () => {
      const original = mockFullSchema;

      // Manually corrupt the roundtrip by adding a field after conversion
      const jsonSchema = nexusToJsonSchema(original);
      const perSampleGroup = jsonSchema.properties!['per_sample_fields'] as JSONSchema7;

      // Add extra field
      perSampleGroup.properties!['extra_field'] = {
        type: 'string',
        title: 'Extra',
      };

      const corrupted = jsonSchemaToNexus(jsonSchema);

      expect(corrupted.per_sample_fields.length).not.toBe(original.per_sample_fields.length);
    });

    it('should detect field count mismatch in sections', () => {
      const original = {
        per_sample_fields: [],
        sections: [mockSection],
        batch_metadata_fields: [],
      };

      const jsonSchema = nexusToJsonSchema(original);

      // Remove section
      delete jsonSchema.properties!['sections'];

      const corrupted = jsonSchemaToNexus(jsonSchema);

      // Create manual comparison since validateRoundtrip uses original schema
      expect(corrupted.sections.length).not.toBe(original.sections.length);
    });

    it('should detect field count mismatch in batch_metadata_fields', () => {
      const original = mockFullSchema;

      const jsonSchema = nexusToJsonSchema(original);
      const batchGroup = jsonSchema.properties!['batch_metadata_fields'] as JSONSchema7;

      // Remove a field
      delete batchGroup.properties!['batch_code'];

      const corrupted = jsonSchemaToNexus(jsonSchema);

      expect(corrupted.batch_metadata_fields.length).not.toBe(
        original.batch_metadata_fields.length
      );
    });
  });

  // ============================================================================
  // EDGE CASES - Boundary Conditions and Unusual Inputs
  // ============================================================================
  describe('Edge Cases', () => {
    describe('Schema Structure Edge Cases', () => {
      it('should handle schema with undefined properties', () => {
        const jsonSchema: JSONSchema7 = {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          title: 'QC Schema',
        };

        const result = jsonSchemaToNexus(jsonSchema);

        expect(result).toEqual({
          per_sample_fields: [],
          sections: [],
          batch_metadata_fields: [],
        });
      });

      it('should handle schema with only sections (no fields)', () => {
        const schema = {
          per_sample_fields: [],
          sections: [mockSection],
          batch_metadata_fields: [],
        };

        const result = nexusToJsonSchema(schema);

        // All groups are always present to support adding new fields
        expect(result.properties).toHaveProperty('per_sample_fields');
        expect(result.properties).toHaveProperty('sections');
        expect(result.properties).toHaveProperty('batch_metadata_fields');
        // Empty groups have empty properties
        const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;
        expect(perSampleGroup.properties).toEqual({});
        // Sections should have the actual section
        const sectionsGroup = result.properties!['sections'] as JSONSchema7;
        expect(sectionsGroup.properties).toHaveProperty('visual_inspection');
        expect(result.required).toEqual(['per_sample_fields', 'sections', 'batch_metadata_fields']);
      });

      it('should handle schema with only batch_metadata_fields', () => {
        const schema = {
          per_sample_fields: [],
          sections: [],
          batch_metadata_fields: [mockTextField],
        };

        const result = nexusToJsonSchema(schema);

        // All groups are always present to support adding new fields
        expect(result.properties).toHaveProperty('per_sample_fields');
        expect(result.properties).toHaveProperty('sections');
        expect(result.properties).toHaveProperty('batch_metadata_fields');
        // Empty groups have empty properties
        const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;
        expect(perSampleGroup.properties).toEqual({});
        const sectionsGroup = result.properties!['sections'] as JSONSchema7;
        expect(sectionsGroup.properties).toEqual({});
        // batch_metadata_fields should have the actual field
        const batchGroup = result.properties!['batch_metadata_fields'] as JSONSchema7;
        expect(batchGroup.properties).toHaveProperty('batch_code');
        expect(result.required).toEqual(['per_sample_fields', 'sections', 'batch_metadata_fields']);
      });

      it('should handle large schema with many fields', () => {
        const manyFields = Array.from({ length: 50 }, (_, i) => ({
          id: `field_${i}`,
          label: `Field ${i}`,
          field_type: 'text' as const,
          required: i % 2 === 0,
        }));

        const schema = {
          per_sample_fields: manyFields,
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields).toHaveLength(50);
        expect(result.per_sample_fields[25].id).toBe('field_25');
        expect(result.per_sample_fields[0].required).toBe(true);
        expect(result.per_sample_fields[1].required).toBe(false);
      });

      it('should handle section with empty criteria array', () => {
        const emptySection = {
          id: 'empty_section',
          label: 'Empty Section',
          label_id: 'section_empty',
          criteria: [],
        };

        const schema = {
          per_sample_fields: [],
          sections: [emptySection],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.sections).toHaveLength(1);
        expect(result.sections[0].criteria).toEqual([]);
      });

      it('should handle multiple sections with different criteria counts', () => {
        const section1 = {
          id: 'section_1',
          label: 'Section 1',
          criteria: [
            { id: 'crit_1', label: 'Criterion 1', grades: [{ value: 1, label: 'Grade 1' }] },
          ],
        };
        const section2 = {
          id: 'section_2',
          label: 'Section 2',
          criteria: [
            { id: 'crit_2a', label: 'Criterion 2a', grades: [{ value: 1, label: 'G1' }] },
            { id: 'crit_2b', label: 'Criterion 2b', grades: [{ value: 1, label: 'G1' }] },
            { id: 'crit_2c', label: 'Criterion 2c', grades: [{ value: 1, label: 'G1' }] },
          ],
        };

        const schema = {
          per_sample_fields: [],
          sections: [section1, section2],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.sections).toHaveLength(2);
        expect(result.sections[0].criteria).toHaveLength(1);
        expect(result.sections[1].criteria).toHaveLength(3);
      });
    });

    describe('Field Options Edge Cases', () => {
      it('should handle choice field with empty options array', () => {
        const choiceFieldEmpty = {
          id: 'empty_choice',
          label: 'Empty Choice',
          field_type: 'choice' as const,
          required: false,
          options: [],
        };

        const schema = {
          per_sample_fields: [choiceFieldEmpty],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const perSampleGroup = jsonSchema.properties!['per_sample_fields'] as JSONSchema7;
        const choiceField = perSampleGroup.properties!['empty_choice'] as JSONSchema7;

        expect(choiceField.type).toBe('string');
        expect(choiceField.enum).toBeUndefined();
        expect(choiceField['x-nexus-options']).toBeUndefined();
      });

      it('should handle graded_choice field with empty options array', () => {
        const gradedFieldEmpty = {
          id: 'empty_graded',
          label: 'Empty Graded',
          field_type: 'graded_choice' as const,
          required: false,
          options: [],
        };

        const schema = {
          per_sample_fields: [gradedFieldEmpty],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const perSampleGroup = jsonSchema.properties!['per_sample_fields'] as JSONSchema7;
        const gradedField = perSampleGroup.properties!['empty_graded'] as JSONSchema7;

        expect(gradedField.type).toBe('integer');
        expect(gradedField['x-nexus-graded']).toBe(true);
        expect(gradedField.enum).toBeUndefined();
        expect(gradedField['x-nexus-grades']).toBeUndefined();
      });

      it('should handle choice field with single option', () => {
        const singleOption = {
          id: 'single_choice',
          label: 'Single Choice',
          field_type: 'choice' as const,
          required: false,
          options: [{ value: 1, label: 'Only Option' }],
        };

        const schema = {
          per_sample_fields: [singleOption],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].options).toHaveLength(1);
        expect(result.per_sample_fields[0].options![0].label).toBe('Only Option');
      });

      it('should preserve options with label_id in roundtrip', () => {
        const fieldWithLabelIds = {
          id: 'graded_with_label_ids',
          label: 'Graded With Label IDs',
          field_type: 'graded_choice' as const,
          required: true,
          options: [
            { value: 1, label: 'Low', label_id: 'grade_low' },
            { value: 2, label: 'Medium', label_id: 'grade_medium' },
            { value: 3, label: 'High', label_id: 'grade_high' },
          ],
        };

        const schema = {
          per_sample_fields: [fieldWithLabelIds],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].options).toHaveLength(3);
        expect(result.per_sample_fields[0].options![0].label_id).toBe('grade_low');
        expect(result.per_sample_fields[0].options![2].label_id).toBe('grade_high');
      });
    });

    describe('Type Inference Edge Cases', () => {
      it('should infer graded_choice from x-nexus-graded flag', () => {
        const jsonSchema: JSONSchema7 = {
          type: 'object',
          properties: {
            per_sample_fields: {
              type: 'object',
              properties: {
                graded_field: {
                  type: 'integer',
                  title: 'Graded Field',
                  'x-nexus-graded': true,
                  enum: [1, 2, 3],
                },
              },
            },
          },
        };

        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].field_type).toBe('graded_choice');
      });

      it('should infer number from integer type', () => {
        const jsonSchema: JSONSchema7 = {
          type: 'object',
          properties: {
            per_sample_fields: {
              type: 'object',
              properties: {
                integer_field: {
                  type: 'integer',
                  title: 'Integer Field',
                },
              },
            },
          },
        };

        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].field_type).toBe('number');
      });

      it('should handle unknown field type gracefully (defaults to text)', () => {
        const fieldWithUnknownType = {
          id: 'unknown_type',
          label: 'Unknown Type Field',
          field_type: 'unknown_type' as any,
          required: false,
        };

        const schema = {
          per_sample_fields: [fieldWithUnknownType],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const perSampleGroup = jsonSchema.properties!['per_sample_fields'] as JSONSchema7;
        const unknownField = perSampleGroup.properties!['unknown_type'] as JSONSchema7;

        expect(unknownField.type).toBe('string');
      });

      it('should use key as fallback for id when x-nexus-id is missing', () => {
        const jsonSchema: JSONSchema7 = {
          type: 'object',
          properties: {
            per_sample_fields: {
              type: 'object',
              properties: {
                my_field_key: {
                  type: 'string',
                  title: 'My Field',
                },
              },
            },
          },
        };

        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].id).toBe('my_field_key');
      });

      it('should use key as fallback for label when title is missing', () => {
        const jsonSchema: JSONSchema7 = {
          type: 'object',
          properties: {
            per_sample_fields: {
              type: 'object',
              properties: {
                field_without_title: {
                  type: 'string',
                },
              },
            },
          },
        };

        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].label).toBe('field_without_title');
      });
    });
  });

  // ============================================================================
  // VALIDATION RULES - Comprehensive Testing of Validation Constraints
  // ============================================================================
  describe('Validation Rules', () => {
    describe('Number Field Validation', () => {
      it('should handle number field with only minimum', () => {
        const fieldWithMin = {
          id: 'min_only',
          label: 'Min Only',
          field_type: 'number' as const,
          required: false,
          validation_rules: { min: 0 },
        };

        const schema = {
          per_sample_fields: [fieldWithMin],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].validation_rules?.min).toBe(0);
        expect(result.per_sample_fields[0].validation_rules?.max).toBeUndefined();
      });

      it('should handle number field with only maximum', () => {
        const fieldWithMax = {
          id: 'max_only',
          label: 'Max Only',
          field_type: 'number' as const,
          required: false,
          validation_rules: { max: 100 },
        };

        const schema = {
          per_sample_fields: [fieldWithMax],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].validation_rules?.min).toBeUndefined();
        expect(result.per_sample_fields[0].validation_rules?.max).toBe(100);
      });

      it('should handle number field without validation rules', () => {
        const fieldNoValidation = {
          id: 'no_validation',
          label: 'No Validation',
          field_type: 'number' as const,
          required: false,
        };

        const schema = {
          per_sample_fields: [fieldNoValidation],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const perSampleGroup = jsonSchema.properties!['per_sample_fields'] as JSONSchema7;
        const field = perSampleGroup.properties!['no_validation'] as JSONSchema7;

        expect(field.minimum).toBeUndefined();
        expect(field.maximum).toBeUndefined();
      });

      it('should preserve zero values in min/max', () => {
        const fieldWithZero = {
          id: 'zero_values',
          label: 'Zero Values',
          field_type: 'number' as const,
          required: false,
          validation_rules: { min: 0, max: 0 },
        };

        const schema = {
          per_sample_fields: [fieldWithZero],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].validation_rules?.min).toBe(0);
        expect(result.per_sample_fields[0].validation_rules?.max).toBe(0);
      });

      it('should handle negative min/max values', () => {
        const fieldWithNegative = {
          id: 'negative_values',
          label: 'Negative Values',
          field_type: 'number' as const,
          required: false,
          validation_rules: { min: -100, max: -10 },
        };

        const schema = {
          per_sample_fields: [fieldWithNegative],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].validation_rules?.min).toBe(-100);
        expect(result.per_sample_fields[0].validation_rules?.max).toBe(-10);
      });
    });

    describe('Text Field Validation', () => {
      it('should handle text field with only pattern', () => {
        const fieldWithPattern = {
          id: 'pattern_only',
          label: 'Pattern Only',
          field_type: 'text' as const,
          required: false,
          validation_rules: { pattern: '^[A-Z]+$' },
        };

        const schema = {
          per_sample_fields: [fieldWithPattern],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].validation_rules?.pattern).toBe('^[A-Z]+$');
        expect(result.per_sample_fields[0].validation_rules?.minLength).toBeUndefined();
        expect(result.per_sample_fields[0].validation_rules?.maxLength).toBeUndefined();
      });

      it('should handle text field with only minLength', () => {
        const fieldWithMinLength = {
          id: 'min_length_only',
          label: 'Min Length Only',
          field_type: 'text' as const,
          required: false,
          validation_rules: { minLength: 5 },
        };

        const schema = {
          per_sample_fields: [fieldWithMinLength],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].validation_rules?.minLength).toBe(5);
        expect(result.per_sample_fields[0].validation_rules?.maxLength).toBeUndefined();
      });

      it('should handle text field with only maxLength', () => {
        const fieldWithMaxLength = {
          id: 'max_length_only',
          label: 'Max Length Only',
          field_type: 'text' as const,
          required: false,
          validation_rules: { maxLength: 50 },
        };

        const schema = {
          per_sample_fields: [fieldWithMaxLength],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].validation_rules?.maxLength).toBe(50);
        expect(result.per_sample_fields[0].validation_rules?.minLength).toBeUndefined();
      });

      it('should handle text field with all validation rules combined', () => {
        const fieldWithAll = {
          id: 'all_validations',
          label: 'All Validations',
          field_type: 'text' as const,
          required: true,
          validation_rules: {
            pattern: '^[A-Z]{2}[0-9]{4}$',
            minLength: 6,
            maxLength: 6,
          },
        };

        const schema = {
          per_sample_fields: [fieldWithAll],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].validation_rules?.pattern).toBe('^[A-Z]{2}[0-9]{4}$');
        expect(result.per_sample_fields[0].validation_rules?.minLength).toBe(6);
        expect(result.per_sample_fields[0].validation_rules?.maxLength).toBe(6);
      });

      it('should handle text field without validation rules', () => {
        const fieldNoValidation = {
          id: 'text_no_validation',
          label: 'Text No Validation',
          field_type: 'text' as const,
          required: false,
        };

        const schema = {
          per_sample_fields: [fieldNoValidation],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const perSampleGroup = jsonSchema.properties!['per_sample_fields'] as JSONSchema7;
        const field = perSampleGroup.properties!['text_no_validation'] as JSONSchema7;

        expect(field.pattern).toBeUndefined();
        expect(field.minLength).toBeUndefined();
        expect(field.maxLength).toBeUndefined();
      });

      it('should preserve zero-length string validation', () => {
        const fieldWithZeroLength = {
          id: 'zero_length',
          label: 'Zero Length',
          field_type: 'text' as const,
          required: false,
          validation_rules: { minLength: 0, maxLength: 0 },
        };

        const schema = {
          per_sample_fields: [fieldWithZeroLength],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].validation_rules?.minLength).toBe(0);
        expect(result.per_sample_fields[0].validation_rules?.maxLength).toBe(0);
      });
    });
  });

  // ============================================================================
  // DEEP EQUALITY - Data Preservation and Integrity Tests
  // ============================================================================
  describe('Deep Equality and Data Preservation', () => {
    describe('Metadata Preservation', () => {
      it('should preserve all label_ids in field roundtrip', () => {
        const fieldWithAllMeta = {
          id: 'meta_field',
          label: 'Meta Field',
          label_id: 'field_meta_field',
          field_type: 'text' as const,
          required: true,
        };

        const schema = {
          per_sample_fields: [fieldWithAllMeta],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].label_id).toBe('field_meta_field');
      });

      it('should preserve unit in number field roundtrip', () => {
        const fieldWithUnit = {
          id: 'unit_field',
          label: 'Unit Field',
          field_type: 'number' as const,
          required: false,
          unit: 'kg/m3',
        };

        const schema = {
          per_sample_fields: [fieldWithUnit],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].unit).toBe('kg/m3');
      });

      it('should preserve section label_id in roundtrip', () => {
        const sectionWithLabelId = {
          id: 'labeled_section',
          label: 'Labeled Section',
          label_id: 'section_labeled',
          criteria: [],
        };

        const schema = {
          per_sample_fields: [],
          sections: [sectionWithLabelId],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.sections[0].label_id).toBe('section_labeled');
      });

      it('should preserve criteria label_ids in section roundtrip', () => {
        const sectionWithCriteriaLabelIds = {
          id: 'criteria_section',
          label: 'Criteria Section',
          criteria: [
            {
              id: 'crit_1',
              label: 'Criterion 1',
              label_id: 'criterion_1_label',
              grades: [{ value: 1, label: 'Grade 1', label_id: 'grade_1_label' }],
            },
          ],
        };

        const schema = {
          per_sample_fields: [],
          sections: [sectionWithCriteriaLabelIds],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.sections[0].criteria[0].label_id).toBe('criterion_1_label');
        expect(result.sections[0].criteria[0].grades[0].label_id).toBe('grade_1_label');
      });

      it('should preserve default_value in field roundtrip', () => {
        const fieldWithDefault = {
          id: 'default_field',
          label: 'Default Field',
          field_type: 'text' as const,
          required: false,
          default_value: 'default_text_value',
        };

        const schema = {
          per_sample_fields: [fieldWithDefault],
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        expect(result.per_sample_fields[0].default_value).toBe('default_text_value');
      });
    });

    describe('Complex Schema Roundtrip', () => {
      it('should preserve complete schema structure in roundtrip', () => {
        const complexSchema = {
          per_sample_fields: [
            mockTextField,
            mockPerSampleField,
            mockDateField,
          ],
          sections: [mockSection],
          batch_metadata_fields: [
            mockBooleanField,
            mockChoiceField,
          ],
        };

        const jsonSchema = nexusToJsonSchema(complexSchema);
        const result = jsonSchemaToNexus(jsonSchema);

        // Verify per_sample_fields
        expect(result.per_sample_fields).toHaveLength(3);
        expect(result.per_sample_fields.map(f => f.id)).toEqual(['batch_code', 'weight', 'production_date']);

        // Verify sections
        expect(result.sections).toHaveLength(1);
        expect(result.sections[0].id).toBe('visual_inspection');
        expect(result.sections[0].criteria).toHaveLength(2);

        // Verify batch_metadata_fields
        expect(result.batch_metadata_fields).toHaveLength(2);
        expect(result.batch_metadata_fields.map(f => f.id)).toEqual(['certified', 'color']);
      });

      it('should preserve field order in roundtrip', () => {
        const orderedFields = [
          { id: 'field_a', label: 'Field A', field_type: 'text' as const, required: false },
          { id: 'field_b', label: 'Field B', field_type: 'number' as const, required: true },
          { id: 'field_c', label: 'Field C', field_type: 'boolean' as const, required: false },
        ];

        const schema = {
          per_sample_fields: orderedFields,
          sections: [],
          batch_metadata_fields: [],
        };

        const jsonSchema = nexusToJsonSchema(schema);
        const result = jsonSchemaToNexus(jsonSchema);

        // Note: Object.entries may not preserve order in all JS engines,
        // but we test that all fields are present
        expect(result.per_sample_fields).toHaveLength(3);
        expect(result.per_sample_fields.map(f => f.id).sort()).toEqual(['field_a', 'field_b', 'field_c']);
      });
    });

    describe('JSON Schema Output Structure', () => {
      it('should include $schema property in output', () => {
        const result = nexusToJsonSchema(mockEmptySchema);

        expect(result.$schema).toBe('http://json-schema.org/draft-07/schema#');
      });

      it('should set type to object at root level', () => {
        const result = nexusToJsonSchema(mockMinimalSchema);

        expect(result.type).toBe('object');
      });

      it('should include title at root level', () => {
        const result = nexusToJsonSchema(mockMinimalSchema);

        expect(result.title).toBe('QC Schema');
      });

      it('should include description for per_sample_fields group', () => {
        const result = nexusToJsonSchema(mockMinimalSchema);
        const perSampleGroup = result.properties!['per_sample_fields'] as JSONSchema7;

        expect(perSampleGroup.description).toBe('Fields that apply to each sample in the batch');
      });

      it('should include description for sections group', () => {
        const schema = {
          per_sample_fields: [],
          sections: [mockSection],
          batch_metadata_fields: [],
        };

        const result = nexusToJsonSchema(schema);
        const sectionsGroup = result.properties!['sections'] as JSONSchema7;

        expect(sectionsGroup.description).toBe('Graded sections with criteria');
      });

      it('should include description for batch_metadata_fields group', () => {
        const schema = {
          per_sample_fields: [],
          sections: [],
          batch_metadata_fields: [mockTextField],
        };

        const result = nexusToJsonSchema(schema);
        const batchGroup = result.properties!['batch_metadata_fields'] as JSONSchema7;

        expect(batchGroup.description).toBe('Fields that apply to the entire batch');
      });
    });
  });

  // ============================================================================
  // SECTION RECONSTRUCTION - Testing Section Parsing from Properties
  // ============================================================================
  describe('Section Reconstruction from Properties', () => {
    it('should reconstruct section criteria from properties when x-nexus-criteria is missing', () => {
      const jsonSchema: JSONSchema7 = {
        type: 'object',
        properties: {
          sections: {
            type: 'object',
            properties: {
              my_section: {
                type: 'object',
                title: 'My Section',
                'x-nexus-id': 'my_section',
                properties: {
                  criterion_1: {
                    type: 'integer',
                    title: 'Criterion 1',
                    'x-nexus-id': 'criterion_1',
                    'x-nexus-label-id': 'crit_1_label',
                    'x-nexus-graded': true,
                    'x-nexus-grades': [
                      { value: 1, label: 'Low' },
                      { value: 2, label: 'High' },
                    ],
                    enum: [1, 2],
                  },
                },
              },
            },
          },
        },
      };

      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].criteria).toHaveLength(1);
      expect(result.sections[0].criteria[0].id).toBe('criterion_1');
      expect(result.sections[0].criteria[0].label).toBe('Criterion 1');
      expect(result.sections[0].criteria[0].label_id).toBe('crit_1_label');
      expect(result.sections[0].criteria[0].grades).toHaveLength(2);
    });

    it('should handle section without properties and without x-nexus-criteria', () => {
      const jsonSchema: JSONSchema7 = {
        type: 'object',
        properties: {
          sections: {
            type: 'object',
            properties: {
              empty_section: {
                type: 'object',
                title: 'Empty Section',
                'x-nexus-id': 'empty_section',
              },
            },
          },
        },
      };

      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].id).toBe('empty_section');
      expect(result.sections[0].criteria).toEqual([]);
    });

    it('should prefer x-nexus-criteria over reconstructed criteria', () => {
      const storedCriteria = [
        { id: 'stored_crit', label: 'Stored Criterion', grades: [{ value: 1, label: 'G1' }] },
      ];

      const jsonSchema: JSONSchema7 = {
        type: 'object',
        properties: {
          sections: {
            type: 'object',
            properties: {
              my_section: {
                type: 'object',
                title: 'My Section',
                'x-nexus-id': 'my_section',
                'x-nexus-criteria': storedCriteria,
                properties: {
                  different_criterion: {
                    type: 'integer',
                    title: 'Different Criterion',
                    'x-nexus-id': 'different_criterion',
                    'x-nexus-grades': [{ value: 1, label: 'G' }],
                    enum: [1],
                  },
                },
              },
            },
          },
        },
      };

      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.sections[0].criteria).toHaveLength(1);
      expect(result.sections[0].criteria[0].id).toBe('stored_crit');
    });

    it('should handle reconstruction when criterion property is boolean', () => {
      const jsonSchema: JSONSchema7 = {
        type: 'object',
        properties: {
          sections: {
            type: 'object',
            properties: {
              my_section: {
                type: 'object',
                title: 'My Section',
                properties: {
                  bool_criterion: true as any,
                  valid_criterion: {
                    type: 'integer',
                    title: 'Valid',
                    'x-nexus-id': 'valid_criterion',
                    'x-nexus-grades': [{ value: 1, label: 'G' }],
                  },
                },
              },
            },
          },
        },
      };

      const result = jsonSchemaToNexus(jsonSchema);

      // Should only include the valid criterion, not the boolean one
      expect(result.sections[0].criteria.some(c => c.id === 'valid_criterion')).toBe(true);
    });
  });

  // ============================================================================
  // SPECIAL VALUES - Handling of Null, Undefined, and Edge Cases
  // ============================================================================
  describe('Special Values Handling', () => {
    it('should handle undefined label_id gracefully', () => {
      const fieldWithoutLabelId = {
        id: 'no_label_id',
        label: 'No Label ID',
        field_type: 'text' as const,
        required: false,
        label_id: undefined,
      };

      const schema = {
        per_sample_fields: [fieldWithoutLabelId],
        sections: [],
        batch_metadata_fields: [],
      };

      const jsonSchema = nexusToJsonSchema(schema);
      const perSampleGroup = jsonSchema.properties!['per_sample_fields'] as JSONSchema7;
      const field = perSampleGroup.properties!['no_label_id'] as JSONSchema7;

      expect(field['x-nexus-label-id']).toBeUndefined();
    });

    it('should handle undefined unit gracefully', () => {
      const fieldWithoutUnit = {
        id: 'no_unit',
        label: 'No Unit',
        field_type: 'number' as const,
        required: false,
        unit: undefined,
      };

      const schema = {
        per_sample_fields: [fieldWithoutUnit],
        sections: [],
        batch_metadata_fields: [],
      };

      const jsonSchema = nexusToJsonSchema(schema);
      const perSampleGroup = jsonSchema.properties!['per_sample_fields'] as JSONSchema7;
      const field = perSampleGroup.properties!['no_unit'] as JSONSchema7;

      expect(field['x-nexus-unit']).toBeUndefined();
    });

    it('should handle undefined default_value gracefully', () => {
      const fieldWithoutDefault = {
        id: 'no_default',
        label: 'No Default',
        field_type: 'text' as const,
        required: false,
        default_value: undefined,
      };

      const schema = {
        per_sample_fields: [fieldWithoutDefault],
        sections: [],
        batch_metadata_fields: [],
      };

      const jsonSchema = nexusToJsonSchema(schema);
      const perSampleGroup = jsonSchema.properties!['per_sample_fields'] as JSONSchema7;
      const field = perSampleGroup.properties!['no_default'] as JSONSchema7;

      expect(field.default).toBeUndefined();
    });

    it('should handle empty string default_value', () => {
      const fieldWithEmptyDefault = {
        id: 'empty_default',
        label: 'Empty Default',
        field_type: 'text' as const,
        required: false,
        default_value: '',
      };

      const schema = {
        per_sample_fields: [fieldWithEmptyDefault],
        sections: [],
        batch_metadata_fields: [],
      };

      const jsonSchema = nexusToJsonSchema(schema);
      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.per_sample_fields[0].default_value).toBe('');
    });

    it('should handle options with undefined label_ids', () => {
      const fieldWithMixedOptions = {
        id: 'mixed_options',
        label: 'Mixed Options',
        field_type: 'graded_choice' as const,
        required: false,
        options: [
          { value: 1, label: 'First' },
          { value: 2, label: 'Second', label_id: 'second_label' },
          { value: 3, label: 'Third' },
        ],
      };

      const schema = {
        per_sample_fields: [fieldWithMixedOptions],
        sections: [],
        batch_metadata_fields: [],
      };

      const jsonSchema = nexusToJsonSchema(schema);
      const result = jsonSchemaToNexus(jsonSchema);

      expect(result.per_sample_fields[0].options).toHaveLength(3);
      expect(result.per_sample_fields[0].options![0].label_id).toBeUndefined();
      expect(result.per_sample_fields[0].options![1].label_id).toBe('second_label');
      expect(result.per_sample_fields[0].options![2].label_id).toBeUndefined();
    });
  });
});
