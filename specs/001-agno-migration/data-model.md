# Data Model: Agno Framework Migration

**Feature**: 001-agno-migration
**Date**: 2025-12-14
**Source**: Feature specification key entities

## Overview

This migration does not introduce new database tables. All entities below are runtime objects used by the agent service.

## Entities

### 1. Agent Configuration

Runtime configuration for the Agno agent instance.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model_id | string | Yes | OpenRouter model identifier (e.g., `anthropic/claude-3.5-sonnet`) |
| system_prompt | string | Yes | Agent instructions including QC schema context |
| tools | list[Tool] | Yes | Registered tool functions |
| markdown | bool | No | Enable markdown formatting in responses (default: true) |

**Validation Rules**:
- `model_id` must be a valid OpenRouter model identifier
- `tools` must include `show_confirmation_modal` and `commit_qc_data`

### 2. AgentMessage

Request/response model for agent interactions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| session_id | UUID | Yes | Session identifier |
| content | string | Yes | User message text |
| images | list[Image] | No | Attached images (scale photos, etc.) |
| role | enum | Yes | `user` or `assistant` |

**Validation Rules**:
- `session_id` must reference an active session in Redis
- `images` must be valid URLs or base64-encoded JPEG/PNG

### 3. Image

Multimodal image input for vision processing.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | No* | Public URL to image |
| base64 | string | No* | Base64-encoded image data |

*One of `url` or `base64` is required.

**Validation Rules**:
- URL must be HTTPS and accessible
- Base64 must include valid data URI prefix or raw base64

### 4. ConfirmationModal

Data structure stored in Redis for client retrieval.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| confirmation_id | UUID | Yes | Unique identifier for this confirmation |
| session_id | UUID | Yes | Associated session |
| schema_id | UUID | Yes | QC schema being filled |
| extracted_data | dict | Yes | Data extracted by agent |
| created_at | datetime | Yes | Timestamp |
| expires_at | datetime | Yes | TTL (15 minutes from creation) |
| status | enum | Yes | `pending`, `confirmed`, `rejected` |

**State Transitions**:
```
pending → confirmed (user approves)
pending → rejected (user cancels)
pending → expired (TTL reached)
```

**Redis Key Pattern**: `modal:{session_id}`

### 5. ToolCall

Record of tool execution by the agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tool_name | string | Yes | Name of tool called |
| arguments | dict | Yes | Arguments passed to tool |
| result | any | Yes | Tool return value |
| timestamp | datetime | Yes | Execution time |

**Validation Rules**:
- `tool_name` must be one of registered tools
- `arguments` must match tool's parameter schema

## Relationships

```
Session (Redis)
    │
    ├── AgentMessage[] (conversation history)
    │
    └── ConfirmationModal (pending confirmation, if any)
            │
            └── extracted_data → QC Report (after commit)
```

## Pydantic Models (backend/app/models/)

### agent.py

```python
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"

class ImageInput(BaseModel):
    """Image input for vision processing."""
    url: Optional[str] = None
    base64: Optional[str] = None

    @model_validator(mode="after")
    def validate_one_of(self):
        if not self.url and not self.base64:
            raise ValueError("Either url or base64 must be provided")
        return self

class AgentMessageRequest(BaseModel):
    """Request to send a message to the agent."""
    content: str = Field(..., min_length=1)
    images: list[ImageInput] = Field(default_factory=list)

class AgentMessageResponse(BaseModel):
    """Response from the agent."""
    session_id: UUID
    content: str
    role: MessageRole = MessageRole.ASSISTANT
    tool_calls: list[dict] = Field(default_factory=list)
    has_pending_confirmation: bool = False

class ConfirmationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

class ConfirmationModalData(BaseModel):
    """Confirmation modal data stored in Redis."""
    confirmation_id: UUID
    session_id: UUID
    schema_id: UUID
    extracted_data: dict
    created_at: datetime
    expires_at: datetime
    status: ConfirmationStatus = ConfirmationStatus.PENDING

class ConfirmationRequest(BaseModel):
    """User's response to confirmation modal."""
    confirmed: bool
    modifications: Optional[dict] = None  # User corrections to extracted data
```

## Notes

- No database migrations required
- All new models are runtime/Redis only
- Existing Supabase tables (reports, audit_events) unchanged
- Session model in `session.py` may need updates to include conversation history
