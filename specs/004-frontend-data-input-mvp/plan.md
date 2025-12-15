# Implementation Plan: Frontend Data Input MVP

**Branch**: `004-frontend-data-input-mvp` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-frontend-data-input-mvp/spec.md`

## Summary

Build a frontend MVP for QC data input that enables field operators to enter measurement data via text or voice. The system uses the Agno framework for AI agent processing, OpenAI Whisper for speech-to-text, SQLite for simplified local storage, and shadcn/ui components for the user interface. The core flow is: operator inputs data → agent extracts values → confirmation modal → human approval → data persisted.

## Technical Context

**Language/Version**: Python 3.11+ (Backend), TypeScript 5.2+ (Frontend)
**Primary Dependencies**:
- Backend: FastAPI, Pydantic v2, Agno 1.4.5+, aiosqlite, SQLAlchemy[asyncio], openai (Whisper)
- Frontend: React 18.x, Vite, Tailwind CSS 3.x, shadcn/ui, React Hook Form, Zod
**Storage**: SQLite (local file `backend/data/nexus.db`) - MVP simplification from Supabase
**Testing**: pytest (backend), ESLint (frontend)
**Target Platform**: Web (modern browsers: Chrome, Firefox, Edge, Safari 14.1+)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: <500ms interaction response, <3s confirmation feedback
**Constraints**: 60-second max recording, 15-minute modal timeout, offline-tolerant design
**Scale/Scope**: Single operator per session, local-only MVP (no multi-facility)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Human-in-the-Loop (NON-NEGOTIABLE)
| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Agent calls `show_confirmation_modal` before `commit_qc_data` | COMPLIANT | Existing agent tools use `stop_after_tool_call=True` |
| Users explicitly confirm extracted data | COMPLIANT | FR-014: "save data only after explicit operator confirmation" |
| No automated persistence | COMPLIANT | Confirmation modal required by spec |

### II. Layered Architecture
| Layer | Status | Files |
|-------|--------|-------|
| API Layer | COMPLIANT | `backend/app/api/sessions.py`, `backend/app/api/stt.py` (new) |
| Service Layer | COMPLIANT | `backend/app/services/agent_service.py`, `stt_service.py` (new) |
| Tool Layer | COMPLIANT | `backend/app/tools/confirmation.py`, `commit.py` |
| DB Layer | DEVIATION | SQLite replaces Redis/Supabase for MVP - requires DEV-002 |
| Models | COMPLIANT | `backend/app/models/agent.py`, new SQLAlchemy models |

### III. Security by Default
| Requirement | Status | Notes |
|-------------|--------|-------|
| Pydantic validation at API entry | COMPLIANT | All endpoints use Pydantic models |
| RLS policies | N/A (MVP) | SQLite local-only; no multi-tenant isolation needed |
| JWT authentication | DEFERRED | MVP is single-user local; auth planned for production |
| Secrets in env vars | COMPLIANT | OPENAI_API_KEY in environment |
| CORS whitelist | COMPLIANT | localhost:5173 whitelisted for dev |

### IV. Test-First Development
| Scope | Status | Notes |
|-------|--------|-------|
| Backend services | REQUIRED | TDD for stt_service.py, SQLite service |
| Backend API | REQUIRED | TDD for stt.py endpoints |
| Frontend | RECOMMENDED | Not mandated by constitution |

### Deviations Required

| ID | Technology | Deviation | Justification |
|----|------------|-----------|---------------|
| DEV-002 | Database | SQLite + in-memory replaces Redis/Supabase | MVP simplification: eliminates Docker dependency, enables instant local development, preserves all core principles. Production will migrate to PostgreSQL. |

## Project Structure

### Documentation (this feature)

```text
specs/004-frontend-data-input-mvp/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── sessions.py      # Existing session endpoints
│   │   └── stt.py           # NEW: Speech-to-text endpoint
│   ├── services/
│   │   ├── agent_service.py # Existing Agno agent
│   │   ├── session_service.py # UPDATE: SQLite backend
│   │   └── stt_service.py   # NEW: Whisper API client
│   ├── db/
│   │   ├── sqlite.py        # NEW: SQLite connection
│   │   └── models.py        # NEW: SQLAlchemy ORM models
│   ├── tools/
│   │   ├── confirmation.py  # Existing (update for SQLite)
│   │   └── commit.py        # Existing (update for SQLite)
│   └── models/
│       └── agent.py         # Existing Pydantic models
├── data/
│   └── nexus.db             # SQLite database file (auto-created)
└── tests/
    ├── test_stt_service.py  # NEW: STT unit tests
    └── test_sqlite.py       # NEW: SQLite integration tests

web/
├── src/
│   ├── pages/
│   │   └── DataEntry.tsx    # NEW: Main data entry page
│   ├── components/
│   │   ├── ui/              # Existing shadcn components
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx  # NEW
│   │   │   ├── ChatMessage.tsx    # NEW
│   │   │   └── ChatInput.tsx      # NEW
│   │   ├── voice/
│   │   │   └── VoiceRecorder.tsx  # NEW
│   │   └── modals/
│   │       └── ConfirmationModal.tsx  # NEW
│   ├── services/
│   │   ├── supabase.ts      # Existing (may be unused in MVP)
│   │   └── api.ts           # NEW: Backend API client
│   ├── hooks/
│   │   ├── useAgentSession.ts     # NEW
│   │   ├── useVoiceRecording.ts   # NEW
│   │   └── useModalPolling.ts     # NEW
│   └── lib/
│       ├── utils.ts         # Existing cn() utility
│       └── validation.ts    # NEW: Zod schemas
├── App.tsx                  # UPDATE: Add /data-entry route
└── index.css                # UPDATE: Recording animations
```

**Structure Decision**: Web application structure with separate backend/ and web/ directories. Backend follows existing layered architecture from constitution. Frontend follows established patterns from shadcn setup (003-shadcn-setup).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| DEV-002: SQLite instead of Supabase | MVP simplification for instant local dev | Supabase requires Docker, network setup; SQLite is zero-config |
| In-memory session context | Faster development iteration | Redis requires Docker; in-memory sufficient for single-user MVP |

## Implementation Phases

### Phase 0: Research (Complete)
- SQLite async patterns with aiosqlite
- OpenAI Whisper API integration
- MediaRecorder API browser compatibility
- shadcn/ui Dialog and Form patterns

### Phase 1: Design (This Document)
- Data model design
- API contracts
- Component architecture

### Phase 2: Tasks (via /speckit.tasks)
- Implementation tasks with dependencies
- Test requirements per constitution
