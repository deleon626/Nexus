"""API endpoints for ID rule management and ID generation."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.models.id_generation import (
    EntityType,
    IDRuleParseRequest,
    IDRuleParseResponse,
    IDRuleCreateRequest,
    IDRuleResponse,
    IDRuleListResponse,
    IDGenerateRequest,
    IDGenerateResponse,
    IDTestGenerateRequest,
    IDTestGenerateResponse,
)
from app.services.id_service import IDService

router = APIRouter(tags=["ID Generation"])


@router.post("/parse", response_model=IDRuleParseResponse)
async def parse_id_rule(request: IDRuleParseRequest):
    """
    Parse a natural language ID rule description into structured format.

    This endpoint uses AI to analyze the natural language description
    and extract the pattern structure, components, and reset rules.

    Args:
        request: Parse request with natural language rule

    Returns:
        Parsed rule with pattern, components, and confidence score
    """
    service = IDService()
    result = await service.parse_id_rule(request)
    return result


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_id_rule(request: IDRuleCreateRequest):
    """
    Save a new ID rule.

    If a rule already exists for the same entity type and facility,
    the existing rule will be deactivated and replaced.

    Args:
        request: Create request with rule definition

    Returns:
        Created rule details
    """
    service = IDService()
    rule = await service.save_id_rule(request)

    return {
        "id": rule.id,
        "rule_name": rule.rule_name,
        "entity_type": rule.entity_type,
        "facility_id": rule.facility_id,
        "pattern": rule.pattern,
        "components": rule.components,
        "sequence_reset_period": rule.sequence_reset_period,
        "natural_language_source": rule.natural_language_source,
        "last_sequence": rule.last_sequence,
        "active": rule.active,
        "created_at": rule.created_at.isoformat(),
        "updated_at": rule.updated_at.isoformat(),
    }


@router.get("", response_model=IDRuleListResponse)
async def list_id_rules(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    facility_id: Optional[str] = Query(None, description="Filter by facility ID"),
    include_inactive: bool = Query(False, description="Include inactive rules"),
):
    """
    List all ID rules with optional filtering.

    Args:
        entity_type: Optional filter by entity type (batch, sample, report, schema)
        facility_id: Optional filter by facility ID
        include_inactive: Whether to include inactive rules

    Returns:
        List of ID rules with total count
    """
    service = IDService()

    # Convert entity_type string to enum if provided
    entity_type_enum = None
    if entity_type:
        try:
            entity_type_enum = EntityType(entity_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid entity_type: {entity_type}",
            )

    result = await service.list_id_rules(
        entity_type=entity_type_enum,
        facility_id=facility_id,
        include_inactive=include_inactive,
    )
    return result


@router.get("/{rule_id}", response_model=dict)
async def get_id_rule(rule_id: str):
    """
    Get an ID rule by its ID.

    Args:
        rule_id: UUID of the rule

    Returns:
        Rule details

    Raises:
        404: If rule not found
    """
    service = IDService()
    rule = await service.get_id_rule(rule_id)

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID rule not found: {rule_id}",
        )

    return {
        "id": rule.id,
        "rule_name": rule.rule_name,
        "entity_type": rule.entity_type,
        "facility_id": rule.facility_id,
        "pattern": rule.pattern,
        "components": rule.components,
        "sequence_reset_period": rule.sequence_reset_period,
        "natural_language_source": rule.natural_language_source,
        "last_sequence": rule.last_sequence,
        "active": rule.active,
        "created_at": rule.created_at.isoformat(),
        "updated_at": rule.updated_at.isoformat(),
    }


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_id_rule(rule_id: str):
    """
    Deactivate an ID rule (soft delete).

    Args:
        rule_id: UUID of the rule

    Raises:
        404: If rule not found
    """
    service = IDService()
    success = await service.deactivate_id_rule(rule_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID rule not found: {rule_id}",
        )


# ID Generation router (for /api/ids prefix)
ids_router = APIRouter(tags=["ID Generation"])


@ids_router.post("/generate", response_model=IDGenerateResponse)
async def generate_id(request: IDGenerateRequest):
    """
    Generate a new unique ID for the specified entity type.

    This endpoint generates a new ID following the active rule for
    the entity type. The sequence is incremented and persisted.

    Args:
        request: Generate request with entity type and optional facility

    Returns:
        Generated ID with sequence number and rule information

    Raises:
        404: If no active rule exists for the entity type
    """
    service = IDService()

    try:
        result = await service.generate_id(
            entity_type=request.entity_type,
            facility_id=request.facility_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@ids_router.post("/test-generate", response_model=IDTestGenerateResponse)
async def test_generate_id(request: IDTestGenerateRequest):
    """
    Generate a preview of the next ID without persisting the sequence.

    Unlike /generate, this endpoint:
    - Does NOT increment the sequence counter
    - Returns is_preview=True to indicate non-persisted preview
    - Can be called repeatedly to see what the next ID would be

    Use this for testing rules or previewing IDs before actual generation.

    Args:
        request: Test generate request with entity type and optional facility

    Returns:
        Preview ID with sequence number, rule info, and is_preview=True

    Raises:
        404: If no active rule exists for the entity type
    """
    service = IDService()

    try:
        result = await service.test_generate_id(
            entity_type=request.entity_type,
            facility_id=request.facility_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
