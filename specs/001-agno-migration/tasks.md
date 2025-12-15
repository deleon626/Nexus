# Tasks: Agno Framework Migration

**Input**: Design documents from `/specs/001-agno-migration/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓
**Branch**: `001-agno-migration`

**Tests**: TDD applies to backend only (per project constitution). Test tasks included for all phases.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `backend/` directory:
- **Services**: `app/services/`
- **Tools**: `app/tools/`
- **Models**: `app/models/`
- **Tests**: `tests/unit/`, `tests/integration/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency migration

- [x] T001 Update dependencies in `backend/pyproject.toml`: add `agno>=1.0.0`, remove `anthropic>=0.75.0`
- [x] T002 Add environment variables to `backend/.env`: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL_ID`
- [x] T003 [P] Update `backend/app/config.py` with new OpenRouter settings (openrouter_api_key, openrouter_model_id)
- [x] T004 [P] Verify Agno installation with quickstart test script `backend/test_agent.py` (from quickstart.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create Pydantic models in `backend/app/models/agent.py`: MessageRole, ImageInput, AgentMessageRequest, AgentMessageResponse, ConfirmationStatus, ConfirmationModalData, ConfirmationRequest
- [x] T006 Create tool base module `backend/app/tools/__init__.py` with shared imports
- [x] T007 Create agent service base in `backend/app/services/agent_service.py`: AgentService class with OpenRouter initialization
- [x] T008 Add error handling utilities for Agno exceptions in `backend/app/services/agent_service.py`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - AI Agent Processes QC Data (Priority: P1) 🎯 MVP

**Goal**: Field operator uploads scale image + voice message → Agent extracts weight → Shows confirmation modal

**Independent Test**: Upload a scale image via API and verify the agent extracts correct numeric value and triggers confirmation modal

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [P] [US1] Unit test for agent image processing in `backend/tests/unit/services/test_agent_service.py`
- [x] T010 [P] [US1] Unit test for confirmation modal tool in `backend/tests/unit/tools/test_confirmation.py`
- [x] T011 [P] [US1] Integration test for agent QC data processing in `backend/tests/integration/test_agent_qc_processing.py`

### Implementation for User Story 1

- [x] T012 [US1] Implement `show_confirmation_modal` tool in `backend/app/tools/confirmation.py` using Agno `@tool` decorator with `stop_after_tool_call=True`
- [x] T013 [US1] Implement vision/image handling in `backend/app/services/agent_service.py` using `agno.media.Image`
- [x] T014 [US1] Implement agent message processing in `backend/app/services/agent_service.py`: `process_message()` method with session context
- [x] T015 [US1] Implement streaming response support in `backend/app/services/agent_service.py` using `stream=True`
- [x] T016 [US1] Add Redis integration for confirmation modal storage in `backend/app/tools/confirmation.py` (key: `modal:{session_id}`, TTL: 15 min)
- [x] T017 [US1] Update API endpoint `backend/app/api/sessions.py` to use new AgentService with streaming response

**Checkpoint**: User Story 1 fully functional - agent processes images and shows confirmation modal

---

## Phase 4: User Story 2 - Agent Tools Execute Correctly (Priority: P2)

**Goal**: Custom tools (show_confirmation_modal, commit_qc_data) execute correctly with proper parameters and return results

**Independent Test**: Send message that triggers tool execution, verify tool receives correct parameters and returns expected results

### Tests for User Story 2

- [x] T018 [P] [US2] Unit test for `commit_qc_data` tool in `backend/tests/unit/tools/test_commit.py`
- [x] T019 [P] [US2] Integration test for tool execution flow in `backend/tests/integration/test_agent_tools.py`
- [x] T020 [P] [US2] Integration test for confirmation → commit flow in `backend/tests/integration/test_confirmation_flow.py`

### Implementation for User Story 2

- [x] T021 [US2] Implement `commit_qc_data` tool in `backend/app/tools/commit.py` using Agno `@tool` decorator
- [x] T022 [US2] Add Supabase persistence in `backend/app/tools/commit.py` for QC reports
- [x] T023 [US2] Add audit event creation in `backend/app/tools/commit.py` for compliance
- [x] T024 [US2] Implement confirmation resume flow in `backend/app/services/agent_service.py`: handle user confirmation/rejection
- [x] T025 [US2] Register both tools in AgentService in `backend/app/services/agent_service.py`: `tools=[show_confirmation_modal, commit_qc_data]`

**Checkpoint**: User Stories 1 AND 2 work independently - full human-in-the-loop workflow operational

---

## Phase 5: User Story 3 - Multi-Model Support (Priority: P3)

**Goal**: System administrator can configure different AI models via environment configuration without code changes

**Independent Test**: Change model ID in environment configuration and verify agent processes requests correctly with different model

### Tests for User Story 3

- [x] T026 [P] [US3] Unit test for model configuration in `backend/tests/unit/services/test_model_config.py`
- [x] T027 [P] [US3] Integration test for model switching in `backend/tests/integration/test_model_switching.py`

### Implementation for User Story 3

- [x] T028 [US3] Implement configurable model ID in `backend/app/config.py`: `OPENROUTER_MODEL_ID` with default `anthropic/claude-3.5-sonnet`
- [x] T029 [US3] Update AgentService in `backend/app/services/agent_service.py` to use configurable model ID from settings
- [x] T030 [US3] Add model validation in `backend/app/services/agent_service.py`: verify model ID format on initialization
- [x] T031 [US3] Document supported models in `backend/.env.example` with examples (Claude, GPT-4o, Llama)

**Checkpoint**: All user stories independently functional - multi-model support complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T032 [P] Remove test scripts `backend/test_agent.py` and `backend/test_tools.py` (quickstart verification complete)
- [ ] T033 [P] Update `CLAUDE.md` to document Agno framework usage and new environment variables
- [ ] T034 Run all tests `cd backend && uv run pytest` and verify SC-003 (all existing tests pass)
- [ ] T035 [P] Add type hints throughout new files for Pydantic v2 compatibility
- [ ] T036 Run quickstart.md validation end-to-end
- [ ] T037 Code cleanup: remove any unused imports from Anthropic SDK

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses confirmation modal from US1 but can be developed independently
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Configuration only, no dependencies on other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD per constitution)
- Models before services
- Tools before service integration
- Core implementation before API integration
- Story complete before moving to next priority

### Parallel Opportunities

- T003, T004 can run in parallel (different concerns)
- T009, T010, T011 can all run in parallel (different test files)
- T018, T019, T020 can all run in parallel (different test files)
- T026, T027 can run in parallel (different test files)
- T032, T033, T035 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for agent image processing in backend/tests/unit/services/test_agent_service.py"
Task: "Unit test for confirmation modal tool in backend/tests/unit/tools/test_confirmation.py"
Task: "Integration test for agent QC data processing in backend/tests/integration/test_agent_qc_processing.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008) - CRITICAL
3. Complete Phase 3: User Story 1 (T009-T017)
4. **STOP and VALIDATE**: Test image extraction and confirmation modal independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Full human-in-the-loop)
4. Add User Story 3 → Test independently → Deploy/Demo (Multi-model flexibility)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (agent + vision + confirmation modal)
   - Developer B: User Story 2 (commit tool + persistence)
   - Developer C: User Story 3 (model configuration)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- TDD applies to backend only (per constitution)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All changes scoped to `backend/app/services/` and `backend/app/tools/` per spec
