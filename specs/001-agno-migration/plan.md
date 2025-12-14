# Implementation Plan: Agno Framework Migration

**Branch**: `001-agno-migration` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-agno-migration/spec.md`

## Summary

Migrate the AI agent architecture from direct Anthropic SDK to Agno framework with OpenRouter as the model gateway. This enables model-agnostic agent operations while preserving the existing human-in-the-loop workflow (confirmation modal before data commit). The migration affects `backend/app/services/` and `backend/app/tools/` only.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: Agno framework, FastAPI 0.124+, Pydantic v2, Redis 7.x
**Storage**: Supabase (PostgreSQL) for persistent data, Redis for session state
**Testing**: pytest with pytest-asyncio
**Target Platform**: Linux server (Docker container)
**Project Type**: Web application (backend API + frontend clients)
**Performance Goals**: <5 seconds response time for non-image requests (SC-002)
**Constraints**: Human-in-the-loop confirmation required before data persistence
**Scale/Scope**: Single facility MVP, multi-facility Phase 2

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Human-in-the-Loop** | ✅ PASS | FR-006 explicitly requires confirmation before commit; tools preserve `show_confirmation_modal` → `commit_qc_data` flow |
| **II. Layered Architecture** | ✅ PASS | Agent service in `app/services/`, tools in `app/tools/`, no direct DB access from tools |
| **III. Security by Default** | ✅ PASS | FR-008 requires `OPENROUTER_API_KEY` env var; Pydantic validation at API boundaries |
| **IV. Test-First Development** | ✅ PASS | SC-003 requires all existing tests pass; TDD applies to backend scope |

**Gate Result**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-agno-migration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── sessions.py      # Session endpoints (existing)
│   ├── services/
│   │   ├── __init__.py
│   │   └── agent_service.py # NEW: Agno agent orchestration
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── confirmation.py  # NEW: show_confirmation_modal tool
│   │   └── commit.py        # NEW: commit_qc_data tool
│   ├── models/
│   │   ├── agent.py         # NEW: Agent request/response schemas
│   │   └── session.py       # Session state models
│   ├── db/
│   │   ├── supabase.py      # Supabase client
│   │   └── redis.py         # Redis client
│   └── config.py            # Settings including OPENROUTER_API_KEY
└── tests/
    ├── unit/
    │   └── services/
    │       └── test_agent_service.py
    └── integration/
        └── test_agent_tools.py
```

**Structure Decision**: Web application structure with backend-only changes. Frontend clients (React web, Flutter mobile) are out of scope per spec.

## Complexity Tracking

> No violations identified. All changes follow existing patterns.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Model Gateway | OpenRouter via Agno | Single API key, 400+ models, user requirement |
| Tool Pattern | Agno `@tool` decorator | Framework standard, cleaner than Toolkit class for 2 tools |
| Session State | Redis (unchanged) | Agno does not replace session management |
