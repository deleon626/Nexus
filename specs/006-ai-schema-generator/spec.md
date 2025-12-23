# Feature Specification: AI Schema Generator & ID Generator

**Feature Branch**: `006-ai-schema-generator`
**Created**: 2025-12-22
**Status**: Draft
**Input**: AI-powered Schema Generator and ID Generator for QC forms based on implementation plan

---

## Overview

This feature delivers two related capabilities for the Nexus QC system:

1. **Schema Generator**: AI-powered conversion of PDF/image QC forms into structured JSON schemas representing one sample's data structure
2. **ID Generator**: Flexible, AI-powered ID generation system for batches, samples, reports, and schemas

Both features support the multi-form QC system where different facilities have different form templates and ID conventions.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Schema Extraction from PDF (Priority: P1)

A Schema Designer uploads a blank QC inspection form (PDF or image) to the system. The AI analyzes the form structure and extracts a JSON schema representing the per-sample data fields, sections, criteria with grades, and validation rules. The extracted schema is displayed in an editable format for review and correction before saving.

**Why this priority**: This is the core value proposition - automating the tedious manual work of creating QC schemas from paper forms. Without this capability, Schema Designers must manually translate complex forms into data structures, which is error-prone and time-consuming.

**Independent Test**: Upload the sample "Penerimaan Bahan Baku" PDF form, verify schema extraction includes temperature fields, graded criteria sections, and batch metadata fields. Extraction accuracy should be measurable by comparing extracted fields against known form structure.

**Acceptance Scenarios**:

1. **Given** a Schema Designer has a blank QC form PDF, **When** they upload it with a schema name, **Then** the system displays an extracted JSON schema with per-sample fields, sections, criteria, and a confidence score
2. **Given** an extracted schema is displayed, **When** the Schema Designer edits the JSON, **Then** changes are preserved and validation errors are shown inline
3. **Given** an extracted schema with errors, **When** the Schema Designer corrects the JSON, **Then** they can save the corrected schema to the database

---

### User Story 2 - Schema Management (Priority: P1)

Schema Designers can view, edit, and manage all saved QC schemas in a centralized list. Schemas are versioned, allowing updates without losing historical data. Schemas can be validated for structural correctness before use.

**Why this priority**: Essential companion to extraction - schemas need lifecycle management to be useful in production. Operators selecting forms for data entry need access to validated, versioned schemas.

**Independent Test**: Create a schema via any method, verify it appears in schema list, edit it, save as new version, verify both versions exist. Original version remains accessible for historical submissions.

**Acceptance Scenarios**:

1. **Given** saved schemas exist, **When** a Schema Designer views the schema list, **Then** they see all schemas with name, version, creation date, and status
2. **Given** a schema is selected for editing, **When** the Schema Designer modifies it and saves, **Then** a new version is created and the previous version is preserved
3. **Given** a schema with validation errors, **When** validation is requested, **Then** the system returns specific error messages indicating what needs correction

---

### User Story 3 - ID Rule Configuration (Priority: P2)

Facility administrators define ID generation rules using natural language. The AI interprets these rules and creates a structured format. For example: "Batch IDs should be NAB-YYYY-MM-NNNN where YYYY is year, MM is month, and NNNN is a 4-digit sequence starting at 0001, resetting monthly."

**Why this priority**: ID generation is critical for traceability but less urgent than schema extraction. Facilities can use simple sequential IDs initially, then configure custom rules as needed.

**Independent Test**: Create a natural language ID rule for batches, verify the AI parses it into structured components. Generate sample IDs to confirm the pattern matches the rule.

**Acceptance Scenarios**:

1. **Given** a Facility Administrator wants custom batch IDs, **When** they describe the ID format in natural language, **Then** the AI parses it into a structured rule definition
2. **Given** a parsed ID rule, **When** the Administrator views it, **Then** they see the pattern, components, and an example generated ID
3. **Given** an ID rule exists for an entity type, **When** a new entity is created, **Then** the system generates the next ID following that rule

