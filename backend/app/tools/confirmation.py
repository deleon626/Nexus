"""
Confirmation Modal Tool

Displays extracted QC data for user confirmation before commit.
Implements Human-in-the-Loop principle from Constitution.
"""

import logging
from uuid import uuid4

from agno.tools import tool

from app.db.memory_store import memory_store


logger = logging.getLogger(__name__)


@tool(
    name="show_confirmation_modal",
    description="Display extracted QC data for user confirmation before commit. MUST be called before commit_qc_data to ensure human verification.",
    stop_after_tool_call=True,  # Critical: pause for user confirmation
)
def show_confirmation_modal(
    session_id: str,
    extracted_data: dict,
    schema_id: str,
) -> str:
    """
    Store confirmation data in memory store for client retrieval.

    Args:
        session_id: Current session identifier
        extracted_data: Data extracted from image/voice (e.g., {"weight": 150.5, "unit": "kg"})
        schema_id: QC schema being filled

    Returns:
        Confirmation ID for client polling

    Raises:
        RuntimeError: If storage fails
    """
    try:
        # Generate confirmation ID
        confirmation_id = str(uuid4())

        # Store in memory store (handles expiration internally)
        memory_store.store_confirmation(
            confirmation_id=confirmation_id,
            session_id=session_id,
            schema_id=schema_id,
            extracted_data=extracted_data,
        )

        logger.info(
            f"Confirmation modal stored for session {session_id}, "
            f"confirmation_id={confirmation_id}"
        )

        return (
            f"Confirmation modal created successfully. "
            f"Confirmation ID: {confirmation_id}. "
            f"Waiting for user to confirm or modify the extracted data."
        )

    except Exception as e:
        logger.error(f"Failed to create confirmation modal: {e}")
        raise RuntimeError(f"Confirmation modal creation failed: {e}") from e
