/**
 * Schema Converter: Bidirectional conversion between Nexus ExtractedSchemaStructure
 * and standard JSON Schema format for use with jsonjoy-builder.
 *
 * Strategy: Keep Nexus format as canonical, convert to/from JSON Schema for visual editing.
 * Custom metadata preserved via x-nexus-* extensions.
 */

import type {
  ExtractedSchemaStructure,
  SchemaField,
  SchemaSection,
  SchemaCriterion,
  GradeOption,
  FieldType,
} from '@/types/schema';

// JSON Schema 7 types (subset we need)
export interface JSONSchema7 {
  $schema?: string;
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: Record<string, JSONSchema7Definition>;
  required?: string[];
  items?: JSONSchema7Definition;
  enum?: (string | number | boolean | null)[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: unknown;
  // Nexus custom extensions
  'x-nexus-id'?: string;
  'x-nexus-label-id'?: string;
  'x-nexus-unit'?: string;
  'x-nexus-field-type'?: FieldType;
  'x-nexus-graded'?: boolean;
  'x-nexus-grades'?: GradeOption[];
  'x-nexus-options'?: GradeOption[];
  'x-nexus-criteria'?: SchemaCriterion[];
}

export type JSONSchema7Definition = JSONSchema7 | boolean;

/**
 * Convert a Nexus SchemaField to JSON Schema property definition
 */
function fieldToJsonSchema(field: SchemaField): JSONSchema7 {
  const base: JSONSchema7 = {
    title: field.label,
    'x-nexus-id': field.id,
    'x-nexus-field-type': field.field_type,
  };

  // Preserve optional metadata
  if (field.label_id) {
    base['x-nexus-label-id'] = field.label_id;
  }
  if (field.unit) {
    base['x-nexus-unit'] = field.unit;
  }
  if (field.default_value !== undefined) {
    base.default = field.default_value;
  }

  // Map field type to JSON Schema type
  switch (field.field_type) {
    case 'text':
      base.type = 'string';
      if (field.validation_rules?.minLength !== undefined) {
        base.minLength = field.validation_rules.minLength as number;
      }
      if (field.validation_rules?.maxLength !== undefined) {
        base.maxLength = field.validation_rules.maxLength as number;
      }
      if (field.validation_rules?.pattern) {
        base.pattern = field.validation_rules.pattern as string;
      }
      break;

    case 'number':
      base.type = 'number';
      if (field.validation_rules?.min !== undefined) {
        base.minimum = field.validation_rules.min as number;
      }
      if (field.validation_rules?.max !== undefined) {
        base.maximum = field.validation_rules.max as number;
      }
      break;

    case 'date':
      base.type = 'string';
      base.format = 'date';
      break;

    case 'boolean':
      base.type = 'boolean';
      break;

    case 'choice':
      base.type = 'string';
      if (field.options && field.options.length > 0) {
        base.enum = field.options.map((opt) => opt.label);
        base['x-nexus-options'] = field.options;
      }
      break;

    case 'graded_choice':
      base.type = 'integer';
      base['x-nexus-graded'] = true;
      if (field.options && field.options.length > 0) {
        base.enum = field.options.map((opt) => opt.value);
        base['x-nexus-grades'] = field.options;
      }
      break;

    default:
      base.type = 'string';
  }

  return base;
}

/**
 * Convert a Nexus SchemaSection to JSON Schema property definition
 */
function sectionToJsonSchema(section: SchemaSection): JSONSchema7 {
  return {
    type: 'object',
    title: section.label,
    'x-nexus-id': section.id,
    'x-nexus-label-id': section.label_id,
    'x-nexus-criteria': section.criteria,
    properties: section.criteria.reduce(
      (acc, criterion) => {
        acc[criterion.id] = {
          type: 'integer',
          title: criterion.label,
          'x-nexus-id': criterion.id,
          'x-nexus-label-id': criterion.label_id,
          'x-nexus-graded': true,
          'x-nexus-grades': criterion.grades,
          enum: criterion.grades.map((g) => g.value),
        };
        return acc;
      },
      {} as Record<string, JSONSchema7>
    ),
  };
}

/**
 * Convert Nexus ExtractedSchemaStructure to JSON Schema
 */
export function nexusToJsonSchema(nexus: ExtractedSchemaStructure): JSONSchema7 {
  const properties: Record<string, JSONSchema7> = {};

  // Per-sample fields group - ALWAYS create to allow adding new fields
  const perSampleProps: Record<string, JSONSchema7> = {};
  const perSampleRequired: string[] = [];

  nexus.per_sample_fields.forEach((field) => {
    perSampleProps[field.id] = fieldToJsonSchema(field);
    if (field.required) {
      perSampleRequired.push(field.id);
    }
  });

  properties['per_sample_fields'] = {
    type: 'object',
    title: 'Per Sample Fields',
    description: 'Fields that apply to each sample in the batch',
    properties: perSampleProps,
    required: perSampleRequired.length > 0 ? perSampleRequired : undefined,
  };

  // Sections group - ALWAYS create to allow adding new sections
  const sectionsProps: Record<string, JSONSchema7> = {};

  nexus.sections.forEach((section) => {
    sectionsProps[section.id] = sectionToJsonSchema(section);
  });

  properties['sections'] = {
    type: 'object',
    title: 'Sections',
    description: 'Graded sections with criteria',
    properties: sectionsProps,
  };

  // Batch metadata fields group - ALWAYS create to allow adding new fields
  const batchProps: Record<string, JSONSchema7> = {};
  const batchRequired: string[] = [];

  nexus.batch_metadata_fields.forEach((field) => {
    batchProps[field.id] = fieldToJsonSchema(field);
    if (field.required) {
      batchRequired.push(field.id);
    }
  });

  properties['batch_metadata_fields'] = {
    type: 'object',
    title: 'Batch Metadata Fields',
    description: 'Fields that apply to the entire batch',
    properties: batchProps,
    required: batchRequired.length > 0 ? batchRequired : undefined,
  };

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: 'QC Schema',
    properties,
    // All groups are required at top level
    required: Object.keys(properties),
  };
}

