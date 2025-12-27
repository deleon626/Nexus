"""
Test Agent Schema Context Awareness

Verifies that agent service fetches and includes schema context when processing messages.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.services.agent_service import AgentService
from app.db.memory_store import MemoryStore
from app.db.models import FormTemplate


@pytest.fixture
def memory_store():
    """Create in-memory store for testing."""
    return MemoryStore()


@pytest.fixture
def mock_schema():
    """Mock schema with test fields."""
    return FormTemplate(
        id=str(uuid4()),
        form_code="TEST-001",
        form_name="Test QC Form",
        version="1.0.0",
        version_number=1,
        schema_definition={
            "per_sample_fields": [
                {
                    "id": "temperature",
                    "label": "Temperature",
                    "field_type": "number",
                    "required": True,
                    "unit": "C",
                },
                {
                    "id": "weight",
                    "label": "Weight",
                    "field_type": "number",
                    "required": True,
                    "unit": "kg",
                },
            ],
            "batch_metadata_fields": [
                {
                    "id": "batch_number",
                    "label": "Batch Number",
                    "field_type": "text",
                    "required": True,
                }
            ],
            "sections": [],
        },
        status="active",
    )


class TestAgentSchemaContext:
    """Test suite for agent schema context awareness."""

    @pytest.mark.asyncio
    async def test_get_schema_context_formats_fields(self, memory_store, mock_schema):
        """_get_schema_context should format schema fields for agent."""
        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
            mock_settings.openrouter_api_key = "test-key"

            agent_service = AgentService(memory_store)

            with patch.object(
                agent_service, "_get_schema_context"
            ) as mock_get_schema:
                # Mock the schema service response
                expected_context = """

QC Schema Fields:
- Temperature (temperature): number [REQUIRED] (unit: C)
- Weight (weight): number [REQUIRED] (unit: kg)
- Batch Number (batch_number): text [BATCH]"""
                mock_get_schema.return_value = expected_context

                # Call the method
                schema_id = str(uuid4())
                context = await agent_service._get_schema_context(schema_id)

                assert "Temperature (temperature): number [REQUIRED]" in context
                assert "unit: C" in context
                assert "Weight (weight): number [REQUIRED]" in context
                assert "unit: kg" in context
                assert "Batch Number (batch_number): text [BATCH]" in context

    @pytest.mark.asyncio
    async def test_get_schema_context_returns_empty_for_default_schema(
        self, memory_store
    ):
        """_get_schema_context should return empty string for default-schema."""
        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
            mock_settings.openrouter_api_key = "test-key"

            agent_service = AgentService(memory_store)

            # Test with "default-schema"
            context = await agent_service._get_schema_context("default-schema")
            assert context == ""

            # Test with None
            context = await agent_service._get_schema_context(None)
            assert context == ""

            # Test with empty string
            context = await agent_service._get_schema_context("")
            assert context == ""

    @pytest.mark.asyncio
    async def test_get_schema_context_handles_missing_schema_gracefully(
        self, memory_store
    ):
        """_get_schema_context should return empty string if schema not found."""
        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
            mock_settings.openrouter_api_key = "test-key"

            agent_service = AgentService(memory_store)

            with patch(
                "app.services.schema_service.SchemaService.get_schema_by_id",
                return_value=None,
            ):
                schema_id = str(uuid4())
                context = await agent_service._get_schema_context(schema_id)
                assert context == ""

    @pytest.mark.asyncio
    async def test_get_schema_context_handles_errors_gracefully(self, memory_store):
        """_get_schema_context should return empty string on errors."""
        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
            mock_settings.openrouter_api_key = "test-key"

            agent_service = AgentService(memory_store)

            with patch(
                "app.services.schema_service.SchemaService.get_schema_by_id",
                side_effect=Exception("Database error"),
            ):
                schema_id = str(uuid4())
                context = await agent_service._get_schema_context(schema_id)
                assert context == ""

    @pytest.mark.asyncio
    async def test_process_message_includes_schema_context(self, memory_store):
        """process_message should include schema context in agent message."""
        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
            mock_settings.openrouter_api_key = "test-key"

            agent_service = AgentService(memory_store)

            # Set up session context with schema_id
            session_id = str(uuid4())
            schema_id = str(uuid4())
            memory_store.set_session_context(
                session_id,
                {
                    "session_id": session_id,
                    "schema_id": schema_id,
                    "messages": [],
                },
            )

            # Mock schema context
            mock_schema_context = "\n\nQC Schema Fields:\n- Temperature (temp): number"

            with patch.object(
                agent_service, "_get_schema_context", return_value=mock_schema_context
            ):
                with patch.object(
                    agent_service.agent, "run", return_value=MagicMock(content="Response")
                ) as mock_run:
                    await agent_service.process_message(
                        message="What fields do I need?",
                        session_id=session_id,
                    )

                    # Verify agent.run was called with enhanced message
                    mock_run.assert_called_once()
                    call_args = mock_run.call_args[0]
                    assert "What fields do I need?" in call_args[0]
                    assert mock_schema_context in call_args[0]

    @pytest.mark.asyncio
    async def test_process_message_works_without_schema(self, memory_store):
        """process_message should work normally when no schema is available."""
        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
            mock_settings.openrouter_api_key = "test-key"

            agent_service = AgentService(memory_store)

            # Set up session context without schema_id
            session_id = str(uuid4())
            memory_store.set_session_context(
                session_id,
                {
                    "session_id": session_id,
                    "schema_id": None,
                    "messages": [],
                },
            )

            with patch.object(
                agent_service.agent, "run", return_value=MagicMock(content="Response")
            ) as mock_run:
                await agent_service.process_message(
                    message="Hello",
                    session_id=session_id,
                )

                # Verify agent.run was called with original message (no schema context)
                mock_run.assert_called_once()
                call_args = mock_run.call_args[0]
                assert call_args[0] == "Hello"

    @pytest.mark.asyncio
    async def test_process_message_stream_includes_schema_context(self, memory_store):
        """process_message_stream should include schema context."""
        with patch("app.services.agent_service.settings") as mock_settings:
            mock_settings.openrouter_model_id = "anthropic/claude-3.5-sonnet"
            mock_settings.openrouter_api_key = "test-key"

            agent_service = AgentService(memory_store)

            # Set up session context with schema_id
            session_id = str(uuid4())
            schema_id = str(uuid4())
            memory_store.set_session_context(
                session_id,
                {
                    "session_id": session_id,
                    "schema_id": schema_id,
                    "messages": [],
                },
            )

            # Mock schema context
            mock_schema_context = "\n\nQC Schema Fields:\n- Temperature (temp): number"

            def mock_stream(*args, **kwargs):
                yield "chunk1"
                yield "chunk2"

            with patch.object(
                agent_service, "_get_schema_context", return_value=mock_schema_context
            ):
                with patch.object(
                    agent_service.agent, "run", return_value=mock_stream()
                ) as mock_run:
                    chunks = []
                    async for chunk in agent_service.process_message_stream(
                        message="Stream test",
                        session_id=session_id,
                    ):
                        chunks.append(chunk)

                    # Verify agent.run was called with enhanced message
                    mock_run.assert_called_once()
                    call_args = mock_run.call_args[0]
                    assert "Stream test" in call_args[0]
                    assert mock_schema_context in call_args[0]
