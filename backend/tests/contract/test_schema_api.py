"""Contract tests for Schema API endpoints.

TDD: These tests are written FIRST, before implementation.
They should FAIL until the API endpoints are implemented.
"""

import io
from datetime import datetime
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.models.schema import (
    ExtractedSchemaStructure,
    ExtractionMetadata,
    SchemaField,
    FieldType,
)


class TestSchemaExtractionEndpoint:
    """Contract tests for POST /api/schemas/extract."""

    @pytest.fixture
    def sample_pdf_bytes(self) -> bytes:
        """Return minimal PDF-like bytes for testing."""
        # This is not a real PDF, but enough for testing file handling
        return b"%PDF-1.4 test content"

    @pytest.fixture
    def sample_png_bytes(self) -> bytes:
        """Return minimal PNG bytes for testing."""
        # 1x1 transparent PNG
        import base64
        png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        return base64.b64decode(png_b64)

    @pytest.mark.asyncio
    async def test_extract_endpoint_exists(self):
        """
        Test that POST /api/schemas/extract endpoint exists.

        Given: The FastAPI application
        When: We send a POST request to /api/schemas/extract
        Then: We get a response (not 404)
        """
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/schemas/extract",
                files={"file": ("test.pdf", b"test", "application/pdf")},
                data={"schema_name": "Test"},
            )

        # Should not be 404 (endpoint should exist)
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_extract_requires_file(self):
        """
        Test that extraction requires a file upload.

        Given: A request without a file
        When: We POST to /api/schemas/extract
        Then: We get a 422 validation error
        """
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/schemas/extract",
                data={"schema_name": "Test"},
            )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_extract_requires_schema_name(self, sample_png_bytes: bytes):
        """
        Test that extraction requires a schema_name.

        Given: A request with file but no schema_name
        When: We POST to /api/schemas/extract
        Then: We get a 422 validation error
        """
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/schemas/extract",
                files={"file": ("test.png", sample_png_bytes, "image/png")},
            )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_extract_rejects_invalid_file_type(self):
        """
        Test that extraction rejects non-PDF/image files.

        Given: A text file upload
        When: We POST to /api/schemas/extract
        Then: We get a 400 error with file type message
        """
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/schemas/extract",
                files={"file": ("test.txt", b"text content", "text/plain")},
                data={"schema_name": "Test"},
            )

        assert response.status_code == 400
        assert "file" in response.json().get("detail", "").lower() or "type" in response.json().get("detail", "").lower()

    @pytest.mark.asyncio
    async def test_extract_returns_schema_structure(self, sample_png_bytes: bytes):
        """
        Test that successful extraction returns schema structure.

        Given: A valid image file
        When: We POST to /api/schemas/extract
        Then: Response includes extracted_schema, confidence_score, extraction_metadata
        """
        # Create proper Pydantic model instances
        mock_schema = ExtractedSchemaStructure(
            per_sample_fields=[],
            sections=[],
            batch_metadata_fields=[],
        )
        mock_metadata = ExtractionMetadata(
            source_file="test.png",
            source_file_size=100,
            model_used="test-model",
            confidence_score=0.8,
            extraction_timestamp=datetime(2025, 1, 1, 0, 0, 0),
            processing_time_ms=500,
        )

        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.extract_schema = AsyncMock(
                return_value=(mock_schema, mock_metadata)
            )

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/schemas/extract",
                    files={"file": ("test.png", sample_png_bytes, "image/png")},
                    data={"schema_name": "Test Schema"},
                )

        assert response.status_code == 200
        data = response.json()
        assert "extracted_schema" in data
        assert "confidence_score" in data
        assert "extraction_metadata" in data

    @pytest.mark.asyncio
    async def test_extract_response_matches_contract(self, sample_png_bytes: bytes):
        """
        Test that response matches SchemaExtractionResponse schema.

        Given: A valid extraction request
        When: We POST to /api/schemas/extract
        Then: Response has all required fields with correct types
        """
        # Create proper Pydantic model instances with actual field
        mock_schema = ExtractedSchemaStructure(
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
        mock_metadata = ExtractionMetadata(
            source_file="test.png",
            source_file_size=100,
            model_used="claude-3.5-sonnet",
            confidence_score=0.75,
            extraction_timestamp=datetime(2025, 1, 1, 0, 0, 0),
            processing_time_ms=1200,
        )

        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.extract_schema = AsyncMock(
                return_value=(mock_schema, mock_metadata)
            )

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/schemas/extract",
                    files={"file": ("test.png", sample_png_bytes, "image/png")},
                    data={"schema_name": "Test Schema"},
                )

        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert isinstance(data["extracted_schema"], dict)
        assert isinstance(data["confidence_score"], (int, float))
        assert 0 <= data["confidence_score"] <= 1
        assert isinstance(data["extraction_metadata"], dict)
        assert isinstance(data.get("warnings", []), list)


