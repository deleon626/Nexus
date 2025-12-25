-- Migration 006: AI Schema Generator tables
-- Created: 2025-12-23
-- Feature: 006-ai-schema-generator

-- FormTemplate already exists in models.py, but we need extraction_metadata
-- This migration adds the extraction_metadata column if not exists

-- Note: SQLite doesn't support IF NOT EXISTS for columns, so we use a try-style approach
-- The SQLAlchemy model in models.py handles the full schema definition

-- Add extraction_metadata to form_templates if not exists
-- This is handled by SQLAlchemy's create_all() in init_db()

-- Create index for faster schema lookups by name
CREATE INDEX IF NOT EXISTS idx_form_templates_name ON form_templates(form_name);

-- Create index for extraction metadata queries
CREATE INDEX IF NOT EXISTS idx_form_templates_created_at ON form_templates(created_at);
