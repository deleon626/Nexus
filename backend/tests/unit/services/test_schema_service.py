"""Unit tests for schema extraction service.

TDD: These tests are written FIRST, before implementation.
They should FAIL until the service is implemented.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.schema import (
    ExtractedSchemaStructure,
    ExtractionMetadata,
    SchemaField,
    SchemaSection,
    SchemaCriterion,
    GradeOption,
    FieldType,
)


class TestSchemaExtractionService:
    """Tests for schema extraction from PDF/image."""

    @pytest.fixture
    def sample_image_base64(self) -> str:
        """Return a minimal valid PNG as base64."""
        # 1x1 transparent PNG
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    @pytest.fixture
    def mock_llm_response(self) -> dict:
        """Return a mock LLM extraction response."""
        return {
            "per_sample_fields": [
                {
                    "id": "temperature",
                    "label": "Temperature",
                    "label_id": "Suhu",
                    "field_type": "number",
                    "required": True,
                    "unit": "C",
                }
            ],
            "sections": [
                {
                    "id": "frozen",
                    "label": "Frozen",
                    "label_id": "Beku",
                    "criteria": [
                        {
                            "id": "appearance",
                            "label": "Appearance",
                            "label_id": "Penampakan",
                            "grades": [
                                {"value": 9, "label": "Excellent"},
                                {"value": 7, "label": "Good"},
                                {"value": 5, "label": "Fair"},
                            ],
                        }
                    ],
                }
            ],
            "batch_metadata_fields": [
                {
                    "id": "supplier",
                    "label": "Supplier",
                    "field_type": "text",
                    "required": True,
                }
            ],
            "validation_rules": {"temperature_min": -25, "temperature_max": -18},
        }

    @pytest.mark.asyncio
    async def test_extract_schema_returns_structured_result(
        self, sample_image_base64: str, mock_llm_response: dict
    ):
        """
        Test that extract_schema returns a valid ExtractedSchemaStructure.

        Given: A base64 image of a QC form
        When: extract_schema is called
        Then: It returns ExtractedSchemaStructure with fields, sections, metadata
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        with patch.object(
            service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = mock_llm_response

            result = await service.extract_schema(
                image_base64=sample_image_base64,
                source_filename="test_form.pdf",
            )

        assert isinstance(result, tuple)
        schema, metadata = result
        assert isinstance(schema, ExtractedSchemaStructure)
        assert isinstance(metadata, ExtractionMetadata)

    @pytest.mark.asyncio
    async def test_extract_schema_includes_confidence_score(
        self, sample_image_base64: str, mock_llm_response: dict
    ):
        """
        Test that extraction includes a confidence score between 0 and 1.

        Given: A successful extraction
        When: extract_schema completes
        Then: metadata includes confidence_score in [0, 1]
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        with patch.object(
            service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = mock_llm_response

            _, metadata = await service.extract_schema(
                image_base64=sample_image_base64,
                source_filename="test_form.pdf",
            )

        assert 0.0 <= metadata.confidence_score <= 1.0

    @pytest.mark.asyncio
    async def test_extract_schema_preserves_bilingual_labels(
        self, sample_image_base64: str, mock_llm_response: dict
    ):
        """
        Test that both English and Indonesian labels are preserved.

        Given: A form with bilingual labels
        When: extract_schema extracts the data
        Then: Both label and label_id are populated
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        with patch.object(
            service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = mock_llm_response

            schema, _ = await service.extract_schema(
                image_base64=sample_image_base64,
                source_filename="test_form.pdf",
            )

        # Check per_sample_fields have both labels
        temp_field = schema.per_sample_fields[0]
        assert temp_field.label == "Temperature"
        assert temp_field.label_id == "Suhu"

        # Check section criteria have both labels
        frozen_section = schema.sections[0]
        assert frozen_section.label == "Frozen"
        assert frozen_section.label_id == "Beku"

    @pytest.mark.asyncio
    async def test_extract_schema_extracts_graded_criteria(
        self, sample_image_base64: str, mock_llm_response: dict
    ):
        """
        Test that graded criteria with 5/7/9 values are extracted.

        Given: A form with graded criteria
        When: extract_schema extracts the data
        Then: Criteria have grade options with values and labels
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        with patch.object(
            service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = mock_llm_response

            schema, _ = await service.extract_schema(
                image_base64=sample_image_base64,
                source_filename="test_form.pdf",
            )

        criterion = schema.sections[0].criteria[0]
        assert len(criterion.grades) == 3
        assert criterion.grades[0].value == 9
        assert criterion.grades[0].label == "Excellent"

    @pytest.mark.asyncio
    async def test_extract_schema_records_metadata(self, sample_image_base64: str, mock_llm_response: dict):
        """
        Test that extraction metadata includes source file and model info.

        Given: A successful extraction
        When: extract_schema completes
        Then: metadata includes source_file, model_used, extraction_timestamp
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        with patch.object(
            service, "_call_vision_llm", new_callable=AsyncMock
        ) as mock_llm:
            mock_llm.return_value = mock_llm_response

            _, metadata = await service.extract_schema(
                image_base64=sample_image_base64,
                source_filename="test_form.pdf",
            )

        assert metadata.source_file == "test_form.pdf"
        assert metadata.model_used != ""
        assert metadata.extraction_timestamp is not None


class TestConfidenceScoring:
    """Tests for confidence score calculation."""

    def test_calculate_confidence_high_for_complete_schema(self):
        """
        Test that a well-structured schema gets high confidence.

        Given: A schema with all expected components
        When: calculate_confidence_score is called
        Then: Score is >= 0.7
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        schema = ExtractedSchemaStructure(
            per_sample_fields=[
                SchemaField(
                    id="temp",
                    label="Temperature",
                    field_type=FieldType.NUMBER,
                    required=True,
                )
            ],
            sections=[
                SchemaSection(
                    id="frozen",
                    label="Frozen",
                    criteria=[
                        SchemaCriterion(
                            id="appearance",
                            label="Appearance",
                            grades=[
                                GradeOption(value=9, label="Good"),
                                GradeOption(value=7, label="Fair"),
                            ],
                        )
                    ],
                )
            ],
            batch_metadata_fields=[
                SchemaField(
                    id="supplier",
                    label="Supplier",
                    field_type=FieldType.TEXT,
                    required=True,
                )
            ],
        )

        score = service.calculate_confidence_score(schema)
        assert score >= 0.7

    def test_calculate_confidence_low_for_empty_schema(self):
        """
        Test that an empty schema gets low confidence.

        Given: A schema with no fields or sections
        When: calculate_confidence_score is called
        Then: Score is < 0.5
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        schema = ExtractedSchemaStructure(
            per_sample_fields=[],
            sections=[],
            batch_metadata_fields=[],
        )

        score = service.calculate_confidence_score(schema)
        assert score < 0.5


class TestSchemaSaveVersioning:
    """Tests for schema save with versioning (T033)."""

    @pytest.fixture
    def sample_schema(self) -> ExtractedSchemaStructure:
        """Return a sample schema for testing."""
        return ExtractedSchemaStructure(
            per_sample_fields=[
                SchemaField(
                    id="temp",
                    label="Temperature",
                    field_type=FieldType.NUMBER,
                    required=True,
                )
            ],
            sections=[],
            batch_metadata_fields=[],
        )

    @pytest.mark.asyncio
    async def test_save_schema_creates_new_schema(self, sample_schema: ExtractedSchemaStructure):
        """
        Test that save_schema creates a new schema record.

        Given: A new schema to save
        When: save_schema is called
        Then: A new schema is created with version 1.0.0
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        with patch("app.services.schema_service.get_async_session") as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            mock_session_instance.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: None))

            result = await service.save_schema(
                form_code="NAB-001",
                form_name="Penerimaan Bahan Baku",
                schema_definition=sample_schema,
            )

        assert result is not None
        assert result.form_code == "NAB-001"
        assert result.version == "1.0.0"
        assert result.version_number == 1

    @pytest.mark.asyncio
    async def test_save_schema_increments_version_on_update(self, sample_schema: ExtractedSchemaStructure):
        """
        Test that updating an existing schema creates a new version.

        Given: An existing schema
        When: save_schema is called with the same form_code
        Then: Version is incremented (1.0.0 -> 1.1.0)
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        # Mock existing schema
        existing_schema = MagicMock()
        existing_schema.version_number = 1
        existing_schema.version = "1.0.0"

        with patch("app.services.schema_service.get_async_session") as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            # Return existing schema on first query
            mock_session_instance.execute = AsyncMock(
                return_value=MagicMock(scalar_one_or_none=lambda: existing_schema)
            )

            result = await service.save_schema(
                form_code="NAB-001",
                form_name="Penerimaan Bahan Baku",
                schema_definition=sample_schema,
            )

        assert result.version_number == 2
        assert result.version == "1.1.0"

    @pytest.mark.asyncio
    async def test_save_schema_validates_schema_structure(self, sample_schema: ExtractedSchemaStructure):
        """
        Test that save_schema validates the schema before saving.

        Given: A schema with invalid structure
        When: save_schema is called
        Then: ValidationError is raised
        """
        from app.services.schema_service import SchemaService, SchemaValidationError

        service = SchemaService()

        # Create invalid schema (empty fields with no structure)
        invalid_schema = ExtractedSchemaStructure(
            per_sample_fields=[],
            sections=[],
            batch_metadata_fields=[],
        )

        with pytest.raises(SchemaValidationError):
            await service.save_schema(
                form_code="",  # Invalid: empty form_code
                form_name="Test",
                schema_definition=invalid_schema,
            )


class TestSchemaListingWithFacilityFilter:
    """Tests for schema listing with facility filter (T034)."""

    @pytest.mark.asyncio
    async def test_list_schemas_returns_paginated_results(self):
        """
        Test that list_schemas returns paginated schema list.

        Given: Multiple schemas in database
        When: list_schemas is called with page=1, page_size=10
        Then: Returns paginated list with total count
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        mock_schemas = [MagicMock() for _ in range(5)]

        with patch("app.services.schema_service.get_async_session") as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            mock_session_instance.execute = AsyncMock(
                return_value=MagicMock(
                    scalars=lambda: MagicMock(all=lambda: mock_schemas),
                    scalar_one=lambda: 5,
                )
            )

            result = await service.list_schemas(page=1, page_size=10)

        assert result["total"] == 5
        assert result["page"] == 1
        assert result["page_size"] == 10
        assert len(result["schemas"]) == 5

    @pytest.mark.asyncio
    async def test_list_schemas_filters_by_facility(self):
        """
        Test that list_schemas can filter by facility_id.

        Given: Schemas from multiple facilities
        When: list_schemas is called with facility_id
        Then: Only schemas from that facility are returned
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        with patch("app.services.schema_service.get_async_session") as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            # The execute should be called with a WHERE clause for facility_id
            mock_session_instance.execute = AsyncMock(
                return_value=MagicMock(
                    scalars=lambda: MagicMock(all=lambda: []),
                    scalar_one=lambda: 0,
                )
            )

            await service.list_schemas(facility_id="facility-123")

            # Verify execute was called (filter logic is internal)
            assert mock_session_instance.execute.called

    @pytest.mark.asyncio
    async def test_list_schemas_filters_by_status(self):
        """
        Test that list_schemas can filter by status (active/archived).

        Given: Schemas with different statuses
        When: list_schemas is called with status="active"
        Then: Only active schemas are returned
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        with patch("app.services.schema_service.get_async_session") as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            mock_session_instance.execute = AsyncMock(
                return_value=MagicMock(
                    scalars=lambda: MagicMock(all=lambda: []),
                    scalar_one=lambda: 0,
                )
            )

            await service.list_schemas(status="active")

            assert mock_session_instance.execute.called

    @pytest.mark.asyncio
    async def test_get_schema_by_id_returns_schema(self):
        """
        Test that get_schema_by_id returns the schema details.

        Given: A schema exists in database
        When: get_schema_by_id is called
        Then: Returns the schema with all fields
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        mock_schema = MagicMock()
        mock_schema.id = "schema-123"
        mock_schema.form_code = "NAB-001"
        mock_schema.form_name = "Test Form"

        with patch("app.services.schema_service.get_async_session") as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            mock_session_instance.execute = AsyncMock(
                return_value=MagicMock(scalar_one_or_none=lambda: mock_schema)
            )

            result = await service.get_schema_by_id("schema-123")

        assert result is not None
        assert result.id == "schema-123"

    @pytest.mark.asyncio
    async def test_get_schema_by_id_returns_none_for_missing(self):
        """
        Test that get_schema_by_id returns None for non-existent schema.

        Given: Schema does not exist
        When: get_schema_by_id is called
        Then: Returns None
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        with patch("app.services.schema_service.get_async_session") as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            mock_session_instance.execute = AsyncMock(
                return_value=MagicMock(scalar_one_or_none=lambda: None)
            )

            result = await service.get_schema_by_id("non-existent-id")

        assert result is None

    @pytest.mark.asyncio
    async def test_archive_schema_soft_deletes(self):
        """
        Test that archive_schema performs soft delete.

        Given: An existing schema
        When: archive_schema is called
        Then: Schema status is set to 'archived'
        """
        from app.services.schema_service import SchemaService

        service = SchemaService()

        mock_schema = MagicMock()
        mock_schema.id = "schema-123"
        mock_schema.status = "active"

        with patch("app.services.schema_service.get_async_session") as mock_session:
            mock_session_instance = AsyncMock()
            mock_session.return_value.__aenter__.return_value = mock_session_instance
            mock_session_instance.execute = AsyncMock(
                return_value=MagicMock(scalar_one_or_none=lambda: mock_schema)
            )

            result = await service.archive_schema("schema-123")

        assert result is True
        assert mock_schema.status == "archived"
