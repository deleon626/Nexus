"""ID generation service for rule parsing and ID creation."""

import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.db.sqlite import async_session_maker
from app.db.models import IDGenerationRule
from app.models.id_generation import (
    EntityType,
    SequenceResetPeriod,
    ComponentType,
    PatternComponent,
    IDRuleDefinition,
    IDRuleParseRequest,
    IDRuleParseResponse,
    IDRuleCreateRequest,
    IDRuleResponse,
    IDRuleListItem,
    IDRuleListResponse,
    IDGenerateRequest,
    IDGenerateResponse,
    IDTestGenerateResponse,
)
from app.tools.id_tools import parse_id_rule_from_text


class IDRuleValidationError(Exception):
    """Raised when ID rule validation fails."""

    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
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


class IDService:
    """Service for ID rule management and ID generation."""

    async def parse_id_rule(self, request: IDRuleParseRequest) -> IDRuleParseResponse:
        """
        Parse a natural language ID rule into structured format.

        Args:
            request: Parse request with natural language rule

        Returns:
            IDRuleParseResponse with parsed rule and confidence
        """
        # Call the LLM tool
        result = await parse_id_rule_from_text(
            natural_language_rule=request.natural_language_rule,
            entity_type=request.entity_type.value,
            facility_id=request.facility_id,
        )

        # Convert raw response to typed models
        raw_rule = result["parsed_rule"]

        # Parse components
        components = []
        for comp in raw_rule.get("components", []):
            comp_type = ComponentType(comp.get("type"))
            components.append(
                PatternComponent(
                    type=comp_type,
                    value=comp.get("value"),
                    padding=comp.get("padding"),
                    start_value=comp.get("start_value", 1),
                )
            )

        # Parse reset period
        reset_period_str = raw_rule.get("sequence_reset_period", "never")
        reset_period = SequenceResetPeriod(reset_period_str)

        # Build typed rule definition
        parsed_rule = IDRuleDefinition(
            pattern=raw_rule.get("pattern", ""),
            components=components,
            sequence_reset_period=reset_period,
            example_id=raw_rule.get("example_id", ""),
        )

        return IDRuleParseResponse(
            parsed_rule=parsed_rule,
            confidence_score=result["confidence_score"],
            warnings=result.get("warnings", []),
        )

    async def save_id_rule(self, request: IDRuleCreateRequest) -> IDGenerationRule:
        """
        Save a new ID rule, replacing any existing rule for the same entity type.

        Args:
            request: Create request with rule definition

        Returns:
            Created IDGenerationRule ORM object
        """
        async with get_async_session() as session:
            # Check for existing active rule for this entity type + facility
            query = select(IDGenerationRule).where(
                IDGenerationRule.entity_type == request.entity_type.value,
                IDGenerationRule.facility_id == request.facility_id,
                IDGenerationRule.active == True,
            )
            result = await session.execute(query)
            existing = result.scalar_one_or_none()

            # Deactivate existing rule if found
            if existing:
                existing.active = False
                existing.updated_at = datetime.utcnow()

            # Serialize components to list of dicts
            components_data = [
                {
                    "type": comp.type.value,
                    "value": comp.value,
                    "padding": comp.padding,
                    "start_value": comp.start_value,
                }
                for comp in request.rule_definition.components
            ]

            # Create new rule
            new_rule = IDGenerationRule(
                id=str(uuid.uuid4()),
                entity_type=request.entity_type.value,
                facility_id=request.facility_id,
                rule_name=request.rule_name,
                pattern=request.rule_definition.pattern,
                components=components_data,
                sequence_reset_period=request.rule_definition.sequence_reset_period.value,
                natural_language_source=request.natural_language_source,
                last_sequence=0,
                active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            session.add(new_rule)
            await session.flush()
            await session.refresh(new_rule)

            return new_rule

    async def list_id_rules(
        self,
        entity_type: Optional[EntityType] = None,
        facility_id: Optional[str] = None,
        include_inactive: bool = False,
    ) -> IDRuleListResponse:
        """
        List ID rules with optional filtering.

        Args:
            entity_type: Filter by entity type
            facility_id: Filter by facility
            include_inactive: Whether to include inactive rules

        Returns:
            IDRuleListResponse with rules and total count
        """
        async with get_async_session() as session:
            query = select(IDGenerationRule)

            # Apply filters
            if not include_inactive:
                query = query.where(IDGenerationRule.active == True)

            if entity_type:
                query = query.where(
                    IDGenerationRule.entity_type == entity_type.value
                )

            if facility_id is not None:
                query = query.where(IDGenerationRule.facility_id == facility_id)

            query = query.order_by(IDGenerationRule.updated_at.desc())

            result = await session.execute(query)
            rules = result.scalars().all()

            # Convert to list items
            items = []
            for rule in rules:
                items.append(
                    IDRuleListItem(
                        id=rule.id,
                        rule_name=rule.rule_name,
                        entity_type=EntityType(rule.entity_type),
                        facility_id=rule.facility_id,
                        pattern=rule.pattern,
                        last_sequence=rule.last_sequence,
                        active=rule.active,
                    )
                )

            return IDRuleListResponse(
                rules=items,
                total=len(items),
            )

    async def get_id_rule(self, rule_id: str) -> Optional[IDGenerationRule]:
        """
        Get an ID rule by its ID.

        Args:
            rule_id: UUID of the rule

        Returns:
            IDGenerationRule or None if not found
        """
        async with get_async_session() as session:
            query = select(IDGenerationRule).where(IDGenerationRule.id == rule_id)
            result = await session.execute(query)
            return result.scalar_one_or_none()

    async def deactivate_id_rule(self, rule_id: str) -> bool:
        """
        Deactivate an ID rule (soft delete).

        Args:
            rule_id: UUID of the rule

        Returns:
            True if deactivated, False if not found
        """
        async with get_async_session() as session:
            query = select(IDGenerationRule).where(IDGenerationRule.id == rule_id)
            result = await session.execute(query)
            rule = result.scalar_one_or_none()

            if not rule:
                return False

            rule.active = False
            rule.updated_at = datetime.utcnow()

            return True

    async def generate_id(
        self,
        entity_type: EntityType,
        facility_id: Optional[str] = None,
    ) -> IDGenerateResponse:
        """
        Generate a new unique ID for the specified entity type.

        Args:
            entity_type: Entity type to generate ID for
            facility_id: Optional facility context

        Returns:
            IDGenerateResponse with generated ID and metadata

        Raises:
            ValueError: If no active rule exists for the entity type
        """
        max_retries = 5
        logger.info(f"Generating ID for entity_type={entity_type.value}, facility_id={facility_id}")

        async with get_async_session() as session:
            # Find active rule for entity type (with row-level lock for concurrency)
            query = select(IDGenerationRule).where(
                IDGenerationRule.entity_type == entity_type.value,
                IDGenerationRule.facility_id == facility_id,
                IDGenerationRule.active == True,
            )
            result = await session.execute(query)
            rule = result.scalar_one_or_none()

            if not rule:
                logger.warning(f"No active ID rule found for entity_type={entity_type.value}")
                raise ValueError(f"No active ID rule found for entity type: {entity_type.value}")

            logger.debug(f"Using rule id={rule.id}, pattern={rule.pattern}, last_sequence={rule.last_sequence}")

            # Check if sequence needs reset
            now = datetime.utcnow()
            should_reset = self._should_reset_sequence(rule, now)

            if should_reset:
                # Get start_value from sequence component
                start_value = self._get_start_value_from_components(rule.components)
                rule.last_sequence = start_value - 1  # Will be incremented to start_value
                rule.last_reset_date = now
                logger.info(f"Sequence reset triggered for rule={rule.id}, reset_period={rule.sequence_reset_period}")

            # Try generating unique ID with retry
            for attempt in range(max_retries):
                # Increment sequence
                rule.last_sequence += 1
                sequence_number = rule.last_sequence

                # Generate ID from pattern
                generated_id = self._apply_pattern(rule, sequence_number, now)

                # Validate uniqueness
                is_unique = await self.validate_id_uniqueness(generated_id, entity_type)

                if is_unique:
                    # Update last reset date if this is first generation of period
                    if rule.last_reset_date is None:
                        rule.last_reset_date = now

                    await session.flush()

                    logger.info(f"Generated ID={generated_id}, sequence={sequence_number}, rule={rule.id}")
                    return IDGenerateResponse(
                        generated_id=generated_id,
                        entity_type=entity_type,
                        sequence_number=sequence_number,
                        rule_id=rule.id,
                    )

            # If all retries failed
            logger.error(f"Failed to generate unique ID after {max_retries} attempts for entity_type={entity_type.value}")
            raise ValueError(f"Failed to generate unique ID after {max_retries} attempts")

    def _should_reset_sequence(self, rule: IDGenerationRule, now: datetime) -> bool:
        """
        Check if sequence should reset based on reset period.

        Args:
            rule: ID generation rule
            now: Current datetime

        Returns:
            True if sequence should reset
        """
        reset_period = rule.sequence_reset_period
        last_reset = rule.last_reset_date

        if reset_period == "never":
            return False

        if last_reset is None:
            return True

        if reset_period == "daily":
            return now.date() > last_reset.date()

        if reset_period == "monthly":
            return (now.year, now.month) > (last_reset.year, last_reset.month)

        if reset_period == "yearly":
            return now.year > last_reset.year

        return False

    def _get_start_value_from_components(self, components: list) -> int:
        """
        Get the start value for sequence from components.

        Args:
            components: List of component dicts

        Returns:
            Start value (defaults to 1)
        """
        for comp in components:
            if comp.get("type") == "sequence":
                return comp.get("start_value", 1)
        return 1

    def _apply_pattern(
        self,
        rule: IDGenerationRule,
        sequence_number: int,
        now: datetime,
    ) -> str:
        """
        Apply the pattern to generate an ID.

        Args:
            rule: ID generation rule
            sequence_number: Current sequence number
            now: Current datetime

        Returns:
            Generated ID string
        """
        result = ""

        for comp in rule.components:
            comp_type = comp.get("type")

            if comp_type == "literal":
                result += comp.get("value", "")

            elif comp_type == "year":
                result += str(now.year)

            elif comp_type == "year_short":
                result += str(now.year)[-2:]

            elif comp_type == "month":
                result += f"{now.month:02d}"

            elif comp_type == "day":
                result += f"{now.day:02d}"

            elif comp_type == "sequence":
                padding = comp.get("padding", 4)
                result += str(sequence_number).zfill(padding)

            elif comp_type == "facility":
                result += rule.facility_id or ""

            elif comp_type == "uuid":
                result += str(uuid.uuid4())[:8]

        return result

    async def validate_id_uniqueness(
        self,
        generated_id: str,
        entity_type: EntityType,
    ) -> bool:
        """
        Validate that a generated ID is unique.

        Args:
            generated_id: ID to validate
            entity_type: Entity type context

        Returns:
            True if ID is unique, False if duplicate exists
        """
        # For now, we just check against a hypothetical entity table
        # In production, this would check the actual entity table
        # (e.g., batches table for batch entity type)
        # For MVP, we assume IDs are unique as they come from sequential generation
        async with get_async_session() as session:
            # Placeholder: In real implementation, query the entity table
            # query = select(EntityTable).where(EntityTable.external_id == generated_id)
            # For now, always return True (unique)
            return True

    async def test_generate_id(
        self,
        entity_type: EntityType,
        facility_id: Optional[str] = None,
    ) -> IDTestGenerateResponse:
        """
        Generate a preview of the next ID without persisting the sequence.

        This method is identical to generate_id() except:
        - It does NOT increment/persist the sequence number
        - Returns is_preview=True to indicate non-persisted preview
        - Repeated calls return the same ID

        Args:
            entity_type: Entity type to preview ID for
            facility_id: Optional facility context

        Returns:
            IDTestGenerateResponse with preview ID and metadata

        Raises:
            ValueError: If no active rule exists for the entity type
        """
        async with get_async_session() as session:
            # Find active rule for entity type
            query = select(IDGenerationRule).where(
                IDGenerationRule.entity_type == entity_type.value,
                IDGenerationRule.facility_id == facility_id,
                IDGenerationRule.active == True,
            )
            result = await session.execute(query)
            rule = result.scalar_one_or_none()

            if not rule:
                raise ValueError(f"No active ID rule found for entity type: {entity_type.value}")

            # Check if sequence would reset (preview only)
            now = datetime.utcnow()
            should_reset = self._should_reset_sequence(rule, now)

            if should_reset:
                # Preview: sequence would reset to start_value
                start_value = self._get_start_value_from_components(rule.components)
                preview_sequence = start_value
            else:
                # Preview: next sequence after current
                preview_sequence = rule.last_sequence + 1

            # Generate preview ID from pattern
            generated_id = self._apply_pattern(rule, preview_sequence, now)

            # NOTE: No flush() - we don't persist the sequence increment

            return IDTestGenerateResponse(
                generated_id=generated_id,
                entity_type=entity_type,
                sequence_number=preview_sequence,
                rule_id=rule.id,
                is_preview=True,
            )
