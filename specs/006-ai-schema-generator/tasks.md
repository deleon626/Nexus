# Tasks: AI Schema Generator & ID Generator

**Input**: Design documents from `/specs/006-ai-schema-generator/`
**Prerequisites**: plan.md, spec.md

**Tests**: Tests are included per TDD requirement in project constitution (Core Principle IV)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Backend: `backend/app/`
- Frontend: `web/src/`
- Tests: `backend/tests/` (following existing pattern from codebase)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Add pdf2image and Pillow dependencies to backend/pyproject.toml
- [x] T002 [P] Create backend/data/uploads/ directory for temporary file storage
- [x] T003 [P] Create database migration backend/app/db/migrations/006_schema_tables.sql for form_templates table
- [x] T004 [P] Create database migration backend/app/db/migrations/007_id_rules_tables.sql for id_generation_rules table
- [x] T005 Update backend/app/db/sqlite_client.py to run migrations 006 and 007 (handled via SQLAlchemy models)
- [x] T006 [P] Create backend/app/models/schema.py for Pydantic schema models
- [x] T007 [P] Create backend/app/models/id_generation.py for Pydantic ID generation models
- [x] T008 [P] Create web/src/types/schema.ts for TypeScript schema types
- [x] T009 [P] Create web/src/types/idGeneration.ts for TypeScript ID generation types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Create backend/app/config.py entries for file upload limits (10MB max size)
- [x] T011 [P] Add file upload validation helpers to backend/app/utils/file_validation.py (mime type, size checks)
- [x] T012 [P] Add schema validation helpers to backend/app/utils/schema_validation.py (JSON structure validation)
- [x] T013 Create backend/app/services/file_service.py for PDF to image conversion using pdf2image
- [x] T014 Run migrations to create form_templates and id_generation_rules tables in backend/data/nexus.db

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Schema Extraction from PDF (Priority: P1) 🎯 MVP

**Goal**: AI-powered extraction of QC form structure from PDF/image files with editable JSON output

**Independent Test**: Upload sample "Penerimaan Bahan Baku" PDF, verify extraction includes temperature fields, graded criteria sections, batch metadata, and confidence score > 0.5

### Tests for User Story 1 (TDD Required)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US1] Write failing unit test for schema extraction service in backend/tests/unit/services/test_schema_service.py
- [ ] T016 [P] [US1] Write failing unit test for schema extraction tool in backend/tests/unit/tools/test_schema_tools.py
- [ ] T017 [P] [US1] Write failing contract test for POST /api/schemas/extract endpoint in backend/tests/contract/test_schema_api.py

### Implementation for User Story 1

- [ ] T018 [US1] Implement PDF to image conversion method in backend/app/services/file_service.py (convert_pdf_to_images)
- [ ] T019 [US1] Create Agno tool extract_schema_from_form in backend/app/tools/schema_tools.py with vision LLM call
- [ ] T020 [US1] Implement schema extraction service in backend/app/services/schema_service.py (extract_schema method)
- [ ] T021 [US1] Add confidence scoring logic to backend/app/services/schema_service.py (calculate_confidence_score)
- [ ] T022 [US1] Implement schema structure validation in backend/app/utils/schema_validation.py
- [ ] T023 [US1] Create POST /api/schemas/extract endpoint in backend/app/api/schemas.py
- [ ] T024 [US1] Add multipart/form-data handling for file uploads in backend/app/api/schemas.py
- [ ] T025 [US1] Verify all US1 tests pass

**Checkpoint**: At this point, User Story 1 backend should be fully functional and testable independently

- [ ] T026 [P] [US1] Create web/src/services/schemaService.ts with extractSchema API client method
- [ ] T027 [P] [US1] Create web/src/components/SchemaUploader.tsx component with file upload UI
- [ ] T028 [P] [US1] Create web/src/components/SchemaPreview.tsx component to display extracted schema
- [ ] T029 [P] [US1] Create web/src/components/SchemaEditor.tsx JSON editor with Monaco or textarea
- [ ] T030 [US1] Create web/src/pages/SchemaGenerator.tsx page integrating uploader, preview, and editor
- [ ] T031 [US1] Add route for /schema-generator in web/src/App.tsx
- [ ] T032 [US1] Add navigation link to Schema Generator in web/src/components (if nav exists)

