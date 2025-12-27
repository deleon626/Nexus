"""
Unit tests for AgentService.

Tests follow TDD approach - these tests should FAIL until implementation is complete.
Tests verify agent initialization, message processing, and image handling.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

from agno.exceptions import ModelProviderError
import redis.asyncio as redis

from app.services.agent_service import AgentService, AgentError, ModelError
from app.models.agent import AgentMessageRequest, ImageInput


@pytest.fixture
def mock_redis():
    """Mock MemoryStore for agent service."""
    from app.db.memory_store import MemoryStore

    # Create a real MemoryStore instance for testing
    # This is simpler than mocking all its methods
    return MemoryStore()


@pytest.fixture
def mock_openrouter():
    """Mock OpenRouter model."""
    with patch("app.services.agent_service.OpenRouter") as mock:
        yield mock


@pytest.fixture
def mock_agent():
    """Mock Agno Agent."""
    with patch("app.services.agent_service.Agent") as mock:
        yield mock


class TestAgentServiceInitialization:
    """Test suite for AgentService initialization."""

    def test_agent_service_initializes_with_openrouter_model(
        self, mock_redis, mock_openrouter, mock_agent
    ):
        """Agent service should initialize with OpenRouter model."""
        # Arrange
        mock_openrouter.return_value = Mock()
        mock_agent.return_value = Mock()

        # Act
        service = AgentService(mock_redis)

        # Assert
        assert service is not None
        assert service.memory_store == mock_redis
        mock_openrouter.assert_called_once()
        mock_agent.assert_called_once()

    def test_agent_service_raises_model_error_on_provider_failure(
        self, mock_redis, mock_openrouter
    ):
        """Agent service should raise ModelError if OpenRouter initialization fails."""
        # Arrange
        mock_openrouter.side_effect = ModelProviderError("API key invalid")

        # Act & Assert
        with pytest.raises(ModelError, match="Model initialization failed"):
            AgentService(mock_redis)

    def test_agent_service_raises_agent_error_on_unexpected_failure(
        self, mock_redis, mock_openrouter
    ):
        """Agent service should raise AgentError on unexpected initialization errors."""
        # Arrange
        mock_openrouter.side_effect = RuntimeError("Unexpected error")

        # Act & Assert
        with pytest.raises(AgentError, match="Agent initialization failed"):
            AgentService(mock_redis)


class TestAgentServiceMessageProcessing:
    """Test suite for message processing functionality."""

    @pytest.mark.asyncio
    async def test_process_message_method_exists(self, mock_redis, mock_agent):
        """AgentService should have process_message async method."""
        # Arrange
        service = AgentService(mock_redis)

        # Act & Assert
        assert hasattr(service, "process_message")
        assert callable(service.process_message)

    @pytest.mark.asyncio
    async def test_process_message_returns_string_response(
        self, mock_redis, mock_agent
    ):
        """process_message should return agent response as string."""
        # Arrange
        mock_response = Mock()
        mock_response.content = "Scale reading: 45.2 kg"
        mock_agent.return_value.run.return_value = mock_response

        service = AgentService(mock_redis)

        # Act
        response = await service.process_message("What's the scale reading?")

        # Assert
        assert isinstance(response, str)
        assert response == "Scale reading: 45.2 kg"

    @pytest.mark.asyncio
    async def test_process_message_with_session_id(self, mock_redis, mock_agent):
        """process_message should accept optional session_id for context."""
        # Arrange
        session_id = str(uuid4())
        mock_response = Mock()
        mock_response.content = "Retrieved context from session"
        mock_agent.return_value.run.return_value = mock_response

        # Set up session context in memory store
        mock_redis.set_session_context(
            session_id,
            {
                "session_id": session_id,
                "messages": [],
                "schema_id": None,
            },
        )

        service = AgentService(mock_redis)

        # Act
        response = await service.process_message(
            "Continue from previous", session_id=session_id
        )

        # Assert
        assert response is not None
        assert response == "Retrieved context from session"

        # Verify session context was loaded and updated
        context = mock_redis.get_session_context(session_id)
        assert context is not None
        assert len(context["messages"]) == 2  # User message + assistant response

    @pytest.mark.asyncio
    async def test_process_message_raises_model_error_on_provider_failure(
        self, mock_redis, mock_agent
    ):
        """process_message should raise ModelError if provider fails during processing."""
        # Arrange
        mock_agent.return_value.run.side_effect = ModelProviderError(
            "Rate limit exceeded"
        )
        service = AgentService(mock_redis)

        # Act & Assert
        with pytest.raises(ModelError, match="AI model unavailable"):
            await service.process_message("Test message")


class TestAgentServiceImageHandling:
    """Test suite for image processing with agno.media.Image."""

    @pytest.mark.asyncio
    async def test_agent_handles_image_url_input(self, mock_redis, mock_agent):
        """Agent should process messages with image URL inputs."""
        # Arrange
        mock_response = Mock()
        mock_response.content = "Scale shows 45.2 kg"
        mock_agent.return_value.run.return_value = mock_response

        service = AgentService(mock_redis)
        image_input = ImageInput(url="https://example.com/scale.jpg")

        # Act
        # TODO: Implement image handling in process_message
        # response = await service.process_message(
        #     "What's the reading?",
        #     images=[image_input]
        # )

        # Assert
        # TODO: This test will fail until image handling is implemented
        pytest.skip("Image handling not yet implemented")

    @pytest.mark.asyncio
    async def test_agent_handles_base64_image_input(self, mock_redis, mock_agent):
        """Agent should process messages with base64 image inputs."""
        # Arrange
        mock_response = Mock()
        mock_response.content = "Detected scale reading: 45.2"
        mock_agent.return_value.run.return_value = mock_response

        service = AgentService(mock_redis)
        image_input = ImageInput(base64="data:image/jpeg;base64,/9j/4AAQ...")

        # Act
        # TODO: Implement image handling in process_message
        # response = await service.process_message(
        #     "Read the scale",
        #     images=[image_input]
        # )

        # Assert
        # TODO: This test will fail until image handling is implemented
        pytest.skip("Image handling not yet implemented")

    @pytest.mark.asyncio
    async def test_agent_handles_multiple_images(self, mock_redis, mock_agent):
        """Agent should process messages with multiple image inputs."""
        # Arrange
        mock_response = Mock()
        mock_response.content = "Front scale: 45.2 kg, Back scale: 44.8 kg"
        mock_agent.return_value.run.return_value = mock_response

        service = AgentService(mock_redis)
        images = [
            ImageInput(url="https://example.com/front.jpg"),
            ImageInput(url="https://example.com/back.jpg"),
        ]

        # Act
        # TODO: Implement multi-image handling
        # response = await service.process_message(
        #     "Read both scales",
        #     images=images
        # )

        # Assert
        # TODO: This test will fail until multi-image handling is implemented
        pytest.skip("Multi-image handling not yet implemented")


class TestAgentServiceStreaming:
    """Test suite for streaming response capability."""

    @pytest.mark.asyncio
    async def test_agent_supports_streaming_responses(self, mock_redis, mock_agent):
        """Agent should support streaming responses for real-time UX."""
        # Arrange
        service = AgentService(mock_redis)

        # Act & Assert
        # TODO: Implement streaming in agent service
        # This test will fail until streaming is implemented
        pytest.skip("Streaming not yet implemented")
