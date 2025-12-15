"""
Integration tests for agent tools.

Tests follow TDD approach - these tests should FAIL until implementation is complete.
Tests verify both show_confirmation_modal and commit_qc_data work together correctly.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4
from datetime import datetime
import json

import redis.asyncio as redis

from app.models.agent import ConfirmationModalData, ConfirmationStatus
from app.tools.confirmation import show_confirmation_modal


def call_tool(tool, *args, **kwargs):
    """Helper to call Agno-wrapped tools."""
    if hasattr(tool, "entrypoint"):
        return tool.entrypoint(*args, **kwargs)
    return tool(*args, **kwargs)


@pytest.fixture
def redis_client():
    """Create mock Redis client for testing."""
    mock = Mock()
    mock.get = Mock(return_value=None)
    mock.setex = Mock()
    mock.delete = Mock()
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
def sample_session_id():
    """Sample session UUID."""
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


class TestAgentToolsIntegration:
    """Integration tests for agent tools working together."""

    def test_show_confirmation_then_commit_flow(
        self, sample_session_id, sample_schema_id, sample_extracted_data, mock_supabase
    ):
        """Test complete flow: show confirmation modal, then commit data."""
        from app.tools.commit import commit_qc_data

        # Step 1: Show confirmation modal
        with patch("app.tools.confirmation.get_redis") as mock_get_redis:
            mock_redis = Mock()
            mock_get_redis.return_value = mock_redis

            confirmation_result = call_tool(
                show_confirmation_modal,
                session_id=sample_session_id,
                schema_id=sample_schema_id,
                extracted_data=sample_extracted_data
            )

            # Extract confirmation_id from result
            assert "Confirmation ID:" in confirmation_result
            confirmation_id_str = confirmation_result.split("Confirmation ID: ")[1].split(".")[0]

            # Get the stored modal data (first setex call)
            modal_call_args = mock_redis.setex.call_args_list[0]
            stored_json = modal_call_args[0][2]

        # Step 2: Commit the confirmed data
        with patch("app.tools.commit.get_redis") as mock_get_redis_commit:
            mock_redis_commit = Mock()
            mock_get_redis_commit.return_value = mock_redis_commit
            # Mock both reverse lookup and modal data retrieval
            mock_redis_commit.get = Mock(side_effect=[
                sample_session_id,  # Reverse lookup returns session_id
                stored_json  # Modal data lookup
            ])
            mock_redis_commit.delete = Mock()

            with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
                report_id = call_tool(
                    commit_qc_data,
                    confirmation_id=confirmation_id_str,
                    modifications=None
                )

                # Verify report was created
                assert "Report ID:" in report_id or len(report_id) > 0

    def test_commit_with_user_modifications(
        self, sample_session_id, sample_schema_id, sample_extracted_data, mock_supabase
    ):
        """Test that user modifications are applied correctly."""
        from app.tools.commit import commit_qc_data

        # Step 1: Create confirmation
        with patch("app.tools.confirmation.get_redis") as mock_get_redis:
            mock_redis = Mock()
            mock_get_redis.return_value = mock_redis

            confirmation_result = call_tool(
                show_confirmation_modal,
                session_id=sample_session_id,
                schema_id=sample_schema_id,
                extracted_data=sample_extracted_data
            )

            confirmation_id_str = confirmation_result.split("Confirmation ID: ")[1].split(".")[0]
            stored_json = mock_redis.setex.call_args_list[0][0][2]

        # Step 2: Commit with modifications
        modifications = {"scale_reading": 46.5}  # User corrected the weight

        with patch("app.tools.commit.get_redis") as mock_get_redis_commit:
            mock_redis_commit = Mock()
            mock_get_redis_commit.return_value = mock_redis_commit
            mock_redis_commit.get = Mock(side_effect=[
                sample_session_id,  # Reverse lookup
                stored_json  # Modal data
            ])
            mock_redis_commit.delete = Mock()

            with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
                call_tool(
                    commit_qc_data,
                    confirmation_id=confirmation_id_str,
                    modifications=modifications
                )

                # Verify modifications were applied - check reports table insert
                chain_mock = mock_supabase.table.return_value
                # The insert should have been called with data containing modified scale_reading
                insert_calls = chain_mock.insert.call_args_list
                # Find the reports insert (first one)
                reports_insert = insert_calls[0][0][0]
                assert reports_insert["data"]["scale_reading"] == 46.5

    def test_commit_without_confirmation_raises_error(self):
        """Test that commit fails if confirmation doesn't exist."""
        from app.tools.commit import commit_qc_data

        fake_confirmation_id = str(uuid4())

        with patch("app.tools.commit.get_redis") as mock_get_redis:
            mock_redis = Mock()
            mock_get_redis.return_value = mock_redis
            mock_redis.get = Mock(return_value=None)

            with pytest.raises(RuntimeError):
                call_tool(
                    commit_qc_data,
                    confirmation_id=fake_confirmation_id,
                    modifications=None
                )

    def test_audit_event_contains_all_required_fields(
        self, sample_session_id, sample_schema_id, sample_extracted_data, mock_supabase
    ):
        """Test that audit event includes all required fields."""
        from app.tools.commit import commit_qc_data

        # Create confirmation
        with patch("app.tools.confirmation.get_redis") as mock_get_redis:
            mock_redis = Mock()
            mock_get_redis.return_value = mock_redis

            confirmation_result = call_tool(
                show_confirmation_modal,
                session_id=sample_session_id,
                schema_id=sample_schema_id,
                extracted_data=sample_extracted_data
            )

            confirmation_id_str = confirmation_result.split("Confirmation ID: ")[1].split(".")[0]
            stored_json = mock_redis.setex.call_args_list[0][0][2]

        # Commit and verify audit event
        with patch("app.tools.commit.get_redis") as mock_get_redis_commit:
            mock_redis_commit = Mock()
            mock_get_redis_commit.return_value = mock_redis_commit
            mock_redis_commit.get = Mock(side_effect=[
                sample_session_id,  # Reverse lookup
                stored_json  # Modal data
            ])
            mock_redis_commit.delete = Mock()

            with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
                call_tool(
                    commit_qc_data,
                    confirmation_id=confirmation_id_str,
                    modifications=None
                )

                # Verify events table was called
                table_calls = [call[0][0] for call in mock_supabase.table.call_args_list]
                assert "events" in table_calls


class TestToolsWithAgnoAgent:
    """Test tools integration with Agno agent framework."""

    def test_both_tools_have_agno_decorator(self):
        """Both tools should have @tool decorator which wraps them in Function object."""
        from app.tools.confirmation import show_confirmation_modal
        from app.tools.commit import commit_qc_data

        # Agno wraps tools in a Function object with entrypoint attribute
        assert hasattr(show_confirmation_modal, "entrypoint")
        assert hasattr(commit_qc_data, "entrypoint")
        # And they have name attribute (from the @tool decorator)
        assert hasattr(show_confirmation_modal, "name")
        assert hasattr(commit_qc_data, "name")

    def test_tools_have_stop_after_tool_call_configuration(self):
        """show_confirmation_modal should have stop_after_tool_call=True."""
        from app.tools.confirmation import show_confirmation_modal
        from app.tools.commit import commit_qc_data

        # Verify tools have entrypoint (callable)
        assert hasattr(show_confirmation_modal, "entrypoint")
        assert callable(show_confirmation_modal.entrypoint)
        assert hasattr(commit_qc_data, "entrypoint")
        assert callable(commit_qc_data.entrypoint)

        # Verify stop_after_tool_call is set correctly
        assert show_confirmation_modal.stop_after_tool_call is True
