/**
 * TypeScript types for ID Generation feature.
 * Mirrors backend/app/models/id_generation.py
 */

export type EntityType = 'batch' | 'sample' | 'report' | 'schema';

export type SequenceResetPeriod = 'never' | 'daily' | 'monthly' | 'yearly';

export type ComponentType =
  | 'literal'
  | 'year'
  | 'year_short'
  | 'month'
  | 'day'
  | 'sequence'
  | 'facility'
  | 'uuid';

export interface PatternComponent {
  type: ComponentType;
  value?: string;
  padding?: number;
  start_value?: number;
}

export interface IDRuleDefinition {
  pattern: string;
  components: PatternComponent[];
  sequence_reset_period: SequenceResetPeriod;
  example_id: string;
}

// API Request/Response Types

export interface IDRuleParseRequest {
  natural_language_rule: string;
  entity_type: EntityType;
  facility_id?: string;
}

export interface IDRuleParseResponse {
  parsed_rule: IDRuleDefinition;
  confidence_score: number;
  warnings: string[];
}

export interface IDRuleCreateRequest {
  rule_name: string;
  entity_type: EntityType;
  facility_id?: string;
  rule_definition: IDRuleDefinition;
  natural_language_source?: string;
}

export interface IDRuleResponse {
  id: string;
  rule_name: string;
  entity_type: EntityType;
  facility_id?: string;
  pattern: string;
  components: PatternComponent[];
  sequence_reset_period: SequenceResetPeriod;
  natural_language_source?: string;
  last_sequence: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IDRuleListItem {
  id: string;
  rule_name: string;
  entity_type: EntityType;
  facility_id?: string;
  pattern: string;
  last_sequence: number;
  active: boolean;
}

export interface IDRuleListResponse {
  rules: IDRuleListItem[];
  total: number;
}

export interface IDGenerateRequest {
  entity_type: EntityType;
  facility_id?: string;
}

export interface IDGenerateResponse {
  generated_id: string;
  entity_type: EntityType;
  sequence_number: number;
  rule_id: string;
}

export interface IDTestGenerateRequest {
  entity_type: EntityType;
  facility_id?: string;
}

export interface IDTestGenerateResponse {
  generated_id: string;
  entity_type: EntityType;
  sequence_number: number;
  rule_id: string;
  is_preview: boolean;
}
