"""Pydantic models for Schema Generator feature."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class FieldType(str, Enum):
    """Supported field types in extracted schemas."""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    CHOICE = "choice"
    GRADED_CHOICE = "graded_choice"
    BOOLEAN = "boolean"


class GradeOption(BaseModel):
    """Grade option for graded choice fields."""
    value: int = Field(..., description="Numeric grade value (e.g., 5, 7, 9)")
    label: str = Field(..., description="Grade label description")
    label_id: Optional[str] = Field(None, description="Indonesian label (bilingual support)")


class SchemaField(BaseModel):
    """Individual field in extracted schema."""
    id: str = Field(..., description="Unique field identifier")
    label: str = Field(..., description="Field label (English)")
    label_id: Optional[str] = Field(None, description="Field label (Indonesian)")
    field_type: FieldType = Field(..., description="Field data type")
    required: bool = Field(True, description="Whether field is required")
    default_value: Optional[str] = Field(None, description="Default value if any")
    validation_rules: Optional[dict] = Field(None, description="Validation rules (min, max, pattern)")
    options: Optional[list[GradeOption]] = Field(None, description="Options for choice/graded_choice fields")
    unit: Optional[str] = Field(None, description="Unit of measurement (e.g., 'kg', 'C')")


class SchemaCriterion(BaseModel):
    """Criterion within a section (e.g., 'Appearance' with grades 5/7/9)."""
    id: str = Field(..., description="Unique criterion identifier")
    label: str = Field(..., description="Criterion label (English)")
    label_id: Optional[str] = Field(None, description="Criterion label (Indonesian)")
    grades: list[GradeOption] = Field(default_factory=list, description="Available grades for this criterion")


class SchemaSection(BaseModel):
    """Section containing multiple criteria (e.g., 'Frozen', 'Thawing')."""
    id: str = Field(..., description="Unique section identifier")
    label: str = Field(..., description="Section label (English)")
    label_id: Optional[str] = Field(None, description="Section label (Indonesian)")
    criteria: list[SchemaCriterion] = Field(default_factory=list, description="Criteria in this section")


class ExtractedSchemaStructure(BaseModel):
    """Complete extracted schema structure representing one sample's data."""
    per_sample_fields: list[SchemaField] = Field(
        default_factory=list,
        description="Fields that apply to each sample (temperature, weight)"
    )
    sections: list[SchemaSection] = Field(
        default_factory=list,
        description="Sections containing criteria with grades"
    )
    batch_metadata_fields: list[SchemaField] = Field(
        default_factory=list,
        description="Batch-level fields (supplier, date, lot number)"
    )
    validation_rules: Optional[dict] = Field(
        None,
        description="Global validation rules from form notes/footers"
    )


class ExtractionMetadata(BaseModel):
    """Metadata about the extraction process."""
    source_file: str = Field(..., description="Original filename")
    source_file_size: int = Field(..., description="File size in bytes")
    model_used: str = Field(..., description="LLM model used for extraction")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence (0-1)")
    extraction_timestamp: datetime = Field(default_factory=datetime.utcnow)
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")


# Request/Response Models

class SchemaExtractionRequest(BaseModel):
    """Request for schema extraction (file is sent as multipart/form-data)."""
    schema_name: str = Field(..., min_length=1, max_length=255, description="Name for the extracted schema")


class SchemaExtractionResponse(BaseModel):
    """Response from schema extraction endpoint."""
    extracted_schema: ExtractedSchemaStructure = Field(..., description="Extracted schema structure")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Overall extraction confidence")
    extraction_metadata: ExtractionMetadata = Field(..., description="Extraction process metadata")
    warnings: list[str] = Field(default_factory=list, description="Extraction warnings or notes")


class SchemaCreateRequest(BaseModel):
    """Request to save a schema."""
    form_code: str = Field(..., min_length=1, max_length=50, description="Form code identifier")
    form_name: str = Field(..., min_length=1, max_length=255, description="Human-readable form name")
    category: Optional[str] = Field(None, max_length=100, description="Form category")
    schema_definition: ExtractedSchemaStructure = Field(..., description="Schema structure")
    extraction_metadata: Optional[ExtractionMetadata] = Field(None, description="Extraction metadata if AI-generated")


class SchemaUpdateRequest(BaseModel):
    """Request to update an existing schema (creates new version)."""
    schema_definition: ExtractedSchemaStructure = Field(..., description="Updated schema structure")
    update_reason: Optional[str] = Field(None, description="Reason for update")


class SchemaResponse(BaseModel):
    """Schema response with full details."""
    id: str
    form_code: str
    form_name: str
    category: Optional[str]
    version: str
    version_number: int
    schema_definition: ExtractedSchemaStructure
    status: str
    extraction_metadata: Optional[ExtractionMetadata]
    created_at: datetime
    updated_at: datetime


class SchemaListItem(BaseModel):
    """Lightweight schema item for list views."""
    id: str
    form_code: str
    form_name: str
    category: Optional[str]
    version: str
    version_number: int
    status: str
    created_at: datetime


class SchemaListResponse(BaseModel):
    """Paginated list of schemas."""
    schemas: list[SchemaListItem]
    total: int
    page: int
    page_size: int