**Checkpoint**: User Story 1 is complete - Schema extraction workflow from PDF to editable JSON is functional

---

## Phase 4: User Story 2 - Schema Management (Priority: P1)

**Goal**: CRUD operations for schemas with versioning and validation

**Independent Test**: Create schema via extraction, verify it appears in list, edit it, save as new version, confirm both versions exist

### Tests for User Story 2 (TDD Required)

- [ ] T033 [P] [US2] Write failing unit test for schema save/versioning in backend/tests/unit/services/test_schema_service.py
- [ ] T034 [P] [US2] Write failing unit test for schema listing with facility filter in backend/tests/unit/services/test_schema_service.py
- [ ] T035 [P] [US2] Write failing contract tests for GET/POST/DELETE /api/schemas in backend/tests/contract/test_schema_api.py

### Implementation for User Story 2

- [ ] T036 [P] [US2] Implement save_schema method in backend/app/services/schema_service.py with versioning logic
- [ ] T037 [P] [US2] Implement list_schemas method with facility filtering in backend/app/services/schema_service.py
- [ ] T038 [P] [US2] Implement get_schema_by_id method in backend/app/services/schema_service.py
- [ ] T039 [US2] Implement archive_schema method (soft delete) in backend/app/services/schema_service.py
- [ ] T040 [US2] Create GET /api/schemas endpoint in backend/app/api/schemas.py (list with facility filter)
- [ ] T041 [US2] Create POST /api/schemas endpoint in backend/app/api/schemas.py (save/update with versioning)
- [ ] T042 [US2] Create GET /api/schemas/{id} endpoint in backend/app/api/schemas.py
- [ ] T043 [US2] Create DELETE /api/schemas/{id} endpoint in backend/app/api/schemas.py (archive)
- [ ] T044 [US2] Verify all US2 tests pass

**Checkpoint**: At this point, User Story 2 backend should be fully functional

- [ ] T045 [P] [US2] Add listSchemas, getSchema, saveSchema, archiveSchema methods to web/src/services/schemaService.ts
- [ ] T046 [P] [US2] Create web/src/components/SchemaList.tsx component with table display
- [ ] T047 [US2] Add schema version badge to web/src/components/SchemaList.tsx
- [ ] T048 [US2] Create web/src/pages/SchemaList.tsx page with list, filter, and edit controls
- [ ] T049 [US2] Integrate save functionality in web/src/pages/SchemaGenerator.tsx with versioning
- [ ] T050 [US2] Add route for /schemas in web/src/App.tsx
- [ ] T051 [US2] Add navigation link to Schema List in web/src/components

**Checkpoint**: User Stories 1 AND 2 are complete - Full schema extraction and management workflow is functional

---

## Phase 5: User Story 3 - ID Rule Configuration (Priority: P2)

**Goal**: Natural language ID rule parsing and storage

**Independent Test**: Submit "Batch IDs should be NAB-YYYY-MM-NNNN where YYYY is year, MM is month, and NNNN is a 4-digit sequence starting at 0001, resetting monthly", verify structured rule output with pattern and components

### Tests for User Story 3 (TDD Required)

- [ ] T052 [P] [US3] Write failing unit test for ID rule parsing tool in backend/tests/unit/tools/test_id_tools.py
- [ ] T053 [P] [US3] Write failing unit test for parse_id_rule service method in backend/tests/unit/services/test_id_service.py
- [ ] T054 [P] [US3] Write failing contract test for POST /api/id-rules/parse in backend/tests/contract/test_id_generation_api.py

### Implementation for User Story 3

