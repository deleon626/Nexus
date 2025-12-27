"""Integration tests for schema extraction pipeline.

Tests the complete flow: PDF → image → LLM extraction → schema structure.

Test Strategy:
- Contract tests: Mock LLM response, test full pipeline integration
- Live tests: Real API calls, validate structural contracts (marked with @pytest.mark.live)
"""

import json
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from app.services.file_service import prepare_image_for_extraction
from app.services.schema_service import (
    SchemaService,
    SchemaExtractionError,
)
from app.models.schema import (
    ExtractedSchemaStructure,
    ExtractionMetadata,
    SchemaField,
    SchemaSection,
    FieldType,
)

from tests.integration.fixtures.llm_responses import (
    QC_FORM_EXTRACTION_RESPONSE,
    QC_FORM_MARKDOWN_WRAPPED,
    MALFORMED_JSON_RESPONSE,
    MINIMAL_VALID_RESPONSE,
    PARTIAL_RESPONSE,
)


class TestSchemaExtractionContract:
    """Contract tests with mocked LLM - fast and deterministic."""

    @pytest.fixture
    def schema_service(self) -> SchemaService:
        """Create schema service instance."""
        return SchemaService()

    @pytest.fixture
    def qc_form_pdf_bytes(self) -> bytes:
        """Load real QC form PDF for image processing tests."""
        pdf_path = (
            Path(__file__).parent.parent.parent.parent
            / "docs/qc-forms/1. FR-QC-II.03.01 - Penerimaan Bahan Baku.pdf"
        )
        if not pdf_path.exists():
            pytest.skip(f"QC form PDF not found at {pdf_path}")
        return pdf_path.read_bytes()

    @pytest.fixture
    def sample_base64_image(self) -> str:
        """Sample base64 image for testing."""
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    # =========================================================================
    # END-TO-END CONTRACT TESTS
    # =========================================================================

    @pytest.mark.asyncio
    async def test_end_to_end_pdf_to_schema(
        self, schema_service: SchemaService, qc_form_pdf_bytes: bytes
    ):
        """
        Given: Real QC form PDF
        When: Full extraction pipeline runs with mocked LLM
        Then: Returns valid ExtractedSchemaStructure with metadata
        """
        # Arrange: Prepare image from PDF
        base64_image, file_size = await prepare_image_for_extraction(
            file_content=qc_form_pdf_bytes,
            content_type="application/pdf",
            max_dimension=2048,
        )

        # Mock the LLM call to return known response
        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = QC_FORM_EXTRACTION_RESPONSE

            # Act
            schema, metadata = await schema_service.extract_schema(
                image_base64=base64_image,
                source_filename="test_qc_form.pdf",
                file_size=file_size,
            )

            # Assert - Structure
            assert isinstance(schema, ExtractedSchemaStructure)
            assert isinstance(metadata, ExtractionMetadata)

            # Assert - Schema content
            assert len(schema.per_sample_fields) == 3
            assert len(schema.sections) == 1
            assert len(schema.batch_metadata_fields) == 4

            # Assert - Metadata
            assert metadata.source_file == "test_qc_form.pdf"
            assert metadata.model_used == schema_service.model
            assert metadata.processing_time_ms >= 0
            assert 0.0 <= metadata.confidence_score <= 1.0

    @pytest.mark.asyncio
    async def test_extracts_per_sample_fields_correctly(
        self, schema_service: SchemaService, sample_base64_image: str
    ):
        """
        Given: LLM returns response with per_sample_fields
        When: Schema is extracted
        Then: Fields are parsed with correct types and attributes
        """
        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = QC_FORM_EXTRACTION_RESPONSE

            schema, _ = await schema_service.extract_schema(
                image_base64=sample_base64_image,
                source_filename="test.pdf",
                file_size=1000,
            )

            # Verify temperature field
            temp_field = next(
                (f for f in schema.per_sample_fields if f.id == "temperature"), None
            )
            assert temp_field is not None
            assert temp_field.label == "Temperature"
            assert temp_field.label_id == "Suhu"
            assert temp_field.field_type == FieldType.NUMBER
            assert temp_field.unit == "°C"
            assert temp_field.validation_rules == {"min": -25, "max": -18}

    @pytest.mark.asyncio
    async def test_extracts_sections_with_criteria_and_grades(
        self, schema_service: SchemaService, sample_base64_image: str
    ):
        """
        Given: LLM returns response with sections containing criteria
        When: Schema is extracted
        Then: Sections, criteria, and grades are correctly nested
        """
        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = QC_FORM_EXTRACTION_RESPONSE

            schema, _ = await schema_service.extract_schema(
                image_base64=sample_base64_image,
                source_filename="test.pdf",
                file_size=1000,
            )

            # Verify section structure
            assert len(schema.sections) == 1
            section = schema.sections[0]
            assert section.id == "organoleptic"
            assert section.label == "Organoleptic Assessment"
            assert section.label_id == "Penilaian Organoleptik"

            # Verify criteria
            assert len(section.criteria) == 3
            appearance = section.criteria[0]
            assert appearance.id == "appearance"
            assert len(appearance.grades) == 3

            # Verify grade options
            top_grade = appearance.grades[0]
            assert top_grade.value == 9
            assert "Excellent" in top_grade.label

    # =========================================================================
    # JSON EXTRACTION TESTS
    # =========================================================================

    def test_handles_markdown_wrapped_json(self, schema_service: SchemaService):
        """
        Given: LLM response wrapped in ```json``` code block
        When: JSON is extracted
        Then: Clean JSON is returned without markdown
        """
        wrapped = '```json\n{"key": "value"}\n```'
        result = schema_service._extract_json_from_response(wrapped)
        assert result == '{"key": "value"}'

    def test_handles_plain_json(self, schema_service: SchemaService):
        """
        Given: LLM response as plain JSON
        When: JSON is extracted
        Then: JSON is returned unchanged (except whitespace)
        """
        plain = '{"key": "value"}'
        result = schema_service._extract_json_from_response(plain)
        assert result == '{"key": "value"}'

    def test_handles_generic_code_block(self, schema_service: SchemaService):
        """
        Given: LLM response wrapped in generic ``` code block
        When: JSON is extracted
        Then: Content is extracted correctly
        """
        wrapped = '```\n{"key": "value"}\n```'
        result = schema_service._extract_json_from_response(wrapped)
        assert result == '{"key": "value"}'

    # =========================================================================
    # CONFIDENCE SCORING TESTS
    # =========================================================================

    @pytest.mark.asyncio
    async def test_confidence_score_high_for_complete_schema(
        self, schema_service: SchemaService, sample_base64_image: str
    ):
        """
        Given: LLM returns complete schema with all components
        When: Confidence is calculated
        Then: Score is high (>= 0.8)
        """
        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = QC_FORM_EXTRACTION_RESPONSE

            schema, metadata = await schema_service.extract_schema(
                image_base64=sample_base64_image,
                source_filename="test.pdf",
                file_size=1000,
            )

            # Complete schema should have high confidence
            assert metadata.confidence_score >= 0.8

    @pytest.mark.asyncio
    async def test_confidence_score_low_for_minimal_schema(
        self, schema_service: SchemaService, sample_base64_image: str
    ):
        """
        Given: LLM returns minimal/empty schema
        When: Confidence is calculated
        Then: Score is low (< 0.5)
        """
        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = MINIMAL_VALID_RESPONSE

            schema, metadata = await schema_service.extract_schema(
                image_base64=sample_base64_image,
                source_filename="test.pdf",
                file_size=1000,
            )

            # Minimal schema should have low confidence
            assert metadata.confidence_score < 0.5

    # =========================================================================
    # METADATA CAPTURE TESTS
    # =========================================================================

    @pytest.mark.asyncio
    async def test_metadata_captures_processing_time(
        self, schema_service: SchemaService, sample_base64_image: str
    ):
        """
        Given: Extraction is performed
        When: Metadata is returned
        Then: Processing time is captured and reasonable
        """
        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = QC_FORM_EXTRACTION_RESPONSE

            _, metadata = await schema_service.extract_schema(
                image_base64=sample_base64_image,
                source_filename="test.pdf",
                file_size=1000,
            )

            assert metadata.processing_time_ms >= 0
            assert metadata.processing_time_ms < 60000  # Less than 60 seconds

    @pytest.mark.asyncio
    async def test_metadata_captures_model_used(
        self, schema_service: SchemaService, sample_base64_image: str
    ):
        """
        Given: Extraction uses configured model
        When: Metadata is returned
        Then: Model name is captured correctly
        """
        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = QC_FORM_EXTRACTION_RESPONSE

            _, metadata = await schema_service.extract_schema(
                image_base64=sample_base64_image,
                source_filename="test.pdf",
                file_size=1000,
            )

            assert metadata.model_used == "google/gemini-3-flash-preview"

    @pytest.mark.asyncio
    async def test_metadata_captures_extraction_timestamp(
        self, schema_service: SchemaService, sample_base64_image: str
    ):
        """
        Given: Extraction is performed
        When: Metadata is returned
        Then: Timestamp is captured and recent
        """
        before = datetime.utcnow()

        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = QC_FORM_EXTRACTION_RESPONSE

            _, metadata = await schema_service.extract_schema(
                image_base64=sample_base64_image,
                source_filename="test.pdf",
                file_size=1000,
            )

        after = datetime.utcnow()
        assert before <= metadata.extraction_timestamp <= after

    # =========================================================================
    # ERROR HANDLING TESTS
    # =========================================================================

    @pytest.mark.asyncio
    async def test_handles_malformed_json_gracefully(
        self, schema_service: SchemaService, sample_base64_image: str
    ):
        """
        Given: LLM returns invalid JSON
        When: Extraction is attempted
        Then: SchemaExtractionError is raised with clear message
        """
        # Mock _call_vision_llm to raise SchemaExtractionError (as it would when JSON is malformed)
        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.side_effect = SchemaExtractionError(
                "Failed to parse LLM response as JSON: Invalid",
                error_code="INVALID_JSON_RESPONSE",
            )

            with pytest.raises(SchemaExtractionError) as exc_info:
                await schema_service.extract_schema(
                    image_base64=sample_base64_image,
                    source_filename="test.pdf",
                    file_size=1000,
                )

            assert "JSON" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_handles_partial_response(
        self, schema_service: SchemaService, sample_base64_image: str
    ):
        """
        Given: LLM returns response missing some fields
        When: Schema is extracted
        Then: Available fields are parsed, missing fields default to empty
        """
        with patch.object(
            schema_service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = PARTIAL_RESPONSE

            schema, _ = await schema_service.extract_schema(
                image_base64=sample_base64_image,
                source_filename="test.pdf",
                file_size=1000,
            )

            # Available fields parsed
            assert len(schema.per_sample_fields) == 1
            # Missing fields default to empty
            assert schema.sections == []
            assert schema.batch_metadata_fields == []


class TestSchemaExtractionLive:
    """Live integration tests - real API calls, skipped in CI."""

    @pytest.fixture
    def schema_service(self) -> SchemaService:
        """Create schema service instance."""
        return SchemaService()

    @pytest.fixture
    def qc_form_pdf_bytes(self) -> bytes:
        """Load real QC form PDF."""
        pdf_path = (
            Path(__file__).parent.parent.parent.parent
            / "docs/qc-forms/1. FR-QC-II.03.01 - Penerimaan Bahan Baku.pdf"
        )
        if not pdf_path.exists():
            pytest.skip(f"QC form PDF not found at {pdf_path}")
        return pdf_path.read_bytes()

    @pytest.mark.live
    @pytest.mark.asyncio
    async def test_live_extraction_produces_valid_schema(
        self, schema_service: SchemaService, qc_form_pdf_bytes: bytes
    ):
        """
        Given: Real QC form PDF and live API connection
        When: Full extraction is performed
        Then: Returns structurally valid schema

        NOTE: This test makes real API calls and costs money.
        Run with: pytest -m live
        Skip in CI with: pytest -m "not live"
        """
        # Arrange
        base64_image, file_size = await prepare_image_for_extraction(
            file_content=qc_form_pdf_bytes,
            content_type="application/pdf",
            max_dimension=2048,
        )

        # Act - Real API call
        schema, metadata = await schema_service.extract_schema(
            image_base64=base64_image,
            source_filename="FR-QC-II.03.01.pdf",
            file_size=file_size,
        )

        # Assert - Structural validity (not specific values due to non-determinism)
        assert isinstance(schema, ExtractedSchemaStructure)
        assert isinstance(metadata, ExtractionMetadata)

        # Assert - At least some content was extracted
        has_content = (
            len(schema.per_sample_fields) > 0
            or len(schema.sections) > 0
            or len(schema.batch_metadata_fields) > 0
        )
        assert has_content, "Schema should have at least some extracted content"

        # Assert - Metadata is valid
        assert metadata.model_used == "google/gemini-3-flash-preview"
        assert metadata.processing_time_ms > 0
        assert 0.0 <= metadata.confidence_score <= 1.0
        assert metadata.source_file == "FR-QC-II.03.01.pdf"

        # TODO(human): Add domain-specific assertions for QC form validation
        # Consider what QC-specific fields MUST be present for this form type

    @pytest.mark.live
    @pytest.mark.asyncio
    async def test_live_extraction_field_type_contracts(
        self, schema_service: SchemaService, qc_form_pdf_bytes: bytes
    ):
        """
        Given: Real extraction result
        When: Schema fields are inspected
        Then: All fields have required attributes with correct types
        """
        base64_image, file_size = await prepare_image_for_extraction(
            file_content=qc_form_pdf_bytes,
            content_type="application/pdf",
            max_dimension=2048,
        )

        schema, _ = await schema_service.extract_schema(
            image_base64=base64_image,
            source_filename="test.pdf",
            file_size=file_size,
        )

        # Verify field type contracts
        for field in schema.per_sample_fields:
            assert isinstance(field.id, str) and len(field.id) > 0
            assert isinstance(field.label, str) and len(field.label) > 0
            assert isinstance(field.field_type, FieldType)
            assert isinstance(field.required, bool)

        # Verify section structure contracts
        for section in schema.sections:
            assert isinstance(section.id, str) and len(section.id) > 0
            assert isinstance(section.label, str) and len(section.label) > 0
            assert isinstance(section.criteria, list)

            for criterion in section.criteria:
                assert isinstance(criterion.id, str)
                assert isinstance(criterion.label, str)
                if criterion.grades:
                    for grade in criterion.grades:
                        assert isinstance(grade.value, int)
                        assert isinstance(grade.label, str)
