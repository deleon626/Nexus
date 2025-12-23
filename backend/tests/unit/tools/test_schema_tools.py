"""Unit tests for schema extraction Agno tool.

TDD: These tests are written FIRST, before implementation.
They should FAIL until the tool is implemented.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestSchemaExtractionTool:
    """Tests for the extract_schema_from_form Agno tool."""

    @pytest.fixture
    def sample_image_base64(self) -> str:
        """Return a minimal valid PNG as base64."""
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    def test_tool_exists_and_is_decorated(self):
        """
        Test that the extract_schema_from_form tool exists and has @tool decorator.

        Given: The schema_tools module
        When: We import extract_schema_from_form
        Then: It is an Agno Function with expected attributes
        """
        from app.tools.schema_tools import extract_schema_from_form

        # Agno @tool decorator wraps in Function object
        # Check for Agno Function attributes
        assert hasattr(extract_schema_from_form, "name")
        assert extract_schema_from_form.name == "extract_schema_from_form"
        assert hasattr(extract_schema_from_form, "entrypoint")

    def test_tool_has_correct_parameters(self):
        """
        Test that the tool accepts the expected parameters.

        Given: The extract_schema_from_form tool
        When: We inspect its parameters schema
        Then: It accepts image_base64 and schema_name parameters
        """
        from app.tools.schema_tools import extract_schema_from_form

        # Agno Function has parameters as a dict schema
        params = extract_schema_from_form.parameters
        assert "properties" in params
        assert "image_base64" in params["properties"]
        assert "schema_name" in params["properties"]

    @pytest.mark.asyncio
    async def test_tool_returns_extraction_result(self, sample_image_base64: str):
        """
        Test that the tool returns a structured extraction result.

        Given: A valid image base64 string
        When: extract_schema_from_form.entrypoint is called
        Then: It returns a JSON string with extracted_schema and confidence_score
        """
        from app.tools.schema_tools import extract_schema_from_form

        # Mock the underlying LLM call
        with patch(
            "app.tools.schema_tools.SchemaService"
        ) as MockService:
            mock_instance = MockService.return_value
            mock_instance.extract_schema = AsyncMock(
                return_value=(
                    MagicMock(model_dump=lambda **_: {"per_sample_fields": [], "sections": [], "batch_metadata_fields": []}),
                    MagicMock(
                        confidence_score=0.75,
                        source_file="test.pdf",
                        model_used="test-model",
                        processing_time_ms=500,
                        model_dump=lambda **_: {"confidence_score": 0.75, "source_file": "test.pdf"},
                    ),
                )
            )

            # Call the tool's entrypoint directly
            result = await extract_schema_from_form.entrypoint(
                image_base64=sample_image_base64,
                schema_name="Test Schema",
            )

        # Should return JSON string with schema data
        assert isinstance(result, str)
        assert "extracted_schema" in result or "success" in result

    @pytest.mark.asyncio
    async def test_tool_handles_extraction_error(self, sample_image_base64: str):
        """
        Test that the tool handles extraction errors gracefully.

        Given: An image that causes extraction to fail
        When: extract_schema_from_form.entrypoint is called
        Then: It returns an error JSON instead of raising
        """
        from app.tools.schema_tools import extract_schema_from_form

        with patch(
            "app.tools.schema_tools.SchemaService"
        ) as MockService:
            mock_instance = MockService.return_value
            mock_instance.extract_schema = AsyncMock(
                side_effect=Exception("LLM timeout")
            )

            result = await extract_schema_from_form.entrypoint(
                image_base64=sample_image_base64,
                schema_name="Test Schema",
            )

        # Should return error info as JSON, not raise
        assert isinstance(result, str)
        assert "error" in result.lower() or "failed" in result.lower()
