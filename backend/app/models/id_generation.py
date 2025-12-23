"""Pydantic models for ID Generation feature."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class EntityType(str, Enum):
    """Entity types that support ID generation."""
    BATCH = "batch"
    SAMPLE = "sample"
    REPORT = "report"
    SCHEMA = "schema"


class SequenceResetPeriod(str, Enum):
    """When to reset sequence numbers."""
    NEVER = "never"
    DAILY = "daily"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class ComponentType(str, Enum):
    """Types of components in an ID pattern."""
    LITERAL = "literal"        # Fixed text (e.g., "NAB-")
    YEAR = "year"              # 4-digit year (YYYY)
    YEAR_SHORT = "year_short"  # 2-digit year (YY)
    MONTH = "month"            # 2-digit month (MM)
    DAY = "day"                # 2-digit day (DD)
    SEQUENCE = "sequence"      # Incrementing sequence number
    FACILITY = "facility"      # Facility code
    UUID = "uuid"              # UUID component


class PatternComponent(BaseModel):
    """Individual component of an ID pattern."""
    type: ComponentType = Field(..., description="Component type")
    value: Optional[str] = Field(None, description="Static value for literal components")
    padding: Optional[int] = Field(None, description="Zero-padding width for sequence")
    start_value: Optional[int] = Field(1, description="Starting value for sequence")


class IDRuleDefinition(BaseModel):
    """Structured ID rule definition parsed from natural language."""
    pattern: str = Field(..., description="Pattern template (e.g., 'NAB-{YYYY}-{MM}-{SEQ:4}')")
    components: list[PatternComponent] = Field(default_factory=list, description="Parsed pattern components")
    sequence_reset_period: SequenceResetPeriod = Field(
        SequenceResetPeriod.NEVER,
        description="When to reset sequence"
    )
    example_id: str = Field(..., description="Example generated ID")


# Request/Response Models

class IDRuleParseRequest(BaseModel):
    """Request to parse natural language ID rule."""
    natural_language_rule: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="Natural language description of ID format"
    )
    entity_type: EntityType = Field(..., description="Entity type this rule applies to")
    facility_id: Optional[str] = Field(None, description="Facility ID for scoped rules")


class IDRuleParseResponse(BaseModel):
    """Response from ID rule parsing."""
    parsed_rule: IDRuleDefinition = Field(..., description="Structured rule definition")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Parsing confidence")
    warnings: list[str] = Field(default_factory=list, description="Parsing warnings")


class IDRuleCreateRequest(BaseModel):
    """Request to save an ID rule."""
    rule_name: str = Field(..., min_length=1, max_length=100, description="Human-readable rule name")
    entity_type: EntityType = Field(..., description="Entity type")
    facility_id: Optional[str] = Field(None, description="Facility ID (null for global)")
    rule_definition: IDRuleDefinition = Field(..., description="Parsed rule definition")
    natural_language_source: Optional[str] = Field(None, description="Original natural language input")


class IDRuleResponse(BaseModel):
    """ID rule response with full details."""
    id: str
    rule_name: str
    entity_type: EntityType
    facility_id: Optional[str]
    pattern: str
    components: list[PatternComponent]
    sequence_reset_period: SequenceResetPeriod
    natural_language_source: Optional[str]
    last_sequence: int
    active: bool
    created_at: datetime
    updated_at: datetime


class IDRuleListItem(BaseModel):
    """Lightweight ID rule item for list views."""
    id: str
    rule_name: str
    entity_type: EntityType
    facility_id: Optional[str]
    pattern: str
    last_sequence: int
    active: bool


class IDRuleListResponse(BaseModel):
    """List of ID rules."""
    rules: list[IDRuleListItem]
    total: int


class IDGenerateRequest(BaseModel):
    """Request to generate a new ID."""
    entity_type: EntityType = Field(..., description="Entity type to generate ID for")
    facility_id: Optional[str] = Field(None, description="Facility context")


class IDGenerateResponse(BaseModel):
    """Response from ID generation."""
    generated_id: str = Field(..., description="Generated unique ID")
    entity_type: EntityType
    sequence_number: int = Field(..., description="Sequence number used")
    rule_id: str = Field(..., description="ID rule that was applied")


class IDTestGenerateRequest(BaseModel):
    """Request to test ID generation without persisting."""
    entity_type: EntityType = Field(..., description="Entity type to test")
    facility_id: Optional[str] = Field(None, description="Facility context")


class IDTestGenerateResponse(BaseModel):
    """Response from test ID generation (preview without persistence).

    Same as IDGenerateResponse but with is_preview=True to indicate
    the sequence was not actually incremented.
    """
    generated_id: str = Field(..., description="Preview of next ID")
    entity_type: EntityType
    sequence_number: int = Field(..., description="Sequence number that would be used")
    rule_id: str = Field(..., description="ID rule that would be applied")
    is_preview: bool = Field(True, description="Indicates this is a preview, not persisted")
