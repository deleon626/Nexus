# Implementation Plan: AI Schema Generator & ID Generator

**Branch**: `006-ai-schema-generator` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-ai-schema-generator/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature delivers two AI-powered capabilities for the Nexus QC system:

1. **Schema Generator**: Converts PDF/image QC forms into structured JSON schemas using vision-capable LLMs, extracting per-sample fields, sections, criteria with grades, and validation rules. Schemas are editable, versioned, and validated before saving.

2. **ID Generator**: Parses natural language ID rules into structured format and generates unique IDs for batches, samples, reports, and schemas following facility-specific patterns with automatic uniqueness validation.

**Technical Approach**: Leverage existing Agno framework with vision-capable models (Claude 3.5 Sonnet via OpenRouter) for schema extraction, cheaper models (Haiku) for ID rule parsing. Use SQLite for MVP storage with versioned schemas and facility-scoped ID rules. Follow Human-in-the-Loop principle for schema confirmation before saving.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.2+ (frontend)
**Primary Dependencies**: Agno 1.4.5+ (agent framework), FastAPI 0.124+ (API), React 18.2+ (UI), Pydantic v2 (validation)
**Storage**: SQLite (MVP database at `backend/data/nexus.db`)
**Testing**: pytest (backend unit/integration), manual testing (frontend)
**Target Platform**: Linux server (backend), modern browsers (frontend web dashboard)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Schema extraction <30s, ID generation <2s, support 10 concurrent extractions
**Constraints**: PDF/image files <10MB, single-page forms only (MVP), 50%+ extraction accuracy
**Scale/Scope**: 100+ schemas per facility, 10 concurrent users, 99.9% ID uniqueness

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Core Principle I: Human-in-the-Loop (NON-NEGOTIABLE)

**Status**: COMPLIANT

- Schema extraction requires explicit user review and confirmation before saving
- ID generation is automatic BUT user confirms entity creation (which triggers ID generation)
- No automated persistence without human approval
- Agent tools will use `stop_after_tool_call=True` for schema confirmation modal

**Verification**: Schema Designer reviews extracted JSON, edits if needed, and explicitly clicks "Save Schema" before persistence.

### ✅ Core Principle II: Layered Architecture

**Status**: COMPLIANT

Planned architecture follows strict layer separation:

- **API Layer** (`backend/app/api/schemas.py`, `id_generation.py`): Thin routes for schema upload/CRUD and ID generation
- **Service Layer** (`backend/app/services/schema_service.py`, `id_service.py`): Business logic for extraction, validation, ID parsing, generation
- **Tool Layer** (`backend/app/tools/schema_tools.py`, `id_tools.py`): Agent tools for extraction and rule parsing
- **DB Layer** (`backend/app/db/sqlite_client.py`): Database access only; no business logic
- **Models** (`backend/app/models/schema.py`, `id_generation.py`): Pydantic schemas for API contracts

**No violations expected**: Tools call services, services orchestrate DB + LLM, routes delegate to services.

### ✅ Core Principle III: Security by Default

**Status**: COMPLIANT

- All file uploads validated at API entry (file type, size, mime type) via Pydantic
- JWT authentication required for all schema/ID endpoints
- File size limit enforced (10MB) to prevent DoS
- Uploaded files stored with unique IDs, not original filenames
- CORS whitelist configured (localhost:5173 for MVP)
- No RLS policies required for MVP (SQLite); facility isolation handled in service layer queries

**Note**: SQLite doesn't support RLS, so facility filtering is enforced in service layer queries. This is acceptable for MVP; migration to PostgreSQL with RLS is planned.

### ✅ Core Principle IV: Test-First Development (Backend)

**Status**: COMPLIANT

TDD will be applied to:

- `app/services/schema_service.py`: Test extraction, validation, versioning logic
- `app/services/id_service.py`: Test ID parsing, generation, uniqueness validation
- `app/tools/schema_tools.py`: Test tool invocation with mock LLM responses
- `app/tools/id_tools.py`: Test rule parsing tool
- `app/api/schemas.py`, `app/api/id_generation.py`: Test endpoint contracts

