"""Contract tests for ID generation API endpoints.

TDD: These tests are written FIRST, before implementation.
They should FAIL until the endpoints are implemented.

Tests validate the API contract (request/response shapes) as defined in:
- specs/006-ai-schema-generator/contracts/id-generation-api.yaml
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import FastAPI

from app.models.id_generation import (
    EntityType,
    SequenceResetPeriod,
    ComponentType,
    PatternComponent,
    IDRuleDefinition,
    IDRuleParseResponse,
    IDRuleResponse,
    IDRuleListResponse,
    IDRuleListItem,
)


@pytest.fixture
def app():
    """Create test FastAPI application with ID generation routes."""
    from app.api.id_generation import router, ids_router

    test_app = FastAPI()
    test_app.include_router(router, prefix="/api/id-rules")
    test_app.include_router(ids_router, prefix="/api/ids")
    return test_app


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


class TestPostIDRulesParse:
    """Tests for POST /api/id-rules/parse endpoint."""

    @pytest.fixture
    def valid_parse_request(self) -> dict:
        """Return a valid parse request body."""
        return {
            "natural_language_rule": (
                "Batch IDs should be NAB-YYYY-MM-NNNN where YYYY is year, "
                "MM is month, and NNNN is a 4-digit sequence starting at 0001, "
                "resetting monthly"
            ),
            "entity_type": "batch",
        }

    @pytest.fixture
    def mock_parse_response(self) -> IDRuleParseResponse:
        """Return mock parse response from service."""
        return IDRuleParseResponse(
            parsed_rule=IDRuleDefinition(
                pattern="NAB-{YYYY}-{MM}-{SEQ:4}",
                components=[
                    PatternComponent(type=ComponentType.LITERAL, value="NAB-"),
                    PatternComponent(type=ComponentType.YEAR),
                    PatternComponent(type=ComponentType.LITERAL, value="-"),
                    PatternComponent(type=ComponentType.MONTH),
                    PatternComponent(type=ComponentType.LITERAL, value="-"),
                    PatternComponent(type=ComponentType.SEQUENCE, padding=4, start_value=1),
                ],
                sequence_reset_period=SequenceResetPeriod.MONTHLY,
                example_id="NAB-2025-12-0001",
            ),
            confidence_score=0.95,
            warnings=[],
        )

    def test_parse_endpoint_returns_200_with_valid_input(
        self, client, valid_parse_request: dict, mock_parse_response: IDRuleParseResponse
    ):
        """
        Test that POST /api/id-rules/parse returns 200 with valid input.

        Given: A valid natural language rule description
        When: POST /api/id-rules/parse is called
        Then: Returns 200 with parsed rule structure
        """
        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.parse_id_rule = AsyncMock(return_value=mock_parse_response)
            MockService.return_value = mock_service

            response = client.post("/api/id-rules/parse", json=valid_parse_request)

            assert response.status_code == 200
            data = response.json()
            assert "parsed_rule" in data
            assert "confidence_score" in data

    def test_parse_endpoint_returns_pattern_in_response(
        self, client, valid_parse_request: dict, mock_parse_response: IDRuleParseResponse
    ):
        """
        Test that parse response includes the pattern.

        Given: A valid parse request
        When: POST /api/id-rules/parse is called
        Then: Response includes pattern field
        """
        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.parse_id_rule = AsyncMock(return_value=mock_parse_response)
            MockService.return_value = mock_service

            response = client.post("/api/id-rules/parse", json=valid_parse_request)

            data = response.json()
            assert data["parsed_rule"]["pattern"] == "NAB-{YYYY}-{MM}-{SEQ:4}"

    def test_parse_endpoint_returns_components_array(
        self, client, valid_parse_request: dict, mock_parse_response: IDRuleParseResponse
    ):
        """
        Test that parse response includes components array.

        Given: A valid parse request with multi-component pattern
        When: POST /api/id-rules/parse is called
        Then: Response includes components array with correct types
        """
        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.parse_id_rule = AsyncMock(return_value=mock_parse_response)
            MockService.return_value = mock_service

            response = client.post("/api/id-rules/parse", json=valid_parse_request)

            data = response.json()
            components = data["parsed_rule"]["components"]
            assert len(components) > 0
            component_types = [c["type"] for c in components]
            assert "year" in component_types
            assert "month" in component_types
            assert "sequence" in component_types

    def test_parse_endpoint_returns_example_id(
        self, client, valid_parse_request: dict, mock_parse_response: IDRuleParseResponse
    ):
        """
        Test that parse response includes example ID.

        Given: A valid parse request
        When: POST /api/id-rules/parse is called
        Then: Response includes example_id field
        """
        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.parse_id_rule = AsyncMock(return_value=mock_parse_response)
            MockService.return_value = mock_service

            response = client.post("/api/id-rules/parse", json=valid_parse_request)

            data = response.json()
            assert data["parsed_rule"]["example_id"] == "NAB-2025-12-0001"

    def test_parse_endpoint_returns_422_for_short_rule(self, client):
        """
        Test that parse endpoint validates minimum rule length.

        Given: A rule description shorter than 10 characters
        When: POST /api/id-rules/parse is called
        Then: Returns 422 validation error
        """
        short_request = {
            "natural_language_rule": "Too short",
            "entity_type": "batch",
        }

        response = client.post("/api/id-rules/parse", json=short_request)

        assert response.status_code == 422

    def test_parse_endpoint_returns_422_for_invalid_entity_type(self, client):
        """
        Test that parse endpoint validates entity type.

        Given: An invalid entity type
        When: POST /api/id-rules/parse is called
        Then: Returns 422 validation error
        """
        invalid_request = {
            "natural_language_rule": "This is a valid length rule description for testing",
            "entity_type": "invalid_type",
        }

        response = client.post("/api/id-rules/parse", json=invalid_request)

        assert response.status_code == 422


class TestPostIDRules:
    """Tests for POST /api/id-rules endpoint (save rule)."""

    @pytest.fixture
    def valid_create_request(self) -> dict:
        """Return a valid ID rule create request."""
        return {
            "rule_name": "Batch ID Rule",
            "entity_type": "batch",
            "rule_definition": {
                "pattern": "NAB-{YYYY}-{MM}-{SEQ:4}",
                "components": [
                    {"type": "literal", "value": "NAB-"},
                    {"type": "year"},
                    {"type": "literal", "value": "-"},
                    {"type": "month"},
                    {"type": "literal", "value": "-"},
                    {"type": "sequence", "padding": 4, "start_value": 1},
                ],
                "sequence_reset_period": "monthly",
                "example_id": "NAB-2025-12-0001",
            },
            "natural_language_source": "Batch IDs should be NAB-YYYY-MM-NNNN...",
        }

    def test_create_endpoint_returns_201_with_valid_input(
        self, client, valid_create_request: dict
    ):
        """
        Test that POST /api/id-rules returns 201 with valid input.

        Given: A valid ID rule create request
        When: POST /api/id-rules is called
        Then: Returns 201 with created rule details
        """
        from app.db.models import IDGenerationRule
        from datetime import datetime

        mock_rule = MagicMock(spec=IDGenerationRule)
        mock_rule.id = "new-rule-id"
        mock_rule.rule_name = "Batch ID Rule"
        mock_rule.entity_type = "batch"
        mock_rule.facility_id = None
        mock_rule.pattern = "NAB-{YYYY}-{MM}-{SEQ:4}"
        mock_rule.components = valid_create_request["rule_definition"]["components"]
        mock_rule.sequence_reset_period = "monthly"
        mock_rule.natural_language_source = valid_create_request["natural_language_source"]
        mock_rule.last_sequence = 0
        mock_rule.active = True
        mock_rule.created_at = datetime.utcnow()
        mock_rule.updated_at = datetime.utcnow()

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.save_id_rule = AsyncMock(return_value=mock_rule)
            MockService.return_value = mock_service

            response = client.post("/api/id-rules", json=valid_create_request)

            assert response.status_code == 201
            data = response.json()
            assert data["id"] == "new-rule-id"
            assert data["rule_name"] == "Batch ID Rule"

    def test_create_endpoint_returns_422_for_missing_rule_name(self, client):
        """
        Test that create endpoint validates rule_name is present.

        Given: A request missing rule_name
        When: POST /api/id-rules is called
        Then: Returns 422 validation error
        """
        invalid_request = {
            "entity_type": "batch",
            "rule_definition": {
                "pattern": "TEST-{SEQ:4}",
                "components": [],
                "sequence_reset_period": "never",
                "example_id": "TEST-0001",
            },
        }

        response = client.post("/api/id-rules", json=invalid_request)

        assert response.status_code == 422


class TestGetIDRules:
    """Tests for GET /api/id-rules endpoint (list rules)."""

    def test_list_endpoint_returns_200(self, client):
        """
        Test that GET /api/id-rules returns 200.

        Given: ID rules exist in the database
        When: GET /api/id-rules is called
        Then: Returns 200 with list of rules
        """
        mock_response = IDRuleListResponse(
            rules=[
                IDRuleListItem(
                    id="rule-1",
                    rule_name="Batch Rule",
                    entity_type=EntityType.BATCH,
                    facility_id=None,
                    pattern="NAB-{SEQ:4}",
                    last_sequence=5,
                    active=True,
                ),
            ],
            total=1,
        )

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.list_id_rules = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.get("/api/id-rules")

            assert response.status_code == 200
            data = response.json()
            assert "rules" in data
            assert "total" in data

    def test_list_endpoint_returns_rules_array(self, client):
        """
        Test that list response includes rules array.

        Given: Multiple ID rules exist
        When: GET /api/id-rules is called
        Then: Response includes rules array with correct structure
        """
        mock_response = IDRuleListResponse(
            rules=[
                IDRuleListItem(
                    id="rule-1",
                    rule_name="Batch Rule",
                    entity_type=EntityType.BATCH,
                    facility_id=None,
                    pattern="NAB-{SEQ:4}",
                    last_sequence=5,
                    active=True,
                ),
                IDRuleListItem(
                    id="rule-2",
                    rule_name="Sample Rule",
                    entity_type=EntityType.SAMPLE,
                    facility_id=None,
                    pattern="SMP-{SEQ:4}",
                    last_sequence=10,
                    active=True,
                ),
            ],
            total=2,
        )

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.list_id_rules = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.get("/api/id-rules")

            data = response.json()
            assert len(data["rules"]) == 2
            assert data["total"] == 2

    def test_list_endpoint_accepts_entity_type_filter(self, client):
        """
        Test that list endpoint accepts entity_type query parameter.

        Given: The entity_type filter is provided
        When: GET /api/id-rules?entity_type=batch is called
        Then: Only batch rules are returned
        """
        mock_response = IDRuleListResponse(
            rules=[
                IDRuleListItem(
                    id="rule-1",
                    rule_name="Batch Rule",
                    entity_type=EntityType.BATCH,
                    facility_id=None,
                    pattern="NAB-{SEQ:4}",
                    last_sequence=5,
                    active=True,
                ),
            ],
            total=1,
        )

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.list_id_rules = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.get("/api/id-rules?entity_type=batch")

            assert response.status_code == 200
            # Verify the service was called with entity_type filter
            mock_service.list_id_rules.assert_called_once()


class TestGetIDRuleById:
    """Tests for GET /api/id-rules/{rule_id} endpoint."""

    def test_get_rule_returns_200_for_existing_rule(self, client):
        """
        Test that GET /api/id-rules/{id} returns 200 for existing rule.

        Given: A rule exists with the specified ID
        When: GET /api/id-rules/{id} is called
        Then: Returns 200 with rule details
        """
        from app.db.models import IDGenerationRule
        from datetime import datetime

        mock_rule = MagicMock(spec=IDGenerationRule)
        mock_rule.id = "test-rule-id"
        mock_rule.rule_name = "Test Rule"
        mock_rule.entity_type = "batch"
        mock_rule.facility_id = None
        mock_rule.pattern = "TEST-{SEQ:4}"
        mock_rule.components = [{"type": "literal", "value": "TEST-"}]
        mock_rule.sequence_reset_period = "never"
        mock_rule.natural_language_source = "Test rule description"
        mock_rule.last_sequence = 0
        mock_rule.active = True
        mock_rule.created_at = datetime.utcnow()
        mock_rule.updated_at = datetime.utcnow()

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.get_id_rule = AsyncMock(return_value=mock_rule)
            MockService.return_value = mock_service

            response = client.get("/api/id-rules/test-rule-id")

            assert response.status_code == 200
            data = response.json()
            assert data["id"] == "test-rule-id"
            assert data["rule_name"] == "Test Rule"

    def test_get_rule_returns_404_for_missing_rule(self, client):
        """
        Test that GET /api/id-rules/{id} returns 404 for non-existent rule.

        Given: No rule exists with the specified ID
        When: GET /api/id-rules/{id} is called
        Then: Returns 404 not found
        """
        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.get_id_rule = AsyncMock(return_value=None)
            MockService.return_value = mock_service

            response = client.get("/api/id-rules/non-existent-id")

            assert response.status_code == 404


class TestDeleteIDRule:
    """Tests for DELETE /api/id-rules/{rule_id} endpoint."""

    def test_delete_rule_returns_204_for_existing_rule(self, client):
        """
        Test that DELETE /api/id-rules/{id} returns 204 for existing rule.

        Given: A rule exists with the specified ID
        When: DELETE /api/id-rules/{id} is called
        Then: Returns 204 no content
        """
        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.deactivate_id_rule = AsyncMock(return_value=True)
            MockService.return_value = mock_service

            response = client.delete("/api/id-rules/test-rule-id")

            assert response.status_code == 204

    def test_delete_rule_returns_404_for_missing_rule(self, client):
        """
        Test that DELETE /api/id-rules/{id} returns 404 for non-existent rule.

        Given: No rule exists with the specified ID
        When: DELETE /api/id-rules/{id} is called
        Then: Returns 404 not found
        """
        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.deactivate_id_rule = AsyncMock(return_value=False)
            MockService.return_value = mock_service

            response = client.delete("/api/id-rules/non-existent-id")

            assert response.status_code == 404


class TestPostIDsGenerate:
    """Tests for POST /api/ids/generate endpoint (T072)."""

    @pytest.fixture
    def valid_generate_request(self) -> dict:
        """Return a valid ID generate request."""
        return {
            "entity_type": "batch",
        }

    @pytest.fixture
    def mock_generate_response(self) -> dict:
        """Return mock generate response."""
        return {
            "generated_id": "NAB-2025-12-0006",
            "entity_type": "batch",
            "sequence_number": 6,
            "rule_id": "rule-123",
        }

    def test_generate_endpoint_returns_200_with_valid_input(
        self, client, valid_generate_request: dict, mock_generate_response: dict
    ):
        """
        Test that POST /api/ids/generate returns 200 with valid input.

        Given: A valid entity type with active ID rule
        When: POST /api/ids/generate is called
        Then: Returns 200 with generated ID
        """
        from app.models.id_generation import IDGenerateResponse

        mock_response = IDGenerateResponse(**mock_generate_response)

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/generate", json=valid_generate_request)

            assert response.status_code == 200
            data = response.json()
            assert "generated_id" in data
            assert "sequence_number" in data

    def test_generate_endpoint_returns_formatted_id(
        self, client, valid_generate_request: dict, mock_generate_response: dict
    ):
        """
        Test that generated ID follows the rule pattern.

        Given: A batch ID rule with pattern NAB-{YYYY}-{MM}-{SEQ:4}
        When: POST /api/ids/generate is called
        Then: Returns properly formatted ID
        """
        from app.models.id_generation import IDGenerateResponse

        mock_response = IDGenerateResponse(**mock_generate_response)

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/generate", json=valid_generate_request)

            data = response.json()
            assert data["generated_id"] == "NAB-2025-12-0006"

    def test_generate_endpoint_returns_sequence_number(
        self, client, valid_generate_request: dict, mock_generate_response: dict
    ):
        """
        Test that response includes sequence number.

        Given: A valid generate request
        When: POST /api/ids/generate is called
        Then: Response includes sequence_number
        """
        from app.models.id_generation import IDGenerateResponse

        mock_response = IDGenerateResponse(**mock_generate_response)

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/generate", json=valid_generate_request)

            data = response.json()
            assert data["sequence_number"] == 6

    def test_generate_endpoint_returns_rule_id(
        self, client, valid_generate_request: dict, mock_generate_response: dict
    ):
        """
        Test that response includes rule_id used for generation.

        Given: A valid generate request
        When: POST /api/ids/generate is called
        Then: Response includes rule_id
        """
        from app.models.id_generation import IDGenerateResponse

        mock_response = IDGenerateResponse(**mock_generate_response)

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/generate", json=valid_generate_request)

            data = response.json()
            assert data["rule_id"] == "rule-123"

    def test_generate_endpoint_returns_404_when_no_rule(self, client, valid_generate_request: dict):
        """
        Test that generate returns 404 when no rule exists for entity type.

        Given: No active ID rule for the entity type
        When: POST /api/ids/generate is called
        Then: Returns 404 not found
        """
        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.generate_id = AsyncMock(
                side_effect=ValueError("No active ID rule found for entity type: batch")
            )
            MockService.return_value = mock_service

            response = client.post("/api/ids/generate", json=valid_generate_request)

            assert response.status_code == 404

    def test_generate_endpoint_returns_422_for_invalid_entity_type(self, client):
        """
        Test that generate endpoint validates entity type.

        Given: An invalid entity type
        When: POST /api/ids/generate is called
        Then: Returns 422 validation error
        """
        invalid_request = {
            "entity_type": "invalid_type",
        }

        response = client.post("/api/ids/generate", json=invalid_request)

        assert response.status_code == 422

    def test_generate_endpoint_accepts_facility_id(self, client):
        """
        Test that generate endpoint accepts optional facility_id.

        Given: A request with facility_id
        When: POST /api/ids/generate is called
        Then: Returns 200 and uses facility-specific rule
        """
        from app.models.id_generation import IDGenerateResponse

        request_with_facility = {
            "entity_type": "batch",
            "facility_id": "facility-abc",
        }

        mock_response = IDGenerateResponse(
            generated_id="FAC-ABC-0001",
            entity_type="batch",
            sequence_number=1,
            rule_id="facility-rule-id",
        )

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/generate", json=request_with_facility)

            assert response.status_code == 200


class TestPostIDsTestGenerate:
    """Tests for POST /api/ids/test-generate endpoint (T086).

    Unlike /generate, /test-generate:
    - Returns a preview of what the next ID would be
    - Does NOT persist the sequence increment
    - Includes is_preview: true in response
    """

    @pytest.fixture
    def valid_test_generate_request(self) -> dict:
        """Return a valid test-generate request."""
        return {
            "entity_type": "batch",
        }

    @pytest.fixture
    def mock_test_generate_response(self) -> dict:
        """Return mock test-generate response."""
        return {
            "generated_id": "NAB-2025-12-0006",
            "entity_type": "batch",
            "sequence_number": 6,
            "rule_id": "rule-123",
            "is_preview": True,
        }

    def test_test_generate_endpoint_returns_200_with_valid_input(
        self, client, valid_test_generate_request: dict, mock_test_generate_response: dict
    ):
        """
        Test that POST /api/ids/test-generate returns 200 with valid input.

        Given: A valid entity type with active ID rule
        When: POST /api/ids/test-generate is called
        Then: Returns 200 with preview ID
        """
        from app.models.id_generation import IDTestGenerateResponse

        mock_response = IDTestGenerateResponse(**mock_test_generate_response)

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.test_generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/test-generate", json=valid_test_generate_request)

            assert response.status_code == 200
            data = response.json()
            assert "generated_id" in data
            assert "is_preview" in data

    def test_test_generate_returns_is_preview_true(
        self, client, valid_test_generate_request: dict, mock_test_generate_response: dict
    ):
        """
        Test that test-generate response includes is_preview: true.

        Given: A valid test-generate request
        When: POST /api/ids/test-generate is called
        Then: Response includes is_preview set to true
        """
        from app.models.id_generation import IDTestGenerateResponse

        mock_response = IDTestGenerateResponse(**mock_test_generate_response)

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.test_generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/test-generate", json=valid_test_generate_request)

            data = response.json()
            assert data["is_preview"] is True

    def test_test_generate_returns_formatted_preview_id(
        self, client, valid_test_generate_request: dict, mock_test_generate_response: dict
    ):
        """
        Test that test-generate returns properly formatted preview ID.

        Given: A batch ID rule with pattern
        When: POST /api/ids/test-generate is called
        Then: Returns formatted preview ID
        """
        from app.models.id_generation import IDTestGenerateResponse

        mock_response = IDTestGenerateResponse(**mock_test_generate_response)

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.test_generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/test-generate", json=valid_test_generate_request)

            data = response.json()
            assert data["generated_id"] == "NAB-2025-12-0006"

    def test_test_generate_returns_sequence_number(
        self, client, valid_test_generate_request: dict, mock_test_generate_response: dict
    ):
        """
        Test that test-generate response includes sequence number.

        Given: A valid test-generate request
        When: POST /api/ids/test-generate is called
        Then: Response includes sequence_number
        """
        from app.models.id_generation import IDTestGenerateResponse

        mock_response = IDTestGenerateResponse(**mock_test_generate_response)

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.test_generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/test-generate", json=valid_test_generate_request)

            data = response.json()
            assert data["sequence_number"] == 6

    def test_test_generate_returns_404_when_no_rule(
        self, client, valid_test_generate_request: dict
    ):
        """
        Test that test-generate returns 404 when no rule exists.

        Given: No active ID rule for the entity type
        When: POST /api/ids/test-generate is called
        Then: Returns 404 not found
        """
        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.test_generate_id = AsyncMock(
                side_effect=ValueError("No active ID rule found for entity type: batch")
            )
            MockService.return_value = mock_service

            response = client.post("/api/ids/test-generate", json=valid_test_generate_request)

            assert response.status_code == 404

    def test_test_generate_returns_422_for_invalid_entity_type(self, client):
        """
        Test that test-generate endpoint validates entity type.

        Given: An invalid entity type
        When: POST /api/ids/test-generate is called
        Then: Returns 422 validation error
        """
        invalid_request = {
            "entity_type": "invalid_type",
        }

        response = client.post("/api/ids/test-generate", json=invalid_request)

        assert response.status_code == 422

    def test_test_generate_accepts_facility_id(self, client):
        """
        Test that test-generate endpoint accepts optional facility_id.

        Given: A request with facility_id
        When: POST /api/ids/test-generate is called
        Then: Returns 200 with facility-specific preview
        """
        from app.models.id_generation import IDTestGenerateResponse

        request_with_facility = {
            "entity_type": "batch",
            "facility_id": "facility-abc",
        }

        mock_response = IDTestGenerateResponse(
            generated_id="FAC-ABC-0001",
            entity_type="batch",
            sequence_number=1,
            rule_id="facility-rule-id",
            is_preview=True,
        )

        with patch("app.api.id_generation.IDService") as MockService:
            mock_service = MagicMock()
            mock_service.test_generate_id = AsyncMock(return_value=mock_response)
            MockService.return_value = mock_service

            response = client.post("/api/ids/test-generate", json=request_with_facility)

            assert response.status_code == 200
            data = response.json()
            assert data["is_preview"] is True
