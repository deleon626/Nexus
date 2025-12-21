-- Migration: 002_form_system_tables.sql
-- Description: Create form system tables for multi-form QC data storage
-- Author: Claude Code
-- Date: 2024-12-20

-- ============================================================================
-- ENABLE UUID EXTENSION (if not already enabled)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: form_templates
-- Description: Form definitions with versioning for different QC processes
-- ============================================================================
CREATE TABLE IF NOT EXISTS form_templates (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Form Identification
    form_code VARCHAR(50) NOT NULL,              -- e.g., "FR/QC/II.03.01"
    form_name VARCHAR(255) NOT NULL,             -- e.g., "Raw Material Receiving"
    category VARCHAR(100),                       -- e.g., "Receiving", "Processing", "Final"

    -- Versioning
    version VARCHAR(50) NOT NULL,                -- e.g., "Revisi 02", "v1.0"
    version_number INTEGER NOT NULL DEFAULT 1,   -- Numeric version for sorting

    -- Schema Definition (JSONB for flexibility)
    schema_definition JSONB NOT NULL,            -- Complete form structure

    -- Metadata
    status VARCHAR(20) DEFAULT 'draft',          -- draft, active, deprecated, archived
    effective_from TIMESTAMP WITH TIME ZONE,     -- When this version becomes active
    effective_until TIMESTAMP WITH TIME ZONE,    -- When this version expires

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID,

    -- Constraints
    CONSTRAINT uq_form_template_code_version UNIQUE(form_code, version),
    CONSTRAINT ck_form_template_status CHECK (status IN ('draft', 'active', 'deprecated', 'archived'))
);

-- Indexes for form_templates
CREATE INDEX IF NOT EXISTS idx_form_templates_code ON form_templates(form_code);
CREATE INDEX IF NOT EXISTS idx_form_templates_status ON form_templates(status);
CREATE INDEX IF NOT EXISTS idx_form_templates_effective ON form_templates(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_form_templates_version_number ON form_templates(form_code, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_form_templates_schema_gin ON form_templates USING GIN (schema_definition);

-- ============================================================================
-- TABLE: form_submissions
-- Description: Submitted reports with header data and workflow status
-- ============================================================================
CREATE TABLE IF NOT EXISTS form_submissions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Form Template Reference
    template_id UUID NOT NULL REFERENCES form_templates(id),
    form_code VARCHAR(50) NOT NULL,              -- Denormalized for querying
    form_version VARCHAR(50) NOT NULL,           -- Snapshot for audit trail

    -- Session Context
    session_id UUID,                             -- Reference to sessions table (nullable)

    -- Header Data (form-specific fields stored as JSONB)
    header_data JSONB NOT NULL DEFAULT '{}',     -- e.g., {"raw_material_type": "Tuna", "supplier": "ABC Co."}

    -- Summary/Calculated Fields (denormalized for querying)
    summary_data JSONB,                          -- Aggregated data for reporting

    -- Status & Workflow
    status VARCHAR(50) DEFAULT 'draft',          -- draft, pending_approval, approved, rejected, archived

    -- Approval Tracking
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    approval_status VARCHAR(50),                 -- approved, rejected, pending_review, conditional
    approval_comments TEXT,

    -- Compliance Fields
    decision VARCHAR(50),                        -- Release, Reject, Hold
    corrective_action TEXT,

    -- Attachments
    attachment_urls TEXT[],                      -- Array of storage URLs

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT ck_submission_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'archived')),
    CONSTRAINT ck_approval_status CHECK (approval_status IS NULL OR approval_status IN ('approved', 'rejected', 'pending_review', 'conditional'))
);

