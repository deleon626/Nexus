"""API routes for schema extraction and management."""

from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status

from app.models.schema import (
    SchemaExtractionResponse,
    SchemaCreateRequest,
    SchemaUpdateRequest,
    FilePreviewInfo,
)
from app.services.file_service import (
    prepare_image_for_extraction,
    save_temp_file_for_preview,
    FileProcessingError,
)
from app.services.schema_service import (
    SchemaService,
    SchemaExtractionError,
    SchemaValidationError,
    SchemaNotFoundError,
)
from app.utils.file_validation import validate_upload_file, FileValidationError

router = APIRouter(prefix="/api/schemas", tags=["schemas"])


@router.post("/extract", response_model=SchemaExtractionResponse)
async def extract_schema(
    file: UploadFile = File(..., description="PDF or image file of QC form"),
    schema_name: str = Form(..., description="Name for the extracted schema"),
):
    """
    Extract schema structure from uploaded PDF or image.

    - **file**: PDF, PNG, JPG, or JPEG file (max 10MB)
    - **schema_name**: Name to assign to the extracted schema

    Returns extracted schema with confidence score and metadata.
    """
    # Validate file
    try:
        file_size = await validate_upload_file(file)
    except FileValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )

    # Read file content
    content = await file.read()
    await file.seek(0)

    # Save file for preview (using schema_name as session identifier)
    file_preview_info = None
    try:
        # Use a simplified session_id (first 8 chars of schema_name + timestamp)
        import hashlib
        session_id = hashlib.md5(schema_name.encode()).hexdigest()[:8]
        file_preview_dict = await save_temp_file_for_preview(file, session_id)
        file_preview_info = FilePreviewInfo(**file_preview_dict)
        await file.seek(0)  # Reset after save
    except FileProcessingError as e:
        # Non-critical error: continue extraction without preview
        print(f"Warning: Failed to save preview file: {e.message}")

    # Prepare image for extraction
    try:
        image_base64, _ = await prepare_image_for_extraction(
            file_content=content,
            content_type=file.content_type or "application/octet-stream",
        )
    except FileProcessingError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )

    # Extract schema
    try:
        service = SchemaService()
        schema, metadata = await service.extract_schema(
            image_base64=image_base64,
            source_filename=file.filename or "unknown",
            file_size=file_size,
        )
    except SchemaExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction failed: {e.message}",
        )

    return SchemaExtractionResponse(
        extracted_schema=schema,
        confidence_score=metadata.confidence_score,
        extraction_metadata=metadata,
        warnings=[],
        file_preview=file_preview_info,
    )


# =============================================================================
# CRUD ENDPOINTS (T040-T043)
# =============================================================================


@router.get("", response_model=dict)
async def list_schemas(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    facility_id: Optional[str] = Query(None, description="Filter by facility"),
):
    """
    List all schemas with pagination.

    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 20, max: 100)
    - **status**: Optional status filter ('active', 'archived', 'draft')
    - **facility_id**: Optional facility filter

    Returns paginated list of schemas.
    """
    service = SchemaService()
    result = await service.list_schemas(
        page=page,
        page_size=page_size,
        status=status,
        facility_id=facility_id,
    )

    # Convert ORM objects to dicts
    schemas_list = []
    for s in result["schemas"]:
        schemas_list.append({
            "id": s.id,
            "form_code": s.form_code,
            "form_name": s.form_name,
            "category": s.category,
            "version": s.version,
            "version_number": s.version_number,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })

    return {
        "schemas": schemas_list,
        "total": result["total"],
        "page": result["page"],
        "page_size": result["page_size"],
    }


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_schema(request: SchemaCreateRequest):
    """
    Create a new schema.

    If a schema with the same form_code exists, creates a new version.

    - **form_code**: Unique form identifier
    - **form_name**: Human-readable name
    - **category**: Optional category
    - **schema_definition**: Schema structure

    Returns the saved schema with id and version.
    """
    service = SchemaService()

    try:
        saved = await service.save_schema(
            form_code=request.form_code,
            form_name=request.form_name,
            schema_definition=request.schema_definition,
            category=request.category,
        )
    except SchemaValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )

    return {
        "id": saved.id,
        "form_code": saved.form_code,
        "form_name": saved.form_name,
        "category": saved.category,
        "version": saved.version,
        "version_number": saved.version_number,
        "status": saved.status,
        "schema_definition": saved.schema_definition,
        "created_at": saved.created_at.isoformat() if saved.created_at else None,
        "updated_at": saved.updated_at.isoformat() if saved.updated_at else None,
    }


@router.get("/{schema_id}", response_model=dict)
async def get_schema(schema_id: str):
    """
    Get a schema by ID.

    - **schema_id**: Schema UUID

    Returns full schema details or 404 if not found.
    """
    service = SchemaService()
    schema = await service.get_schema_by_id(schema_id)

    if not schema:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schema {schema_id} not found",
        )

    return {
        "id": schema.id,
        "form_code": schema.form_code,
        "form_name": schema.form_name,
        "category": schema.category,
        "version": schema.version,
        "version_number": schema.version_number,
        "status": schema.status,
        "schema_definition": schema.schema_definition,
        "created_at": schema.created_at.isoformat() if schema.created_at else None,
        "updated_at": schema.updated_at.isoformat() if schema.updated_at else None,
    }


@router.put("/{schema_id}", response_model=dict)
async def update_schema(schema_id: str, request: SchemaUpdateRequest):
    """
    Update schema by creating a new version.

    - **schema_id**: Original schema UUID
    - **request**: Updated schema definition

    Returns new version with incremented version_number.
    The original schema is archived (soft deleted).
    """
    service = SchemaService()

    try:
        updated = await service.update_schema(
            schema_id=schema_id,
            schema_definition=request.schema_definition,
            update_reason=request.update_reason,
        )
    except SchemaNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schema {schema_id} not found",
        )

    return {
        "id": updated.id,
        "form_code": updated.form_code,
        "form_name": updated.form_name,
        "category": updated.category,
        "version": updated.version,
        "version_number": updated.version_number,
        "status": updated.status,
        "schema_definition": updated.schema_definition,
        "created_at": updated.created_at.isoformat() if updated.created_at else None,
        "updated_at": updated.updated_at.isoformat() if updated.updated_at else None,
    }


@router.delete("/{schema_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schema(schema_id: str):
    """
    Archive (soft delete) a schema.

    - **schema_id**: Schema UUID

    Returns 204 on success, 404 if not found.
    """
    service = SchemaService()
    success = await service.archive_schema(schema_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schema {schema_id} not found",
        )

    return None
