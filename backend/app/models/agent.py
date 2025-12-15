"""Pydantic models for Agno agent system."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class MessageRole(str, Enum):
    """Role of a message in the conversation."""

    USER = "user"
    ASSISTANT = "assistant"


class ImageInput(BaseModel):
    """Image input for vision processing."""

    url: Optional[str] = None
    base64: Optional[str] = None

    @model_validator(mode="after")
    def validate_one_of(self):
        """Ensure either url or base64 is provided."""
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
    """Status of a confirmation modal."""

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
