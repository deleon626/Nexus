"""Agno tools for schema extraction."""

import json
from agno.tools import tool

from app.services.schema_service import SchemaService, SchemaExtractionError


@tool(
    name="extract_schema_from_form",
    description="Extract QC form schema from an uploaded image. Returns structured schema with fields, sections, and criteria.",
)
async def extract_schema_from_form(image_base64: str, schema_name: str) -> str:
    """
    Extract schema from a QC form image.

    Args:
        image_base64: Base64-encoded image with data URI prefix
        schema_name: Name to assign to the extracted schema

    Returns:
        JSON string with extracted schema and metadata
    """
    try:
        service = SchemaService()
        schema, metadata = await service.extract_schema(
            image_base64=image_base64,
            source_filename=f"{schema_name}.extracted",
        )

        return json.dumps(
            {
                "success": True,
                "schema_name": schema_name,
                "extracted_schema": schema.model_dump(mode="json"),
                "confidence_score": metadata.confidence_score,
                "model_used": metadata.model_used,
                "processing_time_ms": metadata.processing_time_ms,
            },
            indent=2,
        )

    except SchemaExtractionError as e:
        return json.dumps(
            {
                "success": False,
                "error": e.message,
                "error_code": e.error_code,
            }
        )

    except Exception as e:
        return json.dumps(
            {
                "success": False,
                "error": f"Extraction failed: {str(e)}",
                "error_code": "UNEXPECTED_ERROR",
            }
        )
