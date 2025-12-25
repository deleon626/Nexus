-- Migration 007: ID Generation Rules table
-- Created: 2025-12-23
-- Feature: 006-ai-schema-generator

-- ID Generation Rules table for storing parsed ID patterns
CREATE TABLE IF NOT EXISTS id_generation_rules (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,           -- 'batch', 'sample', 'report', 'schema'
    facility_id TEXT,                     -- NULL for global rules
    rule_name TEXT NOT NULL,
    pattern TEXT NOT NULL,                -- e.g., "NAB-{YYYY}-{MM}-{SEQ:4}"
    components TEXT NOT NULL,             -- JSON: Structured rule definition
    natural_language_source TEXT,         -- Original user description
    last_sequence INTEGER DEFAULT 0,      -- Track last used sequence number
    sequence_reset_period TEXT,           -- 'monthly', 'yearly', 'never'
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, facility_id)
);

-- Index for fast ID rule lookups by entity type and facility
CREATE INDEX IF NOT EXISTS idx_id_rules_entity_facility ON id_generation_rules(entity_type, facility_id);

-- Index for active rules lookup
CREATE INDEX IF NOT EXISTS idx_id_rules_active ON id_generation_rules(active);
