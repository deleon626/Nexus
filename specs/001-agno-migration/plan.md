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

## Implementation Phases

### Phase 1: Setup (Shared Infrastructure)

**Goal**: Project initialization and dependency migration

**Files Modified**:
- `backend/pyproject.toml` - Add `agno>=1.4.5`, remove `anthropic>=0.75.0`
- `backend/.env` - Add `OPENROUTER_API_KEY`, `OPENROUTER_MODEL_ID`
- `backend/app/config.py` - Add OpenRouter settings to Settings class

**Verification**: Run `uv sync` and execute quickstart test script

### Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Core infrastructure that MUST complete before any user story

**Files Created**:
- `backend/app/models/agent.py` - Pydantic models (see data-model.md)
- `backend/app/tools/__init__.py` - Tool base module with shared imports

**Files Modified**:
- `backend/app/services/agent_service.py` - AgentService class skeleton with OpenRouter init

**Key Implementation**:
```python
# backend/app/services/agent_service.py
from agno.agent import Agent
from agno.models.openrouter import OpenRouter

class AgentService:
    def __init__(self, settings: Settings):
        self.agent = Agent(
            model=OpenRouter(id=settings.openrouter_model_id),
            tools=[],  # Added in Phase 4
            markdown=True,
        )
```

### Phase 3: User Story 1 - AI Agent Processes QC Data (P1)

**Goal**: Image extraction + confirmation modal display

**Files Created**:
- `backend/app/tools/confirmation.py` - `show_confirmation_modal` with `stop_after_tool_call=True`
- `backend/tests/unit/services/test_agent_service.py`
- `backend/tests/unit/tools/test_confirmation.py`
- `backend/tests/integration/test_agent_qc_processing.py`

**Files Modified**:
- `backend/app/services/agent_service.py` - Add `process_message()`, vision handling, streaming
- `backend/app/api/sessions.py` - Integrate AgentService

**Key Implementation**:
```python
# backend/app/tools/confirmation.py
from agno.tools import tool

@tool(
    name="show_confirmation_modal",
    description="Display extracted QC data for user confirmation",
    stop_after_tool_call=True,  # Pauses agent for human approval
)
def show_confirmation_modal(session_id: str, schema_id: str, extracted_data: dict) -> str:
    # Store in Redis with TTL 15 min
    ...
```

### Phase 4: User Story 2 - Agent Tools Execute Correctly (P2)

**Goal**: Complete tool execution flow with data persistence

**Files Created**:
- `backend/app/tools/commit.py` - `commit_qc_data` tool
- `backend/tests/unit/tools/test_commit.py`
- `backend/tests/integration/test_agent_tools.py`
- `backend/tests/integration/test_confirmation_flow.py`

**Files Modified**:
- `backend/app/services/agent_service.py` - Register both tools, add confirmation resume flow

**Key Implementation**:
```python
# backend/app/tools/commit.py
from agno.tools import tool

@tool(
    name="commit_qc_data",
    description="Persist confirmed QC data to database with audit trail",
)
def commit_qc_data(session_id: str, schema_id: str, data: dict) -> str:
    # Insert into Supabase reports table
    # Create audit event
    ...
```

### Phase 5: User Story 3 - Multi-Model Support (P3)

**Goal**: Configuration-based model switching

**Files Created**:
- `backend/tests/unit/services/test_model_config.py`
- `backend/tests/integration/test_model_switching.py`
- `backend/.env.example` - Document supported models

**Files Modified**:
- `backend/app/config.py` - Add model ID validation
- `backend/app/services/agent_service.py` - Use configurable model ID

**Key Implementation**:
```python
# backend/app/config.py
class Settings(BaseSettings):
    openrouter_api_key: str
    openrouter_model_id: str = "anthropic/claude-3.5-sonnet"

    @field_validator("openrouter_model_id")
    def validate_model_id(cls, v):
        if "/" not in v:
            raise ValueError("Model ID must be in format 'provider/model-name'")
        return v
```