---

### User Story 4 - ID Generation for Entities (Priority: P2)

When creating batches, samples, reports, or schemas, the system automatically generates unique IDs following the configured rules. The generated ID is validated for uniqueness before assignment.

**Why this priority**: Enables the ID rules to be applied in practice. Without generation, rules are just documentation.

**Independent Test**: Configure a rule, create multiple batches, verify IDs increment correctly. Test uniqueness validation by attempting to assign a duplicate ID.

**Acceptance Scenarios**:

1. **Given** an ID rule is configured for batches, **When** a new batch is created, **Then** the system generates the next valid ID automatically
2. **Given** a generated ID, **When** the system checks uniqueness, **Then** conflicts are detected and alternative IDs are generated
3. **Given** a date-based ID pattern with monthly reset, **When** a new month begins, **Then** the sequence number resets to the starting value

---

### User Story 5 - Test ID Generation (Priority: P3)

Users can test ID generation without creating entities. This allows validation of ID rules before putting them into production use.

**Why this priority**: Nice-to-have for rule verification. Not critical for MVP but improves user confidence.

**Independent Test**: Open ID rule test interface, generate sample IDs, verify they follow the configured pattern without creating any database records.

**Acceptance Scenarios**:

1. **Given** an ID rule exists, **When** the user clicks "Test Generation", **Then** the system shows the current last ID and the next generated ID
2. **Given** multiple facilities with different ID rules, **When** a user tests generation for a specific facility, **Then** the correct facility rule is applied

---

### Edge Cases

- What happens when a PDF is corrupt or unreadable?
  - System reports file processing error with clear message; user can retry with a different file
- How does the system handle multi-page PDFs?
  - MVP: Only first page is processed; future versions may support multi-page
- What happens when LLM extraction fails or times out?
  - System retries once, then returns partial results with low confidence score; user can still edit manually
- How does ID generation handle concurrent requests?
  - System validates uniqueness after generation; conflicts trigger automatic retry with next sequence number
- What happens when ID sequence reaches maximum value (e.g., 9999)?
  - System generates warning before maximum; behavior depends on rule configuration (wrap around, extend digits, or error)
- How are bilingual labels (English/Indonesian) handled?
  - Schema format supports multilingual labels; extraction attempts to preserve both languages when present

---

## Requirements *(mandatory)*

### Functional Requirements

**Schema Generator**

- **FR-001**: System MUST accept PDF and image files (PNG, JPG, JPEG) for schema extraction
- **FR-002**: System MUST convert uploaded PDFs to images for AI vision processing
- **FR-003**: System MUST extract per-sample fields with types (text, number, date, choice, graded_choice)
- **FR-004**: System MUST extract sections and criteria hierarchy from form structure
- **FR-005**: System MUST extract graded criteria with all grade levels and their descriptions
- **FR-006**: System MUST extract validation rules from form notes and footers
- **FR-007**: System MUST extract batch-level metadata fields (supplier, date, lot number) separately from per-sample data
- **FR-008**: System MUST preserve bilingual labels when present in source form
- **FR-009**: System MUST return a confidence score indicating extraction reliability
- **FR-010**: System MUST display extracted schema in an editable JSON format
- **FR-011**: System MUST validate schema structure before saving (required fields, correct types)
- **FR-012**: System MUST save schemas with versioning (name + version as unique key)
- **FR-013**: System MUST allow listing all schemas with optional facility filtering
- **FR-014**: System MUST allow updating schemas with automatic version increment

**ID Generator**

