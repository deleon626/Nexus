"""
QC Data commit tool for AG-UI protocol.

This tool is called by the agent after user confirmation to persist
QC data to Supabase. Unlike the original commit.py, this version
receives data directly from the frontend (via AG-UI) rather than
looking it up in a memory store.

The AG-UI flow:
1. Agent extracts data and presents to user
2. User confirms in frontend
3. Frontend sends confirmation message back to agent
4. Agent calls this tool with the confirmed data
5. Tool persists to database and returns success
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from agno.tools import tool

from app.db.supabase_client import get_supabase


logger = logging.getLogger(__name__)


@tool(
    name="commit_qc_data",
    description="""
Persist confirmed QC data to database with audit trail.

IMPORTANT: Only call this tool after the user has explicitly confirmed the data.
The user must say something like "confirm", "yes", "looks good", "approve", or similar.

This tool creates:
- A QC report record in the database
- An audit event for compliance tracking

Args:
    session_id: Current agent session identifier
    schema_id: QC schema being used for this entry
    extracted_data: Data extracted from images/voice (the data the user confirmed)
    user_modifications: Optional dict of corrections made by the user

Returns:
    Success message with report ID
""",
)
async def commit_qc_data(
    session_id: str,
    schema_id: str,
    extracted_data: Dict[str, Any],
    user_modifications: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Persist confirmed QC data to database.

    This is the AG-UI version that receives data directly from the frontend
    confirmation flow rather than from a memory store.

    Args:
        session_id: Current agent session identifier
        schema_id: QC schema being used
        extracted_data: Data extracted by the agent (confirmed by user)
        user_modifications: Optional corrections from the user

    Returns:
        Success message with report ID

    Raises:
        RuntimeError: If database operation fails
    """
    try:
        supabase_client = get_supabase()

        # Apply user modifications to extracted data
        final_data = extracted_data.copy()
        if user_modifications:
            final_data.update(user_modifications)
            logger.info(
                f"Applied user modifications: {list(user_modifications.keys())}"
            )

        # Insert QC report into Supabase
        report_data = {
            "schema_id": schema_id if schema_id != "default-schema" else None,
            "session_id": session_id,
            "data": final_data,
            "status": "pending_approval",
            "created_at": datetime.now(timezone.utc).isoformat(),
            # Note: created_by should come from authenticated user context
            # Will be populated when auth is integrated
        }

        report_result = supabase_client.table("reports").insert(report_data).execute()

        if not report_result.data:
            raise RuntimeError("Failed to create QC report in database")

        report_id = report_result.data[0]["id"]
        logger.info(f"Created QC report: {report_id}")

        # Create audit event for compliance
        audit_event = {
            "event_type": "qc_data_committed",
            "entity_type": "report",
            "entity_id": report_id,
            "session_id": session_id,
            "payload": {
                "schema_id": schema_id,
                "extracted_data": extracted_data,
                "user_modifications": user_modifications,
                "final_data": final_data,
                "source": "ag-ui",  # Track that this came from AG-UI flow
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        audit_result = supabase_client.table("events").insert(audit_event).execute()

        if audit_result.data:
            logger.info(f"Created audit event for report {report_id}")
        else:
            logger.warning(f"Failed to create audit event for report {report_id}")

        return (
            f"QC data committed successfully! "
            f"Report ID: {report_id}. "
            f"Status: pending_approval. "
            f"The data has been saved and is awaiting supervisor approval."
        )

    except Exception as e:
        logger.error(f"Failed to commit QC data: {e}")
        raise RuntimeError(f"QC data commit failed: {e}") from e
