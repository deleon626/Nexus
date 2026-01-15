"""
Custom Events for AG-UI Protocol.

Events are streamed to the frontend in real-time via AG-UI's SSE mechanism.
These replace the polling-based confirmation flow.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from agno.run.agent import CustomEvent


@dataclass
class ConfirmationEvent(CustomEvent):
    """
    Event raised when agent extracts QC data and needs user confirmation.

    This replaces the old Redis-based polling mechanism. The event streams
    directly to the frontend via AG-UI protocol, and the agent pauses until
    the user responds.

    Attributes:
        session_id: Current agent session identifier
        schema_id: QC schema being used for this entry
        schema_name: Human-readable schema name
        extracted_data: Data extracted by the agent from images/voice
        schema_definition: Full schema for form rendering in frontend
        status: Event status (pending_confirmation, confirmed, rejected)
    """

    session_id: str = ""
    schema_id: str = ""
    schema_name: str = ""
    extracted_data: Dict[str, Any] = field(default_factory=dict)
    schema_definition: Optional[Dict[str, Any]] = None
    status: str = "pending_confirmation"


@dataclass
class CommittedEvent(CustomEvent):
    """
    Event raised when QC data is successfully committed to database.

    This notifies the frontend that the commit was successful and
    provides the report ID for reference.

    Attributes:
        report_id: Database ID of the created report
        session_id: Session that created this report
        committed_data: Final data that was committed (including modifications)
        status: Always "committed"
    """

    report_id: str = ""
    session_id: str = ""
    committed_data: Dict[str, Any] = field(default_factory=dict)
    status: str = "committed"


@dataclass
class ErrorEvent(CustomEvent):
    """
    Event raised when an error occurs during processing.

    Attributes:
        error_type: Category of error (validation, commit, extraction)
        message: Human-readable error message
        session_id: Session where error occurred
        status: Always "error"
    """

    error_type: str = ""
    message: str = ""
    session_id: str = ""
    status: str = "error"


@dataclass
class SchemaContextEvent(CustomEvent):
    """
    Event providing schema context to the frontend.

    This allows the frontend to display schema information without
    needing a separate API call. Sent when session starts with a schema.

    Attributes:
        schema_id: Schema identifier
        schema_name: Human-readable schema name
        schema_definition: Full schema definition for form rendering
        status: Always "schema_loaded"
    """

    schema_id: str = ""
    schema_name: str = ""
    schema_definition: Optional[Dict[str, Any]] = None
    status: str = "schema_loaded"
