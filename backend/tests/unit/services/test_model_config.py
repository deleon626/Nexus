"""
Unit Tests for Model Configuration

Tests model ID configuration, validation, and usage in AgentService.
Following TDD: These tests are written FIRST and should fail initially.
"""

import pytest
from unittest.mock import MagicMock, patch
import redis.asyncio as redis

from app.config import Settings
from app.services.agent_service import AgentService, ModelError


class TestModelConfiguration:
    """Test suite for model configuration functionality."""

    @pytest.fixture
    def redis_client(self):
        """Mock Redis client."""
        return MagicMock(spec=redis.Redis)

    def test_default_model_id(self):
        """Test that default model ID is set correctly."""
        settings = Settings(
            supabase_url="http://localhost:54321",
            postgres_url="postgresql://postgres:postgres@localhost:54322/postgres",
            openrouter_api_key="test-key",
            openai_api_key="test-key",
        )
        assert settings.openrouter_model_id == "anthropic/claude-3.5-sonnet"

    def test_custom_model_id_from_env(self):
        """Test that custom model ID can be set via environment."""
        with patch.dict(
            "os.environ",
            {
                "OPENROUTER_MODEL_ID": "openai/gpt-4o",
                "SUPABASE_URL": "http://localhost:54321",
                "POSTGRES_URL": "postgresql://postgres:postgres@localhost:54322/postgres",
                "OPENROUTER_API_KEY": "test-key",
                "OPENAI_API_KEY": "test-key",
            },
        ):
            settings = Settings()
            assert settings.openrouter_model_id == "openai/gpt-4o"

    def test_model_id_validation_valid_format(self, redis_client):
        """Test that valid model ID format is accepted."""
        valid_model_ids = [
            "anthropic/claude-3.5-sonnet",
            "anthropic/claude-3-opus",
            "openai/gpt-4o",
            "openai/gpt-4-turbo",
            "meta-llama/llama-3.1-70b-instruct",
            "google/gemini-pro",
        ]

        for model_id in valid_model_ids:
            with patch("app.services.agent_service.settings") as mock_settings:
                mock_settings.openrouter_model_id = model_id
                mock_settings.redis_session_ttl = 3600

                # Should not raise an error
                try:
                    with patch("app.services.agent_service.Agent"):
                        service = AgentService(redis_client)
                        assert service is not None
                except ModelError:
                    pytest.fail(f"Valid model ID '{model_id}' was rejected")

    def test_model_id_validation_invalid_format(self, redis_client):
        """Test that invalid model ID format is rejected."""
        invalid_model_ids = [
            "claude-3.5-sonnet",  # Missing provider
            "anthropic/",  # Missing model name
            "/claude-3.5-sonnet",  # Missing provider
            "anthropic-claude-3.5-sonnet",  # Wrong separator
            "",  # Empty string
            "anthropic/claude/3.5/sonnet",  # Too many slashes
        ]

        for model_id in invalid_model_ids:
            with patch("app.services.agent_service.settings") as mock_settings:
                mock_settings.openrouter_model_id = model_id
                mock_settings.redis_session_ttl = 3600

                with pytest.raises(ModelError, match="Invalid model ID format"):
                    with patch("app.services.agent_service.Agent"):
                        AgentService(redis_client)

    def test_agent_uses_configured_model(self, redis_client):
        """Test that AgentService initializes with configured model ID."""
        test_model_id = "openai/gpt-4o"

        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = test_model_id
            mock_settings.redis_session_ttl = 3600

            with patch("app.services.agent_service.Agent") as mock_agent_class:
                mock_agent_instance = MagicMock()
                mock_agent_class.return_value = mock_agent_instance

                service = AgentService(redis_client)

                # Verify Agent was initialized
                mock_agent_class.assert_called_once()

                # Verify the model parameter was passed correctly
                call_kwargs = mock_agent_class.call_args[1]
                assert "model" in call_kwargs

                # Verify model has correct ID
                model_obj = call_kwargs["model"]
                assert hasattr(model_obj, "id")
                assert model_obj.id == test_model_id

    def test_multiple_model_switches(self, redis_client):
        """Test that different AgentService instances can use different models."""
        models = ["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "google/gemini-pro"]

        for model_id in models:
            with patch("app.services.agent_service.settings") as mock_settings:
                mock_settings.openrouter_model_id = model_id
                mock_settings.redis_session_ttl = 3600

                with patch("app.services.agent_service.Agent") as mock_agent_class:
                    mock_agent_class.return_value = MagicMock()

                    service = AgentService(redis_client)

                    # Verify correct model was used
                    call_kwargs = mock_agent_class.call_args[1]
                    model_obj = call_kwargs["model"]
                    assert model_obj.id == model_id

    def test_model_error_on_initialization_failure(self, redis_client):
        """Test that ModelError is raised when agent initialization fails."""
        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
            mock_settings.redis_session_ttl = 3600

            with patch("app.services.agent_service.Agent") as mock_agent_class:
                from agno.exceptions import ModelProviderError

                mock_agent_class.side_effect = ModelProviderError("API key invalid")

                with pytest.raises(ModelError, match="Model initialization failed"):
                    AgentService(redis_client)


class TestModelValidationHelpers:
    """Test suite for model validation helper functions."""

    def test_validate_model_id_format_valid(self):
        """Test _validate_model_id with valid formats."""
        from app.services.agent_service import AgentService

        valid_ids = [
            "anthropic/claude-3.5-sonnet",
            "openai/gpt-4o",
            "meta-llama/llama-3.1-70b-instruct",
        ]

        for model_id in valid_ids:
            # Should not raise
            AgentService._validate_model_id(model_id)

    def test_validate_model_id_format_invalid(self):
        """Test _validate_model_id with invalid formats."""
        from app.services.agent_service import AgentService, ModelError

        invalid_ids = [
            "claude-3.5-sonnet",
            "anthropic/",
            "/claude",
            "anthropic-claude",
            "",
        ]

        for model_id in invalid_ids:
            with pytest.raises(ModelError, match="Invalid model ID format"):
                AgentService._validate_model_id(model_id)