### Phase 6: Polish & Cross-Cutting

**Goal**: Cleanup, documentation, final verification

**Files Modified**:
- `CLAUDE.md` - Document Agno framework usage
- All new files - Add type hints

**Files Removed**:
- `backend/test_agent.py` - Quickstart verification script
- `backend/test_tools.py` - Quickstart verification script

**Verification**: `cd backend && uv run pytest` - All tests pass (SC-003)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Agno framework instability | Low | High | Pin version `>=1.4.5`; documented rollback path to Anthropic SDK |
| OpenRouter rate limits | Medium | Medium | Implement retry with exponential backoff; cache responses where appropriate |
| Vision model incompatibility | Low | Medium | Test with Claude 3.5 Sonnet (known vision support); fallback model list in docs |
| Streaming response handling | Medium | Low | Use Agno's native streaming; test with FastAPI StreamingResponse |
| Tool execution timeout | Low | Medium | Add configurable timeout in tool decorator; log slow executions |

## Key Implementation Decisions

### 1. Tool Invocation Pattern

**Decision**: Use `@tool` decorator with `stop_after_tool_call=True` for confirmation modal

**Rationale**:
- Cleaner than Toolkit class for 2 tools
- `stop_after_tool_call=True` provides native Human-in-the-Loop support
- Agent pauses execution, allowing client to poll for confirmation data

**Alternative Rejected**: Agno's built-in `requires_confirmation=True` uses CLI prompts, not web UI

### 2. Image Handling

**Decision**: Use `agno.media.Image` with URL or base64 input

**Rationale**:
- Native multimodal support
- OpenRouter passes images correctly to underlying vision models
- Consistent API regardless of image source (upload vs. storage URL)

### 3. Session Context Management

**Decision**: Keep Redis for session state; Agno agents are stateless

**Rationale**:
- Agno does not replace session management
- Redis already configured and working
- Conversation history loaded from Redis, passed to agent per request

### 4. Error Handling Strategy

**Decision**: Wrap agent operations with specific exception handling

**Implementation**:
```python
from agno.exceptions import ModelProviderError

try:
    response = agent.run(message, images=images)
except ModelProviderError as e:
    raise HTTPException(status_code=502, detail="AI model unavailable")
except Exception as e:
    raise HTTPException(status_code=500, detail="Agent processing failed")
```

## API Contracts

See `contracts/` directory for detailed API schemas. Summary:

| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| `/api/sessions/{id}/messages` | POST | `AgentMessageRequest` | `AgentMessageResponse` | Streaming supported |
| `/api/sessions/{id}/modal` | GET | - | `ConfirmationModalData` | Poll for pending confirmation |
| `/api/sessions/{id}/confirm` | POST | `ConfirmationRequest` | `AgentMessageResponse` | Resume agent after confirmation |

## Dependencies

### Added
```toml
agno = ">=1.4.5"
```

### Removed
```toml
anthropic = ">=0.75.0"
```

### Unchanged
```toml
openai = ">=1.0.0"  # Still used for Whisper STT
fastapi = ">=0.124.2"
pydantic = ">=2.0.0"
redis = ">=5.0.0"
supabase = ">=2.0.0"
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Functional parity | 100% | All acceptance scenarios pass |
| Response time (text) | <5s p95 | Load test with 10 concurrent users |
| Test coverage | ≥80% | pytest-cov report |
| Zero regressions | 0 failures | Existing test suite passes |

## References

- [spec.md](./spec.md) - Feature specification
- [research.md](./research.md) - Technical unknowns resolution
- [data-model.md](./data-model.md) - Pydantic model definitions
- [quickstart.md](./quickstart.md) - Verification scripts
- [tasks.md](./tasks.md) - Implementation task breakdown
- [Constitution DEV-001](/.specify/memory/constitution.md) - Deviation approval
