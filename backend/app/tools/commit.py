"""
Commit QC Data Tool

Persists confirmed QC data to database with audit trail.
Implements Human-in-the-Loop principle - only commits after user confirmation.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from agno.tools import tool

from app.db.memory_store import memory_store
from app.db.supabase_client import get_supabase


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
        RuntimeError: If Supabase unavailable or confirmation not found
    """
    try:
        supabase_client = get_supabase()

        # Retrieve confirmation data from memory store
        confirmation_data = memory_store.get_confirmation(confirmation_id)

        if not confirmation_data:
            raise RuntimeError(
                f"Confirmation {confirmation_id} not found. "
                "Confirmation may have expired or does not exist."
            )

        # Apply user modifications to extracted data
        final_data = confirmation_data["extracted_data"].copy()
        if modifications:
            final_data.update(modifications)
            logger.info(f"Applied user modifications: {modifications}")

        # Insert QC report into Supabase
        report_data = {
            "schema_id": confirmation_data["schema_id"],
            "session_id": confirmation_data["session_id"],
            "data": final_data,
            "status": "pending_approval",
            "created_at": datetime.now(timezone.utc).isoformat(),
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
            "session_id": confirmation_data["session_id"],
            "payload": {
                "confirmation_id": confirmation_id,
                "extracted_data": confirmation_data["extracted_data"],
                "modifications": modifications,
                "final_data": final_data,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        audit_result = supabase_client.table("events").insert(audit_event).execute()

        if audit_result.data:
            logger.info(f"Created audit event for report {report_id}")

        # Clean up confirmation data from memory store
        memory_store.delete_confirmation(confirmation_id)

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
