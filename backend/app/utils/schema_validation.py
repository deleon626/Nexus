"""Schema structure validation utilities."""

from typing import Any

from app.models.schema import (
    ExtractedSchemaStructure,
    FieldType,
    SchemaField,
    SchemaSection,
    SchemaCriterion,
    GradeOption,
)


class SchemaValidationError(Exception):
    """Raised when schema validation fails."""

    def __init__(self, message: str, path: str = "", error_code: str = "VALIDATION_ERROR"):
        self.message = message
        self.path = path
        self.error_code = error_code
        super().__init__(self.message)


def validate_field_id(field_id: str, path: str) -> None:
    """Validate that a field ID is non-empty and alphanumeric with underscores."""
    if not field_id:
        raise SchemaValidationError(
            "Field ID cannot be empty",
            path=path,
            error_code="EMPTY_FIELD_ID",
        )
    if not field_id.replace("_", "").replace("-", "").isalnum():
        raise SchemaValidationError(
            f"Field ID '{field_id}' contains invalid characters",
            path=path,
            error_code="INVALID_FIELD_ID",
        )


def validate_grade_option(grade: GradeOption, path: str) -> None:
    """Validate a grade option."""
    if grade.value < 0:
        raise SchemaValidationError(
            f"Grade value must be non-negative, got {grade.value}",
            path=path,
            error_code="INVALID_GRADE_VALUE",
        )
    if not grade.label:
        raise SchemaValidationError(
            "Grade label cannot be empty",
            path=path,
            error_code="EMPTY_GRADE_LABEL",
        )


def validate_schema_field(field: SchemaField, path: str) -> None:
    """Validate a schema field."""
    validate_field_id(field.id, f"{path}.id")

    if not field.label:
        raise SchemaValidationError(
            "Field label cannot be empty",
            path=f"{path}.label",
            error_code="EMPTY_FIELD_LABEL",
        )

    # For choice/graded_choice fields, options should be provided
    if field.field_type in [FieldType.CHOICE, FieldType.GRADED_CHOICE]:
        if not field.options or len(field.options) == 0:
            raise SchemaValidationError(
                f"Field '{field.id}' of type '{field.field_type}' requires options",
                path=f"{path}.options",
                error_code="MISSING_OPTIONS",
            )
        for i, opt in enumerate(field.options):
            validate_grade_option(opt, f"{path}.options[{i}]")


def validate_criterion(criterion: SchemaCriterion, path: str) -> None:
    """Validate a schema criterion."""
    validate_field_id(criterion.id, f"{path}.id")

    if not criterion.label:
        raise SchemaValidationError(
            "Criterion label cannot be empty",
            path=f"{path}.label",
            error_code="EMPTY_CRITERION_LABEL",
        )

    if not criterion.grades or len(criterion.grades) == 0:
        raise SchemaValidationError(
            f"Criterion '{criterion.id}' requires at least one grade option",
            path=f"{path}.grades",
            error_code="MISSING_GRADES",
        )

    for i, grade in enumerate(criterion.grades):
        validate_grade_option(grade, f"{path}.grades[{i}]")


def validate_section(section: SchemaSection, path: str) -> None:
    """Validate a schema section."""
    validate_field_id(section.id, f"{path}.id")

    if not section.label:
        raise SchemaValidationError(
            "Section label cannot be empty",
            path=f"{path}.label",
            error_code="EMPTY_SECTION_LABEL",
        )

    if not section.criteria or len(section.criteria) == 0:
        raise SchemaValidationError(
            f"Section '{section.id}' requires at least one criterion",
            path=f"{path}.criteria",
            error_code="EMPTY_SECTION",
        )

    # Check for duplicate criterion IDs within section
    criterion_ids = set()
    for i, criterion in enumerate(section.criteria):
        validate_criterion(criterion, f"{path}.criteria[{i}]")
        if criterion.id in criterion_ids:
            raise SchemaValidationError(
                f"Duplicate criterion ID '{criterion.id}' in section '{section.id}'",
                path=f"{path}.criteria[{i}].id",
                error_code="DUPLICATE_CRITERION_ID",
            )
        criterion_ids.add(criterion.id)


def validate_schema_structure(schema: ExtractedSchemaStructure) -> list[str]:
    """
    Validate a complete schema structure.

    Args:
        schema: ExtractedSchemaStructure to validate

    Returns:
        List of warnings (non-fatal issues)

    Raises:
        SchemaValidationError: If validation fails
    """
    warnings: list[str] = []
    all_field_ids: set[str] = set()

    # Validate per-sample fields
    for i, field in enumerate(schema.per_sample_fields):
        path = f"per_sample_fields[{i}]"
        validate_schema_field(field, path)

        if field.id in all_field_ids:
            raise SchemaValidationError(
                f"Duplicate field ID '{field.id}'",
                path=f"{path}.id",
                error_code="DUPLICATE_FIELD_ID",
            )
        all_field_ids.add(field.id)

    # Validate batch metadata fields
    for i, field in enumerate(schema.batch_metadata_fields):
        path = f"batch_metadata_fields[{i}]"
        validate_schema_field(field, path)

        if field.id in all_field_ids:
            raise SchemaValidationError(
                f"Duplicate field ID '{field.id}'",
                path=f"{path}.id",
                error_code="DUPLICATE_FIELD_ID",
            )
        all_field_ids.add(field.id)

    # Validate sections
    section_ids: set[str] = set()
    for i, section in enumerate(schema.sections):
        path = f"sections[{i}]"
        validate_section(section, path)

        if section.id in section_ids:
            raise SchemaValidationError(
                f"Duplicate section ID '{section.id}'",
                path=f"{path}.id",
                error_code="DUPLICATE_SECTION_ID",
            )
        section_ids.add(section.id)

    # Generate warnings for potential issues
    if len(schema.per_sample_fields) == 0 and len(schema.sections) == 0:
        warnings.append("Schema has no per-sample fields or sections - may be incomplete")

    if len(schema.batch_metadata_fields) == 0:
        warnings.append("Schema has no batch metadata fields - consider adding batch-level data")

    return warnings


def schema_to_json(schema: ExtractedSchemaStructure) -> dict[str, Any]:
    """Convert schema structure to JSON-serializable dict."""
    return schema.model_dump(mode="json")


def json_to_schema(data: dict[str, Any]) -> ExtractedSchemaStructure:
    """Parse JSON dict into schema structure."""
    return ExtractedSchemaStructure.model_validate(data)