-- Indexes for form_submissions
CREATE INDEX IF NOT EXISTS idx_form_submissions_template ON form_submissions(template_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_code ON form_submissions(form_code);
CREATE INDEX IF NOT EXISTS idx_form_submissions_session ON form_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_approval ON form_submissions(approval_status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_header_gin ON form_submissions USING GIN (header_data);
CREATE INDEX IF NOT EXISTS idx_form_submissions_summary_gin ON form_submissions USING GIN (summary_data);

-- ============================================================================
-- TABLE: samples
-- Description: Individual samples within a form submission
-- ============================================================================
CREATE TABLE IF NOT EXISTS samples (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Parent Reference
    submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,

    -- Sample Identification
    sample_number INTEGER NOT NULL,              -- 1-18 for Raw Material Receiving
    sample_label VARCHAR(100),                   -- Optional custom label

    -- Common Sample Fields (denormalized for queryability)
    temperature NUMERIC(6,2),                    -- e.g., -18.50 (degrees Celsius)
    weight NUMERIC(10,3),                        -- kg
    grade NUMERIC(5,2),                          -- Calculated grade (5-9)

    -- Sample-Specific Data (flexible JSONB)
    sample_data JSONB,                           -- Any additional sample fields

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_sample_submission_number UNIQUE(submission_id, sample_number),
    CONSTRAINT ck_sample_number_positive CHECK (sample_number > 0)
);

-- Indexes for samples
CREATE INDEX IF NOT EXISTS idx_samples_submission ON samples(submission_id);
CREATE INDEX IF NOT EXISTS idx_samples_temperature ON samples(temperature) WHERE temperature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_samples_grade ON samples(grade) WHERE grade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_samples_sample_data_gin ON samples USING GIN (sample_data);

-- ============================================================================
-- TABLE: sample_measurements
-- Description: Individual criterion measurements for a sample
-- ============================================================================
CREATE TABLE IF NOT EXISTS sample_measurements (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Parent Reference
    sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,

    -- Measurement Context
    section VARCHAR(50) NOT NULL,                -- e.g., "frozen", "thawing"
    criterion_id VARCHAR(50) NOT NULL,           -- e.g., "appearance", "odor", "texture"
    criterion_label VARCHAR(255),                -- Human-readable label

    -- Value
    grade_value NUMERIC(5,2),                    -- e.g., 5, 7, 9
    text_value TEXT,                             -- For non-numeric criteria

    -- Metadata
    measurement_type VARCHAR(50) DEFAULT 'numeric_grade', -- numeric_grade, boolean, text, calculated, other

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_measurement_sample_section_criterion UNIQUE(sample_id, section, criterion_id),
    CONSTRAINT ck_measurement_type CHECK (measurement_type IN ('numeric_grade', 'boolean', 'text', 'calculated', 'other'))
);

-- Indexes for sample_measurements
CREATE INDEX IF NOT EXISTS idx_sample_measurements_sample ON sample_measurements(sample_id);
CREATE INDEX IF NOT EXISTS idx_sample_measurements_criterion ON sample_measurements(criterion_id, section);
CREATE INDEX IF NOT EXISTS idx_sample_measurements_grade ON sample_measurements(grade_value) WHERE grade_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sample_measurements_section ON sample_measurements(section);

-- ============================================================================
-- TABLE: form_submission_history
-- Description: Temporal audit trail for form submissions (FDA 21 CFR Part 11)
-- ============================================================================
CREATE TABLE IF NOT EXISTS form_submission_history (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Reference
    submission_id UUID NOT NULL REFERENCES form_submissions(id),

    -- Event Metadata
    event_type VARCHAR(100) NOT NULL,            -- created, updated, submitted, approved, rejected, modified, archived
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_by UUID,                               -- User who triggered the event

    -- State Snapshot (immutable)
    snapshot_data JSONB NOT NULL,                -- Complete state at this point in time

    -- Change Delta (for efficiency)
    changes JSONB,                               -- Only changed fields (before/after)

    -- Reason/Context
    reason TEXT,
    metadata JSONB,                              -- IP address, user agent, etc.

    -- Constraints
    CONSTRAINT ck_history_event_type CHECK (event_type IN ('created', 'updated', 'submitted', 'approved', 'rejected', 'modified', 'archived'))
);

-- Indexes for form_submission_history
CREATE INDEX IF NOT EXISTS idx_form_submission_history_submission ON form_submission_history(submission_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_form_submission_history_event_type ON form_submission_history(event_type);
CREATE INDEX IF NOT EXISTS idx_form_submission_history_timestamp ON form_submission_history(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_form_submission_history_event_by ON form_submission_history(event_by);

-- ============================================================================
-- TRIGGER: Auto-capture changes to form_submissions
-- Description: Creates immutable audit trail entries on INSERT/UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION capture_form_submission_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO form_submission_history (
        submission_id,
        event_type,
        event_timestamp,
        event_by,
        snapshot_data,
        changes,
        metadata
    )
    VALUES (
        NEW.id,
        CASE
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
                CASE NEW.status
                    WHEN 'pending_approval' THEN 'submitted'
                    WHEN 'approved' THEN 'approved'
                    WHEN 'rejected' THEN 'rejected'
                    WHEN 'archived' THEN 'archived'
                    ELSE 'updated'
                END
            ELSE 'updated'
        END,
        NOW(),
        COALESCE(NEW.updated_by, NEW.created_by),
        to_jsonb(NEW),
        CASE WHEN TG_OP = 'UPDATE' THEN
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'old_approval_status', OLD.approval_status,
                'new_approval_status', NEW.approval_status
            )
        ELSE NULL END,
        jsonb_build_object(
            'operation', TG_OP,
            'table_name', TG_TABLE_NAME,
            'trigger_time', NOW()
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotent migrations)
DROP TRIGGER IF EXISTS trigger_form_submission_history ON form_submissions;

-- Create trigger
CREATE TRIGGER trigger_form_submission_history
AFTER INSERT OR UPDATE ON form_submissions
FOR EACH ROW
EXECUTE FUNCTION capture_form_submission_change();

-- ============================================================================
-- TRIGGER: Auto-update updated_at on form_submissions
-- ============================================================================
CREATE OR REPLACE FUNCTION update_form_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_form_submission_updated_at ON form_submissions;

CREATE TRIGGER trigger_form_submission_updated_at
BEFORE UPDATE ON form_submissions
FOR EACH ROW
EXECUTE FUNCTION update_form_submission_timestamp();

-- ============================================================================
-- TRIGGER: Auto-update updated_at on form_templates
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_form_template_updated_at ON form_templates;

CREATE TRIGGER trigger_form_template_updated_at
BEFORE UPDATE ON form_templates
FOR EACH ROW
EXECUTE FUNCTION update_form_submission_timestamp();

-- ============================================================================
-- COMMENTS: Add documentation to tables and columns
-- ============================================================================
COMMENT ON TABLE form_templates IS 'Form definitions with versioning for different QC processes';
COMMENT ON TABLE form_submissions IS 'Submitted QC reports with header data and workflow status';
COMMENT ON TABLE samples IS 'Individual samples within a form submission';
COMMENT ON TABLE sample_measurements IS 'Individual criterion measurements for a sample';
COMMENT ON TABLE form_submission_history IS 'Immutable audit trail for FDA 21 CFR Part 11 compliance';

COMMENT ON COLUMN form_templates.schema_definition IS 'JSONB containing sections, fields, criteria, and validation rules';
COMMENT ON COLUMN form_submissions.header_data IS 'Form-specific header fields (supplier, date, lot_no, etc.)';
COMMENT ON COLUMN form_submissions.summary_data IS 'Calculated aggregates (avg grade, total weight, etc.)';
COMMENT ON COLUMN samples.grade IS 'Calculated average grade from all measurements';
COMMENT ON COLUMN sample_measurements.section IS 'Section identifier (e.g., frozen, thawing)';
COMMENT ON COLUMN sample_measurements.criterion_id IS 'Criterion identifier (e.g., appearance, odor, texture)';

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_migrations (version, description)
VALUES ('002', 'Add form_templates, form_submissions, samples, sample_measurements, and form_submission_history tables')
ON CONFLICT (version) DO NOTHING;