class TestSchemaCRUDEndpoints:
    """Contract tests for GET/POST/DELETE /api/schemas (T035)."""

    @pytest.fixture
    def sample_schema_data(self) -> dict:
        """Return sample schema data for creating a schema."""
        return {
            "form_code": "NAB-001",
            "form_name": "Penerimaan Bahan Baku",
            "category": "raw_material",
            "schema_definition": {
                "per_sample_fields": [
                    {
                        "id": "temperature",
                        "label": "Temperature",
                        "field_type": "number",
                        "required": True,
                        "unit": "C",
                    }
                ],
                "sections": [],
                "batch_metadata_fields": [],
            },
        }

    @pytest.mark.asyncio
    async def test_list_schemas_endpoint_exists(self):
        """
        Test that GET /api/schemas endpoint exists.

        Given: The FastAPI application
        When: We send a GET request to /api/schemas
        Then: We get a response (not 404)
        """
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/schemas")

        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_list_schemas_returns_paginated_list(self):
        """
        Test that GET /api/schemas returns paginated list.

        Given: Schemas exist in database
        When: We GET /api/schemas
        Then: Response includes schemas array, total, page, page_size
        """
        mock_result = {
            "schemas": [],
            "total": 0,
            "page": 1,
            "page_size": 20,
        }

        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.list_schemas = AsyncMock(return_value=mock_result)

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/schemas")

        assert response.status_code == 200
        data = response.json()
        assert "schemas" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    @pytest.mark.asyncio
    async def test_list_schemas_accepts_pagination_params(self):
        """
        Test that GET /api/schemas accepts page and page_size params.

        Given: Pagination parameters
        When: We GET /api/schemas?page=2&page_size=10
        Then: Service receives correct pagination values
        """
        mock_result = {
            "schemas": [],
            "total": 25,
            "page": 2,
            "page_size": 10,
        }

        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.list_schemas = AsyncMock(return_value=mock_result)

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/schemas?page=2&page_size=10")

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 2
        assert data["page_size"] == 10

    @pytest.mark.asyncio
    async def test_create_schema_endpoint_exists(self, sample_schema_data: dict):
        """
        Test that POST /api/schemas endpoint exists.

        Given: The FastAPI application
        When: We POST to /api/schemas
        Then: We get a response (not 404)
        """
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/schemas", json=sample_schema_data)

        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_create_schema_returns_saved_schema(self, sample_schema_data: dict):
        """
        Test that POST /api/schemas returns the saved schema.

        Given: Valid schema data
        When: We POST to /api/schemas
        Then: Response includes id, version, and saved schema data
        """
        mock_saved = MagicMock()
        mock_saved.id = "schema-123"
        mock_saved.form_code = "NAB-001"
        mock_saved.form_name = "Penerimaan Bahan Baku"
        mock_saved.category = "raw_material"
        mock_saved.version = "1.0.0"
        mock_saved.version_number = 1
        mock_saved.status = "active"
        mock_saved.schema_definition = sample_schema_data["schema_definition"]
        mock_saved.created_at = datetime(2025, 1, 1)
        mock_saved.updated_at = datetime(2025, 1, 1)

        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.save_schema = AsyncMock(return_value=mock_saved)

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/schemas", json=sample_schema_data)

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "version" in data
        assert data["form_code"] == "NAB-001"

    @pytest.mark.asyncio
    async def test_create_schema_validates_required_fields(self):
        """
        Test that POST /api/schemas validates required fields.

        Given: Missing required fields
        When: We POST to /api/schemas
        Then: We get 422 validation error
        """
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/schemas", json={})

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_schema_endpoint_exists(self):
        """
        Test that GET /api/schemas/{id} endpoint exists.

        Given: The FastAPI application
        When: We GET /api/schemas/{id}
        Then: We get a response (not 404 for endpoint, but may be 404 for resource)
        """
        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.get_schema_by_id = AsyncMock(return_value=None)

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/schemas/test-id")

        # 404 is ok if schema not found, but not for missing endpoint
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_get_schema_returns_schema_details(self):
        """
        Test that GET /api/schemas/{id} returns schema details.

        Given: Schema exists
        When: We GET /api/schemas/{id}
        Then: Response includes full schema data
        """
        mock_schema = MagicMock()
        mock_schema.id = "schema-123"
        mock_schema.form_code = "NAB-001"
        mock_schema.form_name = "Test Form"
        mock_schema.category = "test"
        mock_schema.version = "1.0.0"
        mock_schema.version_number = 1
        mock_schema.status = "active"
        mock_schema.schema_definition = {"per_sample_fields": [], "sections": [], "batch_metadata_fields": []}
        mock_schema.created_at = datetime(2025, 1, 1)
        mock_schema.updated_at = datetime(2025, 1, 1)

        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.get_schema_by_id = AsyncMock(return_value=mock_schema)

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/schemas/schema-123")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "schema-123"
        assert data["form_code"] == "NAB-001"

    @pytest.mark.asyncio
    async def test_get_schema_returns_404_for_missing(self):
        """
        Test that GET /api/schemas/{id} returns 404 for non-existent schema.

        Given: Schema does not exist
        When: We GET /api/schemas/{id}
        Then: Response is 404
        """
        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.get_schema_by_id = AsyncMock(return_value=None)

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/schemas/non-existent-id")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_schema_endpoint_exists(self):
        """
        Test that DELETE /api/schemas/{id} endpoint exists.

        Given: The FastAPI application
        When: We DELETE /api/schemas/{id}
        Then: We get a response (not 404 for endpoint)
        """
        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.archive_schema = AsyncMock(return_value=True)

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.delete("/api/schemas/test-id")

        assert response.status_code in [200, 204, 404]

    @pytest.mark.asyncio
    async def test_delete_schema_archives_schema(self):
        """
        Test that DELETE /api/schemas/{id} archives (soft deletes) schema.

        Given: Schema exists
        When: We DELETE /api/schemas/{id}
        Then: Response indicates success
        """
        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.archive_schema = AsyncMock(return_value=True)

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.delete("/api/schemas/schema-123")

        assert response.status_code in [200, 204]

    @pytest.mark.asyncio
    async def test_delete_schema_returns_404_for_missing(self):
        """
        Test that DELETE /api/schemas/{id} returns 404 for non-existent schema.

        Given: Schema does not exist
        When: We DELETE /api/schemas/{id}
        Then: Response is 404
        """
        with patch("app.api.schemas.SchemaService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.archive_schema = AsyncMock(return_value=False)

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.delete("/api/schemas/non-existent-id")

        assert response.status_code == 404
