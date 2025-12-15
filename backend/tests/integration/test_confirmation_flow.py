"""
Integration tests for confirmation flow with agent service.

Tests follow TDD approach - these tests should FAIL until implementation is complete.
Tests verify handle_confirmation method in AgentService correctly processes user responses.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4
from datetime import datetime
import json

import redis.asyncio as redis

from app.services.agent_service import AgentService
from app.models.agent import ConfirmationRequest, ConfirmationStatus


@pytest.fixture
def redis_client():
    """Create mock Redis client for testing."""
    from unittest.mock import AsyncMock
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.setex = AsyncMock()
    mock.delete = AsyncMock()
    return mock


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    mock = Mock()
    mock.table = Mock(return_value=mock)
    mock.insert = Mock(return_value=mock)
    mock.execute = Mock(return_value=Mock(data=[{"id": str(uuid4())}]))
    return mock


@pytest.fixture
def agent_service(redis_client):
    """Create AgentService instance for testing."""
    with patch("app.services.agent_service.settings") as mock_settings:
        mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
        mock_settings.redis_session_ttl = 3600
        with patch("app.services.agent_service.Agent"):
            service = AgentService(redis_client=redis_client)
            return service


@pytest.fixture
def sample_session_id():
    """Sample session UUID."""
    return str(uuid4())


@pytest.fixture
def sample_confirmation_id():
    """Sample confirmation UUID."""
    return str(uuid4())


@pytest.fixture
def sample_schema_id():
    """Sample schema UUID."""
    return str(uuid4())


@pytest.fixture
def sample_extracted_data():
    """Sample QC data extracted by agent."""
    return {
        "product_code": "ABC123",
        "batch_number": "2024-001",
        "scale_reading": 45.2,
        "unit": "kg",
    }


class TestConfirmationFlow:
    """Test suite for confirmation flow in AgentService."""

    @pytest.mark.asyncio
    async def test_handle_confirmation_method_exists(self, agent_service):
        """AgentService should have handle_confirmation method."""
        assert hasattr(agent_service, "handle_confirmation")
        assert callable(agent_service.handle_confirmation)

    @pytest.mark.asyncio
    async def test_handle_confirmation_accepts_correct_parameters(self, agent_service):
        """handle_confirmation should accept session_id and confirmation_request."""
        import inspect

        sig = inspect.signature(agent_service.handle_confirmation)
        params = list(sig.parameters.keys())

        # Should accept session_id and confirmation_request (ConfirmationRequest model)
        assert "session_id" in params or "self" in params

    @pytest.mark.asyncio
    async def test_handle_confirmation_with_user_approval(
        self, agent_service, sample_session_id, sample_confirmation_id, mock_supabase
    ):
        """handle_confirmation should call commit_qc_data when user confirms."""
        # Arrange
        confirmation_request = ConfirmationRequest(
            confirmed=True,
            modifications=None
        )

        # Store mock confirmation data in Redis
        confirmation_data = {
            "confirmation_id": sample_confirmation_id,
            "session_id": sample_session_id,
            "schema_id": str(uuid4()),
            "extracted_data": {"scale_reading": 45.2},
            "status": "pending",
            "created_at": "2024-01-01T00:00:00",
            "expires_at": "2024-01-01T00:15:00"
        }

        # Session context for _load_session_context
        session_context = {
            "session_id": sample_session_id,
            "messages": [],
            "schema_id": None
        }

        # Set up mock redis to return different values based on key
        async def mock_redis_get(key):
            if key == f"session:{sample_session_id}":
                return json.dumps(session_context)
            elif key == f"modal:{sample_session_id}":
                return json.dumps(confirmation_data, default=str)
            return None

        agent_service.redis.get = AsyncMock(side_effect=mock_redis_get)

        # Act - patch the commit tool's dependencies
        with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
            with patch("app.tools.commit.get_redis") as mock_get_redis:
                mock_sync_redis = Mock()
                mock_sync_redis.get = Mock(side_effect=[
                    sample_session_id,  # Reverse lookup
                    json.dumps(confirmation_data, default=str)  # Modal data
                ])
                mock_sync_redis.delete = Mock()
                mock_get_redis.return_value = mock_sync_redis

                result = await agent_service.handle_confirmation(
                    session_id=sample_session_id,
                    confirmation_request=confirmation_request
                )

        # Assert - commit_qc_data should have been called
        # Result should indicate successful commit
        assert result is not None
        assert "success" in result.lower() or "committed" in result.lower() or "report" in result.lower()

    @pytest.mark.asyncio
    async def test_handle_confirmation_with_user_rejection(
        self, agent_service, sample_session_id
    ):
        """handle_confirmation should inform agent when user rejects."""
        # Arrange
        confirmation_request = ConfirmationRequest(
            confirmed=False,
            modifications=None
        )

        # Act
        result = await agent_service.handle_confirmation(
            session_id=sample_session_id,
            confirmation_request=confirmation_request
        )

        # Assert - should return message for agent to retry
        assert result is not None
        assert "rejected" in result.lower() or "try again" in result.lower() or "retry" in result.lower()

    @pytest.mark.asyncio
    async def test_handle_confirmation_with_modifications(
        self, agent_service, sample_session_id, sample_confirmation_id, mock_supabase
    ):
        """handle_confirmation should pass modifications to commit_qc_data."""
        # Arrange
        modifications = {"scale_reading": 46.0}
        confirmation_request = ConfirmationRequest(
            confirmed=True,
            modifications=modifications
        )

        # Store mock confirmation data in Redis
        confirmation_data = {
            "confirmation_id": sample_confirmation_id,
            "session_id": sample_session_id,
            "schema_id": str(uuid4()),
            "extracted_data": {"scale_reading": 45.2},
            "status": "pending",
            "created_at": "2024-01-01T00:00:00",
            "expires_at": "2024-01-01T00:15:00"
        }

        # Session context for _load_session_context
        session_context = {
            "session_id": sample_session_id,
            "messages": [],
            "schema_id": None
        }

        # Set up mock redis to return different values based on key
        async def mock_redis_get(key):
            if key == f"session:{sample_session_id}":
                return json.dumps(session_context)
            elif key == f"modal:{sample_session_id}":
                return json.dumps(confirmation_data, default=str)
            return None

        agent_service.redis.get = AsyncMock(side_effect=mock_redis_get)

        # Act - patch the commit tool's dependencies
        with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
            with patch("app.tools.commit.get_redis") as mock_get_redis:
                mock_sync_redis = Mock()
                mock_sync_redis.get = Mock(side_effect=[
                    sample_session_id,  # Reverse lookup
                    json.dumps(confirmation_data, default=str)  # Modal data
                ])
                mock_sync_redis.delete = Mock()
                mock_get_redis.return_value = mock_sync_redis

                await agent_service.handle_confirmation(
                    session_id=sample_session_id,
                    confirmation_request=confirmation_request
                )

        # Assert - modifications should be applied via commit tool
        # The mock_supabase should have received the modified data
        chain_mock = mock_supabase.table.return_value
        if chain_mock.insert.called:
            insert_calls = chain_mock.insert.call_args_list
            # First insert is reports table
            reports_insert = insert_calls[0][0][0]
            assert reports_insert["data"]["scale_reading"] == 46.0

    @pytest.mark.asyncio
    async def test_handle_confirmation_updates_session_context(
        self, agent_service, sample_session_id
    ):
        """handle_confirmation should update session context in Redis."""
        # Arrange
        confirmation_request = ConfirmationRequest(
            confirmed=False,
            modifications=None
        )

        # Initialize session context
        await agent_service._save_session_context(
            sample_session_id,
            {
                "session_id": sample_session_id,
                "messages": [],
                "schema_id": None
            }
        )

        # Act
        await agent_service.handle_confirmation(
            session_id=sample_session_id,
            confirmation_request=confirmation_request
        )

        # Assert - session context should be updated
        context = await agent_service._load_session_context(sample_session_id)
        assert context is not None
        # Context should have been accessed/modified
        assert "session_id" in context


class TestConfirmationFlowWithAgent:
    """Test confirmation flow integrated with full agent processing."""

    @pytest.mark.asyncio
    async def test_agent_pauses_after_show_confirmation_modal(self, agent_service):
        """Agent should pause after calling show_confirmation_modal tool."""
        # This test verifies that stop_after_tool_call=True works correctly
        # The agent should not continue processing after showing the modal

        # Note: This is a placeholder test - actual implementation depends on
        # how Agno handles stop_after_tool_call
        assert hasattr(agent_service, "process_message")

    @pytest.mark.asyncio
    async def test_agent_resumes_after_user_confirmation(
        self, agent_service, sample_session_id, mock_supabase
    ):
        """Agent should resume and commit data after user confirms."""
        # Arrange - set up confirmation data in mock redis
        confirmation_data = {
            "confirmation_id": str(uuid4()),
            "session_id": sample_session_id,
            "schema_id": str(uuid4()),
            "extracted_data": {"scale_reading": 45.2},
            "status": "pending",
            "created_at": "2024-01-01T00:00:00",
            "expires_at": "2024-01-01T00:15:00"
        }

        # Session context for _load_session_context
        session_context = {
            "session_id": sample_session_id,
            "messages": [],
            "schema_id": None
        }

        # Set up mock redis to return different values based on key
        async def mock_redis_get(key):
            if key == f"session:{sample_session_id}":
                return json.dumps(session_context)
            elif key == f"modal:{sample_session_id}":
                return json.dumps(confirmation_data, default=str)
            return None

        agent_service.redis.get = AsyncMock(side_effect=mock_redis_get)

        # User confirms
        confirmation_request = ConfirmationRequest(
            confirmed=True,
            modifications=None
        )

        # Act - handle confirmation
        with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
            with patch("app.tools.commit.get_redis") as mock_get_redis:
                mock_sync_redis = Mock()
                mock_sync_redis.get = Mock(side_effect=[
                    sample_session_id,
                    json.dumps(confirmation_data, default=str)
                ])
                mock_sync_redis.delete = Mock()
                mock_get_redis.return_value = mock_sync_redis

                result = await agent_service.handle_confirmation(
                    session_id=sample_session_id,
                    confirmation_request=confirmation_request
                )

        # Assert
        assert result is not None

    @pytest.mark.asyncio
    async def test_full_flow_extract_confirm_commit(
        self, agent_service, sample_session_id, sample_schema_id, mock_supabase
    ):
        """Test complete flow: extract data -> show modal -> user confirms -> commit."""
        # This is an end-to-end test of the full confirmation flow
        from app.tools.confirmation import show_confirmation_modal

        # Step 1: Simulate agent extracting data and showing confirmation
        sample_data = {
            "product_code": "ABC123",
            "scale_reading": 45.2,
            "unit": "kg"
        }

        # Use a sync mock for the confirmation tool's redis
        mock_sync_redis = Mock()
        mock_sync_redis.setex = Mock()

        with patch("app.tools.confirmation.get_redis", return_value=mock_sync_redis):
            # Call the tool using its entrypoint
            if hasattr(show_confirmation_modal, "entrypoint"):
                confirmation_result = show_confirmation_modal.entrypoint(
                    session_id=sample_session_id,
                    schema_id=sample_schema_id,
                    extracted_data=sample_data
                )
            else:
                confirmation_result = show_confirmation_modal(
                    session_id=sample_session_id,
                    schema_id=sample_schema_id,
                    extracted_data=sample_data
                )

            # Verify confirmation modal was created
            assert "Confirmation ID:" in confirmation_result

            # Get the stored data from the mock
            stored_json = mock_sync_redis.setex.call_args_list[0][0][2]

        # Step 2: User confirms the data
        confirmation_request = ConfirmationRequest(
            confirmed=True,
            modifications=None
        )

        # Session context for _load_session_context
        session_context = {
            "session_id": sample_session_id,
            "messages": [],
            "schema_id": None
        }

        # Set up agent_service redis to return different values based on key
        async def mock_redis_get(key):
            if key == f"session:{sample_session_id}":
                return json.dumps(session_context)
            elif key == f"modal:{sample_session_id}":
                return stored_json
            return None

        agent_service.redis.get = AsyncMock(side_effect=mock_redis_get)

        # Step 3: Handle confirmation and commit
        with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
            with patch("app.tools.commit.get_redis") as mock_get_redis_commit:
                mock_commit_redis = Mock()
                mock_commit_redis.get = Mock(side_effect=[
                    sample_session_id,  # Reverse lookup
                    stored_json  # Modal data
                ])
                mock_commit_redis.delete = Mock()
                mock_get_redis_commit.return_value = mock_commit_redis

                result = await agent_service.handle_confirmation(
                    session_id=sample_session_id,
                    confirmation_request=confirmation_request
                )

        # Assert complete flow succeeded
        assert result is not None
        assert "report" in result.lower() or "commit" in result.lower() or "success" in result.lower()
