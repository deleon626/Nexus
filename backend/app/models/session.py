"""Pydantic models for session management."""

from typing import Optional

from pydantic import BaseModel


class CreateSessionRequest(BaseModel):
    """Request model for creating a new session."""

    schema_id: Optional[str] = None
    metadata: Optional[dict] = None