- **FR-015**: System MUST parse natural language ID rules into structured rule definitions
- **FR-016**: System MUST support at least three format types: composite patterns, sequential numbers, and UUIDs
- **FR-017**: System MUST generate IDs based on configured rules for entity types: batch, sample, report, schema
- **FR-018**: System MUST validate generated IDs for uniqueness before returning
- **FR-019**: System MUST support facility-specific ID rules (separate rules per facility)
- **FR-020**: System MUST support date-based components (year, month) in ID patterns
- **FR-021**: System MUST support sequence numbers with configurable padding and starting values
- **FR-022**: System MUST handle sequence reset based on time periods (e.g., monthly reset)
- **FR-023**: System MUST allow testing ID generation without creating entities
- **FR-024**: System MUST handle concurrent ID requests without generating duplicates

**Integration**

- **FR-025**: System MUST integrate ID generation with batch creation workflow
- **FR-026**: System MUST record extraction metadata (source file, timestamp, model used, confidence) with saved schemas

### Key Entities

- **FormTemplate**: Represents a QC schema. Contains schema name, version, JSON schema definition (template_data), active status, and extraction metadata. Unique constraint on name + version combination.

- **IDGenerationRule**: Represents an ID generation rule. Contains rule name, entity type (batch/sample/report/schema), facility scope (optional), structured rule definition (pattern, components), natural language source description, and active status. Unique constraint on entity type + facility combination.

- **Extracted Schema Structure**: Nested data representing one sample's QC structure:
  - Per-sample fields (measurements, temperatures)
  - Sections containing criteria (e.g., Frozen section with Appearance criterion)
  - Graded criteria with value-label pairs
  - Batch metadata fields (separate from per-sample data)
  - Validation rules (min/max values, thresholds)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Schema Designers can upload a PDF and receive an extracted schema within 30 seconds
- **SC-002**: At least 50% of extracted schema fields are correct without manual editing for well-structured single-page forms
- **SC-003**: Users can create and save a complete QC schema in under 10 minutes (including review and editing)
- **SC-004**: ID generation returns a unique, valid ID within 2 seconds for any entity type
- **SC-005**: Natural language ID rules are correctly parsed into structured format at least 80% of the time
- **SC-006**: Zero duplicate IDs are generated under concurrent usage scenarios
- **SC-007**: Schema list displays correctly for facilities with 100+ schemas
- **SC-008**: System handles 10 concurrent schema extraction requests without degradation
- **SC-009**: Batch creation workflow successfully receives auto-generated IDs for 99% of requests
- **SC-010**: Users report saved editing time of at least 70% compared to manual schema creation

---

## Assumptions

The following assumptions were made based on context and industry standards:

1. **MVP Scope**: Only single-page, well-structured QC forms are supported initially. Complex multi-page forms will be addressed in Phase 2.

2. **User Technical Level**: MVP users are comfortable editing JSON directly. A visual schema editor is planned for Phase 2.

3. **Extraction Accuracy**: 50-70% initial accuracy is acceptable since users will review and edit extracted schemas.

4. **File Size Limits**: PDF/image uploads are limited to 10MB to ensure reasonable processing times.

5. **Concurrent Usage**: Initial system design targets 10 concurrent users for schema operations.

6. **ID Uniqueness Scope**: Uniqueness is validated per entity type (batches checked against batches only).

7. **Facility Isolation**: Schemas and ID rules can be facility-specific or global, following existing RLS patterns.

8. **LLM Model Selection**: Vision-capable models (Claude 3.5 Sonnet or equivalent) are used for extraction; cheaper models (Haiku) are used for ID tasks.

---

## Scope Boundaries

**In Scope (MVP)**:
- PDF and image upload for schema extraction
- AI-powered schema extraction using vision models
- JSON editor for schema review and editing
- Schema CRUD operations with versioning
- Natural language ID rule configuration
- ID generation for batches, samples, reports, schemas
- Uniqueness validation for generated IDs
- Basic confidence scoring for extraction quality

**Out of Scope (Phase 2+)**:
- Visual drag-and-drop schema editor
- Multi-page PDF support
- Filled form validation (testing extraction with completed forms)
- Schema template library
- Check digit algorithms for IDs
- Bulk ID generation
- Schema approval workflow
- Schema → Form renderer (auto-generate UI)
- Collaborative schema editing