/**
 * Convert JSON Schema property definition back to Nexus SchemaField
 */
function jsonSchemaToField(prop: JSONSchema7, key: string): SchemaField {
  // Sanitize key - generate fallback if empty/whitespace only
  const sanitizedKey = key.trim() || `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  
  const field: SchemaField = {
    id: prop['x-nexus-id'] || sanitizedKey,
    label: prop.title || sanitizedKey,
    label_id: prop['x-nexus-label-id'],
    field_type: prop['x-nexus-field-type'] || inferFieldType(prop),
    required: false, // Will be set by parent
    default_value: prop.default as string | undefined,
    unit: prop['x-nexus-unit'],
  };

  // Restore options for choice/graded_choice
  if (prop['x-nexus-grades']) {
    field.options = prop['x-nexus-grades'];
  } else if (prop['x-nexus-options']) {
    field.options = prop['x-nexus-options'];
  }

  // Restore validation rules
  const validationRules: Record<string, unknown> = {};
  if (prop.minimum !== undefined) validationRules.min = prop.minimum;
  if (prop.maximum !== undefined) validationRules.max = prop.maximum;
  if (prop.minLength !== undefined) validationRules.minLength = prop.minLength;
  if (prop.maxLength !== undefined) validationRules.maxLength = prop.maxLength;
  if (prop.pattern !== undefined) validationRules.pattern = prop.pattern;

  if (Object.keys(validationRules).length > 0) {
    field.validation_rules = validationRules;
  }

  return field;
}

/**
 * Infer Nexus FieldType from JSON Schema if x-nexus-field-type not present
 */
function inferFieldType(prop: JSONSchema7): FieldType {
  if (prop['x-nexus-graded']) {
    return 'graded_choice';
  }

  // Handle union types like ["string", "null"] - extract first non-null type
  let schemaType = prop.type;
  if (Array.isArray(schemaType)) {
    schemaType = schemaType.find((t) => t !== 'null') || 'string';
  }

  // Handle choice fields
  if (prop.enum && schemaType === 'string') {
    return 'choice';
  }
  if (prop.format === 'date') {
    return 'date';
  }
  if (schemaType === 'boolean') {
    return 'boolean';
  }
  if (schemaType === 'number' || schemaType === 'integer') {
    return 'number';
  }
  // Unsupported complex types (array, object) default to text
  if (schemaType === 'array' || schemaType === 'object') {
    return 'text';
  }
  return 'text';
}

/**
 * Convert JSON Schema property definition back to Nexus SchemaSection
 */
function jsonSchemaToSection(prop: JSONSchema7, key: string): SchemaSection {
  // If we have stored criteria, use them directly
  if (prop['x-nexus-criteria']) {
    return {
      id: prop['x-nexus-id'] || key,
      label: prop.title || key,
      label_id: prop['x-nexus-label-id'],
      criteria: prop['x-nexus-criteria'],
    };
  }

  // Otherwise, reconstruct from properties
  const criteria: SchemaCriterion[] = [];

  if (prop.properties) {
    Object.entries(prop.properties).forEach(([critKey, critProp]) => {
      if (typeof critProp === 'object' && critProp !== null) {
        const criterion: SchemaCriterion = {
          id: (critProp as JSONSchema7)['x-nexus-id'] || critKey,
          label: (critProp as JSONSchema7).title || critKey,
          label_id: (critProp as JSONSchema7)['x-nexus-label-id'],
          grades: (critProp as JSONSchema7)['x-nexus-grades'] || [],
        };
        criteria.push(criterion);
      }
    });
  }

  return {
    id: prop['x-nexus-id'] || key,
    label: prop.title || key,
    label_id: prop['x-nexus-label-id'],
    criteria,
  };
}

/**
 * Convert JSON Schema back to Nexus ExtractedSchemaStructure
 */
export function jsonSchemaToNexus(jsonSchema: JSONSchema7): ExtractedSchemaStructure {
  const result: ExtractedSchemaStructure = {
    per_sample_fields: [],
    sections: [],
    batch_metadata_fields: [],
  };

  if (!jsonSchema.properties) {
    return result;
  }

  // Known group keys that we handle specially
  const knownGroups = new Set(['per_sample_fields', 'sections', 'batch_metadata_fields']);

  // Extract per_sample_fields
  const perSampleGroup = jsonSchema.properties['per_sample_fields'];
  if (perSampleGroup && typeof perSampleGroup === 'object') {
    const perSampleSchema = perSampleGroup as JSONSchema7;
    const requiredFields = new Set(perSampleSchema.required || []);

    if (perSampleSchema.properties) {
      Object.entries(perSampleSchema.properties).forEach(([key, prop]) => {
        if (typeof prop === 'object' && prop !== null) {
          const field = jsonSchemaToField(prop as JSONSchema7, key);
          field.required = requiredFields.has(key);
          result.per_sample_fields.push(field);
        }
      });
    }
  }

  // Extract sections
  const sectionsGroup = jsonSchema.properties['sections'];
  if (sectionsGroup && typeof sectionsGroup === 'object') {
    const sectionsSchema = sectionsGroup as JSONSchema7;

    if (sectionsSchema.properties) {
      Object.entries(sectionsSchema.properties).forEach(([key, prop]) => {
        if (typeof prop === 'object' && prop !== null) {
          result.sections.push(jsonSchemaToSection(prop as JSONSchema7, key));
        }
      });
    }
  }

  // Extract batch_metadata_fields
  const batchGroup = jsonSchema.properties['batch_metadata_fields'];
  if (batchGroup && typeof batchGroup === 'object') {
    const batchSchema = batchGroup as JSONSchema7;
    const requiredFields = new Set(batchSchema.required || []);

    if (batchSchema.properties) {
      Object.entries(batchSchema.properties).forEach(([key, prop]) => {
        if (typeof prop === 'object' && prop !== null) {
          const field = jsonSchemaToField(prop as JSONSchema7, key);
          field.required = requiredFields.has(key);
          result.batch_metadata_fields.push(field);
        }
      });
    }
  }

  // Handle orphan fields at root level (not in known groups)
  // These are added to per_sample_fields as a fallback to prevent data loss
  Object.entries(jsonSchema.properties).forEach(([key, prop]) => {
    if (!knownGroups.has(key) && typeof prop === 'object' && prop !== null) {
      const propSchema = prop as JSONSchema7;
      // Only treat as orphan field if it looks like a field (has type), not a group (has properties)
      if (propSchema.type && !propSchema.properties) {
        const field = jsonSchemaToField(propSchema, key);
        result.per_sample_fields.push(field);
      }
    }
  });

  return result;
}

/**
 * Validate that a roundtrip conversion preserves data integrity
 */
export function validateRoundtrip(original: ExtractedSchemaStructure): boolean {
  const jsonSchema = nexusToJsonSchema(original);
  const roundtripped = jsonSchemaToNexus(jsonSchema);

  // Compare field counts
  if (original.per_sample_fields.length !== roundtripped.per_sample_fields.length) {
    return false;
  }
  if (original.sections.length !== roundtripped.sections.length) {
    return false;
  }
  if (original.batch_metadata_fields.length !== roundtripped.batch_metadata_fields.length) {
    return false;
  }

  // Deep comparison would go here if needed
  return true;
}