**Test categories**:
- Unit tests: Service methods, validation logic, ID generation algorithms
- Integration tests: Full extraction workflow, ID generation with DB
- Contract tests: API input/output validation

### 🟡 Technology Stack Compliance

**Status**: COMPLIANT WITH NOTES

- **Approved Stack**: Python 3.11+, FastAPI, Pydantic v2, React 18, TypeScript, SQLite (MVP), Agno framework (approved deviation DEV-001)
- **New Dependencies Required**:
  - `pdf2image` (Python): Convert PDF to images for vision models (well-established, MIT license)
  - `Pillow` (Python): Image manipulation (standard library in Python ecosystem)
  - None for frontend (existing React + TypeScript stack sufficient)

**Justification for new dependencies**:
- `pdf2image`: Required for FR-002 (convert PDFs to images). No built-in Python alternative. Wraps `poppler-utils`, industry standard.
- `Pillow`: Required for image preprocessing before LLM ingestion (resize, format conversion). Python Imaging Library (PIL fork), widely used.

**No deviations from Approved Stack**: All new dependencies are well-established libraries with active maintenance.

### Constitution Check Summary

| Principle | Status | Notes |
|-----------|--------|-------|
| Human-in-the-Loop | ✅ PASS | Schema confirmation required before save |
| Layered Architecture | ✅ PASS | API → Service → Tool → DB separation maintained |
| Security by Default | ✅ PASS | Input validation, file size limits, auth required |
| Test-First Development | ✅ PASS | TDD applied to services, tools, API |
| Approved Stack | ✅ PASS | New dependencies documented and justified |

**Overall Gate Status**: ✅ **PASS** - Proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```text
specs/006-ai-schema-generator/
├── spec.md              # Feature specification (USER INPUT)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (entity models + relationships)
├── quickstart.md        # Phase 1 output (developer onboarding)
├── contracts/           # Phase 1 output (API specifications)
│   ├── schema-api.yaml      # Schema CRUD + extraction endpoints
│   └── id-generation-api.yaml # ID rule + generation endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT YET CREATED)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── schemas.py           # NEW: Schema CRUD + extraction routes
│   │   └── id_generation.py     # NEW: ID rule + generation routes
│   ├── services/
│   │   ├── schema_service.py    # NEW: Schema extraction, validation, versioning
│   │   └── id_service.py        # NEW: ID parsing, generation, uniqueness
│   ├── tools/
│   │   ├── schema_tools.py      # NEW: Agent tool for schema extraction
│   │   └── id_tools.py          # NEW: Agent tool for ID rule parsing
│   ├── models/
│   │   ├── schema.py            # NEW: FormTemplate, SchemaExtractionRequest/Response
│   │   └── id_generation.py    # NEW: IDGenerationRule, IDRequest/Response
│   ├── db/
│   │   ├── sqlite_client.py     # UPDATED: Add schema + ID rule tables
│   │   └── migrations/          # NEW: Schema migration scripts
│   │       ├── 006_schema_tables.sql
│   │       └── 007_id_rules_tables.sql
│   └── tests/
│       ├── test_schema_service.py    # NEW: Schema service tests
│       ├── test_id_service.py        # NEW: ID service tests
│       ├── test_schema_tools.py      # NEW: Schema tool tests
│       └── test_id_tools.py          # NEW: ID tool tests
├── data/
│   ├── uploads/                 # NEW: Temporary file storage for PDFs/images
│   └── nexus.db                 # UPDATED: SQLite database with new tables
└── pyproject.toml               # UPDATED: Add pdf2image, Pillow dependencies

web/
├── src/
│   ├── pages/
│   │   ├── SchemaGenerator.tsx  # NEW: Schema upload + extraction UI
│   │   ├── SchemaList.tsx       # NEW: Schema CRUD management UI
│   │   └── IDRuleConfig.tsx     # NEW: ID rule configuration UI
│   ├── components/
│   │   ├── SchemaUploader.tsx   # NEW: File upload component
│   │   ├── SchemaEditor.tsx     # NEW: JSON schema editor with validation
│   │   ├── SchemaPreview.tsx    # NEW: Display extracted schema
│   │   └── IDRuleTester.tsx     # NEW: Test ID generation component
│   ├── services/
│   │   ├── schemaService.ts     # NEW: API client for schema operations
│   │   └── idService.ts         # NEW: API client for ID operations
│   └── types/
│       ├── schema.ts            # NEW: TypeScript types for schemas
│       └── idGeneration.ts      # NEW: TypeScript types for ID rules
└── package.json                 # No changes (existing React stack sufficient)
```

