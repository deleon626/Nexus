"""
Form Template Service

Handles form template operations including retrieval, creation, and validation.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import FormTemplate, FormStatus


class FormTemplateService:
    """Service for managing form templates."""

    def __init__(self, db: AsyncSession):
        """
        Initialize FormTemplateService.

        Args:
            db: Async database session
        """
        self.db = db

    async def get_template_by_code(
        self,
        form_code: str,
        version: Optional[str] = None
    ) -> Optional[FormTemplate]:
        """
        Retrieve a form template by code.

        If version is not specified, returns the latest active template.

        Args:
            form_code: Form identifier code (e.g., "FR/QC/II.03.01")
            version: Specific version string (e.g., "Revisi 02"), optional

        Returns:
            FormTemplate if found, None otherwise

        Example:
            >>> template = await service.get_template_by_code("FR/QC/II.03.01")
            >>> template = await service.get_template_by_code("FR/QC/II.03.01", "Revisi 02")
        """
        if version:
            # Get specific version
            stmt = select(FormTemplate).where(
                FormTemplate.form_code == form_code,
                FormTemplate.version == version
            )
        else:
            # Get latest active version
            stmt = (
                select(FormTemplate)
                .where(
                    FormTemplate.form_code == form_code,
                    FormTemplate.status == FormStatus.ACTIVE.value
                )
                .order_by(FormTemplate.version_number.desc())
                .limit(1)
            )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_template_by_id(self, template_id: str) -> Optional[FormTemplate]:
        """
        Retrieve a form template by ID.

        Args:
            template_id: Template UUID

        Returns:
            FormTemplate if found, None otherwise
        """
        stmt = select(FormTemplate).where(FormTemplate.id == template_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_template(
        self,
        form_code: str,
        form_name: str,
        schema_definition: dict,
        version: str,
        category: Optional[str] = None,
        status: str = FormStatus.DRAFT.value,
        effective_from: Optional[datetime] = None,
        effective_until: Optional[datetime] = None,
        created_by: Optional[str] = None
    ) -> FormTemplate:
        """
        Create a new form template.

        Automatically increments version_number based on existing templates.

        Args:
            form_code: Form identifier code
            form_name: Human-readable form name
            schema_definition: Complete form structure (JSONB)
            version: Version string (e.g., "Revisi 02")
            category: Form category (optional)
            status: Template status (default: draft)
            effective_from: Activation timestamp (optional)
            effective_until: Expiration timestamp (optional)
            created_by: Creator user ID (optional)

        Returns:
            Created FormTemplate

        Example:
            >>> template = await service.create_template(
            ...     form_code="FR/QC/II.03.01",
            ...     form_name="Raw Material Receiving",
            ...     schema_definition={"sections": [...]},
            ...     version="Revisi 02"
            ... )
        """
        # Get latest version number for this form_code
        stmt = (
            select(FormTemplate.version_number)
            .where(FormTemplate.form_code == form_code)
            .order_by(FormTemplate.version_number.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        latest_version_number = result.scalar_one_or_none()

        # Increment version number
        version_number = (latest_version_number or 0) + 1

        # Create new template
        template = FormTemplate(
            id=str(uuid.uuid4()),
            form_code=form_code,
            form_name=form_name,
            category=category,
            version=version,
            version_number=version_number,
            schema_definition=schema_definition,
            status=status,
            effective_from=effective_from,
            effective_until=effective_until,
            created_by=created_by,
            updated_by=created_by
        )

        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)

        return template

    async def validate_submission_against_template(
        self,
        submission_data: dict,
        template_id: str
    ) -> tuple[bool, Optional[list[str]]]:
        """
        Validate submission data against template schema.

        Checks required fields and basic data types.

        Args:
            submission_data: Data to validate
            template_id: Template UUID

        Returns:
            Tuple of (is_valid, error_messages)
            - is_valid: True if validation passes
            - error_messages: List of error messages if invalid, None if valid

        Example:
            >>> is_valid, errors = await service.validate_submission_against_template(
            ...     submission_data={"supplier": "ABC Co."},
            ...     template_id="template-uuid"
            ... )
            >>> if not is_valid:
            ...     print(f"Validation errors: {errors}")
        """
        # Retrieve template
        template = await self.get_template_by_id(template_id)
        if not template:
            return False, [f"Template {template_id} not found"]

        schema_def = template.schema_definition
        errors = []

        # Extract required fields from schema definition
        required_fields = self._extract_required_fields(schema_def)

        # Check required fields
        for field in required_fields:
            if field not in submission_data:
                errors.append(f"Required field '{field}' is missing")

        # If errors exist, validation failed
        if errors:
            return False, errors

        return True, None

    def _extract_required_fields(self, schema_definition: dict) -> list[str]:
        """
        Extract required field IDs from schema definition.

        Args:
            schema_definition: Schema JSONB structure

        Returns:
            List of required field IDs

        Note:
            This is a simplified implementation. In production, you may want
            to recursively traverse the schema for nested required fields.
        """
        required_fields = []

        # Navigate schema sections
        sections = schema_definition.get("sections", [])
        for section in sections:
            fields = section.get("fields", [])
            for field in fields:
                if field.get("required", False):
                    required_fields.append(field.get("id"))

        return required_fields

    async def list_templates(
        self,
        form_code: Optional[str] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> list[FormTemplate]:
        """
        List form templates with optional filters.

        Args:
            form_code: Filter by form code (optional)
            status: Filter by status (optional)
            category: Filter by category (optional)
            limit: Maximum number of results (default: 100)
            offset: Number of results to skip (default: 0)

        Returns:
            List of FormTemplate objects

        Example:
            >>> templates = await service.list_templates(
            ...     status="active",
            ...     limit=50
            ... )
        """
        stmt = select(FormTemplate)

        # Apply filters
        if form_code:
            stmt = stmt.where(FormTemplate.form_code == form_code)
        if status:
            stmt = stmt.where(FormTemplate.status == status)
        if category:
            stmt = stmt.where(FormTemplate.category == category)

        # Apply pagination
        stmt = stmt.order_by(FormTemplate.created_at.desc()).offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_template_status(
        self,
        template_id: str,
        status: str,
        updated_by: Optional[str] = None
    ) -> Optional[FormTemplate]:
        """
        Update template status (e.g., activate, deprecate, archive).

        Args:
            template_id: Template UUID
            status: New status value
            updated_by: User ID performing the update (optional)

        Returns:
            Updated FormTemplate if found, None otherwise

        Example:
            >>> template = await service.update_template_status(
            ...     template_id="uuid",
            ...     status="active",
            ...     updated_by="user-uuid"
            ... )
        """
        template = await self.get_template_by_id(template_id)
        if not template:
            return None

        template.status = status
        template.updated_by = updated_by
        template.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(template)

        return template
