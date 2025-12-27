"""Agno tools for ID rule parsing and generation."""

import json
from typing import Optional

from app.config import settings


ID_RULE_PARSING_PROMPT = """You are an ID rule parser. Analyze the natural language description and extract the ID pattern structure.

Return a JSON object with exactly this structure:
{
    "pattern": "Pattern template using placeholders like {YYYY}, {MM}, {DD}, {SEQ:N}, {FACILITY}",
    "components": [
        {"type": "literal", "value": "fixed text"},
        {"type": "year"},
        {"type": "year_short"},
        {"type": "month"},
        {"type": "day"},
        {"type": "sequence", "padding": 4, "start_value": 1},
        {"type": "facility"}
    ],
    "sequence_reset_period": "never|daily|monthly|yearly",
    "example_id": "Example generated ID"
}

Component types:
- literal: Fixed text (e.g., "NAB-", "-", "/")
- year: 4-digit year (YYYY)
- year_short: 2-digit year (YY)
- month: 2-digit month (MM)
- day: 2-digit day (DD)
- sequence: Incrementing number with padding (e.g., 0001, 0002)
- facility: Facility code placeholder
- uuid: UUID component

For sequences:
- padding: Number of digits (e.g., 4 for 0001)
- start_value: Starting number (usually 1)

sequence_reset_period:
- "never": Sequence never resets
- "daily": Resets each day
- "monthly": Resets at start of each month
- "yearly": Resets at start of each year

Return ONLY valid JSON, no markdown or explanation."""


async def parse_id_rule_from_text(
    natural_language_rule: str,
    entity_type: str,
    facility_id: Optional[str] = None,
) -> dict:
    """
    Parse a natural language ID rule description into a structured format.

    This tool uses an LLM to analyze natural language descriptions of ID formats
    and extract the pattern structure, components, and reset rules.

    Args:
        natural_language_rule: Natural language description of the ID format
        entity_type: Type of entity (batch, sample, report, schema)
        facility_id: Optional facility ID for scoped rules

    Returns:
        Dictionary containing:
        - parsed_rule: Structured ID rule definition
        - confidence_score: Parsing confidence (0.0-1.0)
        - warnings: Any parsing warnings
    """
    from agno.models.openrouter import OpenRouter
    from agno.agent import Agent

    # Create LLM agent for parsing
    model = OpenRouter(
        id=settings.schema_extraction_model,  # Reuse the same model
        api_key=settings.openrouter_api_key,
    )

    agent = Agent(
        model=model,
        instructions=ID_RULE_PARSING_PROMPT,
    )

    # Build context message
    context = f"Entity type: {entity_type}"
    if facility_id:
        context += f"\nFacility ID: {facility_id}"

    message = f"{context}\n\nID rule description:\n{natural_language_rule}"

    # Call LLM
    response = await agent.arun(input=message)

    # Parse response
    response_text = response.content
    if isinstance(response_text, list):
        response_text = response_text[0] if response_text else ""

    json_str = _extract_json_from_response(str(response_text))
    parsed = json.loads(json_str)

    # Calculate confidence score based on completeness
    confidence = _calculate_parse_confidence(parsed)

    # Collect any warnings
    warnings = _collect_parse_warnings(parsed, natural_language_rule)

    return {
        "parsed_rule": parsed,
        "confidence_score": confidence,
        "warnings": warnings,
    }


def _extract_json_from_response(text: str) -> str:
    """Extract JSON from LLM response, handling markdown code blocks."""
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    return text.strip()


def _calculate_parse_confidence(parsed: dict) -> float:
    """Calculate confidence score for parsed rule."""
    score = 0.0

    # Has pattern
    if parsed.get("pattern"):
        score += 0.3

    # Has components
    components = parsed.get("components", [])
    if components:
        score += 0.3
        # Has sequence component
        if any(c.get("type") == "sequence" for c in components):
            score += 0.1

    # Has reset period
    if parsed.get("sequence_reset_period"):
        score += 0.15

    # Has example ID
    if parsed.get("example_id"):
        score += 0.15

    return min(score, 1.0)


def _collect_parse_warnings(parsed: dict, original_rule: str) -> list[str]:
    """Collect warnings from parsed rule."""
    warnings = []

    # Check for missing sequence
    components = parsed.get("components", [])
    if not any(c.get("type") == "sequence" for c in components):
        warnings.append("No sequence component detected - IDs may not be unique")

    # Check for pattern consistency
    pattern = parsed.get("pattern", "")
    if "{SEQ" in pattern.upper():
        has_seq = any(c.get("type") == "sequence" for c in components)
        if not has_seq:
            warnings.append("Pattern contains SEQ but no sequence component found")

    return warnings