**Structure Decision**: Web application structure selected. Backend handles AI processing, file storage, and business logic. Frontend provides UI for schema management and ID configuration. Follows existing Nexus architecture pattern (backend/app/, web/src/).

## Complexity Tracking

**No violations to justify**: This feature complies with all constitution principles and approved stack. No complexity threshold breaches detected.

---

## Phase 0: Research & Technical Decisions

*Output artifact: `research.md`*

### Research Tasks

The following unknowns from Technical Context require resolution:

1. **PDF to Image Conversion Strategy**
   - **Unknown**: Best approach for converting PDFs to images for vision LLM ingestion
   - **Research**: Evaluate `pdf2image` vs alternatives (PyMuPDF, pdfplumber)
   - **Deliverable**: Recommended library + conversion workflow (DPI, format, optimization)

2. **Vision LLM Prompting Patterns**
   - **Unknown**: Effective prompt structure for QC form schema extraction
   - **Research**: Review Claude vision best practices, test prompts with sample forms
   - **Deliverable**: Prompt template for schema extraction with example outputs

3. **JSON Schema Validation Library**
   - **Unknown**: Best library for validating extracted schemas before saving
   - **Research**: Compare jsonschema, pydantic-based validation, custom validators
   - **Deliverable**: Recommended validation approach + validation rules

4. **ID Uniqueness Validation at Scale**
   - **Unknown**: Handling concurrent ID generation without race conditions
   - **Research**: Evaluate database-level constraints vs application-level locking
   - **Deliverable**: Concurrency strategy (DB unique constraints + retry logic)

5. **Schema Versioning Strategy**
   - **Unknown**: How to handle schema updates without breaking historical data
   - **Research**: Review versioning patterns (immutable versions vs in-place updates)
   - **Deliverable**: Versioning approach (name + version as composite key)

6. **File Upload Security**
   - **Unknown**: Best practices for validating PDF/image uploads
   - **Research**: OWASP file upload guidelines, mime type validation, malware scanning
   - **Deliverable**: Security checklist for file upload endpoints

7. **LLM Model Selection**
   - **Unknown**: Optimal OpenRouter model for schema extraction vs ID parsing
   - **Research**: Compare Claude 3.5 Sonnet, GPT-4 Vision pricing/performance
   - **Deliverable**: Model recommendations for each use case

8. **Confidence Scoring Method**
   - **Unknown**: How to calculate extraction confidence score
   - **Research**: LLM confidence metrics (entropy, logprobs, structured output validation)
   - **Deliverable**: Confidence scoring algorithm

### Expected Outcomes (research.md)

For each research task above, `research.md` will document:

- **Decision**: Final technical choice
- **Rationale**: Why this option was selected
- **Alternatives Considered**: Other options evaluated
- **Implementation Notes**: Key details for development

---

## Phase 1: Design & Contracts

*Output artifacts: `data-model.md`, `contracts/*.yaml`, `quickstart.md`*

### 1.1 Data Model Design (data-model.md)

Extract entities from spec and define database schema:

**Entities to Model**:

1. **FormTemplate**
   - Fields: id, name, version, template_data (JSON), active, extraction_metadata, created_at, updated_at
   - Relationships: None (standalone entity)
   - Validation Rules: name + version must be unique, template_data must validate against schema structure
   - State Transitions: Draft → Active, Active → Archived

