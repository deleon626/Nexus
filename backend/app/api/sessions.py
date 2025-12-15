"""
Sessions API

Handles agent conversation sessions, message processing, and confirmation modals.
"""

import json
import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.models.agent import (
    AgentMessageRequest,
    AgentMessageResponse,
    ConfirmationModalData,
    ConfirmationRequest,
    MessageRole,
)
from app.services.agent_service import AgentService, AgentError, ModelError
from app.db.redis_client import get_redis
import redis.asyncio as redis


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/sessions", tags=["sessions"])


async def get_agent_service(
    redis_client: redis.Redis = Depends(get_redis),
) -> AgentService:
    """Dependency to provide initialized AgentService."""
    return AgentService(redis_client)


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

        return AgentMessageResponse(
            session_id=session_id,
            content=response_content,
            role=MessageRole.ASSISTANT,
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
async def get_confirmation_modal(
    session_id: UUID,
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Retrieve pending confirmation modal data for a session.

    Args:
        session_id: Session identifier
        redis_client: Redis client dependency

    Returns:
        Confirmation modal data if available

    Raises:
        HTTPException: 404 if no pending confirmation found
    """
    redis_key = f"modal:{session_id}"
    modal_json = await redis_client.get(redis_key)

    if not modal_json:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending confirmation found",
        )

    try:
        modal_data = ConfirmationModalData.model_validate_json(modal_json)
        return modal_data
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
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    User confirms or rejects the confirmation modal.

    Args:
        session_id: Session identifier
        request: Confirmation request with user's decision
        redis_client: Redis client dependency

    Returns:
        Success message

    Raises:
        HTTPException: 404 if no pending confirmation found
    """
    redis_key = f"modal:{session_id}"
    modal_json = await redis_client.get(redis_key)

    if not modal_json:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending confirmation found",
        )

    try:
        modal_data = ConfirmationModalData.model_validate_json(modal_json)

        # Update status based on user confirmation
        if request.confirmed:
            modal_data.status = "confirmed"
            # Apply modifications if provided
            if request.modifications:
                modal_data.extracted_data.update(request.modifications)
        else:
            modal_data.status = "rejected"

        # Update Redis with new status
        await redis_client.setex(
            redis_key,
            900,  # Keep for 15 minutes
            modal_data.model_dump_json(),
        )

        return {
            "message": "Confirmation processed successfully",
            "status": modal_data.status,
        }

    except Exception as e:
        logger.error(f"Failed to process confirmation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Confirmation processing failed",
        )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_session(redis_client: redis.Redis = Depends(get_redis)):
    """
    Create a new agent session.

    Args:
        redis_client: Redis client dependency

    Returns:
        New session ID and metadata
    """
    session_id = uuid4()
    session_context = {
        "session_id": str(session_id),
        "messages": [],
        "schema_id": None,
        "created_at": None,
    }

    redis_key = f"session:{session_id}"
    await redis_client.setex(
        redis_key,
        3600,  # 1 hour TTL
        json.dumps(session_context),
    )

    return {
        "session_id": session_id,
        "message": "Session created successfully",
    }


@router.delete("/{session_id}")
async def delete_session(
    session_id: UUID,
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Delete an agent session.

    Args:
        session_id: Session identifier
        redis_client: Redis client dependency

    Returns:
        Success message
    """
    redis_key = f"session:{session_id}"
    deleted = await redis_client.delete(redis_key)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    return {"message": "Session deleted successfully"}
