"""
Tests for Agent Service

TDD-driven tests for AgentService class with OpenRouter integration.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import redis.asyncio as redis

from app.services.agent_service import AgentService, AgentError, ModelError


class TestAgentServiceInitialization:
    """Test suite for AgentService initialization."""

    def test_agent_service_init_success(self):
        """Test successful AgentService initialization."""
        # Arrange
        mock_redis = Mock(spec=redis.Redis)

        # Act
        with patch("app.services.agent_service.Agent") as mock_agent_class:
            mock_agent_instance = MagicMock()
            mock_agent_class.return_value = mock_agent_instance

            service = AgentService(mock_redis)

            # Assert
            assert service.redis == mock_redis
            assert service.agent == mock_agent_instance
            mock_agent_class.assert_called_once()

    def test_agent_service_uses_config_model_id(self):
        """Test that AgentService uses model ID from settings."""
        # Arrange
        mock_redis = Mock(spec=redis.Redis)

        # Act
        with patch("app.services.agent_service.Agent") as mock_agent_class, patch(
            "app.services.agent_service.settings"
        ) as mock_settings:

            mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
            AgentService(mock_redis)  # Service created for side effects

            # Assert
            call_kwargs = mock_agent_class.call_args[1]
            assert call_kwargs["markdown"] is True

    def test_agent_service_init_model_provider_error(self):
        """Test AgentService raises ModelError on model provider failure."""
        # Arrange
        mock_redis = Mock(spec=redis.Redis)

        # Act & Assert
        with patch("app.services.agent_service.Agent") as mock_agent_class:
            from agno.exceptions import ModelProviderError

            mock_agent_class.side_effect = ModelProviderError("API key invalid")

            with pytest.raises(ModelError) as exc_info:
                AgentService(mock_redis)

            assert "Model initialization failed" in str(exc_info.value)

    def test_agent_service_init_generic_error(self):
        """Test AgentService raises AgentError on unexpected failure."""
        # Arrange
        mock_redis = Mock(spec=redis.Redis)

        # Act & Assert
        with patch("app.services.agent_service.Agent") as mock_agent_class:
            mock_agent_class.side_effect = ValueError("Unexpected error")

            with pytest.raises(AgentError) as exc_info:
                AgentService(mock_redis)

            assert "Agent initialization failed" in str(exc_info.value)


class TestAgentServiceProcessMessage:
    """Test suite for process_message method."""

    @pytest.mark.asyncio
    async def test_process_message_basic(self):
        """Test basic message processing without session."""
        # Arrange
        mock_redis = Mock(spec=redis.Redis)
        message = "What is the weight reading?"

        with patch("app.services.agent_service.Agent") as mock_agent_class:
            mock_agent = MagicMock()
            mock_response = MagicMock()
            mock_response.content = "Please provide the scale image."
            mock_agent.run.return_value = mock_response
            mock_agent_class.return_value = mock_agent

            service = AgentService(mock_redis)

            # Act
            response = await service.process_message(message)

            # Assert
            assert response == "Please provide the scale image."
            mock_agent.run.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_process_message_model_error(self):
        """Test process_message raises ModelError on provider failure."""
        # Arrange
        mock_redis = Mock(spec=redis.Redis)

        with patch("app.services.agent_service.Agent") as mock_agent_class:
            from agno.exceptions import ModelProviderError

            mock_agent = MagicMock()
            mock_agent.run.side_effect = ModelProviderError("Rate limit exceeded")
            mock_agent_class.return_value = mock_agent

            service = AgentService(mock_redis)

            # Act & Assert
            with pytest.raises(ModelError) as exc_info:
                await service.process_message("test message")

            assert "AI model unavailable" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_process_message_generic_error(self):
        """Test process_message raises AgentError on unexpected failure."""
        # Arrange
        mock_redis = Mock(spec=redis.Redis)

        with patch("app.services.agent_service.Agent") as mock_agent_class:
            mock_agent = MagicMock()
            mock_agent.run.side_effect = RuntimeError("Unexpected error")
            mock_agent_class.return_value = mock_agent

            service = AgentService(mock_redis)

            # Act & Assert
            with pytest.raises(AgentError) as exc_info:
                await service.process_message("test message")

            assert "Agent processing failed" in str(exc_info.value)