2. **IDGenerationRule**
   - Fields: id, entity_type, facility_id (nullable), rule_name, pattern, components (JSON), natural_language_source, active, created_at, updated_at
   - Relationships: Optional FK to facilities table (if facility-scoped)
   - Validation Rules: entity_type + facility_id must be unique, pattern must be parseable
   - State Transitions: Draft → Active, Active → Inactive

3. **ExtractedSchemaStructure** (JSON structure within FormTemplate.template_data)
   - Nested structure: per_sample_fields, sections, criteria, batch_metadata, validation_rules
   - Field types: text, number, date, choice, graded_choice
   - Graded criteria: value-label pairs for each grade level

**Database Schema** (SQLite migrations):

```sql
-- Migration 006: FormTemplates table
CREATE TABLE form_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version INTEGER NOT NULL,
    template_data JSON NOT NULL,  -- Extracted schema structure
    active BOOLEAN DEFAULT 1,
    extraction_metadata JSON,      -- {source_file, model_used, confidence, timestamp}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, version)
);

-- Migration 007: ID Generation Rules table
CREATE TABLE id_generation_rules (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,     -- 'batch', 'sample', 'report', 'schema'
    facility_id TEXT,               -- NULL for global rules
    rule_name TEXT NOT NULL,
    pattern TEXT NOT NULL,          -- e.g., "NAB-{YYYY}-{MM}-{SEQ:4}"
    components JSON NOT NULL,       -- Structured rule definition
    natural_language_source TEXT,   -- Original user description
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, facility_id)
);

-- Index for fast ID rule lookups
CREATE INDEX idx_id_rules_entity_facility ON id_generation_rules(entity_type, facility_id);
```

### 1.2 API Contracts (contracts/)

Generate OpenAPI specifications from functional requirements:

**Schema API** (`contracts/schema-api.yaml`):

```yaml
openapi: 3.0.0
info:
  title: Schema Generator API
  version: 1.0.0

paths:
  /api/schemas/extract:
    post:
      summary: Extract schema from uploaded PDF/image
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                schema_name:
                  type: string
      responses:
        200:
          description: Schema extracted successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SchemaExtractionResponse'
        400:
          description: Invalid file or request

  /api/schemas:
    get:
      summary: List all schemas
      parameters:
        - name: facility_id
          in: query
          schema:
            type: string
      responses:
        200:
          description: List of schemas
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/FormTemplate'
    post:
      summary: Save a schema (create or update)
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SchemaCreateRequest'
      responses:
        201:
          description: Schema saved successfully

  /api/schemas/{id}:
    get:
      summary: Get schema by ID
      responses:
        200:
          description: Schema details
    delete:
      summary: Archive a schema
      responses:
        204:
          description: Schema archived

components:
  schemas:
    SchemaExtractionResponse:
      type: object
      properties:
        extracted_schema:
          type: object
        confidence_score:
          type: number
        extraction_metadata:
          type: object
```

**ID Generation API** (`contracts/id-generation-api.yaml`):

```yaml
openapi: 3.0.0
info:
  title: ID Generation API
  version: 1.0.0

paths:
  /api/id-rules/parse:
    post:
      summary: Parse natural language ID rule
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                natural_language_rule:
                  type: string
                entity_type:
                  type: string
                  enum: [batch, sample, report, schema]
      responses:
        200:
          description: Parsed rule structure

  /api/id-rules:
    get:
      summary: List all ID rules
      responses:
        200:
          description: List of ID rules
    post:
      summary: Save ID rule
      responses:
        201:
          description: Rule saved

  /api/ids/generate:
    post:
      summary: Generate next ID for entity type
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                entity_type:
                  type: string
                facility_id:
                  type: string
      responses:
        200:
          description: Generated ID
          content:
            application/json:
              schema:
                type: object
                properties:
                  generated_id:
                    type: string
                  next_sequence:
                    type: integer
```

### 1.3 Quickstart Guide (quickstart.md)

Developer onboarding document:

**Sections to Include**:

