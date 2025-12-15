# Tasks: Frontend Data Input MVP

**Input**: Design documents from `/specs/004-frontend-data-input-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Per constitution, TDD is required for backend services (`app/services/`, `app/tools/`, `app/api/`). Frontend testing is recommended but not mandated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/` (Python/FastAPI)
- **Frontend**: `web/src/` (React/TypeScript)
- **Database**: `backend/data/` (SQLite file)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and database foundation

- [X] T001 Add backend dependencies (aiosqlite, sqlalchemy[asyncio]) in backend/pyproject.toml
- [X] T002 Create data directory at backend/data/ for SQLite database
- [X] T003 [P] Create SQLite connection module in backend/app/db/sqlite.py
- [X] T004 [P] Create SQLAlchemy ORM models (Session, Message, Report, Confirmation) in backend/app/db/models.py

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [X] T005 Write unit tests for SQLite service (CRUD operations) in backend/tests/test_sqlite.py
- [X] T006 Implement SQLite session management service in backend/app/services/session_service.py (update existing)
- [X] T007 [P] Create in-memory store for session context and confirmations in backend/app/db/memory_store.py
- [X] T008 [P] Write unit tests for STT service in backend/tests/test_stt_service.py
- [X] T009 Implement STT service (OpenAI Whisper client) in backend/app/services/stt_service.py
- [X] T010 [P] Write API tests for STT endpoint in backend/tests/test_stt_api.py
- [X] T011 Implement STT endpoint (POST /api/stt/transcribe) in backend/app/api/stt.py
- [X] T012 Register STT router in backend/app/main.py

### Frontend Foundation

- [X] T013 [P] Create backend API client service in web/src/services/api.ts
- [X] T014 [P] Create Zod validation schemas in web/src/lib/validation.ts
- [X] T015 Add /data-entry route in web/src/App.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Text-Based QC Data Entry (Priority: P1) 🎯 MVP

**Goal**: Operator can type QC measurement, receive agent response, confirm extracted data, and see success notification

**Independent Test**: Type a message, view agent response, confirm extracted data in modal, verify success toast appears and form resets

### Implementation for User Story 1

- [X] T016 [P] [US1] Create useAgentSession hook (session lifecycle, sendMessage) in web/src/hooks/useAgentSession.ts
- [X] T017 [P] [US1] Create useModalPolling hook (poll for confirmation modal) in web/src/hooks/useModalPolling.ts
- [X] T018 [P] [US1] Create ChatMessage component in web/src/components/ChatMessage.tsx
- [X] T019 [P] [US1] Create ChatInput component in web/src/components/ChatInput.tsx
- [X] T020 [US1] Create ChatContainer component in web/src/components/ChatContainer.tsx
- [X] T021 [US1] Create ConfirmationModal component (read-only data display) in web/src/components/ConfirmationModal.tsx
- [X] T022 [US1] Create DataEntry page (compose ChatContainer, ChatInput, ConfirmationModal) in web/src/pages/DataEntry.tsx
- [X] T023 [US1] Implement success toast notification in web/src/pages/DataEntry.tsx
- [X] T024 [US1] Implement form reset after successful confirmation in web/src/pages/DataEntry.tsx

**Checkpoint**: User Story 1 should be fully functional - text input → agent response → confirmation → success

---

## Phase 4: User Story 2 - Voice-Based QC Data Entry (Priority: P2)

**Goal**: Operator can record voice, transcribe via Whisper, and process as text input

**Independent Test**: Press record, speak a measurement, stop recording, verify transcribed text appears in input field

### Implementation for User Story 2

- [X] T025 [P] [US2] Create useVoiceRecording hook (MediaRecorder, permissions) in web/src/hooks/useVoiceRecording.ts
- [X] T026 [US2] Create VoiceRecorder component (mic button, recording indicator, timer) in web/src/components/VoiceRecorder.tsx
- [X] T027 [US2] Add recording animation styles in web/src/index.css
- [X] T028 [US2] Integrate VoiceRecorder with DataEntry page in web/src/pages/DataEntry.tsx
- [X] T029 [US2] Implement transcription result → automatic send as message in web/src/pages/DataEntry.tsx
- [X] T030 [US2] Add microphone permission error handling in web/src/components/VoiceRecorder.tsx

**Checkpoint**: User Story 2 should be fully functional - voice record → transcribe → populate input → standard flow

---

## Phase 5: User Story 3 - Data Modification Before Confirmation (Priority: P3)

**Goal**: Operator can edit extracted values in confirmation modal before saving

**Independent Test**: Trigger confirmation modal, edit a field value, confirm, verify modified value is saved

### Implementation for User Story 3