- [ ] T055 [US3] Create Agno tool parse_id_rule_from_text in backend/app/tools/id_tools.py with LLM call
- [ ] T056 [US3] Implement parse_id_rule method in backend/app/services/id_service.py
- [ ] T057 [US3] Implement save_id_rule method in backend/app/services/id_service.py
- [ ] T058 [US3] Implement list_id_rules method in backend/app/services/id_service.py
- [ ] T059 [US3] Create POST /api/id-rules/parse endpoint in backend/app/api/id_generation.py
- [ ] T060 [US3] Create POST /api/id-rules endpoint in backend/app/api/id_generation.py (save rule)
- [ ] T061 [US3] Create GET /api/id-rules endpoint in backend/app/api/id_generation.py (list rules)
- [ ] T062 [US3] Verify all US3 tests pass

**Checkpoint**: At this point, User Story 3 backend should be fully functional

- [ ] T063 [P] [US3] Add parseIDRule, saveIDRule, listIDRules methods to web/src/services/idService.ts
- [ ] T064 [P] [US3] Create web/src/components/IDRuleForm.tsx with natural language input
- [ ] T065 [P] [US3] Create web/src/components/IDRulePreview.tsx to show parsed rule structure
- [ ] T066 [US3] Create web/src/pages/IDRuleConfig.tsx page integrating form and preview
- [ ] T067 [US3] Add route for /id-rules in web/src/App.tsx
- [ ] T068 [US3] Add navigation link to ID Rule Config in web/src/components

**Checkpoint**: User Story 3 is complete - ID rule configuration from natural language is functional

---

## Phase 6: User Story 4 - ID Generation for Entities (Priority: P2)

**Goal**: Automatic ID generation following configured rules with uniqueness validation

**Independent Test**: Configure batch ID rule, create 3 batches via API, verify IDs increment correctly (e.g., NAB-2025-12-0001, NAB-2025-12-0002, NAB-2025-12-0003), attempt duplicate ID and verify conflict detection

### Tests for User Story 4 (TDD Required)

- [ ] T069 [P] [US4] Write failing unit test for ID generation algorithm in backend/tests/unit/services/test_id_service.py
- [ ] T070 [P] [US4] Write failing unit test for uniqueness validation in backend/tests/unit/services/test_id_service.py
- [ ] T071 [P] [US4] Write failing unit test for date-based sequence reset in backend/tests/unit/services/test_id_service.py
- [ ] T072 [P] [US4] Write failing contract test for POST /api/ids/generate in backend/tests/contract/test_id_generation_api.py
- [ ] T073 [P] [US4] Write failing integration test for concurrent ID generation in backend/tests/integration/test_id_concurrency.py

### Implementation for User Story 4

- [ ] T074 [US4] Implement generate_id method in backend/app/services/id_service.py (pattern matching and component replacement)
- [ ] T075 [US4] Add sequence tracking to backend/app/services/id_service.py (track last sequence per entity type)
- [ ] T076 [US4] Implement validate_id_uniqueness method in backend/app/services/id_service.py
- [ ] T077 [US4] Add date-based component handling (YYYY, MM) in backend/app/services/id_service.py
- [ ] T078 [US4] Add sequence reset logic (monthly/yearly) in backend/app/services/id_service.py
- [ ] T079 [US4] Implement retry logic for uniqueness conflicts in backend/app/services/id_service.py
- [ ] T080 [US4] Create POST /api/ids/generate endpoint in backend/app/api/id_generation.py
- [ ] T081 [US4] Add transaction handling for concurrent ID generation in backend/app/api/id_generation.py
- [ ] T082 [US4] Verify all US4 tests pass including concurrency test

**Checkpoint**: User Story 4 is complete - ID generation is functional with uniqueness guarantees

- [ ] T083 [P] [US4] Add generateID method to web/src/services/idService.ts
- [ ] T084 [US4] Integrate ID generation into batch creation workflow (if exists, otherwise defer to future feature)

**Checkpoint**: User Stories 1-4 are complete - Core schema and ID generation features are functional

---

## Phase 7: User Story 5 - Test ID Generation (Priority: P3)

**Goal**: Non-destructive ID generation testing interface

**Independent Test**: Open ID rule tester, select batch entity type, click "Generate Test ID", verify sample ID appears without creating database records