1. **Prerequisites**: Python 3.11+, Node 18+, SQLite, uv package manager
2. **Setup Instructions**:
   - Backend: `cd backend && uv add pdf2image Pillow && uv run python -m app.db.migrations`
   - Frontend: `cd web && npm install`
3. **Run Development Servers**:
   - Backend: `cd backend && uv run uvicorn app.main:app --reload`
   - Frontend: `cd web && npm run dev`
4. **Test Schema Extraction**:
   - Upload sample PDF via `/api/schemas/extract`
   - Review extracted JSON
   - Save schema via `/api/schemas`
5. **Test ID Generation**:
   - Configure rule via `/api/id-rules/parse`
   - Generate test IDs via `/api/ids/generate`
6. **Run Tests**: `cd backend && uv run pytest`

### 1.4 Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to update CLAUDE.md with:

- New API endpoints: `/api/schemas/extract`, `/api/schemas`, `/api/id-rules/parse`, `/api/ids/generate`
- New services: `schema_service.py`, `id_service.py`
- New dependencies: `pdf2image`, `Pillow`
- Development commands for running schema extraction tests

**Preserve manual additions** between markers in CLAUDE.md.

---

## Phase 2: Task Breakdown

*Output artifact: `tasks.md` (generated by `/speckit.tasks` command)*

**Note**: This phase is NOT executed by `/speckit.plan`. It will be completed when the user runs `/speckit.tasks`.

Expected task structure:

1. **Backend Foundation**
   - Write failing tests for schema extraction service
   - Implement PDF to image conversion
   - Implement schema extraction with vision LLM
   - Implement schema validation logic
   - Implement schema versioning

2. **ID Generation**
   - Write failing tests for ID parsing service
   - Implement natural language rule parser
   - Implement ID generation algorithms
   - Implement uniqueness validation

3. **API Layer**
   - Implement schema extraction endpoint
   - Implement schema CRUD endpoints
   - Implement ID rule endpoints
   - Implement ID generation endpoint

4. **Frontend**
   - Implement schema upload UI
   - Implement schema editor component
   - Implement schema list view
   - Implement ID rule configuration UI

5. **Integration & Testing**
   - End-to-end schema extraction workflow
   - Concurrent ID generation testing
   - File upload security validation
   - Performance testing (30s extraction, 2s ID generation)

---

## Re-evaluation of Constitution Check (Post-Design)

After completing Phase 1 design, re-verify compliance:

### ✅ Human-in-the-Loop
- Schema extraction workflow requires explicit "Save Schema" action
- ID generation happens at entity creation (which requires user confirmation)
- **COMPLIANT**

### ✅ Layered Architecture
- API routes delegate to services
- Services orchestrate DB + LLM calls
- Tools call services, not DB directly
- **COMPLIANT**

### ✅ Security by Default
- File upload validation at API boundary
- File size limits enforced (10MB)
- MIME type validation
- JWT authentication required
- **COMPLIANT**

### ✅ Test-First Development
- TDD applied to all services, tools, API endpoints
- Unit + integration tests planned
- **COMPLIANT**

**Post-Design Gate Status**: ✅ **PASS** - Ready for `/speckit.tasks` execution

---

## Summary & Next Steps

**Branch**: `006-ai-schema-generator`
**Plan Path**: `/Users/dennyleonardo/Documents/Cursor Workspaces/Nexus/specs/006-ai-schema-generator/plan.md`

**Generated Artifacts** (by this command):
- ✅ `plan.md` (this file)

**Pending Artifacts** (require `/speckit.plan` execution to continue):
- ⏳ `research.md` (Phase 0 research outcomes)
- ⏳ `data-model.md` (Phase 1 entity models)
- ⏳ `contracts/schema-api.yaml` (Phase 1 API spec)
- ⏳ `contracts/id-generation-api.yaml` (Phase 1 API spec)
- ⏳ `quickstart.md` (Phase 1 developer guide)

**Next Command**: This plan is now complete. Continue with manual research or run subsequent speckit commands as needed.

**Ready for Implementation**: After completing research and design phases, run `/speckit.tasks` to generate detailed implementation tasks.
