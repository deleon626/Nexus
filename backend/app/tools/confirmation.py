"""
Confirmation Modal Tool

Displays extracted QC data for user confirmation before commit.
Implements Human-in-the-Loop principle from Constitution.
"""

import logging
from datetime import datetime, timedelta
from uuid import uuid4, UUID

from agno.tools import tool

from app.db.redis_client import get_redis
from app.models.agent import ConfirmationModalData, ConfirmationStatus


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
    Store confirmation data in Redis for client retrieval.

    Args:
        session_id: Current session identifier
        extracted_data: Data extracted from image/voice (e.g., {"weight": 150.5, "unit": "kg"})
        schema_id: QC schema being filled

    Returns:
        Confirmation ID for client polling

    Raises:
        RuntimeError: If Redis client not available
    """
    try:
        redis_client = get_redis()

        # Generate confirmation ID
        confirmation_id = uuid4()

        # Create confirmation data with expiration
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=15)

        confirmation_data = ConfirmationModalData(
            confirmation_id=confirmation_id,
            session_id=UUID(session_id),
            schema_id=UUID(schema_id),
            extracted_data=extracted_data,
            created_at=now,
            expires_at=expires_at,
            status=ConfirmationStatus.PENDING,
        )

        # Store in Redis with TTL
        redis_key = f"modal:{session_id}"
        redis_client.setex(
            redis_key,
            900,  # 15 minutes TTL
            confirmation_data.model_dump_json(),
        )

        # Store reverse lookup: confirmation_id -> session_id
        # This allows commit_qc_data to find the session from confirmation_id
        reverse_key = f"confirmation:{confirmation_id}"
        redis_client.setex(
            reverse_key,
            900,  # Same 15 minutes TTL
            session_id,
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

    except RuntimeError as e:
        logger.error(f"Redis client not available: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to create confirmation modal: {e}")
        raise RuntimeError(f"Confirmation modal creation failed: {e}") from e
