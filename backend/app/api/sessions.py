"""
Sessions API

Handles agent conversation sessions, message processing, and confirmation modals.
Uses SQLite for persistent storage and in-memory store for session context.
"""

import logging
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import (
    AgentMessageRequest,
    AgentMessageResponse,
    ConfirmationModalData,
    ConfirmationRequest,
    MessageRole,
)
from app.models.session import CreateSessionRequest
from app.services.agent_service import AgentService, AgentError, ModelError
from app.services.session_service import SessionService
from app.db.sqlite import get_db
from app.db.memory_store import memory_store


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def get_session_service(db: AsyncSession = Depends(get_db)) -> SessionService:
    """Dependency to provide SessionService with database session."""
    return SessionService(db)


def get_agent_service() -> AgentService:
    """Dependency to provide initialized AgentService with memory store."""
    return AgentService(memory_store)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_session(
    request: CreateSessionRequest = CreateSessionRequest(),
    session_service: SessionService = Depends(get_session_service),
):
    """
    Create a new agent session.

    Args:
        request: Optional session creation request with schema_id and metadata

    Returns:
        New session ID and metadata
    """
    try:
        session_id = await session_service.create_session()

        # Use provided schema_id or fallback to default
        schema_id = request.schema_id if request.schema_id else "default-schema"

        # Initialize session context in memory store
        memory_store.set_session_context(session_id, {
            "session_id": session_id,
            "messages": [],
            "schema_id": schema_id,
            "metadata": request.metadata or {},
            "created_at": datetime.utcnow().isoformat(),
        })

        return {
            "session_id": session_id,
            "schema_id": schema_id,
            "message": "Session created successfully",
        }
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session",
        )


@router.delete("/{session_id}")
async def delete_session(
    session_id: UUID,
    session_service: SessionService = Depends(get_session_service),
):
    """
    Delete an agent session.

    Args:
        session_id: Session identifier

    Returns:
        Success message
    """
    session_id_str = str(session_id)

    # Delete from SQLite
    deleted = await session_service.delete_session(session_id_str)

    # Also delete from memory store
    memory_store.delete_session_context(session_id_str)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    return {"message": "Session deleted successfully"}


@router.post("/{session_id}/messages", response_model=AgentMessageResponse)
async def send_message(
    session_id: UUID,
    request: AgentMessageRequest,
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Send a message to the agent (non-streaming).

    Args:
        session_id: Session identifier
        request: Message request with content and optional images

    Returns:
        Agent response with content and tool call information

    Raises:
        HTTPException: 502 if model unavailable, 500 for other errors
    """
    try:
        response_content = await agent_service.process_message(
            message=request.content,
            session_id=str(session_id),
            images=request.images,
        )

        # Check if there's a pending confirmation for this session
        has_pending = memory_store.get_session_confirmation(str(session_id)) is not None

        return AgentMessageResponse(
            session_id=session_id,
            content=response_content,
            role=MessageRole.ASSISTANT,
            has_pending_confirmation=has_pending,
        )

    except ModelError as e:
        logger.error(f"Model error in session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI model temporarily unavailable",
        )
    except AgentError as e:
        logger.error(f"Agent error in session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Agent processing failed",
        )


@router.post("/{session_id}/messages/stream")
async def send_message_stream(
    session_id: UUID,
    request: AgentMessageRequest,
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Send a message to the agent with streaming response.

    Args:
        session_id: Session identifier
        request: Message request with content and optional images

    Returns:
        StreamingResponse with agent response chunks

    Raises:
        HTTPException: 502 if model unavailable, 500 for other errors
    """

    async def generate():
        try:
            async for chunk in agent_service.process_message_stream(
                message=request.content,
                session_id=str(session_id),
                images=request.images,
            ):
                yield chunk
        except ModelError as e:
            logger.error(f"Model error in session {session_id}: {e}")
            yield "\n\n[ERROR: AI model temporarily unavailable]\n"
        except AgentError as e:
            logger.error(f"Agent error in session {session_id}: {e}")
            yield "\n\n[ERROR: Agent processing failed]\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/{session_id}/modal", response_model=ConfirmationModalData)
async def get_confirmation_modal(session_id: UUID):
    """
    Retrieve pending confirmation modal data for a session.

    Args:
        session_id: Session identifier

    Returns:
        Confirmation modal data if available

    Raises:
        HTTPException: 404 if no pending confirmation found
    """
    modal_data = memory_store.get_session_confirmation(str(session_id))

    if not modal_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending confirmation found",
        )

    try:
        return ConfirmationModalData(
            confirmation_id=modal_data["confirmation_id"],
            session_id=modal_data["session_id"],
            schema_id=modal_data.get("schema_id"),
            extracted_data=modal_data["extracted_data"],
            status="pending",
            created_at=modal_data["created_at"],
            expires_at=modal_data["expires_at"],
        )
    except Exception as e:
        logger.error(f"Failed to parse modal data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid confirmation data",
        )


@router.post("/{session_id}/modal/confirm")
async def confirm_modal(
    session_id: UUID,
    request: ConfirmationRequest,
    session_service: SessionService = Depends(get_session_service),
):
    """
    User confirms or rejects the confirmation modal.

    Args:
        session_id: Session identifier
        request: Confirmation request with user's decision

    Returns:
        Success message with status and optional report_id

    Raises:
        HTTPException: 404 if no pending confirmation found
    """
    session_id_str = str(session_id)
    modal_data = memory_store.get_session_confirmation(session_id_str)

    if not modal_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending confirmation found",
        )

    try:
        confirmation_id = modal_data["confirmation_id"]

        if request.confirmed:
            # Apply modifications if provided
            final_data = modal_data["extracted_data"].copy()
            if request.modifications:
                final_data.update(request.modifications)

            # Create report in database
            report_id = await session_service.create_report(
                session_id=session_id_str,
                confirmation_id=confirmation_id,
                data=final_data,
            )

            # Delete the confirmation
            memory_store.delete_confirmation(confirmation_id)

            return {
                "message": "Data confirmed and saved",
                "status": "confirmed",
                "report_id": report_id,
            }
        else:
            # User rejected - just delete the confirmation
            memory_store.delete_confirmation(confirmation_id)

            return {
                "message": "Confirmation rejected",
                "status": "rejected",
            }

    except Exception as e:
        logger.error(f"Failed to process confirmation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Confirmation processing failed",
        )
