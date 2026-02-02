-- Migration: 003_schema_document_storage.sql
-- Description: Add source document storage columns to form_templates
-- Author: Claude
-- Date: 2026-01-16

-- Add source document columns to form_templates
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS source_document_path VARCHAR(500);
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS source_document_filename VARCHAR(255);
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS source_document_size INTEGER;
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS source_document_mime_type VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN form_templates.source_document_path IS 'Relative path to stored source document (e.g., documents/{schema_id}/source.pdf)';
COMMENT ON COLUMN form_templates.source_document_filename IS 'Original filename of uploaded source document';
COMMENT ON COLUMN form_templates.source_document_size IS 'File size in bytes';
COMMENT ON COLUMN form_templates.source_document_mime_type IS 'MIME type of source document (e.g., application/pdf, image/png)';
