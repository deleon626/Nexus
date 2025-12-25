"""Unit tests for ID rule parsing tools.

TDD: These tests are written FIRST, before implementation.
They should FAIL until the tools are implemented.
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.id_generation import (
    EntityType,
    SequenceResetPeriod,
    ComponentType,
    PatternComponent,
    IDRuleDefinition,
)


class TestParseIDRuleFromTextTool:
    """Tests for parse_id_rule_from_text Agno tool."""

    @pytest.fixture
    def sample_natural_language_rule(self) -> str:
        """Return a sample natural language ID rule description."""
        return (
            "Batch IDs should be NAB-YYYY-MM-NNNN where YYYY is year, "
            "MM is month, and NNNN is a 4-digit sequence starting at 0001, "
            "resetting monthly"
        )

    @pytest.fixture
    def mock_llm_parsed_response(self) -> dict:
        """Return mock LLM response for ID rule parsing."""
        return {
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
        }

    @pytest.mark.asyncio
    async def test_parse_id_rule_from_text_returns_structured_rule(
        self, sample_natural_language_rule: str, mock_llm_parsed_response: dict
    ):
        """
        Test that parse_id_rule_from_text returns a valid IDRuleDefinition.

        Given: A natural language description of an ID format
        When: The parse_id_rule_from_text tool is called
        Then: It returns a structured IDRuleDefinition with pattern and components
        """
        from app.tools.id_tools import parse_id_rule_from_text

        with patch("agno.agent.Agent") as MockAgent:
            # Setup mock agent
            mock_agent = MagicMock()
            mock_response = MagicMock()
            mock_response.content = json.dumps(mock_llm_parsed_response)
            mock_agent.arun = AsyncMock(return_value=mock_response)
            MockAgent.return_value = mock_agent

            result = await parse_id_rule_from_text(
                natural_language_rule=sample_natural_language_rule,
                entity_type=EntityType.BATCH.value,
            )

            assert result is not None
            assert "parsed_rule" in result
            assert "confidence_score" in result
            parsed = result["parsed_rule"]
            assert "pattern" in parsed
            assert "components" in parsed
            assert "sequence_reset_period" in parsed

    @pytest.mark.asyncio
    async def test_parse_id_rule_extracts_pattern_components(
        self, sample_natural_language_rule: str, mock_llm_parsed_response: dict
    ):
        """
        Test that parsing extracts correct pattern components.

        Given: A natural language rule with YYYY, MM, and sequence
        When: The tool parses the rule
        Then: Components include year, month, and sequence with correct settings
        """
        from app.tools.id_tools import parse_id_rule_from_text

        with patch("agno.agent.Agent") as MockAgent:
            mock_agent = MagicMock()
            mock_response = MagicMock()
            mock_response.content = json.dumps(mock_llm_parsed_response)
            mock_agent.arun = AsyncMock(return_value=mock_response)
            MockAgent.return_value = mock_agent

            result = await parse_id_rule_from_text(
                natural_language_rule=sample_natural_language_rule,
                entity_type=EntityType.BATCH.value,
            )

            parsed = result["parsed_rule"]
            components = parsed["components"]

            # Should have literal, year, literal, month, literal, sequence
            component_types = [c.get("type") for c in components]
            assert "year" in component_types
            assert "month" in component_types
            assert "sequence" in component_types

    @pytest.mark.asyncio
    async def test_parse_id_rule_detects_reset_period(
        self, sample_natural_language_rule: str, mock_llm_parsed_response: dict
    ):
        """
        Test that parsing correctly identifies sequence reset period.

        Given: A rule describing monthly sequence reset
        When: The tool parses the rule
        Then: sequence_reset_period is set to "monthly"
        """
        from app.tools.id_tools import parse_id_rule_from_text

        with patch("agno.agent.Agent") as MockAgent:
            mock_agent = MagicMock()
            mock_response = MagicMock()
            mock_response.content = json.dumps(mock_llm_parsed_response)
            mock_agent.arun = AsyncMock(return_value=mock_response)
            MockAgent.return_value = mock_agent

            result = await parse_id_rule_from_text(
                natural_language_rule=sample_natural_language_rule,
                entity_type=EntityType.BATCH.value,
            )

            parsed = result["parsed_rule"]
            assert parsed["sequence_reset_period"] == "monthly"

    @pytest.mark.asyncio
    async def test_parse_id_rule_generates_example_id(
        self, sample_natural_language_rule: str, mock_llm_parsed_response: dict
    ):
        """
        Test that parsing generates an example ID.

        Given: A natural language rule
        When: The tool parses the rule
        Then: An example_id is generated following the pattern
        """
        from app.tools.id_tools import parse_id_rule_from_text

        with patch("agno.agent.Agent") as MockAgent:
            mock_agent = MagicMock()
            mock_response = MagicMock()
            mock_response.content = json.dumps(mock_llm_parsed_response)
            mock_agent.arun = AsyncMock(return_value=mock_response)
            MockAgent.return_value = mock_agent

            result = await parse_id_rule_from_text(
                natural_language_rule=sample_natural_language_rule,
                entity_type=EntityType.BATCH.value,
            )

            parsed = result["parsed_rule"]
            assert "example_id" in parsed
            assert parsed["example_id"].startswith("NAB-")

    @pytest.mark.asyncio
    async def test_parse_id_rule_returns_confidence_score(
        self, sample_natural_language_rule: str, mock_llm_parsed_response: dict
    ):
        """
        Test that parsing returns a confidence score.

        Given: A natural language rule
        When: The tool parses the rule
        Then: A confidence score between 0.0 and 1.0 is returned
        """
        from app.tools.id_tools import parse_id_rule_from_text

        with patch("agno.agent.Agent") as MockAgent:
            mock_agent = MagicMock()
            mock_response = MagicMock()
            mock_response.content = json.dumps(mock_llm_parsed_response)
            mock_agent.arun = AsyncMock(return_value=mock_response)
            MockAgent.return_value = mock_agent

            result = await parse_id_rule_from_text(
                natural_language_rule=sample_natural_language_rule,
                entity_type=EntityType.BATCH.value,
            )

            assert "confidence_score" in result
            assert 0.0 <= result["confidence_score"] <= 1.0

    @pytest.mark.asyncio
    async def test_parse_id_rule_handles_simple_patterns(self):
        """
        Test parsing of simple patterns without sequences.

        Given: A simple pattern like "SCHEMA-NNNN"
        When: The tool parses the rule
        Then: Correctly identifies literal prefix and sequence
        """
        from app.tools.id_tools import parse_id_rule_from_text

        simple_rule = "Schema IDs should be SCHEMA-NNNN where NNNN is a 4-digit sequence"
        mock_response = {
            "pattern": "SCHEMA-{SEQ:4}",
            "components": [
                {"type": "literal", "value": "SCHEMA-"},
                {"type": "sequence", "padding": 4, "start_value": 1},
            ],
            "sequence_reset_period": "never",
            "example_id": "SCHEMA-0001",
        }

        with patch("agno.agent.Agent") as MockAgent:
            mock_agent = MagicMock()
            mock_resp = MagicMock()
            mock_resp.content = json.dumps(mock_response)
            mock_agent.arun = AsyncMock(return_value=mock_resp)
            MockAgent.return_value = mock_agent

            result = await parse_id_rule_from_text(
                natural_language_rule=simple_rule,
                entity_type=EntityType.SCHEMA.value,
            )

            assert result is not None
            parsed = result["parsed_rule"]
            assert parsed["sequence_reset_period"] == "never"

    @pytest.mark.asyncio
    async def test_parse_id_rule_handles_yearly_reset(self):
        """
        Test parsing of rules with yearly sequence reset.

        Given: A rule specifying yearly reset
        When: The tool parses the rule
        Then: sequence_reset_period is set to "yearly"
        """
        from app.tools.id_tools import parse_id_rule_from_text

        yearly_rule = (
            "Report IDs should be RPT-YYYY-NNNN where the sequence "
            "resets at the start of each year"
        )
        mock_response = {
            "pattern": "RPT-{YYYY}-{SEQ:4}",
            "components": [
                {"type": "literal", "value": "RPT-"},
                {"type": "year"},
                {"type": "literal", "value": "-"},
                {"type": "sequence", "padding": 4, "start_value": 1},
            ],
            "sequence_reset_period": "yearly",
            "example_id": "RPT-2025-0001",
        }

        with patch("agno.agent.Agent") as MockAgent:
            mock_agent = MagicMock()
            mock_resp = MagicMock()
            mock_resp.content = json.dumps(mock_response)
            mock_agent.arun = AsyncMock(return_value=mock_resp)
            MockAgent.return_value = mock_agent

            result = await parse_id_rule_from_text(
                natural_language_rule=yearly_rule,
                entity_type=EntityType.REPORT.value,
            )

            parsed = result["parsed_rule"]
            assert parsed["sequence_reset_period"] == "yearly"

    @pytest.mark.asyncio
    async def test_parse_id_rule_with_facility_code(self):
        """
        Test parsing of rules that include facility code placeholder.

        Given: A rule including facility code
        When: The tool parses the rule
        Then: Components include facility type
        """
        from app.tools.id_tools import parse_id_rule_from_text

        facility_rule = (
            "Sample IDs should be {facility}-SMP-NNNN where {facility} "
            "is the facility code"
        )
        mock_response = {
            "pattern": "{FACILITY}-SMP-{SEQ:4}",
            "components": [
                {"type": "facility"},
                {"type": "literal", "value": "-SMP-"},
                {"type": "sequence", "padding": 4, "start_value": 1},
            ],
            "sequence_reset_period": "never",
            "example_id": "FAC1-SMP-0001",
        }

        with patch("agno.agent.Agent") as MockAgent:
            mock_agent = MagicMock()
            mock_resp = MagicMock()
            mock_resp.content = json.dumps(mock_response)
            mock_agent.arun = AsyncMock(return_value=mock_resp)
            MockAgent.return_value = mock_agent

            result = await parse_id_rule_from_text(
                natural_language_rule=facility_rule,
                entity_type=EntityType.SAMPLE.value,
                facility_id="FAC1",
            )

            parsed = result["parsed_rule"]
            component_types = [c.get("type") for c in parsed["components"]]
            assert "facility" in component_types
