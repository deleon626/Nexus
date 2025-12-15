"""
Agent Service

Provides AI agent functionality using Agno framework with OpenRouter.
Handles QC data extraction, validation, and conversation management.
"""

import json
import logging
from typing import AsyncGenerator, Optional

from agno.agent import Agent
from agno.models.openrouter import OpenRouter
from agno.media import Image
from agno.exceptions import ModelProviderError
import redis.asyncio as redis

from app.config import settings
from app.models.agent import ImageInput, ConfirmationRequest
from app.tools.confirmation import show_confirmation_modal
from app.tools.commit import commit_qc_data


logger = logging.getLogger(__name__)


class AgentError(Exception):
    """Base exception for agent service errors."""

    pass


class ModelError(AgentError):
    """Exception for model provider errors."""

    pass


class AgentService:
    """
    AI Agent Service for QC data extraction and validation.

    Uses Agno framework with OpenRouter to support multiple AI models.
    Tools will be added in Phase 4 of migration.
    """

    @staticmethod
    def _validate_model_id(model_id: str) -> None:
        """
        Validate model ID format.

        Model ID must follow the pattern: provider/model-name
        Examples: anthropic/claude-3.5-sonnet, openai/gpt-4o

        Args:
            model_id: Model identifier to validate

        Raises:
            ModelError: If model ID format is invalid
        """
        if not model_id or not isinstance(model_id, str):
            raise ModelError(
                "Invalid model ID format: model ID must be a non-empty string"
            )

        # Check for exactly one slash separator
        if model_id.count("/") != 1:
            raise ModelError(
                f"Invalid model ID format: '{model_id}'. "
                "Expected format: provider/model-name (e.g., 'anthropic/claude-3.5-sonnet')"
            )

        provider, model_name = model_id.split("/")

        # Validate provider and model name are not empty
        if not provider or not model_name:
            raise ModelError(
                f"Invalid model ID format: '{model_id}'. "
                "Both provider and model name must be non-empty"
            )

    def __init__(self, redis_client: redis.Redis) -> None:
        """
        Initialize agent service.

        Args:
            redis_client: Redis client for session state management

        Raises:
            ModelError: If agent initialization fails
        """
        self.redis = redis_client

        # Validate model ID format before initialization
        self._validate_model_id(settings.openrouter_model_id)

        # System prompt for QC data extraction
        self.system_prompt = """You are a Quality Control (QC) assistant for manufacturing operations.
Your role is to help field operators capture and validate QC data through voice and image inputs.

Key responsibilities:
1. Extract data from scale images (weight readings, units)
2. Process voice commands to fill QC forms
3. Validate extracted data against schema requirements
4. ALWAYS use show_confirmation_modal before committing data (Human-in-the-Loop principle)
5. Wait for user confirmation before calling commit_qc_data

When you extract data from images or voice:
- Be precise with numerical values
- Identify units of measurement
- Note any quality issues or anomalies
- Ask clarifying questions if data is unclear
- NEVER commit data without user confirmation
"""

        try:
            self.agent = Agent(
                model=OpenRouter(id=settings.openrouter_model_id),
                markdown=True,
                tools=[
                    show_confirmation_modal,
                    commit_qc_data,
                ],  # Both tools registered
                instructions=self.system_prompt,
            )
            logger.info(f"Agent initialized with model: {settings.openrouter_model_id}")
        except ModelProviderError as e:
            logger.error(f"Failed to initialize OpenRouter model: {e}")
            raise ModelError(f"Model initialization failed: {e}") from e
        except Exception as e:
            logger.error(f"Unexpected error initializing agent: {e}")
            raise AgentError(f"Agent initialization failed: {e}") from e

    def _convert_images(self, images: list[ImageInput]) -> list[Image]:
        """
        Convert ImageInput models to Agno Image objects.

        Args:
            images: List of image inputs (URL or base64)

        Returns:
            List of Agno Image objects
        """
        agno_images = []
        for img_input in images:
            if img_input.url:
                agno_images.append(Image(url=img_input.url))
            elif img_input.base64:
                agno_images.append(Image(content=img_input.base64))
        return agno_images

    async def _load_session_context(self, session_id: str) -> dict:
        """
        Load session context from Redis.

        Args:
            session_id: Session identifier

        Returns:
            Session context dictionary
        """
        redis_key = f"session:{session_id}"
        context_json = await self.redis.get(redis_key)

        if context_json:
            return json.loads(context_json)
        else:
            # Initialize new session context
            return {
                "session_id": session_id,
                "messages": [],
                "schema_id": None,
                "created_at": None,
            }

    async def _save_session_context(self, session_id: str, context: dict) -> None:
        """
        Save session context to Redis.

        Args:
            session_id: Session identifier
            context: Session context dictionary
        """
        redis_key = f"session:{session_id}"
        await self.redis.setex(
            redis_key,
            settings.redis_session_ttl,
            json.dumps(context, default=str),
        )

    async def process_message(
        self,
        message: str,
        session_id: Optional[str] = None,
        images: Optional[list[ImageInput]] = None,
    ) -> str:
        """
        Process a user message through the agent.

        Args:
            message: User input message
            session_id: Optional session ID for context retrieval
            images: Optional list of images for vision processing

        Returns:
            Agent response text

        Raises:
            ModelError: If model provider encounters an error
            AgentError: For other agent processing errors
        """
        try:
            # Load session context if session_id provided
            context = {}
            if session_id:
                context = await self._load_session_context(session_id)

            # Convert images to Agno Image objects
            agno_images = []
            if images:
                agno_images = self._convert_images(images)

            # Build conversation history from context
            # For now, just pass the current message
            # Future: Include full message history from context["messages"]

            # Run agent with message and images
            if agno_images:
                response = self.agent.run(message, images=agno_images)
            else:
                response = self.agent.run(message)

            # Update context with new message and response
            if session_id:
                context["messages"].append(
                    {
                        "role": "user",
                        "content": message,
                        "timestamp": str(json.dumps(None)),
                    }
                )
                response_content = (
                    response.content if hasattr(response, "content") else str(response)
                )
                context["messages"].append(
                    {
                        "role": "assistant",
                        "content": response_content,
                        "timestamp": str(json.dumps(None)),
                    }
                )
                await self._save_session_context(session_id, context)

            return response.content if hasattr(response, "content") else str(response)

        except ModelProviderError as e:
            logger.error(f"Model provider error: {e}")
            raise ModelError(f"AI model unavailable: {e}") from e
        except Exception as e:
            logger.error(f"Agent processing error: {e}")
            raise AgentError(f"Agent processing failed: {e}") from e

    async def process_message_stream(
        self,
        message: str,
        session_id: Optional[str] = None,
        images: Optional[list[ImageInput]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Process a user message through the agent with streaming response.

        Args:
            message: User input message
            session_id: Optional session ID for context retrieval
            images: Optional list of images for vision processing

        Yields:
            Chunks of agent response text

        Raises:
            ModelError: If model provider encounters an error
            AgentError: For other agent processing errors
        """
        try:
            # Load session context if session_id provided
            context = {}
            if session_id:
                context = await self._load_session_context(session_id)

            # Convert images to Agno Image objects
            agno_images = []
            if images:
                agno_images = self._convert_images(images)

            # Stream response from agent
            full_response = ""
            if agno_images:
                for chunk in self.agent.run(message, images=agno_images, stream=True):
                    full_response += str(chunk)
                    yield str(chunk)
            else:
                for chunk in self.agent.run(message, stream=True):
                    full_response += str(chunk)
                    yield str(chunk)

            # Update context with new message and response
            if session_id:
                context["messages"].append(
                    {
                        "role": "user",
                        "content": message,
                        "timestamp": str(json.dumps(None)),
                    }
                )
                context["messages"].append(
                    {
                        "role": "assistant",
                        "content": full_response,
                        "timestamp": str(json.dumps(None)),
                    }
                )
                await self._save_session_context(session_id, context)

        except ModelProviderError as e:
            logger.error(f"Model provider error: {e}")
            raise ModelError(f"AI model unavailable: {e}") from e
        except Exception as e:
            logger.error(f"Agent processing error: {e}")
            raise AgentError(f"Agent processing failed: {e}") from e

    async def handle_confirmation(
        self,
        session_id: str,
        confirmation_request: ConfirmationRequest,
    ) -> str:
        """
        Handle user's response to confirmation modal.

        Args:
            session_id: Current session identifier
            confirmation_request: User's confirmation decision (confirmed + optional modifications)

        Returns:
            Result message indicating success or prompting for retry

        Raises:
            AgentError: If confirmation handling fails
        """
        try:
            # Load session context
            context = await self._load_session_context(session_id)

            if confirmation_request.confirmed:
                # User confirmed - retrieve confirmation ID from Redis modal data
                modal_key = f"modal:{session_id}"
                confirmation_json = await self.redis.get(modal_key)

                if not confirmation_json:
                    raise AgentError(
                        f"No pending confirmation found for session {session_id}. "
                        "Confirmation may have expired."
                    )

                # Parse confirmation data to get confirmation_id
                confirmation_data = json.loads(confirmation_json)
                confirmation_id = confirmation_data.get("confirmation_id")

                if not confirmation_id:
                    raise AgentError(
                        "Invalid confirmation data: missing confirmation_id"
                    )

                # Call commit_qc_data tool (using entrypoint for direct invocation)
                commit_result = commit_qc_data.entrypoint(
                    confirmation_id=str(confirmation_id),
                    modifications=confirmation_request.modifications,
                )

                # Update session context
                context["messages"].append(
                    {
                        "role": "system",
                        "content": f"User confirmed data. {commit_result}",
                        "timestamp": str(json.dumps(None)),
                    }
                )
                await self._save_session_context(session_id, context)

                return commit_result

            else:
                # User rejected - inform them to try again
                rejection_message = (
                    "Data confirmation rejected by user. "
                    "Please provide corrected information or try again."
                )

                # Update session context
                context["messages"].append(
                    {
                        "role": "system",
                        "content": "User rejected the extracted data.",
                        "timestamp": str(json.dumps(None)),
                    }
                )
                await self._save_session_context(session_id, context)

                # Clear the modal from Redis
                modal_key = f"modal:{session_id}"
                await self.redis.delete(modal_key)

                return rejection_message

        except AgentError:
            raise
        except Exception as e:
            logger.error(f"Confirmation handling error: {e}")
            raise AgentError(f"Failed to handle confirmation: {e}") from e
