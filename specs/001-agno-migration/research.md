# Research: Agno Framework Migration

**Feature**: 001-agno-migration
**Date**: 2025-12-14
**Purpose**: Resolve technical unknowns and document best practices for Agno + OpenRouter integration

## 1. Agno Tool Definition Pattern

**Decision**: Use `@tool` decorator from `agno.tools`

**Rationale**:
- Cleaner syntax than Toolkit class for small number of tools (2 tools)
- Supports all required features: custom names, descriptions, hooks
- Works with sync and async functions

**Implementation Pattern**:
```python
from agno.tools import tool

@tool(
    name="show_confirmation_modal",
    description="Display extracted QC data for user confirmation before commit",
    stop_after_tool_call=True  # Important: pause for user confirmation
)
def show_confirmation_modal(
    session_id: str,
    extracted_data: dict,
    schema_id: str
) -> str:
    """
    Store confirmation data in Redis for client retrieval.

    Args:
        session_id: Current session identifier
        extracted_data: Data extracted from image/voice
        schema_id: QC schema being filled

    Returns:
        Confirmation ID for client polling
    """
    # Store in Redis, return confirmation ID
    ...
```

**Alternatives Considered**:
- `Toolkit` class: More boilerplate, better for large tool collections (10+)
- Raw function without decorator: Loses metadata, harder to configure

## 2. Agno OpenRouter Integration

**Decision**: Use `agno.models.openrouter.OpenRouter` as primary model gateway

**Rationale**:
- Single API key for 400+ models
- User requirement for model flexibility
- Supports vision and tool use when underlying model supports it

**Implementation Pattern**:
```python
from agno.agent import Agent
from agno.models.openrouter import OpenRouter

agent = Agent(
    model=OpenRouter(
        id="anthropic/claude-3.5-sonnet",  # Configurable via env
        # api_key loaded from OPENROUTER_API_KEY env var automatically
    ),
    tools=[show_confirmation_modal, commit_qc_data],
    markdown=True,
)
```

**Environment Configuration**:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL_ID=anthropic/claude-3.5-sonnet  # Optional, for easy switching
```

**Alternatives Considered**:
- Direct `agno.models.anthropic.Claude`: Locks to single provider
- Multiple provider classes: More complex configuration

## 3. Agno Vision/Image Handling

**Decision**: Use `agno.media.Image` for image inputs

**Rationale**:
- Native Agno support for multimodal inputs
- Works with URL or base64 encoded images
- OpenRouter passes images to underlying model correctly

**Implementation Pattern**:
```python
from agno.agent import Agent
from agno.media import Image

# From URL
image = Image(url="https://storage.example.com/scale-image.jpg")

# From base64
image = Image(base64="data:image/jpeg;base64,/9j/4AAQ...")

# Pass to agent
response = agent.run(
    "Extract the weight value from this scale image",
    images=[image]
)
```

**Alternatives Considered**:
- Raw base64 in prompt: Less clean, model-specific formatting required

## 4. Agno Streaming Responses

**Decision**: Use `stream=True` parameter on agent methods

**Rationale**:
- Native streaming support in Agno
- Compatible with FastAPI StreamingResponse
- Works with tool calls (tools execute, then streaming resumes)

**Implementation Pattern**:
```python
from agno.agent import Agent

agent = Agent(model=OpenRouter(id="..."), tools=[...])

# Streaming response
for chunk in agent.run("Process this QC data", stream=True):
    yield chunk  # Yield to FastAPI StreamingResponse

# Or with print_response for debugging
agent.print_response("Process this QC data", stream=True)
```

**FastAPI Integration**:
```python
from fastapi.responses import StreamingResponse

@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, message: MessageRequest):
    async def generate():
        for chunk in agent.run(message.content, images=message.images, stream=True):
            yield chunk

    return StreamingResponse(generate(), media_type="text/event-stream")
```

**Alternatives Considered**:
- Non-streaming: Simpler but worse UX for long responses

## 5. Tool Execution Flow with Human-in-the-Loop

**Decision**: Use `stop_after_tool_call=True` for confirmation modal

**Rationale**:
- Pauses agent execution after tool call
- Allows client to poll for confirmation data
- Resumes only after user confirms

**Flow**:
```
1. User sends message + image
2. Agent processes, calls show_confirmation_modal with stop_after_tool_call=True
3. Tool stores data in Redis, returns confirmation_id
4. Agent response includes tool result, execution pauses
5. Client polls GET /sessions/{id}/modal
6. User confirms/modifies data
7. Client sends confirmation to resume agent
8. Agent calls commit_qc_data
9. Data persisted with audit trail
```

**Alternatives Considered**:
- `requires_confirmation=True`: Agno's built-in confirmation, but uses CLI prompts not web UI

## 6. Session State Management

**Decision**: Keep Redis for session state (Agno does not replace this)

**Rationale**:
- Agno agents are stateless by default
- Redis already configured in Nexus
- Session context needs to persist across requests

**Implementation Pattern**:
```python
from agno.agent import Agent

class AgentService:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.agent = Agent(
            model=OpenRouter(id=settings.openrouter_model_id),
            tools=[...],
        )

    async def process_message(self, session_id: str, message: str, images: list):
        # Load session context from Redis
        context = await self.redis.get(f"session:{session_id}")

        # Build conversation history from context
        messages = self._build_messages(context, message)

        # Run agent
        response = self.agent.run(messages, images=images)

        # Save updated context to Redis
        await self.redis.set(f"session:{session_id}", updated_context)

        return response
```

## 7. Dependency Changes

**Decision**: Replace `anthropic` with `agno` in pyproject.toml

**Current Dependencies** (backend/pyproject.toml):
```toml
dependencies = [
    "anthropic>=0.75.0",  # REMOVE
    "fastapi>=0.124.2",
    ...
]
```

**New Dependencies**:
```toml
dependencies = [
    "agno>=1.0.0",  # ADD - includes OpenRouter support
    "fastapi>=0.124.2",
    ...
]
```

**Note**: `openai` dependency can remain for Whisper STT (unchanged)

## 8. Error Handling Best Practices

**Decision**: Wrap agent operations with try/except for graceful degradation

**Implementation Pattern**:
```python
from agno.exceptions import ModelProviderError

try:
    response = agent.run(message, images=images)
except ModelProviderError as e:
    # OpenRouter/model-specific errors
    logger.error(f"Model error: {e}")
    raise HTTPException(status_code=502, detail="AI model unavailable")
except Exception as e:
    logger.error(f"Agent error: {e}")
    raise HTTPException(status_code=500, detail="Agent processing failed")
```

## Summary

| Unknown | Resolution |
|---------|------------|
| Tool definition pattern | `@tool` decorator from `agno.tools` |
| Model gateway | `agno.models.openrouter.OpenRouter` |
| Image handling | `agno.media.Image` (URL or base64) |
| Streaming | `stream=True` parameter |
| Human-in-the-loop | `stop_after_tool_call=True` on confirmation tool |
| Session state | Redis (unchanged) |
| Dependencies | Replace `anthropic` with `agno` |

All NEEDS CLARIFICATION items resolved. Proceed to Phase 1.
