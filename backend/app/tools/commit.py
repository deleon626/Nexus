"""
Commit QC Data Tool

Persists confirmed QC data to database with audit trail.
Implements Human-in-the-Loop principle - only commits after user confirmation.
"""

import json
import logging
from datetime import datetime
from typing import Optional

from agno.tools import tool

from app.db.redis_client import get_redis
from app.db.supabase_client import get_supabase
from app.models.agent import ConfirmationModalData


logger = logging.getLogger(__name__)


@tool(
    name="commit_qc_data",
    description="Persist confirmed QC data to database with audit trail. Only call this after user has confirmed the data via show_confirmation_modal.",
)
def commit_qc_data(
    confirmation_id: str,
    modifications: Optional[dict] = None,
) -> str:
    """
    Persist QC data after user confirmation.

    Args:
        confirmation_id: ID of the confirmed modal
        modifications: Optional user corrections to extracted data

    Returns:
        Report ID of created QC report

    Raises:
        RuntimeError: If Redis/Supabase unavailable or confirmation not found
    """
    try:
        redis_client = get_redis()
        supabase_client = get_supabase()

        # Retrieve confirmation data from Redis
        # Note: We need to find the session_id first, so we'll search by confirmation_id
        # For now, we'll use the pattern that the confirmation_id is stored in the data

        # Search all modal keys to find the one with matching confirmation_id
        # This is not ideal for production but works for MVP
        # Better approach: store confirmation_id -> session_id mapping

        # Try to get from Redis by scanning modal keys
        # Note: In production, we should have a direct mapping
        # For now, we'll need the session_id to be passed or we scan

        # Actually, looking at the confirmation modal tool, it stores with session_id
        # We need to find a way to get session_id from confirmation_id
        # Let's store an additional key for reverse lookup

        # For MVP, we'll scan (not ideal but functional)
        # Better solution: store "confirmation:{confirmation_id}" -> session_id mapping

        # Let's check if we stored a reverse lookup key
        reverse_key = f"confirmation:{confirmation_id}"
        session_id_str = redis_client.get(reverse_key)

        if not session_id_str:
            # Fallback: scan modal keys (inefficient but works for MVP)
            logger.warning("No reverse lookup found, scanning modal keys")
            # For now, raise an error - we'll fix the confirmation tool to add reverse lookup
            raise RuntimeError(
                f"Confirmation {confirmation_id} not found. "
                "Confirmation may have expired or does not exist."
            )

        # Get confirmation data from modal key
        modal_key = f"modal:{session_id_str}"
        confirmation_json = redis_client.get(modal_key)

        if not confirmation_json:
            raise RuntimeError(
                f"Confirmation data not found for session {session_id_str}. "
                "Confirmation may have expired."
            )

        # Parse confirmation data
        confirmation_dict = json.loads(confirmation_json)
        confirmation_data = ConfirmationModalData(**confirmation_dict)

        # Verify confirmation_id matches
        if str(confirmation_data.confirmation_id) != confirmation_id:
            raise RuntimeError(
                f"Confirmation ID mismatch: expected {confirmation_id}, "
                f"got {confirmation_data.confirmation_id}"
            )

        # Apply user modifications to extracted data
        final_data = confirmation_data.extracted_data.copy()
        if modifications:
            final_data.update(modifications)
            logger.info(f"Applied user modifications: {modifications}")

        # Insert QC report into Supabase
        report_data = {
            "schema_id": str(confirmation_data.schema_id),
            "session_id": str(confirmation_data.session_id),
            "data": final_data,
            "status": "pending_approval",
            "created_at": datetime.utcnow().isoformat(),
            # Note: created_by should come from authenticated user context
            # For MVP, we'll leave it null - will be added when auth is implemented
        }

        report_result = supabase_client.table("reports").insert(report_data).execute()

        if not report_result.data:
            raise RuntimeError("Failed to create QC report in database")

        report_id = report_result.data[0]["id"]
        logger.info(f"Created QC report: {report_id}")

        # Create audit event
        audit_event = {
            "event_type": "qc_data_committed",
            "entity_type": "report",
            "entity_id": report_id,
            "session_id": str(confirmation_data.session_id),
            "payload": {
                "confirmation_id": confirmation_id,
                "extracted_data": confirmation_data.extracted_data,
                "modifications": modifications,
                "final_data": final_data,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

        audit_result = supabase_client.table("events").insert(audit_event).execute()

        if audit_result.data:
            logger.info(f"Created audit event for report {report_id}")

        # Clean up confirmation data from Redis
        redis_client.delete(modal_key)
        redis_client.delete(reverse_key)

        return (
            f"QC data committed successfully. "
            f"Report ID: {report_id}. "
            f"Status: pending_approval. "
            f"The data has been saved and is awaiting supervisor approval."
        )

    except RuntimeError as e:
        logger.error(f"Runtime error in commit_qc_data: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to commit QC data: {e}")
        raise RuntimeError(f"QC data commit failed: {e}") from e
