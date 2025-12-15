"""
Unit tests for commit_qc_data tool.

Tests follow TDD approach - these tests should FAIL until implementation is complete.
Tests verify commit_qc_data tool persists data to Supabase and creates audit events.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4, UUID
from datetime import datetime
import json

from app.models.agent import ConfirmationModalData, ConfirmationStatus


def call_tool(tool, *args, **kwargs):
    """Helper to call Agno-wrapped tools."""
    if hasattr(tool, "entrypoint"):
        return tool.entrypoint(*args, **kwargs)
    return tool(*args, **kwargs)


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    mock = Mock()
    return mock


@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    mock = Mock()
    # Create a chain mock that returns itself for chaining
    chain_mock = Mock()
    chain_mock.insert = Mock(return_value=chain_mock)
    chain_mock.execute = Mock(return_value=Mock(data=[{"id": str(uuid4())}]))
    mock.table = Mock(return_value=chain_mock)
    return mock


@pytest.fixture
def sample_confirmation_id():
    """Sample confirmation UUID."""
    return uuid4()


@pytest.fixture
def sample_session_id():
    """Sample session UUID."""
    return uuid4()


@pytest.fixture
def sample_schema_id():
    """Sample schema UUID."""
    return uuid4()


@pytest.fixture
def sample_user_id():
    """Sample user UUID."""
    return uuid4()


@pytest.fixture
def sample_extracted_data():
    """Sample QC data extracted by agent."""
    return {
        "product_code": "ABC123",
        "batch_number": "2024-001",
        "scale_reading": 45.2,
        "unit": "kg",
        "timestamp": datetime.utcnow().isoformat(),
    }


@pytest.fixture
def sample_confirmation_data(sample_confirmation_id, sample_session_id, sample_schema_id, sample_extracted_data):
    """Sample confirmation modal data."""
    return ConfirmationModalData(
        confirmation_id=sample_confirmation_id,
        session_id=sample_session_id,
        schema_id=sample_schema_id,
        extracted_data=sample_extracted_data,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow(),
        status=ConfirmationStatus.PENDING,
    )


class TestCommitQCDataTool:
    """Test suite for commit_qc_data tool."""

    def test_commit_qc_data_tool_exists(self):
        """commit_qc_data tool should be importable and callable."""
        from app.tools.commit import commit_qc_data
        # Agno wraps tools, check for entrypoint or the object itself
        assert commit_qc_data is not None
        assert hasattr(commit_qc_data, "entrypoint") or callable(commit_qc_data)

    def test_commit_qc_data_has_correct_signature(self):
        """Tool should accept confirmation_id and optional modifications parameters."""
        from app.tools.commit import commit_qc_data
        import inspect

        # Get the actual function (entrypoint) from Agno-wrapped tool
        func = commit_qc_data.entrypoint if hasattr(commit_qc_data, "entrypoint") else commit_qc_data
        sig = inspect.signature(func)
        params = list(sig.parameters.keys())

        assert "confirmation_id" in params
        assert "modifications" in params

    def test_commit_qc_data_retrieves_confirmation_from_redis(
        self, mock_redis, sample_confirmation_id, sample_confirmation_data
    ):
        """Tool should retrieve confirmation data from Redis."""
        from app.tools.commit import commit_qc_data

        # Arrange
        reverse_key = f"confirmation:{sample_confirmation_id}"
        mock_redis.get = Mock(side_effect=[
            str(sample_confirmation_data.session_id),  # First call: reverse lookup
            sample_confirmation_data.model_dump_json()  # Second call: actual data
        ])

        # Act
        with patch("app.tools.commit.get_redis", return_value=mock_redis):
            with patch("app.tools.commit.get_supabase", return_value=Mock()):
                try:
                    call_tool(
                        commit_qc_data,
                        confirmation_id=str(sample_confirmation_id),
                        modifications=None
                    )
                except Exception:
                    pass  # We expect errors in TDD, just checking Redis call

        # Assert
        assert mock_redis.get.call_count >= 1

    def test_commit_qc_data_inserts_report_to_supabase(
        self, mock_redis, mock_supabase, sample_confirmation_id, sample_confirmation_data
    ):
        """Tool should insert QC report into Supabase reports table."""
        from app.tools.commit import commit_qc_data

        # Arrange
        mock_redis.get = Mock(side_effect=[
            str(sample_confirmation_data.session_id),  # First call: reverse lookup
            sample_confirmation_data.model_dump_json()  # Second call: actual data
        ])
        mock_redis.delete = Mock()

        # Act
        with patch("app.tools.commit.get_redis", return_value=mock_redis):
            with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
                call_tool(commit_qc_data,
                    confirmation_id=str(sample_confirmation_id),
                    modifications=None
                )

        # Assert
        mock_supabase.table.assert_any_call("reports")
        # Check that insert was called on the chain mock
        table_result = mock_supabase.table.return_value
        table_result.insert.assert_called()

    def test_commit_qc_data_applies_user_modifications(
        self, mock_redis, mock_supabase, sample_confirmation_id, sample_confirmation_data
    ):
        """Tool should apply user modifications to extracted data before persisting."""
        from app.tools.commit import commit_qc_data

        # Arrange
        mock_redis.get = Mock(side_effect=[
            str(sample_confirmation_data.session_id),
            sample_confirmation_data.model_dump_json()
        ])
        mock_redis.delete = Mock()
        modifications = {"scale_reading": 46.0}  # User corrected the weight

        # Act
        with patch("app.tools.commit.get_redis", return_value=mock_redis):
            with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
                call_tool(commit_qc_data,
                    confirmation_id=str(sample_confirmation_id),
                    modifications=modifications
                )

        # Assert - verify insert was called with modified data
        table_result = mock_supabase.table.return_value
        insert_calls = table_result.insert.call_args_list
        # First insert is for reports table
        reports_insert = insert_calls[0][0][0]
        assert reports_insert["data"]["scale_reading"] == 46.0

    def test_commit_qc_data_creates_audit_event(
        self, mock_redis, mock_supabase, sample_confirmation_id, sample_confirmation_data
    ):
        """Tool should create an audit event in Supabase events table."""
        from app.tools.commit import commit_qc_data

        # Arrange
        mock_redis.get = Mock(side_effect=[
            str(sample_confirmation_data.session_id),
            sample_confirmation_data.model_dump_json()
        ])
        mock_redis.delete = Mock()

        # Act
        with patch("app.tools.commit.get_redis", return_value=mock_redis):
            with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
                call_tool(commit_qc_data,
                    confirmation_id=str(sample_confirmation_id),
                    modifications=None
                )

        # Assert - verify events table was inserted into
        table_calls = [call[0][0] for call in mock_supabase.table.call_args_list]
        assert "events" in table_calls

    def test_commit_qc_data_returns_report_id(
        self, mock_redis, mock_supabase, sample_confirmation_id, sample_confirmation_data
    ):
        """Tool should return the ID of the created QC report."""
        from app.tools.commit import commit_qc_data

        # Arrange
        mock_redis.get = Mock(side_effect=[
            str(sample_confirmation_data.session_id),
            sample_confirmation_data.model_dump_json()
        ])
        mock_redis.delete = Mock()
        expected_report_id = str(uuid4())

        # Update the chain mock
        chain_mock = mock_supabase.table.return_value
        chain_mock.execute = Mock(return_value=Mock(data=[{"id": expected_report_id}]))

        # Act
        with patch("app.tools.commit.get_redis", return_value=mock_redis):
            with patch("app.tools.commit.get_supabase", return_value=mock_supabase):
                result = call_tool(commit_qc_data,
                    confirmation_id=str(sample_confirmation_id),
                    modifications=None
                )

        # Assert
        assert expected_report_id in result

    def test_commit_qc_data_raises_error_if_confirmation_not_found(
        self, mock_redis, sample_confirmation_id
    ):
        """Tool should raise error if confirmation data not found in Redis."""
        from app.tools.commit import commit_qc_data

        # Arrange - reverse lookup returns None
        mock_redis.get = Mock(return_value=None)

        # Act & Assert
        with patch("app.tools.commit.get_redis", return_value=mock_redis):
            with patch("app.tools.commit.get_supabase", return_value=Mock()):
                with pytest.raises(RuntimeError):
                    call_tool(commit_qc_data,
                        confirmation_id=str(sample_confirmation_id),
                        modifications=None
                    )

    def test_commit_qc_data_raises_error_if_redis_unavailable(
        self, sample_confirmation_id
    ):
        """Tool should raise error if Redis client is not available."""
        from app.tools.commit import commit_qc_data

        # Act & Assert
        with patch("app.tools.commit.get_redis", side_effect=RuntimeError("Redis not initialized")):
            with pytest.raises(RuntimeError):
                call_tool(commit_qc_data,
                    confirmation_id=str(sample_confirmation_id),
                    modifications=None
                )

    def test_commit_qc_data_raises_error_if_supabase_unavailable(
        self, mock_redis, sample_confirmation_id, sample_confirmation_data
    ):
        """Tool should raise error if Supabase client is not available."""
        from app.tools.commit import commit_qc_data

        # Arrange
        mock_redis.get = Mock(side_effect=[
            str(sample_confirmation_data.session_id),
            sample_confirmation_data.model_dump_json()
        ])

        # Act & Assert
        with patch("app.tools.commit.get_redis", return_value=mock_redis):
            with patch("app.tools.commit.get_supabase", side_effect=RuntimeError("Supabase not initialized")):
                with pytest.raises(RuntimeError):
                    call_tool(commit_qc_data,
                        confirmation_id=str(sample_confirmation_id),
                        modifications=None
                    )