### Tests for User Story 5 (TDD Required)

- [ ] T085 [P] [US5] Write failing unit test for test_generate_id method in backend/tests/unit/services/test_id_service.py
- [ ] T086 [P] [US5] Write failing contract test for POST /api/ids/test-generate in backend/tests/contract/test_id_generation_api.py

### Implementation for User Story 5

- [ ] T087 [US5] Implement test_generate_id method in backend/app/services/id_service.py (non-persisting generation)
- [ ] T088 [US5] Create POST /api/ids/test-generate endpoint in backend/app/api/id_generation.py
- [ ] T089 [US5] Verify all US5 tests pass

**Checkpoint**: At this point, User Story 5 backend should be fully functional

- [ ] T090 [P] [US5] Add testGenerateID method to web/src/services/idService.ts
- [ ] T091 [P] [US5] Create web/src/components/IDRuleTester.tsx component with test generation UI
- [ ] T092 [US5] Integrate IDRuleTester into web/src/pages/IDRuleConfig.tsx
- [ ] T093 [US5] Add display of current sequence and next generated ID in IDRuleTester

**Checkpoint**: All user stories are complete - Full feature set is functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T094 [P] Add comprehensive logging to backend/app/services/schema_service.py for extraction operations
- [ ] T095 [P] Add comprehensive logging to backend/app/services/id_service.py for generation operations
- [ ] T096 [P] Add error handling for LLM timeout/failure scenarios in backend/app/tools/schema_tools.py
- [ ] T097 [P] Add error handling for PDF conversion failures in backend/app/services/file_service.py
- [ ] T098 Add rate limiting to POST /api/schemas/extract endpoint to prevent abuse
- [ ] T099 [P] Add confidence score thresholds to backend/app/config.py
- [ ] T100 [P] Add file cleanup cron job for backend/data/uploads/ temporary files
- [ ] T101 [P] Document schema extraction workflow in docs/schema-extraction.md
- [ ] T102 [P] Document ID generation workflow in docs/id-generation.md
- [ ] T103 [P] Add schema extraction examples to docs/examples/
- [ ] T104 [P] Create quickstart.md validation script
- [ ] T105 Run full test suite with pytest to verify all stories pass independently
- [ ] T106 Performance test: Verify schema extraction completes < 30 seconds
- [ ] T107 Performance test: Verify ID generation completes < 2 seconds
- [ ] T108 Load test: Verify system handles 10 concurrent schema extractions
- [ ] T109 Security audit: Verify file upload validation prevents malicious files
- [ ] T110 Code review: Ensure layered architecture compliance (no violations of API → Service → DB)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 (P1 priority): Core schema features - should complete first
  - US3 and US4 (P2 priority): ID generation features - can start after foundational or in parallel with US1/US2 if staffed
  - US5 (P3 priority): Nice-to-have testing UI - can be deferred
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Schema Extraction)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1 - Schema Management)**: Depends on US1 models but can develop API independently; integrates with US1 for save workflow
- **User Story 3 (P2 - ID Rule Config)**: Can start after Foundational (Phase 2) - No dependencies on schema stories
- **User Story 4 (P2 - ID Generation)**: Depends on US3 (needs rules to generate IDs)
- **User Story 5 (P3 - Test ID Generation)**: Depends on US4 (uses generation logic non-destructively)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Models before services
- Services before endpoints
- Backend endpoints before frontend integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup Phase**: T001-T009 can all run in parallel (different files)
- **Foundational Phase**: T010-T013 can run in parallel
- **US1 Tests**: T015-T017 can run in parallel
- **US1 Frontend**: T026-T029 can run in parallel (different components)
- **US2 Tests**: T033-T035 can run in parallel
- **US2 Backend**: T036-T038 can run in parallel (different methods, same file)
- **US2 Frontend**: T045-T047 can run in parallel
- **US3 Tests**: T052-T054 can run in parallel
- **US3 Frontend**: T063-T065 can run in parallel
- **US4 Tests**: T069-T073 can run in parallel
- **US5 Tests**: T085-T086 can run in parallel
- **US5 Frontend**: T090-T091 can run in parallel
- **Polish Phase**: T094-T104 can run in parallel (different files)