- [X] T031 [US3] Update ConfirmationModal with state management in web/src/components/ConfirmationModal.tsx
- [X] T032 [US3] Add editable input fields for each extracted data field in web/src/components/ConfirmationModal.tsx
- [X] T033 [US3] Update confirmModal API call to include modifications in web/src/pages/DataEntry.tsx
- [X] T034 [US3] Add change tracking for modified values in web/src/components/ConfirmationModal.tsx

**Checkpoint**: User Story 3 should be fully functional - can edit values in modal before confirming

---

## Phase 6: User Story 4 - Conversation History Display (Priority: P4)

**Goal**: Operator can see full conversation history with visual distinction between user and agent messages

**Independent Test**: Send multiple messages, verify all appear in chronological order with proper styling

### Implementation for User Story 4

- [X] T035 [US4] Enhance ChatContainer with auto-scroll behavior in web/src/components/ChatContainer.tsx
- [X] T036 [US4] Add visual styling for user messages (right-aligned, distinct color) in web/src/components/ChatMessage.tsx
- [X] T037 [US4] Add visual styling for agent messages (left-aligned, distinct color) in web/src/components/ChatMessage.tsx
- [X] T038 [US4] Add loading indicator for pending agent response in web/src/components/ChatContainer.tsx
- [X] T039 [US4] Add timestamps to messages in web/src/components/ChatMessage.tsx

**Checkpoint**: User Story 4 should be fully functional - full conversation history with proper visual presentation

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T040 [P] Add error boundary component in web/src/components/ErrorBoundary.tsx
- [X] T041 [P] Add loading states for chat (already implemented in ChatContainer)
- [X] T042 [P] Add retry mechanism for failed API calls in web/src/services/api.ts
- [X] T043 Add graceful handling for STT service unavailability in web/src/components/VoiceRecorder.tsx
- [X] T044 Add modal timeout handling (15-minute expiration) in web/src/hooks/useModalPolling.ts
- [X] T045 [P] Add network connectivity error display in web/src/pages/DataEntry.tsx (already implemented)
- [ ] T046 Run quickstart.md validation (manual test all endpoints and flows - requires backend running)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories proceed sequentially in priority order (P1 → P2 → P3 → P4)
  - Each story builds on previous but remains independently testable
- **Polish (Phase 7)**: Depends on at least User Story 1 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Independent of US1 for core voice recording, integrates with US1's data entry page
- **User Story 3 (P3)**: Can start after Foundational - Depends on US1's ConfirmationModal existing
- **User Story 4 (P4)**: Can start after Foundational - Depends on US1's ChatContainer existing

### Within Each Phase

- Backend tests MUST be written and FAIL before implementation (TDD per constitution)
- Backend dependencies must be resolved before frontend can consume APIs
- Models before services
- Services before endpoints
- Hooks before components that use them
- Components before pages that compose them

### Parallel Opportunities

- T003, T004 can run in parallel (different files)
- T007, T008 can run in parallel (different services)
- T010 can run with T009 completion
- T013, T014 can run in parallel (frontend foundation)
- T016, T017, T018, T019 can run in parallel (independent hooks/components)
- T025 can run in parallel with US1 work (independent hook)
- T040, T041, T042, T045 can run in parallel (independent polish tasks)

---

## Parallel Example: User Story 1 Foundation

```bash
# After Phase 2 complete, launch these in parallel:
Task: "Create useAgentSession hook in web/src/hooks/useAgentSession.ts"
Task: "Create useModalPolling hook in web/src/hooks/useModalPolling.ts"
Task: "Create ChatMessage component in web/src/components/chat/ChatMessage.tsx"
Task: "Create ChatInput component in web/src/components/chat/ChatInput.tsx"

# Then sequentially:
Task: "Create ChatContainer component (depends on ChatMessage)"
Task: "Create ConfirmationModal component"
Task: "Create DataEntry page (depends on all above)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T015)
3. Complete Phase 3: User Story 1 (T016-T024)
4. **STOP and VALIDATE**: Test text-based data entry end-to-end
5. Deploy/demo as MVP

### Incremental Delivery

1. **MVP (US1)**: Setup + Foundational + US1 → Text-based QC entry works
2. **+Voice (US2)**: Add US2 → Voice input works
3. **+Edit (US3)**: Add US3 → Can modify before confirm
4. **+History (US4)**: Add US4 → Full conversation visibility
5. **+Polish (Phase 7)**: Error handling, retry, loading states

### Task Count Summary

| Phase | Tasks | Cumulative |
|-------|-------|------------|
| Setup | 4 | 4 |
| Foundational | 11 | 15 |
| User Story 1 | 9 | 24 |
| User Story 2 | 6 | 30 |
| User Story 3 | 4 | 34 |
| User Story 4 | 5 | 39 |
| Polish | 7 | 46 |

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable at checkpoint
- TDD required for backend: write tests first, verify they fail, then implement
- Frontend tests recommended but optional per constitution
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
