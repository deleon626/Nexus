"""Schema extraction and management service."""

import json
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from json_repair import repair_json

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.sqlite import async_session_maker
from app.db.models import FormTemplate, FormStatus
from app.models.schema import (
    ExtractedSchemaStructure,
    ExtractionMetadata,
    SchemaField,
    SchemaSection,
    SchemaCriterion,
    GradeOption,
    FieldType,
)


class SchemaExtractionError(Exception):
    """Raised when schema extraction fails."""

    def __init__(self, message: str, error_code: str = "EXTRACTION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class SchemaValidationError(Exception):
    """Raised when schema validation fails."""

    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(self.message)


class SchemaNotFoundError(Exception):
    """Raised when a schema is not found."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


@asynccontextmanager
async def get_async_session():
    """Context manager for database sessions."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


class SchemaService:
    """Service for schema extraction and management."""

    EXTRACTION_PROMPT = """You are a QC form schema extractor. Analyze this QC inspection form image and extract the data structure.

Return a JSON object with exactly this structure:
{
    "per_sample_fields": [
        {
            "id": "unique_field_id",
            "label": "English label",
            "label_id": "Indonesian label (if visible)",
            "field_type": "text|number|date|choice|graded_choice|boolean",
            "required": true/false,
            "unit": "unit if applicable (e.g., 'C', 'kg')",
            "validation_rules": {"min": value, "max": value} // optional
        }
    ],
    "sections": [
        {
            "id": "section_id",
            "label": "Section name (English)",
            "label_id": "Section name (Indonesian)",
            "criteria": [
                {
                    "id": "criterion_id",
                    "label": "Criterion name (English)",
                    "label_id": "Criterion name (Indonesian)",
                    "grades": [
                        {"value": 9, "label": "Description for grade 9"},
                        {"value": 7, "label": "Description for grade 7"},
                        {"value": 5, "label": "Description for grade 5"}
                    ]
                }
            ]
        }
    ],
    "batch_metadata_fields": [
        {
            "id": "field_id",
            "label": "Field label",
            "field_type": "text|number|date",
            "required": true/false
        }
    ],
    "validation_rules": {
        "temperature_min": -25,
        "temperature_max": -18
        // other global validation rules from form notes
    }
}

Focus on:
1. Extract ALL fields visible on the form, including header fields
2. Preserve BOTH English and Indonesian labels when present
3. For graded criteria (5/7/9 scoring), include all grade options with descriptions
4. Identify per-sample fields (temperature, weight, individual grades) vs batch-level fields (supplier, date, lot number)
5. Extract any validation rules mentioned in notes or footers

Return ONLY valid JSON, no markdown or explanation."""

    def __init__(self):
        """Initialize schema service."""
        self.model = settings.schema_extraction_model

    async def extract_schema(
        self,
        image_base64: str,
        source_filename: str,
        file_size: int = 0,
    ) -> tuple[ExtractedSchemaStructure, ExtractionMetadata]:
        """
        Extract schema structure from a form image.

        Args:
            image_base64: Base64-encoded image (with data URI prefix)
            source_filename: Original filename
            file_size: File size in bytes

        Returns:
            Tuple of (ExtractedSchemaStructure, ExtractionMetadata)

        Raises:
            SchemaExtractionError: If extraction fails
        """
        start_time = time.time()

        # Call vision LLM
        raw_result = await self._call_vision_llm(image_base64)

        # Parse result into schema structure
        schema = self._parse_llm_response(raw_result)

        # Calculate confidence score
        confidence = self.calculate_confidence_score(schema)

        # Build metadata
        processing_time_ms = int((time.time() - start_time) * 1000)
        metadata = ExtractionMetadata(
            source_file=source_filename,
            source_file_size=file_size,
            model_used=self.model,
            confidence_score=confidence,
            extraction_timestamp=datetime.utcnow(),
            processing_time_ms=processing_time_ms,
        )

        return schema, metadata

    async def _call_vision_llm(self, image_base64: str) -> dict:
        """
        Call vision LLM for schema extraction.

        Args:
            image_base64: Base64-encoded image

        Returns:
            Parsed JSON response from LLM
        """
        try:
            from agno.models.openrouter import OpenRouter
            from agno.agent import Agent

            # Create vision-capable agent
            model = OpenRouter(
                id=self.model,
                api_key=settings.openrouter_api_key,
            )

            agent = Agent(
                model=model,
                instructions=self.EXTRACTION_PROMPT,
            )

            # Run extraction with image
            from agno.media import Image

            response = await agent.arun(
                input="Extract the schema from this QC form image.",
                images=[Image(url=image_base64)],
            )

            # Parse JSON from response
            response_text = response.content
            if isinstance(response_text, list):
                response_text = response_text[0] if response_text else ""

            # Extract JSON from response (may have markdown code blocks)
            json_str = self._extract_json_from_response(str(response_text))

            # Use json_repair to handle malformed LLM output
            # (handles trailing commas, unterminated strings, truncated JSON)
            repaired = repair_json(json_str, return_objects=True)
            if isinstance(repaired, dict):
                return repaired
            return json.loads(repaired)

        except json.JSONDecodeError as e:
            raise SchemaExtractionError(
                f"Failed to parse LLM response as JSON: {e}",
                error_code="INVALID_JSON_RESPONSE",
            )
        except Exception as e:
            raise SchemaExtractionError(
                f"LLM extraction failed: {e}",
                error_code="LLM_ERROR",
            )

    def _extract_json_from_response(self, text: str) -> str:
        """Extract JSON from LLM response, handling markdown code blocks."""
        # Remove markdown code blocks if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        return text.strip()

    def _parse_llm_response(self, data: dict) -> ExtractedSchemaStructure:
        """
        Parse LLM response into ExtractedSchemaStructure.

        Args:
            data: Raw dict from LLM

        Returns:
            Validated ExtractedSchemaStructure
        """
        per_sample_fields = []
        for field_data in data.get("per_sample_fields", []):
            per_sample_fields.append(
                SchemaField(
                    id=field_data.get("id", str(uuid.uuid4())[:8]),
                    label=field_data.get("label", ""),
                    label_id=field_data.get("label_id"),
                    field_type=FieldType(field_data.get("field_type", "text")),
                    required=field_data.get("required", True),
                    default_value=field_data.get("default_value"),
                    validation_rules=field_data.get("validation_rules"),
                    options=self._parse_grade_options(field_data.get("options")),
                    unit=field_data.get("unit"),
                )
            )

        sections = []
        for section_data in data.get("sections", []):
            criteria = []
            for crit_data in section_data.get("criteria", []):
                criteria.append(
                    SchemaCriterion(
                        id=crit_data.get("id", str(uuid.uuid4())[:8]),
                        label=crit_data.get("label", ""),
                        label_id=crit_data.get("label_id"),
                        grades=self._parse_grade_options(crit_data.get("grades", [])),
                    )
                )
            sections.append(
                SchemaSection(
                    id=section_data.get("id", str(uuid.uuid4())[:8]),
                    label=section_data.get("label", ""),
                    label_id=section_data.get("label_id"),
                    criteria=criteria,
                )
            )

        batch_metadata_fields = []
        for field_data in data.get("batch_metadata_fields", []):
            batch_metadata_fields.append(
                SchemaField(
                    id=field_data.get("id", str(uuid.uuid4())[:8]),
                    label=field_data.get("label", ""),
                    label_id=field_data.get("label_id"),
                    field_type=FieldType(field_data.get("field_type", "text")),
                    required=field_data.get("required", True),
                    default_value=field_data.get("default_value"),
                    validation_rules=field_data.get("validation_rules"),
                    unit=field_data.get("unit"),
                )
            )

        return ExtractedSchemaStructure(
            per_sample_fields=per_sample_fields,
            sections=sections,
            batch_metadata_fields=batch_metadata_fields,
            validation_rules=data.get("validation_rules"),
        )

    def _parse_grade_options(
        self, options_data: list | None
    ) -> list[GradeOption]:
        """Parse grade options from raw data."""
        if not options_data:
            return []

        result = []
        for opt in options_data:
            # Handle empty or non-integer values gracefully
            raw_value = opt.get("value", 0)
            try:
                value = int(raw_value) if raw_value != "" else 0
            except (ValueError, TypeError):
                value = 0

            result.append(
                GradeOption(
                    value=value,
                    label=opt.get("label", ""),
                    label_id=opt.get("label_id"),
                )
            )
        return result

    def calculate_confidence_score(self, schema: ExtractedSchemaStructure) -> float:
        """
        Calculate confidence score for extracted schema.

        Scoring based on:
        - Has per-sample fields: +0.3
        - Has sections with criteria: +0.3
        - Has batch metadata: +0.2
        - Criteria have grades: +0.1
        - Fields have bilingual labels: +0.1

        Args:
            schema: Extracted schema structure

        Returns:
            Confidence score between 0.0 and 1.0
        """
        score = 0.0

        # Has per-sample fields
        if schema.per_sample_fields:
            score += 0.3

        # Has sections with criteria
        if schema.sections:
            score += 0.2
            has_criteria = any(s.criteria for s in schema.sections)
            if has_criteria:
                score += 0.1

        # Has batch metadata
        if schema.batch_metadata_fields:
            score += 0.2

        # Criteria have grades
        has_grades = False
        for section in schema.sections:
            for crit in section.criteria:
                if crit.grades:
                    has_grades = True
                    break
        if has_grades:
            score += 0.1

        # Bilingual labels
        has_bilingual = False
        for field in schema.per_sample_fields:
            if field.label_id:
                has_bilingual = True
                break
        for section in schema.sections:
            if section.label_id:
                has_bilingual = True
                break
        if has_bilingual:
            score += 0.1

        return min(score, 1.0)

    # =========================================================================
    # CRUD OPERATIONS (T036-T039)
    # =========================================================================

    async def save_schema(
        self,
        form_code: str,
        form_name: str,
        schema_definition: ExtractedSchemaStructure,
        category: str = None,
        extraction_metadata: ExtractionMetadata = None,
        facility_id: str = None,
    ) -> FormTemplate:
        """
        Save or update a schema with versioning.

        Args:
            form_code: Unique form identifier code
            form_name: Human-readable form name
            schema_definition: Extracted schema structure
            category: Optional form category
            extraction_metadata: Optional extraction metadata
            facility_id: Optional facility scope

        Returns:
            Saved FormTemplate instance

        Raises:
            SchemaValidationError: If validation fails
        """
        # Validate required fields
        if not form_code or not form_code.strip():
            raise SchemaValidationError("form_code is required", field="form_code")

        if not form_name or not form_name.strip():
            raise SchemaValidationError("form_name is required", field="form_name")

        async with get_async_session() as session:
            # Check for existing schema with same form_code
            query = select(FormTemplate).where(
                FormTemplate.form_code == form_code,
                FormTemplate.status != FormStatus.ARCHIVED.value,
            ).order_by(FormTemplate.version_number.desc()).limit(1)

            result = await session.execute(query)
            existing = result.scalar_one_or_none()

            if existing:
                # Increment version
                new_version_number = existing.version_number + 1
                major, minor, patch = existing.version.split(".")
                new_version = f"{major}.{int(minor) + 1}.{patch}"
            else:
                new_version_number = 1
                new_version = "1.0.0"

            # Create new schema record
            schema_dict = schema_definition.model_dump()

            new_template = FormTemplate(
                id=str(uuid.uuid4()),
                form_code=form_code.strip(),
                form_name=form_name.strip(),
                category=category,
                version=new_version,
                version_number=new_version_number,
                schema_definition=schema_dict,
                status=FormStatus.ACTIVE.value,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            session.add(new_template)
            await session.flush()
            await session.refresh(new_template)

            return new_template

    async def list_schemas(
        self,
        page: int = 1,
        page_size: int = 20,
        facility_id: str = None,
        status: str = None,
    ) -> dict:
        """
        List schemas with pagination and filtering.

        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page
            facility_id: Optional facility filter
            status: Optional status filter ('active', 'archived', etc.)

        Returns:
            Dict with schemas, total, page, page_size
        """
        async with get_async_session() as session:
            # Build base query
            query = select(FormTemplate)

            # Apply filters
            if status:
                query = query.where(FormTemplate.status == status)
            else:
                # Default to non-archived
                query = query.where(FormTemplate.status != FormStatus.ARCHIVED.value)

            # Count total
            count_query = select(func.count()).select_from(query.subquery())
            count_result = await session.execute(count_query)
            total = count_result.scalar_one()

            # Apply pagination
            offset = (page - 1) * page_size
            query = query.order_by(FormTemplate.updated_at.desc())
            query = query.offset(offset).limit(page_size)

            result = await session.execute(query)
            schemas = result.scalars().all()

            return {
                "schemas": list(schemas),
                "total": total,
                "page": page,
                "page_size": page_size,
            }

    async def get_schema_by_id(self, schema_id: str) -> Optional[FormTemplate]:
        """
        Get a schema by its ID.

        Args:
            schema_id: Schema UUID

        Returns:
            FormTemplate or None if not found
        """
        async with get_async_session() as session:
            query = select(FormTemplate).where(FormTemplate.id == schema_id)
            result = await session.execute(query)
            return result.scalar_one_or_none()

    async def archive_schema(self, schema_id: str) -> bool:
        """
        Archive a schema (soft delete).

        Args:
            schema_id: Schema UUID

        Returns:
            True if archived, False if not found
        """
        async with get_async_session() as session:
            query = select(FormTemplate).where(FormTemplate.id == schema_id)
            result = await session.execute(query)
            schema = result.scalar_one_or_none()

            if not schema:
                return False

            schema.status = FormStatus.ARCHIVED.value
            schema.updated_at = datetime.utcnow()

            return True

    async def update_schema(
        self,
        schema_id: str,
        schema_definition: dict,
        update_reason: Optional[str] = None,
    ) -> FormTemplate:
        """
        Create a new version of an existing schema.

        The original schema is archived (soft deleted) and a new version
        is created with an incremented version_number.

        Args:
            schema_id: UUID of the schema to update
            schema_definition: New schema structure (ExtractedSchemaStructure dict)
            update_reason: Optional reason for the update

        Returns:
            New FormTemplate instance with incremented version

        Raises:
            SchemaNotFoundError: If the original schema is not found
        """
        # Fetch original schema
        original = await self.get_schema_by_id(schema_id)
        if not original:
            raise SchemaNotFoundError(f"Schema {schema_id} not found")

        # Archive the original schema
        await self.archive_schema(schema_id)

        # Calculate new version
        new_version_number = original.version_number + 1
        # Parse version string (e.g., "1.0.0" -> "1.0.1")
        version_parts = original.version.split(".")
        if len(version_parts) == 3:
            major, minor, patch = version_parts
            new_version = f"{major}.{minor}.{new_version_number}"
        else:
            # Fallback if version format is unexpected
            new_version = f"1.0.{new_version_number}"

        # Convert schema_definition to dict if it's a Pydantic model
        if hasattr(schema_definition, "model_dump"):
            schema_dict = schema_definition.model_dump()
        else:
            schema_dict = schema_definition

        # Create new version
        async with get_async_session() as session:
            new_template = FormTemplate(
                id=str(uuid.uuid4()),
                form_code=original.form_code,
                form_name=original.form_name,
                category=original.category,
                version=new_version,
                version_number=new_version_number,
                schema_definition=schema_dict,
                status=FormStatus.ACTIVE.value,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            session.add(new_template)
            await session.flush()
            await session.refresh(new_template)

            return new_template