### Story-Level Parallelization

If team has capacity:
- After Foundational completes, US1+US3 can run in parallel (no dependencies)
- US2 can start once US1 completes T018-T023 (backend extraction done)
- US4 can start once US3 completes T055-T062 (ID rule parsing done)
- US5 can start once US4 completes T074-T082 (generation logic done)

---

## Parallel Example: User Story 1 Backend

```bash
# Launch all tests for User Story 1 together:
Task T015: "Write failing unit test for schema extraction service"
Task T016: "Write failing unit test for schema extraction tool"
Task T017: "Write failing contract test for POST /api/schemas/extract"

# After tests fail, implement in sequence due to dependencies:
Task T018: "Implement PDF to image conversion" (foundational)
Task T019: "Create Agno tool extract_schema_from_form" (uses T018)
Task T020: "Implement schema extraction service" (uses T019)
# ... continue sequentially

# Launch all frontend components together (after backend T025 passes):
Task T026: "Create schemaService.ts API client"
Task T027: "Create SchemaUploader component"
Task T028: "Create SchemaPreview component"
Task T029: "Create SchemaEditor component"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T014) - CRITICAL
3. Complete Phase 3: User Story 1 (T015-T032) - Schema Extraction
4. **STOP and VALIDATE**: Test extraction with sample PDF independently
5. Complete Phase 4: User Story 2 (T033-T051) - Schema Management
6. **STOP and VALIDATE**: Test full CRUD lifecycle independently
7. Deploy/demo schema features

### Full Feature Set

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Schema extraction works
3. Add User Story 2 → Test independently → Schema CRUD works (MVP deployable!)
4. Add User Story 3 → Test independently → ID rule parsing works
5. Add User Story 4 → Test independently → ID generation works (Full P1+P2 complete!)
6. Add User Story 5 → Test independently → Test generation works (All features complete!)
7. Complete Phase 8: Polish → Production ready

### Parallel Team Strategy

With 2-3 developers after Foundational phase completes:

**Week 1**:
- Developer A: User Story 1 (Schema Extraction) - T015-T032
- Developer B: User Story 3 (ID Rule Config) - T052-T068

**Week 2**:
- Developer A: User Story 2 (Schema Management) - T033-T051
- Developer B: User Story 4 (ID Generation) - T069-T084

**Week 3**:
- Developer A or B: User Story 5 (Test Generation) - T085-T093
- Both: Phase 8 Polish tasks in parallel

---

## Notes

- **[P] tasks** = different files, no dependencies, safe for parallel execution
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD REQUIRED**: Verify tests fail before implementing (Core Principle IV)
- Commit after each task or logical group
- Stop at checkpoints to validate story independently
- **Layered architecture**: API → Service → Tool/DB, no shortcuts
- **Human-in-the-Loop**: Schema save requires explicit user confirmation (handled in frontend)
- All file paths are absolute from project root for clarity
- Tests use pytest (backend standard from project)
- Frontend uses existing React + shadcn/ui patterns from web/src/components/ui/

---

## Success Metrics

After completing all phases, verify success criteria from spec.md:

- **SC-001**: Schema extraction completes in < 30 seconds (verify with T106)
- **SC-002**: At least 50% field accuracy for well-structured forms (manual validation)
- **SC-003**: Complete schema creation in < 10 minutes including review (UX test)
- **SC-004**: ID generation returns in < 2 seconds (verify with T107)
- **SC-005**: Natural language ID rule parsing 80%+ accuracy (manual validation)
- **SC-006**: Zero duplicate IDs under concurrent usage (verify with T073)
- **SC-007**: Schema list handles 100+ schemas (create test data)
- **SC-008**: 10 concurrent extractions without degradation (verify with T108)
- **SC-009**: Batch creation receives auto-generated IDs 99%+ success rate (integration test)
- **SC-010**: User reports 70%+ time savings vs manual schema creation (user feedback)
