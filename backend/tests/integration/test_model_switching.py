"""
Integration Tests for Model Switching

Tests end-to-end model switching with real AgentService initialization.
Following TDD: These tests are written FIRST and should fail initially.
"""

import pytest
import os
from unittest.mock import patch, MagicMock
import redis.asyncio as redis

from app.services.agent_service import AgentService, ModelError
from app.config import Settings


class TestModelSwitchingIntegration:
    """Integration tests for switching between different AI models."""

    @pytest.fixture
    def redis_client(self):
        """Create a mock Redis client for testing."""
        # For integration tests, we mock Redis to avoid external dependencies
        return MagicMock(spec=redis.Redis)

    @pytest.mark.asyncio
    async def test_switch_between_models(self, redis_client):
        """Test switching between different models without code changes."""
        models_to_test = [
            "anthropic/claude-3.5-sonnet",
            "anthropic/claude-3-opus",
            "openai/gpt-4o",
        ]

        for model_id in models_to_test:
            # Mock the Agent class to avoid real API calls
            with patch("app.services.agent_service.Agent") as mock_agent_class:
                mock_agent_class.return_value = MagicMock()

                # Override settings for this test
                with patch("app.services.agent_service.settings") as mock_settings:
                    mock_settings.openrouter_model_id = model_id
                    mock_settings.redis_session_ttl = 3600

                    # Create service with new model
                    service = AgentService(redis_client)

                    # Verify the correct model was used
                    call_kwargs = mock_agent_class.call_args[1]
                    model_obj = call_kwargs["model"]
                    assert model_obj.id == model_id

    @pytest.mark.asyncio
    async def test_process_message_with_different_models(self, redis_client):
        """Test that message processing works with different configured models."""
        test_message = "What is 2 + 2?"
        expected_response = "4"

        models = ["anthropic/claude-3.5-sonnet", "openai/gpt-4o"]

        for model_id in models:
            with patch("app.services.agent_service.Agent") as mock_agent_class:
                # Mock the agent's run method
                mock_agent_instance = MagicMock()
                mock_response = MagicMock()
                mock_response.content = expected_response
                mock_agent_instance.run.return_value = mock_response
                mock_agent_class.return_value = mock_agent_instance

                with patch("app.services.agent_service.settings") as mock_settings:
                    mock_settings.openrouter_model_id = model_id
                    mock_settings.redis_session_ttl = 3600

                    service = AgentService(redis_client)
                    response = await service.process_message(test_message)

                    # Verify response is correct
                    assert response == expected_response

                    # Verify agent was called
                    mock_agent_instance.run.assert_called_once()

    @pytest.mark.asyncio
    async def test_invalid_model_prevents_service_creation(self, redis_client):
        """Test that invalid model ID prevents AgentService creation."""
        invalid_model = "invalid-model-format"

        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = invalid_model
            mock_settings.redis_session_ttl = 3600

            with patch("app.services.agent_service.Agent"):
                with pytest.raises(ModelError, match="Invalid model ID format"):
                    AgentService(redis_client)

    @pytest.mark.asyncio
    async def test_model_error_propagates_correctly(self, redis_client):
        """Test that model provider errors are properly caught and converted."""
        with patch("app.services.agent_service.Agent") as mock_agent_class:
            from agno.exceptions import ModelProviderError

            mock_agent_class.side_effect = ModelProviderError("Invalid API key")

            with patch("app.services.agent_service.settings") as mock_settings:
                mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
                mock_settings.redis_session_ttl = 3600

                with pytest.raises(
                    ModelError, match="Model initialization failed.*Invalid API key"
                ):
                    AgentService(redis_client)

    @pytest.mark.asyncio
    async def test_streaming_with_different_models(self, redis_client):
        """Test that streaming works with different configured models."""
        test_message = "Count to 3"
        expected_chunks = ["1", "2", "3"]

        models = ["anthropic/claude-3.5-sonnet", "openai/gpt-4o"]

        for model_id in models:
            with patch("app.services.agent_service.Agent") as mock_agent_class:
                # Mock the agent's run method to return an iterator
                mock_agent_instance = MagicMock()
                mock_agent_instance.run.return_value = iter(expected_chunks)
                mock_agent_class.return_value = mock_agent_instance

                with patch("app.services.agent_service.settings") as mock_settings:
                    mock_settings.openrouter_model_id = model_id
                    mock_settings.redis_session_ttl = 3600

                    service = AgentService(redis_client)

                    # Collect streamed chunks
                    chunks = []
                    async for chunk in service.process_message_stream(test_message):
                        chunks.append(chunk)

                    # Verify all chunks received
                    assert chunks == expected_chunks

    @pytest.mark.asyncio
    async def test_env_override_changes_model(self, redis_client):
        """Test that environment variable override changes the active model."""
        default_model = "anthropic/claude-3.5-sonnet"
        override_model = "openai/gpt-4o"

        # Test default model
        with patch("app.services.agent_service.Agent") as mock_agent_class:
            mock_agent_class.return_value = MagicMock()

            with patch("app.services.agent_service.settings") as mock_settings:
                mock_settings.openrouter_model_id = default_model
                mock_settings.redis_session_ttl = 3600

                service1 = AgentService(redis_client)
                call1_kwargs = mock_agent_class.call_args[1]
                assert call1_kwargs["model"].id == default_model

        # Test override via environment
        with patch("app.services.agent_service.Agent") as mock_agent_class:
            mock_agent_class.return_value = MagicMock()

            with patch("app.services.agent_service.settings") as mock_settings:
                mock_settings.openrouter_model_id = override_model
                mock_settings.redis_session_ttl = 3600

                service2 = AgentService(redis_client)
                call2_kwargs = mock_agent_class.call_args[1]
                assert call2_kwargs["model"].id == override_model
